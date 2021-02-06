/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import dns = require('dns')
import express = require('express')
import fs = require('fs')
import glob = require('glob')
import http = require('http')
import https = require('https')
import os = require('os')
import path = require('path')
import syslog = require('modern-syslog')
import url = require('url')
import ws = require('ws')
import Alpine = require('seologs-alpine')
const Tail = require('tail').Tail
const URL = url.URL

interface config {
    host?: string,
    port?: number,
    loglevel?: string | number,
    apache?: { dir: string, files: string },
    ssl?: { key: string, cert: string }
}

//  peek services init
process.title = `peek-gw`

process.on('uncaughtException', (err, origin) => {
    console.error(`${process.title}: ${origin} ${err}`)
})

process.on('SIGINT', () => {
    console.info(` → signaled to interrupt: shutting down`)
    process.exit(0)
})

let passed = '';
if (process.argv.length > 2 && process.argv[2]) {
    passed = process.argv[2].toLowerCase()
    console.log(`parameter passed: '${passed}'`)
}

console.log('*'.repeat(80))
console.log(`Node.js ${process.version} BIDMC ITS Peek gateway`)
console.log(`on ${os.hostname()} (${process.platform}) at ` + new Date())

process.chdir(__dirname)
console.log(`cwd:\t\t${__dirname}`)

let config: config = require('./assets/gateway.json')

config.loglevel = config.loglevel || 'LOG_NOTICE'
if (isNaN(+config.loglevel)) config.loglevel = syslog.level[config.loglevel]

function audit(message, level = 'notice') {
    if (process.stdout.isTTY)
        console.log(message)
    else
        syslog[level](message)
}
audit(`syslog: \t${syslog.level[+config.loglevel]} - level ${config.loglevel} event messaging`)

const host: string = config.host || 'localhost'
const port: number = config.port || 2018
const apache = config.apache || { dir: "/var/log/httpd", files: "*_log" }
const ssl = config.ssl || null

//  app server startup
dns.lookup(host, (err, addr, family) => {
    const app = express()
    app.set('trust proxy', ['loopback', addr])

    let protocol = 'https'
    let server

    try {
        server = https.createServer({ cert: fs.readFileSync(ssl.cert), key: fs.readFileSync(ssl.key) }, app)
    }
    catch (err) {
        console.error("SSL error:", err.message)
        protocol = 'http'
        server = http.createServer(app)
    }

    console.log(`process:\t${process.title} [${process.pid}]`)

    server.listen(port, addr)
    console.log(` + listening on ${protocol}://${addr}:${port}/peek/`)
    console.log('*'.repeat(80))
    syslog.open(process.title)
    syslog.upto(+config.loglevel)
    syslog.note(`listening on http${ssl ? 's' : ''}://${host}:${port}/peek/`)

    //  enable WebSocket endpoints
    const wss = new ws.Server({ noServer: true, path: `/peek/`, clientTracking: true })
    server.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url, `${protocol}://${host}:${port}`).pathname
        if (pathname == `/peek/`) {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req)
            })
        } else {
            syslog.warn(`Unhandled WebSocket request: ${pathname}`)
            socket.destroy()
        }
    })

    //  web services
    app.use('/', express.static(path.resolve(__dirname, 'assets'), { redirect: false }))

    //  REST services
    app.get(`/peek`, (req, res) => {
        let VIP = req.query.VIP
        let USER = req.query.USER || 'nobody'
        let console = req.header('x-forwarded-for') || req.hostname
        audit(`GET query logs list by ${USER} from remote host: ${console}`)

        let session = VIP == 'local' ? getLogs('samples') : getLogs()
        let result = { host: os.hostname(), logs: session.logs }

        res.json(result)
        res.end()
    })

    app.post(`/peek`, (req, res) => {
        const VIP = req.query.VIP
        const USER = req.query.USER || 'nobody'
        const client = req.header('x-forwarded-for') || req.hostname
        audit(`POST new peek session requested by ${USER} from remote host: ${client}`)

        let session = VIP == 'local' ? peek(true, 'samples') : peek(true)
        let result = { host: os.hostname(), logs: session.logs }

        res.json(result)
        res.end()
    })

    //  WebSocket endpoints: utilize upgraded socket connection to stream output to client
    wss.on('connection', (client, req) => {
        let params = new URL(req.url, `${protocol}://${addr}:${port}`).searchParams
        const VIP = params.get('VIP')
        const USER = params.get('USER') || 'nobody'
        const host = new RegExp(params.get('host') || '.*')
        const request = new RegExp(params.get('request') || '.*')
        const status = new RegExp(params.get('status') || '.*')
        const webt = parseInt(params.get('webt')) || 0
        audit(`MONITOR peek-gw socket opened by ${USER}`)

        const logs = (VIP == 'local' ? getLogs('samples', false) : getLogs(apache.dir, false)).logs

        logs.forEach((file) => {
            let stat = fs.statSync(file)
            let minutes = Math.trunc((new Date().getTime() - stat.ctime.getTime()) / 60 / 1000) + 1
            let lpm = Math.trunc(stat.size / 512 / minutes) + 1
            if (lpm > 600) lpm = 600

            let tail = new Tail(file, { nLines: lpm })
            let alpine = new Alpine(Alpine.LOGFORMATS.COMBINED)

            tail.on("line", (data) => {
                try {
                    //  strip leading ip addresses
                    while (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[,].*$/.test(data)) {
                        const space = data.indexOf(', ')
                        data = data.substr(space + 2)
                    }
                    let result = alpine.parseLine(data)

                    //  want only specific clinical session
                    if (webt && /(_WEBT=)/.test(result.request)) {
                        params = new URL(result.request.split(' ')[1], `${protocol}://${addr}:${port}`).searchParams
                        if (parseInt(params.get('_WEBT')) !== webt)
                            return
                    }

                    //  trim payload
                    delete result.originalLine
                    delete result.logname
                    delete result.remoteUser
                    delete result.sizeCLF

                    //  apply filters
                    if (host.test(result.remoteHost) && request.test(result.request) && status.test(result.status)) {
                        result.host = os.hostname()

                        //  drop trailing non-sense
                        if (/(HTTP\/1\.1)*$/.test(result.request))
                            result.request = result.request.split(' ').splice(0, 2).join(' ')

                        //  convert Apache timestamp to Date TypeScript
                        let a = result.time.split(' ')
                        let d = new Date(a[0].replace(':', ' ')) + ' GMT' + a[1]
                        result.time = (new Date(d).toLocaleDateString())
                            + ' ' + (new Date(d).toLocaleTimeString('en-US', { hour12: false }))
                        client.send(JSON.stringify(result))
                    }
                }
                catch (err) {
                    client.send(JSON.stringify({ error: err }))
                }
            })

            tail.on("error", (error) => {
                audit(`ERROR: ${error}`, 'critical')
            })
        })

        //  client → any terminates
        client.on('message', (msg) => {
            client.close()
        })

        client.on('close', () => {
            audit(`peek-gw socket closed`)
        })
    })

    if (passed == 'test' && process.kill(process.pid, 'SIGINT'))
        console.log(`self-interrupted ${passed}`)
})

//  only those that have entries recorded for today
function getLogs(dir = apache.dir, base = true): { logs: string[] } {
    const today = new Date().toLocaleDateString()
    let logs = glob.sync(path.resolve(dir, apache.files)).filter((file) => {
        let stat = fs.statSync(file)
        return (stat.isFile() && stat.mtime.toLocaleDateString() == today)
    })
    if (base) logs.forEach((file, i) => { logs[i] = path.basename(file) })
    return { logs: logs }
}

function peek(open = false, dir = apache.dir): { logs: string[], streams?: fs.ReadStream[] } {
    let logs = getLogs(dir, false).logs
    let streams: fs.ReadStream[] = []
    if (open) logs.forEach((file) => {
        streams.push(fs.createReadStream(file, { encoding: "utf8" }))
    })

    return open ? { logs: logs, streams: streams } : { logs: logs }
}
