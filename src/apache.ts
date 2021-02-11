/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import { audit, config, listener } from './gateway'
import express = require('express')
import fs = require('fs')
import glob = require('glob')
import os = require('os')
import path = require('path')
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
        audit(`GET ${API}: ${req.url} -> ${req.params}`)

        let VIP = req.query.VIP
        audit(`GET query active Apache log list for ${VIP}`)

        let session = VIP == 'local' ? getLogs('samples') : getLogs()
        let result = { host: os.hostname(), logs: session.logs }

        res.json(result)
        res.end()
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

    export function tail(client, req) {
        let params = new URL(req.url, `${listener}`).searchParams
        const VIP = params.get('VIP')
        let host = new RegExp(params.get('host'))   //  if 'unknown' here, identify if webt is set/found
        const request = new RegExp(params.get('request'))
        const status = new RegExp(params.get('status'))
        const webt = parseInt(params.get('webt')) || 0
        const verbose = parseInt(params.get('verbose')) || 0
        const xtra = parseInt(params.get('xtra')) || 0
        audit(`Apache socket ${req.url}`)

        const logs = getLogs(VIP == 'local' ? 'samples' : apache.dir, false).logs

        logs.forEach((file) => {
            const today = new Date().toLocaleDateString()
            let stat = fs.statSync(file)
            let lpm = Math.trunc(stat.size / 400) + 1

            //  DevOps not specific here, start with most recent events
            if (String(host) == '/.*/' && !webt) {
                const minutes = Math.trunc((stat.mtime.getTime() - new Date(`${today} 00:00:00`).getTime())
                    / 1000 / 60) + 1
                lpm = Math.trunc(lpm / minutes) + 1
                audit(`${path.basename(file)}  size:${stat.size.toLocaleString()}  minutes:${minutes}  lpm:${lpm}`)
            }

            let tail = new Tail(file, { nLines: lpm })
            let alpine = new Alpine(Alpine.LOGFORMATS.COMBINED)

            tail.on("line", (data) => {
                try {
                    //  strip any X-Forwarded-For ip addresses first
                    while (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[,].*$/.test(data)) {
                        const space = data.indexOf(', ')
                        data = data.substr(space + 2)
                    }
                    //  now parse it
                    let result = alpine.parseLine(data)

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

                        //  convert Apache timestamp to JavaScript Date
                        let a = result.time.split(' ')
                        let d = new Date(a[0].replace(':', ' '))    // + ' GMT' + a[1]
                        result.time = new Date(d).toLocaleDateString() + ' '
                            + (new Date(d).toLocaleTimeString('en-US', { hour12: false }))

                        //  send result to peek console
                        delete result.originalLine
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

            tail.on("error", (error) => {
                audit(`ERROR: ${error}`, 'critical')
            })
        })

        //  client → any signal terminates
        client.on('message', (msg) => {
            client.close()
        })

        client.on('close', () => {
            audit(`Apache socket closed`)
        })
    }

}

export = Apache