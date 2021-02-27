<template>
  <div class="uk-container">
    <div class="uk-float-right">
      <div class="uk-tooltip uk-tooltip-bottom-center uk-display-inline-block uk-margin-remove uk-position-relative">
        {{ menu }}
      </div>
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
    </ul>

    <ul class="uk-switcher">
      <!-- devops -->
      <li>
        <template v-if="caché">
          <h3 style="text-align: right">{{ caché }}</h3>
        </template>
        <template v-else>
          <div class="uk-align-right uk-width-1-4 uk-alert-primary" uk-alert>
            <button class="uk-alert-close" type="button" uk-close></button>
            <h3><span class="uk-badge">NOTE</span></h3>
            <p>Please use <span uk-icon="icon: menu"></span> menu button to select a <b>Caché</b> farm</p>
          </div>
        </template>
      </li>

      <!-- monitor -->
      <li>
        <template v-if="apache">
          <div style="text-align: right">
            <a class="uk-button uk-button-primary" href="#modal-clientIP" uk-toggle>
              <b>{{ apache }}</b> &nbsp;<span class="uk-margin-small-left" uk-icon="icon: info" />
            </a>
          </div>
          <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto" id="dashboard">
            <!-- header line -->
            <thead>
              <tr>
                <th style="text-align: center">location</th>
                <th style="text-align: center">access</th>
                <th style="text-align: center" v-for="server in hosts.apache" :key="server">
                  {{ server.split('.')[0] }}
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
                <td></td>
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
            <button class="uk-alert-close" type="button" uk-close></button>
            <h3><span class="uk-badge">NOTE</span></h3>
            <p>Please use <span uk-icon="icon: menu"></span> menu button to select an <b>Apache</b> web farm</p>
          </div>
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
      <div class="uk-modal-dialog uk-modal-body" style="text-align: center">
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
      pathname: string
      username?: string
      webt?: string
    }
  } = {}
  peekTable = ''
  ready = false
  refresh = 0
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
    html += `<th style="text-align: center">location</th>`
    html += `<th style="text-align: center">access</th>`
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
          if (!row) html += `<td style="vertical-align: middle" rowspan="${Object.keys(detail[location]).length}">${location}</td>`
          html += `<td>${access}</td>`
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

  webTrail(location: string, access: string, server: string) {
    return new Promise<number>((resolve, reject) => {
      this.webtrail = { location: location, access: access, server: server, peek: {} }
      let ccc: [{ ip?: string; webt?: string }?] = []

      for (let remoteHost in this.peek) {
        if (this.peek[remoteHost].server !== server) continue
        const where = this.topology(remoteHost)
        if (where.location !== location || where.access !== access) continue
        if (!this.webtrail.peek[remoteHost]) this.webtrail.peek[remoteHost] = {}
        this.webtrail.peek[remoteHost].ts = this.peek[remoteHost].ts.toLocaleTimeString()
        if (this.peek[remoteHost].pathname && !/(\/scripts\/)/.test(this.peek[remoteHost].pathname))
          this.webtrail.peek[remoteHost].pathname = this.peek[remoteHost].pathname
        if (this.peek[remoteHost].webt) this.webtrail.peek[remoteHost].webt = this.peek[remoteHost].webt
        if (this.peek[remoteHost].webt && !this.webtrail.peek[remoteHost].username) {
          ccc.push({ ip: remoteHost, webt: this.peek[remoteHost].webt })
        }
      }

      if (Object.keys(ccc).length) {
        const reqUrl = `https://${server}/peek/api/data/webt/`
        const params = new URLSearchParams({ INSTANCES: String(this.hosts.caché) })
        console.debug(JSON.stringify(ccc))
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
            })
          })
          .catch((err) => {
            console.error(err)
            reject(0)
          })
          .finally(() => {
            resolve(Object.keys(ccc).length)
          })
      } else resolve(0)
    })
  }

  webtrailFormatter(location: string, access: string, server: string) {
    this.webtrailTable = 'Loading ... <div uk-spinner></div>'
    UIkit.modal('#modal-webTrail').show()
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
        html += `<td>${this.webtrail.peek[remoteHost].pathname || this.webtrail.peek[remoteHost].webt || 'scope'}</td>`
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
      this.wss.forEach((s) => {
        s.close()
      })
      this.wss = []

      let count = 0
      this.ready = false

      this.hosts.apache.forEach((server) => {
        this.alive[server] = 0
        this.messages[server] = '<div uk-spinner></div>'

        const reqUrl = `wss://${server}/peek/apache/`

        let i = this.wss.push(new WebSocket(reqUrl)) - 1

        this.wss[i].onopen = () => {
          UIkit.notification({ message: `WebSocket opened: ${server}`, pos: 'bottom-left', status: 'success' })
          this.messages[server] = 0
          count++
        }

        this.wss[i].onclose = (ev) => {
          UIkit.notification({ message: `WebSocket closed: ${server}`, pos: 'bottom-left', status: 'warning' })
          this.messages[server] = `<em>${this.messages[server]}</em>`
          count--
          if (!count) resolve(1)
        }

        this.wss[i].onerror = (ev) => {
          this.messages[server] = '<div uk-spinner></div>'
          UIkit.notification({ message: `WebSocket error: ${server}`, pos: 'bottom-left', status: 'danger' })
        }

        this.wss[i].onmessage = (ev) => {
          try {
            const result: {
              [remoteHost: string]: {
                ts: string
                pathname: string
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
                  UIkit.notification({
                    message: `${where.location} ${remoteHost} switched from ${from.split('.')[0]} to ${server.split('.')[0]}`,
                    pos: 'bottom-left',
                    status: 'warning',
                  })
                  this.peek[remoteHost].server = server
                }
                this.peek[remoteHost].ts = new Date(result[remoteHost].ts)
                this.peek[remoteHost].pathname = result[remoteHost].pathname
              } else {
                this.peek[remoteHost] = {
                  server: server,
                  ts: new Date(result[remoteHost].ts),
                  pathname: result[remoteHost].pathname,
                }
              }
              //  keep any last webt received
              if (result[remoteHost].webt) this.peek[remoteHost].webt = result[remoteHost].webt
            }

            for (const location in this.dashboard) for (const access in this.dashboard[location]) this.dashboard[location][access][server] = 0
            this.alive[server] = 0
            //  idle?
            for (let remoteHost in this.peek) {
              if (this.peek[remoteHost].server !== server) continue
              const where = this.topology(remoteHost)
              const then = this.peek[remoteHost].ts.valueOf() || 0
              const elapsed = Date.now() - then
              if (elapsed < 1200000) {
                this.dashboard[where.location][where.access][server]++
                this.alive[server]++
              } else delete this.peek[remoteHost]
            }
            this.peekFormatter()
          } catch (err) {
            UIkit.notification({
              message: `WebSocket message error: ${err.message} from ${server}`,
              pos: 'bottom-left',
              status: 'danger',
            })
            console.error(reqUrl, 'websocket message', err.message)
          }

          this.ready = true
          this.refresh = Date.now()
        }
      })
    })
  }

  //  hooks
  beforeCreate() {}

  created() {
    this.menu = 'peek'
  }

  beforeMount() {}
  mounted() {}
  beforeUpdate() {}
  updated() {}
  beforeDestroy() {}
  destroyed() {}
}
</script>
