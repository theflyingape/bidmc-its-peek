<template>
  <div class="uk-container">
    <div class="uk-float-right">
      <a class="uk-navbar-toggle" href="#offcanvas" uk-navbar-toggle-icon uk-toggle></a>
    </div>

    <!-- tabs -->
    <ul class="uk-tab" uk-switcher="animation: uk-animation-fade">
      <li>
        <a href="#">DevOps<span class="uk-margin-small-left" uk-icon="icon: users" /></a>
      </li>
      <li class="uk-active">
        <a href="#">Monitor<span class="uk-margin-small-left" uk-icon="icon: list" /></a>
      </li>
      <li>
        <a href="#">Archive <span uk-icon="icon: history" />&nbsp; DR <span uk-icon="icon: lifesaver" /></a>
      </li>
    </ul>

    <ul class="uk-switcher">
      <!-- devops -->
      <li>
        <template v-if="caché">
          <h3 style="text-align: right">{{ caché }}</h3>
        </template>
        <template v-else>
          <div class="uk-align-right uk-width-1-4 uk-alert-primary" uk-alert>
            <p style="text-align: right">Please use <span uk-icon="icon: menu"></span> menu button to select a <b>Caché</b> farm</p>
          </div>
        </template>
      </li>

      <!-- monitor -->
      <li>
        <template v-if="apache">
          <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto" id="dashboard">
            <!-- header line -->
            <thead>
              <tr>
                <th style="text-align: center">location</th>
                <th style="text-align: center">access</th>
                <th style="text-align: center" v-for="(server, index) in hosts.apache" :key="server">
                  <span v-if="wss[index].readyState < 3">{{ server.split('.')[0] }}</span>
                  <span v-else>
                  <button class="uk-button uk-button-link" @click="wss[index] = webSocketOpen(server)" type="button">
                    <em>{{ server.split('.')[0] }}</em>
                  </button></span>
                </th>
              </tr>
            </thead>
            <tbody v-if="ready">
              <!-- detail line -->
              <template v-for="(o1, location) in dashboard" v-bind="location">
                <template v-for="(o2, access, n) in dashboard[location]" v-bind="access">
                  <tr style="text-align: center" :key="`${location}-${access}`">
                    <td
                      v-if="n == 0"
                      :rowspan="Object.keys(dashboard[location]).length"
                      style="vertical-align: middle"
                      :key="`${location}-${access}1`"
                    >
                      {{ location }}
                    </td>
                    <td :key="`${location}-${access}2`">{{ access }}</td>
                    <td v-for="(value, server) in dashboard[location][access]" :key="server">
                      <button v-if="value" class="uk-button uk-button-link" @click="webtrailFormatter(location, access, server)" type="button">
                        {{ value }}
                      </button>
                      <span v-else>-</span>
                    </td>
                  </tr>
                </template>
              </template>
              <!-- total line -->
              <tr style="vertical-align: middle">
                <td style="text-align: center">
                  <a class="uk-button uk-button-primary" href="#modal-clientIP" uk-toggle>
                    <b>{{ apache }}</b> &nbsp;<span class="uk-margin-small-left" uk-icon="icon: info" />
                  </a>
                </td>
                <td style="text-align: right"><b>- total:</b></td>
                <td style="text-align: center" v-for="(value, index) in alive" :key="index">
                  <b>{{ value || '-' }}</b>
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th style="text-align: right">
                  <em>as of {{ refresh ? new Date(refresh).toLocaleTimeString('en-US', { hour12: false }) : 'never' }}</em>
                </th>
                <th style="text-align: right">events</th>
                <th style="text-align: center" v-for="server in hosts.apache" :key="server">
                  <span v-html="messages[server] || '-'"></span>
                </th>
              </tr>
            </thead>
          </table>
        </template>
        <template v-else>
          <div class="uk-align-right uk-width-1-4 uk-alert-primary" uk-alert>
            <p style="text-align: right">Please use <span uk-icon="icon: menu"></span> menu button to select an <b>Apache</b> web farm</p>
          </div>
        </template>
      </li>
      <!-- valhalla & asgard -->
      <li>
        <template>
        </template>
      </li>
    </ul>

    <!-- modals :: detail listing off main dashboard -->
    <div id="modal-clientIP" class="uk-model-container" uk-modal>
      <div class="uk-modal-dialog uk-modal-body uk-width-1-1" uk-overflow-auto>
        <button class="uk-modal-close-default" type="button" uk-close></button>
        <div class="uk-modal-header">
          <h2 class="uk-modal-title">Client IP - Topology</h2>
        </div>
        <span v-html="peekTable"></span>
      </div>
    </div>

    <div id="modal-webTrail" uk-modal>
      <div class="uk-modal-dialog uk-modal-body uk-width-1-2" style="text-align: center">
        <button class="uk-modal-close-default" type="button" uk-close></button>
        <div class="uk-modal-header">
          <h4>{{ webtrail.location }} - {{ webtrail.access }} on {{ webtrail.server }}</h4>
        </div>
        <span v-html="webtrailTable"></span>
      </div>
    </div>

    <!-- side navigation bar -->
    <div id="offcanvas" uk-offcanvas="flip: true; overlay: true">
      <div class="uk-offcanvas-bar">
        <button class="uk-offcanvas-close" type="button" uk-close></button>
        <h2>👁️ Peek Portal</h2>
        <a class="uk-icon-button" href="#" onclick="location.reload(true)" uk-icon="icon: refresh"></a>&nbsp;Reload
        <hr />

        <ul class="uk-nav uk-nav-default">
          <li class="uk-parent">
            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'MYCROFT,webOMR'" uk-icon="icon: world"></a>
              &nbsp;Production
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'MYCROFT,webOMR'">MYCROFT / webOMR</a></li>
            </ul>
            <hr />

            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'TOBY,webomr-test'" uk-icon="icon: push"></a>
              &nbsp;Test
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'TOBY,webomr-test'">TOBY / webOMR-test</a></li>
            </ul>
            <hr />

            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'WATSON,webomr-dev'" uk-icon="icon: code"></a>
              &nbsp;Development
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'WATSON,webomr-dev'">WATSON / webOMR-dev</a></li>
            </ul>
            <hr />
          </li>
        </ul>

        <h4>
          <a class="uk-icon-button" href="https://github.com/theflyingape/bidmc-its-peek" target="_blank" uk-icon="icon: github"></a>
          &nbsp;About
        </h4>
        <p>Insight activity into Caché and Apache web sessions.</p>
        <p class="uk-align-right">- <em>Robert Hurst</em></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import xterm from './consolelog'
const UIkit = require('uikit')

interface alive {
  [fqdn: string]: number
}

interface dashboard {
  [location: string]: {
    [access: string]: {
      [server: string]: number
    }
  }
}

interface hosts {
  apache: string[]
  caché: string[]
}

interface monitor {
  [location: string]: {
    [access: string]: string[]
  }
}

interface vip {
  apache: {
    [fqdn: string]: {
      caché: string
      hosts: string[]
    }
  }
  caché: {
    [fqdn: string]: {
      apache: string
      hosts: string[]
    }
  }
}

interface webtrail {
  enable?: boolean
  location?: string
  access?: string
  server?: string
  peek: {
    [host: string]: {
      ts?: string
      instance?: string
      pathname?: string
      webt?: string
      username?: string
    }
  }
}

@Component
export default class Portal extends Vue {
  ipRangeCheck = require('ip-range-check')
  monitor: monitor = require('../../../etc/monitor.json')
  vip: vip = require('../../../etc/vip.json')

  private _farm!: string

  alive: alive = {}
  apache = ''
  caché = ''
  client = []
  dashboard: dashboard = {}
  detail = false
  hosts: hosts = { apache: [], caché: [] }
  menu = ''
  messages: { [fqdn: string]: string | number } = {}
  peek: {
    [host: string]: {
      server: string
      ts: Date
      app: string
      ttl: number
      username?: string
      pathname: string
      webt?: string
    }
  } = {}
  peekTable = ''
  ready = false
  refresh = 0
  webAdds = 0
  webDrops = 0
  webLog = Date.now()
  webT = 0
  webtrail: webtrail = { enable: false, peek: {} }
  webtrailTable = ''
  wss: WebSocket[] = []

  get farm() {
    return this._farm
  }
  set farm(value: string) {
    this._farm = value
    this.alive = {}
    this.messages = {}

    this.apache = value.split(',')[1]
    this.caché = value.split(',')[0]

    this.hostList('apache', this.apache)
    this.hostList('caché', this.caché)

    this.dashboard = {}
    for (const location in this.monitor) {
      this.dashboard[location] = {}
      for (const access in this.monitor[location]) {
        this.dashboard[location][access] = {}
        this.hosts.apache.forEach((server) => {
          this.dashboard[location][access][server] = 0
        })
      }
    }

    //  configure UIkit events
    UIkit.offcanvas('#offcanvas').toggle()
    UIkit.util.on('#modal-clientIP', 'show', () => {
      this.peekTable = 'Loading ... <div uk-spinner></div>'
      this.detail = true
    })
    UIkit.util.on('#modal-clientIP', 'hide', () => {
      this.detail = false
    })
    UIkit.util.on('#modal-webTrail', 'show', () => {
      this.webtrail.enable = true
    })
    UIkit.util.on('#modal-webTrail', 'hide', () => {
      this.webtrail.enable = false
    })

    if (this.hosts.apache.length)
      this.webMonitoring()
        .catch((reject) => {})
        .finally(() => {
          this.$forceUpdate()
        })
  }

  hostList(farm: 'apache' | 'caché', name: string) {
    this.hosts[farm] = []
    for (let fqdn in this.vip[farm]) {
      const short = fqdn.split('.')[0]
      if (short == name.toLowerCase()) this.hosts[farm] = this.vip[farm][fqdn].hosts
    }
  }

  peekFormatter() {
    //  not showing clientIP - skip html rendering
    if (!this.detail) return

    let html = '<table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto">'
    html += `<thead><tr>`
    html += `<th style="text-align: center">location - access</th>`
    this.hosts.apache.forEach((server) => {
      html += `<th style="text-align: center">${server.split('.')[0]}</th>`
    })
    html += `</tr></thead>`

    let detail: { [location: string]: { [access: string]: { [server: string]: { ip: string[] } } } } = {}
    for (let location in this.dashboard) {
      detail[location] = {}
      for (let access in this.dashboard[location]) {
        detail[location][access] = {}
        this.hosts.apache.forEach((server) => {
          detail[location][access][server] = { ip: [] }
        })
      }
    }
    if (Object.keys(detail).length) {
      for (let remoteHost in this.peek) {
        const where = this.topology(remoteHost)
        detail[where.location][where.access][this.peek[remoteHost].server].ip.push(remoteHost)
      }

      html += `<tbody>`
      for (let location in detail) {
        let row = 0
        for (let access in detail[location]) {
          html += `<tr style="text-align: center">`
          html += `<td style="text-align: center">${location} - ${access}</td>`
          for (let server in detail[location][access]) html += `<td>${detail[location][access][server].ip.join('<br>') || '-'}</td>`
          html += `</tr>`
          row++
        }
      }
      html += `</tbody>`
    }

    html += `</table>`
    this.peekTable = html
  }

  topology(client: string): { location: string; access: string } {
    for (const l in this.monitor) {
      for (const a in this.monitor[l]) {
        if (this.ipRangeCheck(client, this.monitor[l][a])) {
          return { location: l, access: a }
        }
      }
    }
    return { location: '', access: '' }
  }

  webSocketOpen(server: string): WebSocket {
    const reqUrl = `wss://${server}/peek/apache/`
    let wss = new WebSocket(reqUrl)

    wss.onopen = () => {
      UIkit.notification({ message: `WebSocket opened: ${server}`, pos: 'bottom-left', status: 'success' })
      this.messages[server] = 0
      this.$forceUpdate()
    }

    wss.onclose = (ev) => {
      UIkit.notification({ message: `WebSocket closed: ${server}`, pos: 'bottom-left', status: 'warning' })
      this.messages[server] = `<em>${this.messages[server]}</em>`
      this.$forceUpdate()
    }

    wss.onerror = (ev) => {
      this.messages[server] = '<div uk-spinner></div>'
      UIkit.notification({ message: `WebSocket error: ${server}`, pos: 'bottom-left', status: 'danger' })
    }

    wss.onmessage = (ev) => {
      try {
        const result: {
          [remoteHost: string]: {
            ts: string
            app: string
            ttl: number
            pathname: string
            referer: string
            webt?: string
          }
        } = JSON.parse(ev.data)

        for (let remoteHost in result) {
          const where = this.topology(remoteHost)
          if (!where.location || !where.access) {
            UIkit.notification({
              message: `skipping ${remoteHost} from ${server}`,
              pos: 'bottom-left',
              status: 'warning',
            })
            continue
          }
          this.messages[server] = +this.messages[server] + 1

          if (this.peek[remoteHost]) {
            const from = this.peek[remoteHost].server
            if (from !== server) {
              if (this.dashboard[where.location][where.access][from]) {
                this.dashboard[where.location][where.access][from]--
                this.alive[from]--
              }
              this.peek[remoteHost].server = server
              //  log to console, but not API call-ins from our VPCs
              const ts = new Date(Date.now()).toLocaleTimeString()
              const msg = `${ts} \x1b[31;1m ${where.location} ${remoteHost} switched from ${from.split('.')[0]} to ${server.split('.')[0]}`
              xterm.writeln('\x1b[m')
              xterm.write(msg)
            }

            this.peek[remoteHost].ts = new Date(result[remoteHost].ts)
            this.peek[remoteHost].pathname = result[remoteHost].app || this.peek[remoteHost].pathname
          }
          else {
            //  new client
            const ts = new Date(result[remoteHost].ts)
            this.peek[remoteHost] = {
              server: server,
              ts: ts,
              app: result[remoteHost].app, ttl: result[remoteHost].ttl || 2000,
              pathname: result[remoteHost].pathname
            }
            this.webAdds++
          }

          if (!this.peek[remoteHost].app) this.peek[remoteHost].app = result[remoteHost].app
          if (result[remoteHost].ttl > this.peek[remoteHost].ttl) this.peek[remoteHost].ttl = result[remoteHost].ttl

          //  keep any last webt received
          if (result[remoteHost].webt) {
            if (!this.peek[remoteHost].webt) this.webT++
            this.peek[remoteHost].webt = result[remoteHost].webt
          }
        }

        for (const location in this.dashboard) for (const access in this.dashboard[location]) this.dashboard[location][access][server] = 0
        this.alive[server] = 0
        //  idle?
        for (let remoteHost in this.peek) {
          if (this.peek[remoteHost].server !== server) continue
          const where = this.topology(remoteHost)
          const then = this.peek[remoteHost].ts.valueOf() || 0
          const elapsed = Date.now() - then
          //  app identifed "TTL", else Netscaler is configured for 20-minutes
          if (elapsed < this.peek[remoteHost].ttl.valueOf() || 1200000) {
            this.dashboard[where.location][where.access][server]++
            this.alive[server]++
          } else {
            if (this.peek[remoteHost].webt) this.webT--
            delete this.peek[remoteHost]
            this.webDrops++
          }
        }
        //  update any active modal
        this.peekFormatter()
        if (this.webtrail.enable && this.webtrail.location && this.webtrail.access && this.webtrail.server == server)
          this.webtrailFormatter(this.webtrail.location, this.webtrail.access, this.webtrail.server)
      } catch (err:any) {
        UIkit.notification({
          message: `WebSocket message error: ${err.message} from ${server}`,
          pos: 'bottom-left',
          status: 'danger'
        })
      }

      this.ready = true
      this.refresh = Date.now()
      if (this.refresh - this.webLog > 59950) {
        const ts = new Date(this.refresh).toLocaleTimeString()
        let msg = `${ts}  ${this.webAdds} new endpoints detected`
        if (this.webDrops) msg += ` with ${this.webDrops} idle dropped`
        msg += '.  Active '
        if (this.webDrops) msg += `endpoints:\x1B[36;1m ${Object.keys(this.peek).length} \x1B[m`
        msg += `webt:\x1B[36;1m ${this.webT}`
        this.webAdds = 0
        this.webDrops = 0
        this.webLog = this.refresh
        xterm.writeln('\x1b[m')
        xterm.write(msg)
        xterm.scrollToBottom()
      }
    }

    return wss
  }

  webTrail(location: string, access: string, server: string) {
    return new Promise<number>((resolve, reject) => {
      let ccc: [{ ip?: string; webt?: string }?] = []

      for (let remoteHost in this.peek) {
        if (this.peek[remoteHost].server !== server) continue
        const where = this.topology(remoteHost)
        if (where.location !== location || where.access !== access) continue
        if (!this.webtrail.peek[remoteHost]) this.webtrail.peek[remoteHost] = {}
        this.webtrail.peek[remoteHost].ts = this.peek[remoteHost].ts.toLocaleTimeString()
        this.webtrail.peek[remoteHost].pathname = this.peek[remoteHost].pathname
        if (this.peek[remoteHost].webt) {
          this.webtrail.peek[remoteHost].webt = this.peek[remoteHost].webt
          if (!this.webtrail.peek[remoteHost].username)
            ccc.push({ ip: remoteHost, webt: this.webtrail.peek[remoteHost].webt })
        }
      }

      if (Object.keys(ccc).length) {
        const reqUrl = `https://${server}/peek/api/data/webt/`
        const params = new URLSearchParams({ INSTANCES: String(this.hosts.caché) })
        fetch(`${reqUrl}?${params}`, {
          method: 'POST',
          headers: new Headers({ 'content-type': 'application/json' }),
          body: JSON.stringify(ccc),
        })
          .then((response) => {
            response.json().then((globals) => {
              globals.forEach((global: { remoteHost: string; username: string; instance: string }) => {
                this.webtrail.peek[global.remoteHost].username = global.username || ''
                this.webtrail.peek[global.remoteHost].instance = global.instance || ''
              })
              resolve(1)
            })
          })
          .catch((err) => {
            console.error(err)
            reject(0)
          })
      } else resolve(0)
    })
  }

  webtrailFormatter(location: string, access: string, server: string) {
    if (!this.webtrail.enable) {
      this.webtrail = { location: location, access: access, server: server, peek: {} }
      UIkit.modal('#modal-webTrail').show()
      this.webtrailTable = 'Loading ... <div uk-spinner></div>'
    }
    //  harvest content details
    this.webTrail(location, access, server).finally(() => {
      let html = `<table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto">`
      html += `<thead><tr>`
      html += `<th style="text-align: center">client</th>`
      html += `<th style="text-align: center">timestamp</th>`
      html += `<th style="text-align: center">path / webt</th>`
      html += `<th style="text-align: center">username</th>`
      html += `</tr></thead>`

      html += `<tbody>`
      for (let remoteHost in this.webtrail.peek) {
        html += `<tr>`
        html += `<td>${remoteHost}</td>`
        html += `<td>${this.webtrail.peek[remoteHost].ts}</td>`
        html += `<td>${this.webtrail.peek[remoteHost].pathname || ''}${this.webtrail.peek[remoteHost].webt ? ' / ' + this.webtrail.peek[remoteHost].webt : ''}</td>`
        html += `<td>${this.webtrail.peek[remoteHost].username || 'n/a'}</td>`
        html += `</tr>`
      }
      html += `</tbody>`

      html += `</table>`
      this.webtrailTable = html
    })
  }

  //  Shall we begin?
  webMonitoring() {
    //  init collection(s)
    this.peek = {}

    return new Promise<number>((resolve, reject) => {
      this.wss.forEach((s) => { s.close() })
      this.wss = []

      this.ready = false

      this.hosts.apache.forEach((server) => {
        this.alive[server] = 0
        this.messages[server] = '<div uk-spinner></div>'

        let i = this.wss.push(this.webSocketOpen(server)) - 1
      })
      resolve(0)
    })
  }

  //  hooks
  beforeCreate() {}
  created() {}
  beforeMount() {}
  mounted() {}
  beforeUpdate() {}
  updated() {}
  beforeDestroy() {}
  destroyed() {}
}
</script>
