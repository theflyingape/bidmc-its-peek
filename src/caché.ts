/*
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

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
        webTrail([ , , req.params.username ])
        next()
    })
    .use((req, res, next) => {
        closeAll()
        res.json(results)
        res.end
    })

    //  DATABASE services
    export const db = require('./assets/cache1200.node')
    const api = JSON.parse(fs.readFileSync('keys/caché.json').toString())
    export let nodes: cachedb[]
    let instances: string[]
    let results

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
            return cos.ok ? { server: host, ns: ns, pid: cos.cache_pid, cmd: node } : null
        }
        catch (err) {
            console.error(`${err.message} for ${host} (${ns})`)
            return null
        }
    }

    export function global(nosql): object {
        let result = {}
        for (let n in nosql.key)
            result[nosql.key[n]] = nosql.value[n]
        return result
    }

    export function webTrail(args) {
        nodes.forEach(node => {
            const cos = node.cmd.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'Trail', arguments: args })
            if (cos.ok && isNaN(cos.result)) {
                const obj = JSON.parse(cos.result)
                const short = new RegExp(`/${node.server.split('.')[0]}/i`)
                if (!short.test(obj.instance)) obj.instance += "*"
                Array().push.apply(results, obj)
            }
        })
        results.sort((a, b) => (a.ts > b.ts) ? 1 : -1)
    }

    export function webtmaster(node: cachedb, webt:number): object {
        const cos = node.cmd.retrieve({ global: 'webtmaster', subscripts: [ webt, 'login'] })
        return cos.ok ? global(cos) : null
    }
}

export = Caché
