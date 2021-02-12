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
        next()
    })
    .get(`${API}/ip/:ip`, (req, res) => {
        let instances = openAll((req.query.INSTANCES || ['localhost']).toString().split(','))

        let results = []
        instances.forEach(instance => {
            let cos = webTrail(instance.cachedb, [, req.params.ip])
            if (cos) {
                const short = new RegExp(`/${instance.server.split('.')[0]}/i`)
                if (!short.test(cos.instance)) cos.instance += "*"
                Array().push.apply(results, cos)
            }
        })

        closeAll(instances)

        results.sort((a, b) => (a.ts > b.ts) ? 1 : -1)
        res.json(results)
        res.end
    })
    .get(`${API}/username/:username`, (req, res) => {
        let instances = openAll(req.query.INSTANCES.toString().split(',') || ['localhost'])

        let results = []
        instances.forEach(instance => {
            let cos = webTrail(instance.cachedb, [ , , req.params.username ])
            if (cos) {
                const short = new RegExp(`/${instance.server.split('.')[0]}/i`)
                if (!short.test(cos.instance)) cos.instance += "*"
                Array().push.apply(results, cos)
            }
        })

        closeAll(instances)

        results.sort((a, b) => (a.ts > b.ts) ? 1 : -1)
        res.json(results)
        res.end
    })

    //  DATABASE services
    export const db = require('./assets/cache1200.node')
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

    function webTrail(cachedb, args) {
        const cos = cachedb.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'Trail', arguments: args })
        return cos.ok && isNaN(cos.result) ? JSON.parse(cos.result) : null
    }

    function webtmaster(cachedb, webt:number): object {
        const cos = cachedb.retrieve({ global: 'webtmaster', subscripts: [ webt, 'login'] })
        return global(cos)
    }
}

export = Caché
