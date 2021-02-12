/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import dns = require('dns')
import express = require('express')
import fs = require('fs')
import http = require('http')
import https = require('https')
import os = require('os')
import path = require('path')
import ws = require('ws')

interface config {
    host?: string,
    port?: number,
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

let passed = ''
if (process.argv.length > 2 && process.argv[2]) {
    passed = process.argv[2].toLowerCase()
    console.log(`parameter passed: '${passed}'`)
}

console.log('*'.repeat(80))
console.log(`Node.js ${process.version} BIDMC ITS Peek gateway`)
console.log(`on ${os.hostname()} (${process.platform}) at ` + new Date())

process.chdir(__dirname)
console.log(`cwd:    \t${__dirname}`)

module Gateway {

    export let config: config = require('./assets/gateway.json')

    export const router = express.Router({
        caseSensitive: true, strict: false, mergeParams: false
    })

    export let hostname = os.hostname()
    export let listener
    export const ssl = config.ssl || null
    export let username = process.env.USER
    export let wss: ws.Server

    export function audit(message, level = 'notice') {
        const ts = new Date(Date.now()).toLocaleDateString() + ' ' + new Date(Date.now()).toLocaleTimeString()
        message = `${ts} [${username}@${hostname}] ${message}`
        switch (level) {
            case 'critical':
                console.error(message)
                break
            case 'notice':
                console.info(message)
                break
            case 'warn':
                console.warn(message)
                break
            default:
                console.log(message)
                break
        }
    }

    //  app server startup
    dns.lookup(config.host || 'localhost', (err, addr, family) => {
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

        server.listen(config.port, addr)
        listener = `${protocol}://${addr}:${config.port}`
        console.log(` + listening on ${listener}/peek/`)
        console.log('*'.repeat(80))

        //  REST services
        const router = express.Router({
            caseSensitive: true, strict: false, mergeParams: false
        })
        router.use((req, res, next) => {
            hostname = req.header('x-forwarded-for') || req.hostname
            username = String(req.query.USER)
            //  TODO: ACLs
            audit(`${req.method} ${decodeURI(req.url)}`)
            next()
        })
        .use(require('./apache').router)
        .use(require('./caché').router)   //  nvm use
        app.use('/peek/api', router)

        //  web services
        app.use('/peek', express.static(path.resolve(__dirname, 'assets'), { redirect: true }))

        //  enable WebSocket endpoints
        wss = new ws.Server({ noServer: true, path: `/peek/apache/`, clientTracking: true })
        server.on('upgrade', (req, socket, head) => {
            wss.handleUpgrade(req, socket, head, (client, req) => {
                wss.emit('connection', client, req)
            })
        })

        //  WebSocket endpoints: utilize upgraded socket connection to stream output to client
        wss.on('connection', (client, req) => {
            require('./apache').tail(client, req)
        })

        if (passed == 'test' && process.kill(process.pid, 'SIGINT'))
            console.log(`self-interrupted ${passed}`)
    })
}

export = Gateway
