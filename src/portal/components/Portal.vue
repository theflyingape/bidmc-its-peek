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
            <a class="uk-button uk-button-primary" href="#modal-scrollbar" uk-toggle>
              <b>{{ apache }}</b>
            </a>
          </div>
          <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto" id="dashboard">
            <!-- header line -->
            <thead>
              <tr>
                <th style="text-align: center">location</th>
                <th style="text-align: center">access</th>
                <th style="text-align: center" v-for="server in hosts.apache" :key="server">
                  {{ server.split(".")[0] }}
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
                      {{ value || "-" }}
                    </td>
                  </tr>
                </template>
              </template>
              <!-- total line -->
              <tr v-if="ready" style="vertical-align: middle">
                <td></td>
                <td style="text-align: right"><b>- total:</b></td>
                <td style="text-align: center" v-for="(value, index) in alive" :key="index">
                  <b>{{ value || "-" }}</b>
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th>
                  <em
                    >as of
                    {{ refresh ? new Date(refresh).toLocaleTimeString("en-US", { hour12: false }) : "never" }}
                  </em>
                </th>
                <th>events</th>
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

    <div id="modal-scrollbar" uk-modal>
      <div class="uk-modal-dialog uk-modal-body">
        <button class="uk-modal-close-default" type="button" uk-close></button>
        <span v-html="`<pre>${JSON.stringify(peek, null, 2)}</pre>` || '-empty-'"></span>
      </div>
    </div>

    <div id="offcanvas" uk-offcanvas="flip: true; overlay: true">
      <div class="uk-offcanvas-bar">
        <button class="uk-offcanvas-close" type="button" uk-close></button>
        <h2>👁️ Peek Portal</h2>
        <a class="uk-icon-button" href="#" onclick="location.reload(true)" uk-icon="icon: refresh"></a>&nbsp;Reload
        <hr />

        <ul class="uk-nav uk-nav-default">
          <li class="uk-parent">
            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'MYCROFT,webOMR'" uk-icon="icon: world"></a
              >&nbsp;Production
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'MYCROFT,webOMR'">MYCROFT / webOMR</a></li>
            </ul>
            <hr />

            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'TOBY,webomr-test'" uk-icon="icon: push"></a
              >&nbsp;Test
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'TOBY,webomr-test'">TOBY / webOMR-test</a></li>
            </ul>
            <hr />

            <ul class="uk-nav-header">
              <a class="uk-icon-button" href="#" @click="farm = 'WATSON,webomr-dev'" uk-icon="icon: code"></a
              >&nbsp;Development
            </ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm = 'WATSON,webomr-dev'">WATSON / webOMR-dev</a></li>
            </ul>
            <hr />
          </li>
        </ul>

        <h4>
          <a
            class="uk-icon-button"
            href="https://github.com/theflyingape/bidmc-its-peek"
            target="_blank"
            uk-icon="icon: github"
          ></a
          >&nbsp;About
        </h4>
        <p>Insight activity into Caché and Apache web sessions.</p>
        <p class="uk-align-right">- <em>Robert Hurst</em></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
const UIkit = require("uikit");

interface alive {
  [fqdn: string]: number;
}

interface dashboard {
  [location: string]: {
    [access: string]: {
      [server: string]: number;
    };
  };
}

interface hosts {
  apache: string[];
  caché: string[];
}

interface monitor {
  [location: string]: {
    [access: string]: string[];
  };
}

interface vip {
  apache: {
    [fqdn: string]: {
      caché: string;
      hosts: string[];
    };
  };
  caché: {
    [fqdn: string]: {
      apache: string;
      hosts: string[];
    };
  };
}

@Component
export default class Portal extends Vue {
  ipRangeCheck = require("ip-range-check");
  monitor: monitor = require("../../../etc/monitor.json");
  vip: vip = require("../../../etc/vip.json");

  private _farm!: string;

  alive: alive = {};
  apache = "";
  caché = "";
  client = [];
  dashboard: dashboard = {};
  hosts: hosts = { apache: [], caché: [] };
  menu = "";
  messages: { [fqdn: string]: string | number } = {};
  peek: {
    [host: string]: {
      server: string;
      ts: Date;
    };
  } = {};
  ready = false;
  refresh = 0;
  wss: WebSocket[] = [];

  get farm() {
    return this._farm;
  }
  set farm(value: string) {
    this._farm = value;
    this.alive = {};
    this.messages = {};

    this.apache = value.split(",")[1];
    this.caché = value.split(",")[0];

    this.hostList("apache", this.apache);
    this.hostList("caché", this.caché);

    this.dashboard = {};
    for (const location in this.monitor) {
      this.dashboard[location] = {};
      for (const access in this.monitor[location]) {
        this.dashboard[location][access] = {};
        this.hosts.apache.forEach((server) => {
          this.dashboard[location][access][server] = 0;
        });
      }
    }

    UIkit.offcanvas("#offcanvas").toggle();

    if (this.hosts.apache.length)
      this.webMonitoring()
        .catch((reject) => {})
        .finally(() => {
          this.$forceUpdate();
        });
  }

  hostList(farm: "apache" | "caché", name: string) {
    this.hosts[farm] = [];
    for (let fqdn in this.vip[farm]) {
      const short = fqdn.split(".")[0];
      if (short == name.toLowerCase()) this.hosts[farm] = this.vip[farm][fqdn].hosts;
    }
  }

  topology(client: string): { location: string; access: string } {
    for (const l in this.monitor) {
      for (const a in this.monitor[l]) {
        if (this.ipRangeCheck(client, this.monitor[l][a])) {
          return { location: l, access: a };
        }
      }
    }
    return { location: "", access: "" };
  }

  //  Shall we begin?
  webMonitoring() {
    //  init collection(s)
    this.peek = {};

    return new Promise<number>((resolve, reject) => {
      this.wss.forEach((s) => {
        s.close();
      });
      this.wss = [];

      let count = 0;
      this.ready = false;

      this.hosts.apache.forEach((server) => {
        this.alive[server] = 0;
        this.messages[server] = "<div uk-spinner></div>";

        const reqUrl = `wss://${server}/peek/apache/`;

        let i = this.wss.push(new WebSocket(reqUrl)) - 1;

        this.wss[i].onopen = () => {
          UIkit.notification({ message: `WebSocket opened: ${server}`, pos: "bottom-left", status: "success" });
          this.messages[server] = 0;
          count++;
        };

        this.wss[i].onclose = (ev) => {
          UIkit.notification({ message: `WebSocket closed: ${server}`, pos: "bottom-left", status: "warning" });
          this.messages[server] = `<em>${this.messages[server]}</em>`;
          count--;
          if (!count) resolve(1);
        };

        this.wss[i].onerror = (ev) => {
          UIkit.notification({ message: `WebSocket error: ${server}`, pos: "bottom-left", status: "danger" });
        };

        this.wss[i].onmessage = (ev) => {
          try {
            const result: { [remoteHost: string]: string } = JSON.parse(ev.data);

            for (let remoteHost in result) {
              const where = this.topology(remoteHost);
              if (!where.location || !where.access) {
                UIkit.notification({
                  message: `skipping ${remoteHost} from ${server}`,
                  pos: "bottom-left",
                  status: "warning",
                });
                continue;
              }
              this.messages[server] = +this.messages[server] + Object.keys(result).length;

              if (this.peek[remoteHost]) {
                const from = this.peek[remoteHost].server;
                if (from !== server)
                  console.debug(
                    remoteHost,
                    "switched ",
                    from.split(".")[0],
                    "to",
                    server.split("."[0]),
                    "on",
                    result[remoteHost]
                  );
              }
              this.peek[remoteHost] = { server: server, ts: new Date(result[remoteHost]) };
            }

            for (const location in this.dashboard)
              for (const access in this.dashboard[location]) this.dashboard[location][access][server] = 0;
            this.alive[server] = 0;
            //  idle?
            for (let remoteHost in this.peek) {
              if (this.peek[remoteHost].server !== server)
                continue
              const where = this.topology(remoteHost);
              const then = this.peek[remoteHost].ts.valueOf() || 0;
              const elapsed = Date.now() - then;
              if (elapsed < 1200000) {
                this.dashboard[where.location][where.access][server]++;
                this.alive[server]++;
              }
              else
                delete this.peek[remoteHost];
            }
          } catch (err) {
            UIkit.notification({
              message: `WebSocket message error: ${err.message} from ${server}`,
              pos: "bottom-left",
              status: "danger",
            });
            console.error(reqUrl, "websocket message", err.message);
          }

          if (count) this.ready = true;
          this.refresh = Date.now();
        };
      });
    });
  }

  //  hooks
  beforeCreate() {}

  created() {
    this.menu = "peek";
  }

  beforeMount() {}
  mounted() {}
  beforeUpdate() {}
  updated() {}
  beforeDestroy() {}
  destroyed() {}
}
</script>
