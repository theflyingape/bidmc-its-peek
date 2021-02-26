/*
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import { audit } from './gateway'
import express = require('express')
import fs = require('fs')
import path = require('path')

module Caché {

    export const API = encodeURI(`/${path.basename(__filename).split('.')[0]}`)
    export const router = express.Router({
        caseSensitive: true, strict: false, mergeParams: false
    })

    //  REST services
    router.get(`${API}/*`, (req, res, next) => {
        instances = (String(req.query.INSTANCES) || 'localhost').split(',')
        nodes = []
        results = []
        next()
    })
        .get(`${API}/ip/:ip`, (req, res, next) => {
            openAll()
            webTrail([, req.params.ip])
            next()
        })
        .get(`${API}/username/:username`, (req, res, next) => {
            openAll()
            webTrail([, , req.params.username])
            next()
        })
        .get(`${API}/webt/:webt`, (req, res, next) => {
            openAll('WEB')
            let results: { username?: string } = {}
            let webt = parseInt(req.params.webt)
            if (webt) nodes.forEach((node, i) => {
                if (!results.username) results = webtmaster(node, webt) || {}
            })
            next()
        })
        .use((req, res) => {
            closeAll()
            res.send(results)
            res.end()
        })

    //  DATABASE services
    let api
    let db
    let instances: string[]
    let nodes: cachedb[]
    let results

    try {
        const api = JSON.parse(fs.readFileSync('keys/caché.json').toString())
        db = require('./lib/cache1200.node')
    }
    catch (err) {
        audit(`Caché integration not available: ${err.message}`, 'warn')
    }

    export function openAll(ns = 'BIH'): cachedb[] {
        instances.forEach(server => {
            const cachedb = openInstance(server, ns)
            if (cachedb) nodes.push(cachedb)
        })
        return nodes
    }

    export function closeAll() {
        nodes.forEach(instance => {
            instance.cmd.close()
        })
    }

    export function openInstance(host: string, ns = 'BIH'): cachedb {
        try {
            const node = new db.Cache()
            const cos = node.open(Object.assign({ ip_address: host, namespace: ns }, api))
            audit(`${host} (${ns}) -> ${cos.ok ? cos.cache_pid : 'failed'}`, cos.ok ? 'info' : 'critical')
            return cos.ok ? { server: host, ns: ns, pid: cos.cache_pid, cmd: node } : null
        }
        catch (err) {
            audit(`${err.message} for ${host} (${ns})`, 'critical')
            return null
        }
    }

    export function global(nosql): object {
        let result = {}
        if (nosql.global) {
            result[nosql.global] = {}
            nosql.forEach(cstr => {
                if (cstr.subscripts) {
                    let n = cstr.subscripts.length - 1
                    result[nosql.global][cstr.subscripts[n]] = cstr.data
                }
            })
        }
        return result
    }

    export function webTrail(args) {
        nodes.forEach((node, i) => {
            const cos = node.cmd.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'Trail', arguments: args })
            if (cos.ok && isNaN(cos.result)) {
                const obj = JSON.parse(cos.result)
                const short = new RegExp(`/${node.server.split('.')[0]}/i`)
                if (!short.test(obj.instance)) obj.instance += "*"
                Array().push.apply(results, obj)
            }
        })
        results.sort((a, b) => (a.tm > b.tm) ? 1 : -1)
    }

    export function webtmaster(node: cachedb, webt: number): object {
        const cos = node.cmd.retrieve({ global: 'webtmaster', subscripts: [webt, 'login'] })
        return cos.ok ? global(cos) : null
    }

    //  TODO: account for UTC
    export function $h() {
        const now = new Date()
        return `${Math.floor(((now.getTime() + 4070908800000) / 86400000))},${((now.getHours() * 60 * 60) + (now.getMinutes() * 60) + now.getSeconds())}`
    }

    export function $zd(horolog: string | number, format: number): string {
        let ms = parseInt(String(horolog))
        ms = ms < 131072 ? ms * 86400000 - 4070908800000 : ms
        const js = new Date(ms)
        const en = 'en-US'
        let ds = ''
        let options = {}

        switch (format) {
            case 2:
                //  dd Mon yyyy
                ds = js.toLocaleDateString(en, { day: '2-digit' }) + ' ' + js.toLocaleDateString(en, { month: 'short' }) + ' ' + js.toLocaleDateString(en, { year: 'numeric' })
                break
            case 2:
                //  yyyy-mm-dd
                ds = js.toLocaleDateString(en, { year: 'numeric' }) + '-' + js.toLocaleDateString(en, { month: '2-digit' }) + '-' + js.toLocaleDateString(en, { day: '2-digit' })
                break
            case 5:
                //  Mon dd, yyyy
                options = { dateStyle: 'medium' }
                break
            case 9:
                //  Month dd, yyyy
                options = { dateStyle: 'long' }
                break
            case 11:
                //  Day
                options = { weekday: 'short' }
                break
            default:
                //  mm/dd/yyyy
                options = { month: '2-digit', day: '2-digit', year: 'numeric' }
        }

        return String(ds ? ds : js.toLocaleDateString(en, options))
    }

    export function $zdt(horolog: string | number, format): string {
        const date = $zd(horolog, format)
        const secs = parseInt(String(horolog).split(',')[1])
        const js = new Date(1000 * secs)
        const en = 'en-US'
        let dt = ''
        let options = {}

        switch (format) {
            default:
                options = { hour12: false }
        }

        return date + ' ' + String(dt ? dt : js.toLocaleTimeString(en, options))
    }
}

export = Caché
