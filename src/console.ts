/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import dns = require('dns')
const got = require('got')
import fs = require('fs')
import os = require('os')
const sprintf = require('sprintf-js').sprintf
import url = require('url')
import ws = require('ws')
import xvt from 'xvt'

process.on(`${process.title} uncaughtException`, (err, origin) => {
    console.error(origin, err)
})
process.title = 'peek'
process.chdir(__dirname)

const URL = url.URL
const USER = process.env.USER || 'cacheusr'
const vt = new xvt()
const workstation = (process.env.SSH_CLIENT || process.env.IP_ADDR || os.hostname()).split(' ')[0]

vt.outln(vt.magenta, vt.bright, 'Peek log insight console', vt.reset, vt.faint, '  ::  ', vt.normal, USER, vt.faint, '  ::  ', vt.normal, vt.cyan, workstation)

interface config {
    name?: string,
    port?: number,
    ssl?: { key: string, cert: string, requestCert: boolean, rejectUnauthorized: boolean }
}

interface vip {
    apache?: []
    caché?: []
}

let config: config = require('./assets/console.json')
const ssl = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.cert),
    requestCert: config.ssl.requestCert,
    rejectUnauthorized: config.ssl.rejectUnauthorized
}
let peek = {}
let servers: vip = {}
let timer: NodeJS.Timer

const port: number = config.port || 443
Object.assign(config.ssl, {})

let session = {
    name: config.name || '',
    host: '',
    request: '',
    status: '',
    user: '',
    webt: 0
}

let unknown = process.argv.forEach((arg, i) => {
    if (/^-.*/.test(arg)) switch (arg) {
        case '-n':
        case '-name':
            session.name = process.argv[i + 1]
            return false

        case '-h':
        case '-host':
            session.host = process.argv[i + 1]
            return false

        case '-r':
        case '-request':
            session.request = process.argv[i + 1]
            return false

        case '-s':
        case '-status':
            session.status = process.argv[i + 1]
            return false

        case '-u':
        case '-user':
            session.user = process.argv[i + 1]
            return false

        case '-w':
        case '-webt':
            session.webt = parseInt(process.argv[i + 1])
            return false

        default:
            vt.beep()
            vt.outln(vt.red, vt.blink, vt.bright, '?', vt.normal, 'invalid argument: ', vt.white, arg)
            vt.outln(vt.uline, vt.bright, 'USAGE')
            vt.outln(`peek -name 'vip' -host 'regexp' -request 'regexp' -status 'regexp' -user 'account' -webt token`)
            return true
    }
    else
        return false
})

serverList()

vt.form = {
    menu: {
        cb: () => {
            let choice = vt.entry.toUpperCase()

            switch (choice) {
                case 'G':
                    vt.outln(`et ${session.name} @ `, new Date().toLocaleString())
                    if (servers.apache.length) {
                        getLogs().finally(() => { vt.refocus() })
                    }
                    else {
                        vt.outln('no servers -- use ', bracket('Name'))
                        vt.refocus()
                    }
                    return

                case 'H':
                    vt.outln('ost client (regular expression)')
                    vt.outln('Example, type your workstation IP: ', workstation)
                    vt.focus = 'host'
                    return

                case 'M':
                    vt.outln('onitor ', vt.green, vt.bright, session.name, vt.reset, ' @ ', new Date().toLocaleString())

                    process.stdin.setRawMode(false)
                    monitor().finally(() => {
                        if (timer) clearInterval(timer)
                        process.stdin.setRawMode(true)
                        vt.hangup = () => { process.exit(0) }
                        vt.refocus()
                    })
                    return

                case 'N':
                    vt.out('ame')
                    vt.focus = 'name'
                    return

                case 'R':
                    vt.outln('equest (regular expression)')
                    vt.outln('Examples:')
                    vt.outln(vt.magenta, vt.bright, '^GET.*$', vt.white, 'for GET only requests, no POSTS')
                    vt.outln(vt.magenta, vt.bright, '(T \/csp\/).*$', vt.white, 'CSP requests only')
                    vt.outln(vt.magenta, vt.bright, '^((?!(dyna|lan|trigger)).)*$', vt.white, 'exclude the paths containing these words')
                    vt.focus = 'request'
                    return

                case 'S':
                    vt.outln('tatus code (regular expression)')
                    vt.outln('Examples:')
                    vt.focus = 'status'
                    return

                case 'U':
                    vt.out('ser')
                    vt.focus = 'user'
                    return

                case 'Q':
                    vt.outln('uit')
                    process.exit()

                case 'W':
                    vt.outln('WEBT number')
                    vt.focus = 'webt'
                    return

                default:
                    vt.beep()
                    vt.outln(' -- invalid')
                    vt.outln('apache: ', [bracket('Name'), bracket('Status'), bracket('Host'), bracket('Request')])
                    vt.outln('caché: ', [bracket('User'), bracket('Webt')])
                    vt.out([bracket('Get (default)'), bracket('Monitor'), bracket('Quit')].toString())
            }
            vt.refocus()
        }, prompt: vt.attr(vt.off, '\n', vt.cyan, 'Peek: '), cancel: 'Q', enter: 'G', max: 1, eol: false
    },
    name: {
        cb: () => {
            if (vt.entry)
                session.name = vt.entry
            else
                vt.outln(session.name)
            serverList()
            getLogs().finally(() => { vt.focus = 'menu' })
        }, prompt: vt.attr(vt.red, 'Name: '), max: 32
    },
    host: {
        cb: () => {
            vt.entry = vt.entry || session.host
            if (vt.entry !== session.host) {
                session.host = vt.entry
                vt.out(` (set) `)
            }
            vt.focus = 'menu'
        }, prompt: 'Filter on remote host: ', max: 72
    },
    request: {
        cb: () => {
            vt.entry = vt.entry || session.request
            session.request = vt.entry
            if (vt.entry !== session.request) {
                session.request = vt.entry
                vt.out(` (set) `)
            }
            vt.focus = 'menu'
        }, prompt: 'Filter on request: ', max: 72
    },
    status: {
        cb: () => {
            vt.entry = vt.entry || session.status
            session.status = vt.entry
            if (vt.entry !== session.status) {
                session.status = vt.entry
                vt.out(` (set) `)
            }
            vt.focus = 'menu'
        }, prompt: 'Filter on status code: ', max: 72
    },
    user: {
        cb: () => {
            vt.entry = vt.entry || session.user
            if (!/[a-z]+[a-z|0-9]+$/.test(vt.entry))
                vt.entry = ''
            if (vt.entry !== session.user) {
                session.user = vt.entry
                vt.out(` (${session.user ? 'set' : 'unset'})`)
            }
            vt.focus = 'menu'
        }, prompt: 'Filter on which user: ', max: 32
    },
    webt: {
        cb: () => {
            let webt = parseInt(vt.entry) || session.webt
            if (isNaN(+vt.entry)) webt = 0
            if (webt !== session.webt) {
                session.webt = webt
                vt.out(` (${session.webt ? 'set' : 'unset'})`)
            }
            vt.focus = 'menu'
        }, prompt: 'Enter WEBT number: ', max: 12
    }
}

vt.focus = servers.apache.length ? 'menu' : 'name'

function bracket(item: string, nl = false): string {
    return vt.attr(vt.reset, nl ? '\n' : '',
        vt.faint, '<', vt.bright, item[0], vt.faint, '>',
        nl ? ' ' : '', vt.reset, item.substr(1))
}

function getLogs() {
    return new Promise<number>((resolve, reject) => {
        let count = servers.apache.length
        servers.apache.forEach(server => {
            const reqUrl = `https://${server}:${port}/peek/`
            const params = new URLSearchParams({ VIP: session.name, USER: USER }).toString()
            try {
                got(`${reqUrl}?${params}`, {
                    method: 'GET', headers: { 'x-forwarded-for': workstation },
                    https: ssl
                }).then(response => {
                    vt.outln(vt.green, vt.bright, ` ${server} `)
                    if (response.body) {
                        const result = JSON.parse(response.body)
                        vt.outln(vt.bright, result.host, vt.normal, ' apache logs: ', result.logs.toString())
                    }
                }).catch(err => {
                    if (err.statusCode)
                        console.error(err.statusCode, err.statusMessage)
                    else {
                        vt.out(vt.red, vt.faint, `*${server}*`, vt.reset)
                        if (err.code !== 'ECONNREFUSED') vt.out(' - ', err.code)
                        vt.outln()
                    }
                }).finally(() => {
                    if (--count == 0)
                        resolve(1)
                })
            }
            catch (err) {
                console.error(err.response)
                reject(0)
            }
        })
        if (count == 0) resolve(1)
    })
}

function serverList() {

    vt.outln()
    vt.outln(vt.reverse, vt.bright, ' Server list ')

    servers = {}
    const vip = JSON.parse(fs.readFileSync('assets/vip.json').toString())
    Object.keys(vip).forEach(service => {
        servers[service] = []
    })

    if (session.name) {
        for (let service in vip) {
            vt.out(vt.bright, service, vt.normal, ': ')
            for (let name in vip[service]) {
                if (name.startsWith(session.name)) {
                    session.name = name
                    servers[service] = servers[service].concat(vip[service][name].splice(1))
                }
                if (vip[service][name][0].startsWith(session.name)) {
                    session.name = name
                    servers[service] = servers[service].concat(vip[service][name].splice(1))
                }
            }
            vt.outln(servers[service].length ? servers[service].toString() : 'none')
        }
    }
    else {
        vt.out(vt.red, 'Name', vt.reset, ' not selected -- choose any ', vt.uline, 'VIP', vt.nouline, ' below')
        for (let service in vip) {
            vt.outln()
            vt.out(vt.magenta, vt.bright, service, vt.normal, ':\t', vt.reset)
            for (let name in vip[service]) {
                vt.out(` ${name.split('.')[0]} `)
            }
        }
    }
}

//  Shall we begin?
function monitor() {

    if (session.host)
        vt.outln('Remote host filter: ', vt.bright, `/${session.host}/`)
    if (session.request)
        vt.outln('Request filter: ', vt.bright, `/${session.request}/`)
    if (session.status)
        vt.outln('Status code filter: ', vt.cyan, `/${session.status}/`)
    if (session.webt)
        vt.outln('For Caché webt filter: ', vt.magenta, vt.bright, `'${session.webt}'`)
    if (session.user)
        vt.outln('For the user logged: ', vt.magenta, vt.bright, `'${session.user}'`)

    vt.out(vt.red, '6-second reporting interval set')

    timer = setInterval(() => {
        vt.out(vt.reverse, vt.faint, '| ', vt.normal, ` ${messages} `, vt.faint, ' messages | ', vt.normal, ` ${payload} `, vt.faint, ' bytes | ', vt.normal, ` ${new Date().toLocaleString()} `, vt.faint, ' |', vt.noreverse, ' -- press ', vt.normal, 'Ctrl/C', vt.faint, ' to stop -- \r', vt.reset)

        if (messages) {
            vt.outln()
            messages = -1
            payload = 0

            report()

            messages = Math.abs(messages + 1)
        }

    }, 6000)

    vt.outln(vt.reset, ' ... ')

    let messages = 0
    let payload = 0
    peek = {}

    return new Promise<number>((resolve, reject) => {

        const today = new Date().toLocaleDateString()
        let wss = []

        vt.hangup = () => {
            vt.carrier = true
            wss.forEach((s) => {
                s.close()
            })
        }

        let count = servers.apache.length
        servers.apache.forEach(server => {
            const reqUrl = `https://${server}:${port}/peek/`
            const params = new URLSearchParams({
                VIP: session.name, USER: USER,
                host: session.host, request: session.request, status: session.status,
                webt: session.webt.toString()
            }).toString()

            let i = wss.push(new ws(`${reqUrl}?${params}`, ssl)) - 1

            wss[i].onopen = () => {
                //vt.outln(vt.faint, server, ' opened WebSocket')
            }

            wss[i].onclose = (ev) => {
                //vt.outln(vt.faint, server, ' closed WebSocket')
                vt.out(vt.faint, 'peek-gw socket closed: ', vt.reset, `${--count} `, vt.faint, `remaining\r`, vt.reset, -250)
                if (!count) resolve(1)
            }

            wss[i].onerror = (ev) => {
                vt.outln(vt.red, vt.bright, server, ' error ', ev.message)
            }

            wss[i].onmessage = (ev) => {
                try {
                    if (messages < 0)
                        messages--
                    else
                        messages++
                    payload += ev.data.length

                    if (messages > 0 && !(messages % 100))
                        vt.out(`${messages} `, vt.faint, 'messages', '  |  ', vt.reset, `${payload}`, vt.faint, ` bytes\r`, vt.reset)

                    let alpine = JSON.parse(ev.data)

                    let date = new Date(alpine.time).toLocaleDateString()
                    if (date == today) {
                        let time = new Date(alpine.time).toLocaleTimeString()
                        if (!peek[time]) peek[time] = []
                        peek[time].push(alpine)
                    }
                }
                catch (err) {
                    vt.beep()
                    vt.outln(vt.red, 'error: ', vt.reset, err.message)
                }
            }
        })
        if (count == 0) resolve(1)
    })

    function report() {
        const report = Object.keys(peek).sort()
        const tab = 13
        let last = { remoteHost: '', request: '', ts: '' }
        let repeat = 0

        report.forEach((ts) => {
            vt.out(vt.bright, sprintf('%-11.11s', ts), vt.normal, '  ')

            peek[ts].forEach((entry, i) => {
                if (repeat && (entry.remoteHost !== last.remoteHost || entry.request !== last.request)) {
                    vt.out('\r', vt.bright, sprintf('%-11.11s', last.ts), vt.normal)
                    vt.outln(repeat > 1 ? ` [${repeat} repeats] ` : '')
                    vt.out(vt.bright, sprintf('%-11.11s', ts), vt.normal, '  ')
                }
                else
                    if (i) vt.out(' '.repeat(tab))

                vt.out(entry.host || '?', ' ', vt.normal)
                vt.out(' ', entry.status == '200' ? vt.cyan : vt.yellow, entry.status, ' ', vt.white)
                vt.out(sprintf(' %-14.14s ', entry.remoteHost || '?'))
                if (/(_WEBT=)/.test(entry.request)) {
                    let out = entry.request.split('_WEBT=')
                    let webt = parseInt(out[1]).toString()
                    vt.out(out[0], vt.bright, '_WEBT=', vt.magenta, webt, vt.reset, out[1].substr(webt.length))
                }
                else
                    vt.out(entry.request || '?')

                if (entry.remoteHost == last.remoteHost && entry.request == last.request) {
                    last.ts = ts
                    vt.out('\r')
                    repeat++
                }
                else {
                    vt.outln()
                    last = entry
                    repeat = 0
                }
            })
        })
        vt.outln()
        peek = {}
    }
}
