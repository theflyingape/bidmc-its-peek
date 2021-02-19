/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import { audit, config, listener } from './gateway'
import express = require('express')
import fs = require('fs')
import glob = require('glob')
import os = require('os')
import path = require('path')
import ws = require('ws')
import Alpine = require('seologs-alpine')
const Tail = require('tail').Tail

module Apache {

    export const API = encodeURI(`/${path.basename(__filename).split('.')[0]}`)
    export const router = express.Router({
        caseSensitive: true, strict: false, mergeParams: false
    })

    //  REST services
    router.get(`${API}/*`, (req, res, next) => {
        next()
    })
        .get(`${API}`, (req, res) => {
            let session = getLogs()
            let result = { host: os.hostname(), logs: session.logs }

            res.json(result)
            res.end()
        })
        .get(`${API}/restart`, (req, res) => {
            res.json({ host: os.hostname(), code: 1 })
            res.end()
            process.exit(1)
        })

    const apache = config.apache || { dir: "/var/log/httpd", files: "*_log" }

    //  only those log files that have entries recorded for today
    export function getLogs(dir = apache.dir, base = true): { logs: string[] } {
        const today = new Date().toLocaleDateString()
        let logs = glob.sync(path.resolve(dir, apache.files)).filter((file) => {
            let stat = fs.statSync(file)
            return (stat.isFile() && stat.mtime.toLocaleDateString() == today)
        })
        if (base) logs.forEach((file, i) => { logs[i] = path.basename(file) })
        return { logs: logs }
    }

    //  enumerate & open today's current log files
    export function peek(open = false, dir = apache.dir): { logs: string[], streams?: fs.ReadStream[] } {
        let logs = getLogs(dir, false).logs
        let streams: fs.ReadStream[] = []
        if (open) logs.forEach((file) => {
            streams.push(fs.createReadStream(file, { encoding: "utf8" }))
        })

        return open ? { logs: logs, streams: streams } : { logs: logs }
    }

    export function cliMonitor(client: ws, params: URLSearchParams) {
        let host = new RegExp(params.get('host'))   //  if 'unknown' here, identify if webt is set/found
        const request = new RegExp(params.get('request'))
        const status = new RegExp(params.get('status'))
        const webt = parseInt(params.get('webt')) || 0
        const verbose = parseInt(params.get('verbose')) || 0
        const xtra = parseInt(params.get('xtra')) || 0

        //  DevOps not specific here, start with most recent events
        tail((String(host) == '/.*/' && !webt), (result: apacheLog) => {
            try {
                //  DevOps specified a clinical session token
                if (webt) {
                    if (/(_WEBT=)/.test(result.request)) {
                        params = new URL(result.request.split(' ')[1], `${listener}`).searchParams
                        if (parseInt(params.get('_WEBT')) == webt) {
                            if (String(host) !== String(new RegExp(result.remoteHost)))
                                host = new RegExp(result.remoteHost)    //  found the workstation
                        }
                    }
                }

                //  drop legacy protocol
                if (/(HTTP\/1\.1)*$/.test(result.request))
                    result.request = result.request.split(' ').splice(0, 2).join(' ')

                //  filter out any good 'static' file requests
                if (!verbose && parseInt(result.status) == 200) {
                    if (
                        result.request == 'GET /favicon.ico' ||
                        result.request.startsWith('GET /dyna/') ||
                        result.request.startsWith('GET /images/') ||
                        result.request.startsWith('GET /spellcheck/') ||
                        /^(GET|POST) \/scripts\/(nph-mgwcgi|mgwms32.dll)(\/?)(\?MGWLPN=\w+)?$/.test(result.request) ||
                        /RUN=lan&app=triggerCheck/.test(result.request)
                    ) {
                        client.send(JSON.stringify({ skip: '1', reason: 'verbose' }))
                        return
                    }
                }

                //  trim payload
                delete result.logname
                delete result.remoteUser
                delete result.sizeCLF

                //  apply filters
                if (host.test(result.remoteHost) && request.test(result.request) && status.test(result.status)) {
                    result.host = os.hostname()

                    //  condense UserAgent
                    if (xtra && result['RequestHeader User-agent']) {
                        const ol = result.originalLine
                        //  machine
                        result.userAgent = ol.indexOf('(Windows ') > 0 ? 'Win'
                            : ol.indexOf('(X11; CrOS') > 0 ? 'CrOS'
                                : ol.indexOf('(Macintosh;') > 0 ? 'Mac' : '.'
                        result.userAgent += '/'
                        //  browser
                        if (ol.indexOf(' Chrome/') > 0) {
                            const version = parseInt(ol.split(' Chrome/')[1])
                            result.userAgent += `${version}`
                        }
                        else
                            result.userAgent += ol.indexOf(' Trident/') > 0 ? 'IE'
                                : ol.indexOf('curl/') > 0 ? 'curl' : '.'
                        delete result['RequestHeader User-agent']
                    }

                    delete result.originalLine

                    //  send result to peek cli console
                    client.send(JSON.stringify(result))
                    return
                }
                else {
                    client.send(JSON.stringify({ skip: '1', reason: webt ? 'webt' : 'verbose' }))
                    return
                }
            }
            catch (err) {
                client.send(JSON.stringify({ skip: '1', reason: err.message }))
            }
        })
    }

    export function webMonitor(client: ws, params: URLSearchParams) {
        let hosts = 0
        let payload = {}

        tail(true, (result: apacheLog) => {
            if (result.remoteHost && result.time) {
                payload[result.remoteHost] = result.time
                hosts++
            }
        })

        let timer = setInterval(() => {
            if (hosts) {
                const copy = Object.assign({}, payload)
                payload = {}
                hosts = 0
                client.send(JSON.stringify(copy), (err) => {
                    if (err) {
                        audit(`webMonitor: ${err.message}`, 'warn')
                        clearInterval(timer)
                    }
                })
            }
        }, 1000)
    }

    function tail(recent: boolean, cb: Function) {
        const logs = getLogs(os.hostname() == 'penguin' ? 'samples' : apache.dir, false).logs

        logs.forEach((file) => {
            const today = new Date().toLocaleDateString()
            let stat = fs.statSync(file)
            const minutes = Math.trunc((stat.mtime.getTime() - new Date(`${today} 00:00:00`).getTime())
                / 1000 / 60) + 1
            //  make a good guess ...
            const lpm = Math.trunc(stat.size / 384 / minutes)
            const lines = lpm * (recent ? 36 : 720) + 1

            audit(`${path.basename(file)} size:${stat.size.toLocaleString()} => lpm:${lpm}; want ${lines} lines`)

            let tail = new Tail(file, { nLines: lines })
            let alpine = new Alpine(Alpine.LOGFORMATS.COMBINED)

            tail.on("line", (data) => {
                //  strip any X-Forwarded-For ip addresses first (was a NetScaler config issue)
                while (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[,].*$/.test(data)) {
                    const space = data.indexOf(', ')
                    data = data.substr(space + 2)
                }
                //  now parse it
                const result = alpine.parseLine(data)
                result.time = time(result.time)
                cb(result)
            })

            tail.on("error", (error) => {
                audit(`ERROR: ${error}`, 'critical')
            })
        })
    }

    //  convert Apache timestamp to JavaScript Date
    function time(logDate: string) {
        const a = logDate.split(' ')
        const d = new Date(a[0].replace(':', ' '))    // + ' GMT' + a[1]
        return new Date(d).toLocaleDateString() + ' '
            + (new Date(d).toLocaleTimeString('en-US', { hour12: false }))
    }
}

export = Apache
