/*
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import express = require('express')
import fs = require('fs')
import path = require('path')
import { audit } from './gateway'

module Caché {

    export const API = encodeURI(`/${path.basename(__filename).split('.')[0]}`)
    export const router = express.Router({
        caseSensitive: true, strict: false, mergeParams: false
    })

    //  REST services
    router.get(`${API}/*`, (req, res, next) => {
        next()
    })
    .get(`${API}/ip/:ip`, (req, res) => {
        let instances = openAll((req.query.INSTANCES || ['localhost']).toString().split(','))

        let results = []
        instances.forEach(instance => {
            results.push({ server: instance.server, trail: ipTrail(instance.cachedb, req.params.ip) })
        })

        closeAll(instances)
        res.json(results)
        res.end
    })
    .get(`${API}/username/:username`, (req, res) => {
        let instances = openAll(req.query.INSTANCES.toString().split(',') || ['localhost'])

        let results = []
        instances.forEach(instance => {
            results.push({ server: instance.server, trail: usernameTrail(instance.cachedb, req.params.username) })
        })

        closeAll(instances)
        res.json(results)
        res.end
    })

    //  DATABASE services
    export const db = require('./cache.node')
    const api = JSON.parse(fs.readFileSync('keys/caché.json').toString())

    function openAll(instances: string[], ns = 'BIH'): cachedb[] {
        let cachedb = []
        instances.forEach(server => {
            cachedb.push(openInstance(server, ns))
        })
        return cachedb
    }

    function closeAll(instances: cachedb[]) {
        instances.forEach(instance => {
            instance.cachedb.close()
        })
    }

    function openInstance(host: string, ns = 'BIH'): cachedb {

        let cachedb = new db.Cache()

        try {
            cachedb.open(Object.assign({ ip_address: host, namespace: ns }, api))
        }
        catch (err) {
            console.error(err)
        }

        return { server: host, cachedb: cachedb }
    }

    function global(nosql): object {
        let result = {}
        for (let n in nosql.key)
            result[nosql.key[n]] = nosql.value[n]
        return result
    }

    function ipTrail(cachedb, ip:string) {
        const invoke = cachedb.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'Trail', arguments: [, ip] })
        return JSON.parse(invoke.result)
    }

    function usernameTrail(cachedb, username: string) {
        const invoke = cachedb.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'Trail', arguments: [, , username] })
        return JSON.parse(invoke.result)
    }

    function webtmaster(cachedb, webt:number): object {
        const global = cachedb.retrieve({ global: 'webtmaster', subscripts: [ webt, 'login'] })
        return global(global)
    }
}

export = Caché
