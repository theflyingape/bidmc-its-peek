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
    report: number
    ssl?: { key: string, cert: string, requestCert: boolean, rejectUnauthorized: boolean }
}

interface skip {
    error?: string
    verbose: number
    webt: number
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

let port: number
let servers: vip = {}
let timer: NodeJS.Timer

let session = {
    name: '',
    host: '.*',
    request: '.*',
    status: '.*',
    user: '',
    webt: 0,
    verbose: false,
    xtra: false
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
                    vt.outln('Examples:')
                    vt.outln(vt.magenta, vt.bright, workstation, vt.reset, ' ... yields your workstation requests')
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
                    vt.outln(vt.magenta, vt.bright, '^GET.*$', vt.reset, ' ... yields GET only requests, no POSTS')
                    vt.outln(vt.magenta, vt.bright, '(T \/csp\/).*$', vt.reset, ' ... yields CSP requests only')
                    vt.outln(vt.magenta, vt.bright, '^((?!(dyna|lan|trigger)).)*$', vt.reset, ' ... exclude requests containing these words')
                    vt.focus = 'request'
                    return

                case 'S':
                    vt.outln('tatus code (regular expression)')
                    vt.outln('Examples:')
                    vt.focus = 'status'
                    return

                case 'T':
                    vt.outln('ime between reporting outputs')
                    vt.focus = 'timer'
                    return

                case 'U':
                    vt.out('ser')
                    vt.focus = 'user'
                    return

                case 'V':
                    session.verbose = !session.verbose
                    vt.out(`erbosity = ${session.verbose}`)
                    break

                case 'W':
                    vt.outln('ebt clinical session token ')
                    vt.focus = 'webt'
                    return

                case 'X':
                    session.xtra = !session.xtra
                    vt.out(`tra log info = ${session.xtra}`)
                    break

                case 'Q':
                    vt.outln('uit')
                    process.exit()

                default:
                    vt.beep()
                    vt.outln(' -- help')
                    vt.outln('action: ', bracket('Get'), ', ', bracket('Monitor'), ', ', bracket('Name (switch VIP)'), ', or ', bracket('Quit (default)'))
                    vt.outln('apache: ', bracket('Status'), ', ', bracket('Host'), ', ', bracket('Request'))
                    vt.outln('caché:  ', bracket('User'), ', ', bracket('Webt'))
                    vt.out('output: ', bracket('Timer'), ', ', bracket('Verbose'), ', e', bracket('Xtra'))
            }
            vt.refocus()
        }, prompt: vt.attr(vt.off, '\n', vt.cyan, 'Peek: '), enter: 'Q', max: 1, eol: false
    },
    name: {
        cb: () => {
            if (vt.entry)
                session.name = vt.entry
            else
                vt.outln(session.name)
            serverList()
            getLogs().finally(() => {
                vt.focus = servers.apache.length ? 'menu' : 'name'
            })
        }, prompt: vt.attr(vt.red, 'Name: '), max: 32
    },
    host: {
        cb: () => {
            vt.entry = vt.entry || session.host
            if (vt.entry !== session.host) {
                session.host = vt.entry
                vt.outln(` (set) `)
                session.verbose = true
                vt.outln(vt.red, vt.bright, 'Verbosity is ON')
            }
            //  likely a single IP or name, let's see
            checkHost(session.host).finally(() => { vt.focus = 'menu' })
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
    timer: {
        cb: () => {
            let n = parseInt(vt.entry)
            if (n >= 3 && n <= 30) {
                config.report = n
                vt.out(` (set) `)
            }
            vt.focus = 'menu'
        }, prompt: 'Interval (3-30): ', max: 2
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
            let webt = parseInt(vt.entry)
            if (webt == 0 || webt !== session.webt) {
                session.webt = webt
                vt.outln(` (${session.webt ? 'set' : 'unset'})`)
                if (webt) {
                    session.host = 'unknown'
                    vt.outln('Host = unknown')
                }
                else {
                    session.host = ''
                    vt.outln('Host = any')
                }
                session.verbose = webt ? true : false
                vt.out('Verbose = ', session.verbose)
            }
            vt.focus = 'menu'
        }, prompt: 'Enter WEBT number: ', max: 12, enter: '^'
    }
}

vt.focus = servers.apache.length ? 'menu' : 'name'

function bracket(item: string, nl = false): string {
    return vt.attr(vt.reset, nl ? '\n' : '',
        vt.faint, '<', vt.bright, item[0], vt.faint, '>',
        nl ? ' ' : '', vt.reset, item.substr(1))
}

function checkHost(name = 'localhost') {
    return new Promise<number>((resolve, reject) => {
        if (name) {
            try {
                dns.reverse(name, (err, hostnames) => {
                    if (hostnames.length)
                        vt.out('hostname(s): ', hostnames.toString())
                    resolve(1)
                })
            }
            catch (err) {
                dns.lookup(name, (err, addr, family) => {
                    if (addr) {
                        session.host = addr
                        vt.out('host = ', addr)
                    }
                    resolve(1)
                })
            }
        }
        else
            reject(0)
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
        port = session.name == 'local' ? 2018 : 443
        for (let service in vip) {
            vt.out(vt.bright, service, vt.normal, ': ')
            for (let name in vip[service]) {
                if (session.name == name.split('.')[0]) {
                    session.name = name
                    servers[service] = servers[service].concat(vip[service][name].splice(1))
                }
                if (session.name == vip[service][name][0].split('.')[0]) {
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

function getLogs() {
    return new Promise<number>((resolve, reject) => {
        let count = servers.apache.length
        servers.apache.forEach(server => {
            const reqUrl = `https://${server}:${port}/peek/api/`
            const params = new URLSearchParams({ VIP: session.name, USER: USER }).toString()
            try {
                got(`${reqUrl}?${params}`, {
                    method: 'GET', headers: { 'x-forwarded-for': workstation },
                    https: ssl
                }).then(response => {
                    vt.outln(vt.green, vt.bright, ` ${server}:${port} `)
                    if (response.body) {
                        const result = JSON.parse(response.body)
                        vt.outln(vt.bright, result.host, vt.normal, ' apache logs: ', result.logs.toString())
                    }
                }).catch(err => {
                    if (err.statusCode)
                        console.error(err.statusCode, err.statusMessage)
                    else {
                        vt.out(vt.red, vt.faint, `*${server}:${port}*`, vt.reset)
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

//  Shall we begin?
function monitor() {

    if (session.host)
        vt.outln('Remote host filter: ', vt.red, vt.bright, `/${session.host}/`)
    if (session.request)
        vt.outln('Request filter: ', vt.red, vt.bright, `/${session.request}/`)
    if (session.status)
        vt.outln('Status code filter: ', vt.yellow, `/${session.status}/`)
    if (session.webt)
        vt.outln('For Caché webt filter: ', vt.magenta, vt.bright, `'${session.webt}'`)
    if (session.user)
        vt.outln('For the user logged: ', vt.magenta, vt.bright, `'${session.user}'`)
    if (session.verbose)
        vt.outln(vt.red, vt.bright, 'Verbosity is ON')
    if (session.xtra)
        vt.outln(vt.cyan, vt.bright, 'Extra info is ON')

    vt.out(vt.red, `${config.report}`, vt.reset, '-second reporting interval ')

    timer = setInterval(() => {
        if (matches) {
            statusLine(true)
            matches = 0
            messages = -1
            payload = 0
            skip = { verbose: 0, webt: 0 }

            const copy = Object.assign({}, peek)
            peek = {}
            report(copy)

            messages = Math.abs(messages + 1)
        }
        statusLine()
    }, config.report * 1000)

    vt.outln(vt.reset, 'set ... ')

    //  init collection(s)
    let matches = 0
    let messages = 0
    let payload = 0
    let peek = {}
    let skip: skip = { verbose: 0, webt: 0 }
    statusLine()

    return new Promise<number>((resolve, reject) => {

        //  allow user trap for Ctrl/C
        vt.hangup = () => {
            vt.carrier = true
            wss.forEach((s) => {
                s.close()
            })
        }

        const today = new Date().toLocaleDateString()
        let count = servers.apache.length
        let wss = []

        servers.apache.forEach(server => {
            const reqUrl = `https://${server}:${port}/peek/`
            const params = new URLSearchParams({
                VIP: session.name, USER: USER,
                host: session.host, request: session.request, status: session.status,
                webt: session.webt.toString(),
                verbose: String(+session.verbose), xtra: String(+session.xtra)
            }).toString()

            let i = wss.push(new ws(`${reqUrl}?${params}`, ssl)) - 1

            wss[i].onopen = () => {
                //vt.outln(vt.faint, server, ' opened WebSocket')
            }

            wss[i].onclose = (ev) => {
                vt.outln(vt.bright, server, vt.faint, ' peek-gw socket closed: ', vt.reset, `${--count} `, vt.faint, `remaining `, vt.reset, vt.cll)
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

                    let alpine = JSON.parse(ev.data)
                    let date = new Date(alpine.time).toLocaleDateString()

                    if (date !== today || alpine.skip) {
                        switch (alpine.reason) {
                            case 'verbose':
                                skip.verbose++
                                break

                            case 'webt':
                                skip.webt++
                                break

                            default:
                                skip.verbose++
                                skip.error = alpine.reason
                                break
                        }
                    }

                    if (date == today) {
                        let time = new Date(alpine.time).toLocaleTimeString('en-US', { hour12: false })
                        if (!peek[time]) peek[time] = {}
                        if (!peek[time][alpine.host]) peek[time][alpine.host] = []
                        peek[time][alpine.host].push(alpine)
                        matches++
                    }

                    const refresh = messages < 10 ? 1 : messages < 100 ? 10 : 100
                    if (messages > 0 && !(messages % refresh)) statusLine()
                }
                catch (err) {
                    vt.beep()
                    vt.outln(vt.red, 'error: ', vt.reset, err.message)
                }
            }
        })
        if (count == 0) resolve(1)
    })

    //  make it a HUMAN-readable report :)
    function report(copy) {

        const tab = 10
        let last = { remoteHost: '', request: '', ts: '' }
        let repeat = 0

        //  sort by timestamp
        Object.keys(copy).sort().forEach((ts) => {
            vt.out(vt.bright, sprintf('%-8.8s', ts), vt.normal, '  ')

            //  sort by host
            Object.keys(copy[ts]).sort().forEach((host) => {

                copy[ts][host].forEach((entry, i) => {
                    if (repeat && (entry.remoteHost !== last.remoteHost || entry.request !== last.request)) {
                        vt.out('\r', vt.bright, sprintf('%-8.8s', last.ts), vt.normal)
                        vt.outln(repeat > 1 ? ` [${repeat} repeats] ` : '')
                        vt.out(vt.bright, sprintf('%-8.8s', ts), vt.normal, '  ')
                    }
                    else
                        if (i) vt.out(' '.repeat(tab))

                    vt.out(entry.host, ' ', vt.normal)
                    vt.out(' ', entry.status == '200' ? vt.cyan : vt.yellow, entry.status, ' ', vt.white)
                    vt.out(sprintf(' %-14.14s ', entry.remoteHost || '-?-'))
                    if (session.xtra)
                        vt.out(sprintf(' %-8.8s ', entry.userAgent || '-?-'))
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
        })
        vt.outln()
    }

    function statusLine(nl = false) {
        vt.out(matches > 0 ? vt.blue : vt.green, vt.reverse, vt.faint, '| ')
        vt.out(vt.normal, ` ${Math.abs(messages).toLocaleString()} `, vt.faint, ' messages  | ')
        if (payload > 0)
            vt.out(vt.normal, ` ${payload.toLocaleString()} `, vt.faint, ' bytes  | ')
        if (skip.verbose || skip.webt)
            vt.out(vt.normal, ` ${(skip.verbose + skip.webt).toLocaleString()} `, vt.faint, ' skipped  | ')
        if (skip.error)
            vt.out(vt.normal, ` ${skip.error} `, vt.faint, '  | ')
        vt.out(vt.normal, ` ${new Date().toLocaleTimeString()} `, vt.faint, ' |', vt.reset)
        vt.out(vt.faint, ' -- press ', vt.normal, 'Ctrl/C', vt.faint, ' to stop -- ')
        if (nl)
            vt.outln()
        else
            vt.out(vt.cll, '\r', vt.reset)
    }
}
