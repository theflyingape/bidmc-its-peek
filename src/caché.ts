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
    router.get(API, (req, res) => {
        let client = req.header('x-forwarded-for') || req.hostname
        audit(`GET Caché from ${client}`)
        console.log(req.url)
    })
    /*
        export const db = require('./cache.node')
        const api = JSON.parse(fs.readFileSync('keys/caché.json').toString())
    
        function openInstance(host: string, ns = 'CCC') {
    
            let cachedb = new db.Cache()
    
            try {
                cachedb.open({
                    ip_address: host, tcp_port: 1972, namespace: ns,
                    username: api[ns].username, password: api[ns].password
                })
            }
            catch(err) {
                console.error(err)
            }
        }
    
        function firstLogin(cachedb, ds = new Date().toLocaleDateString()) {
            cachedb.invoke_classmethod({ class: 'CCC.WEB.Session', method: 'FirstLogin', arguments: [ ds ] })
    
        }
    */
}

export = Caché


/** web globals
===============================================================================
^websmaster(993799208,"instance")="MYCROFTAPP1"
^websmaster(993799208,"webt",1205764736)="65784,48951"

^webtmaster(1205764736,"login","APP")=""
                           "browser")="Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
                          "instance")="MYCROFTAPP1"
                                "ip")="10.75.135.110"
                                "ke")=77299
                                "tm")="65784,48951"
                          "username")="kmccar10"
                         "webserver")="10.25.55.101"

MYCROFTAPP1:WEB>zw ^webs(993799208)
^webs(993799208,"ID",3431431)=2302
^webs(993799208,"back")="poe;^oeucm"
^webs(993799208,"from")="POE"
^webs(993799208,"login","APP")=""
^webs(993799208,"login","REAL")=""
^webs(993799208,"login","browser")="Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
^webs(993799208,"login","child")=1
^webs(993799208,"login","ip")="10.75.135.110"
^webs(993799208,"login","ke")=77299
^webs(993799208,"login","tm")="65784,48951"
^webs(993799208,"login","username")="kmccar10"

MYCROFTAPP1:WEB>zw ^webt(1205764736)
^webt(1205764736,-1,"%frmpg")=-1
^webt(1205764736,-1,"%ns")="bih"
^webt(1205764736,-1,"%prg")="^%zwebmain"
^webt(1205764736,-1,"%webs")=993799208
^webt(1205764736,0)=17

===============================================================================
^websmaster(993799209,"instance")="MYCROFTAPP1"
^websmaster(993799209,"webt",1205764738)="65784,48951"
                             1205764782)="65784,48958"
                             1205764788)="65784,48960"

^webtmaster(1205764738,"login","APP")="POESS^^1313574^26"
                           "browser")="Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
                          "instance")="MYCROFTAPP1"
                                "ip")="10.75.27.205"
                                "ke")=83067
                                "tm")="65784,48951"
                             "token")="HjTSVagRviwL4iR4scwg9sCsxwQyLA"
                          "username")="htietje"
                         "webserver")="10.25.55.102"

^webtmaster(1205764782,"login","APP")="POESS^^1313574^26"
                           "browser")="Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
                          "instance")="MYCROFTAPP1"
                                "ip")="10.75.27.205"
                                "ke")=83067
                                "tm")="65784,48951"
                             "token")="MLEHSwzsdzs3lrc/f08+J3jYMQKMAm"
                          "username")="htietje"
                         "webserver")="10.25.55.102"

^webtmaster(1205764788,"login","APP")="POESS^^1313574^26"
                           "browser")="Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
                          "instance")="MYCROFTAPP1"
                                "ip")="10.75.27.205"
                                "ke")=83067
                                "tm")="65784,48951"
                             "token")="MLEHSwzsdzs3lrc/f08+J3jYMQKMAm"
                          "username")="htietje"
                         "webserver")="10.25.55.102"
*/
