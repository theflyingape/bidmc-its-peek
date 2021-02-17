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
          <h3 style="text-align: right">{{ apache }}</h3>
          <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto">
            <thead>
              <tr>
                <th>location</th>
                <th style="text-align: center">access</th>
                <th style="text-align: center" v-for="h in hosts.apache" :key="h">{{ h.split(".")[0] }}</th>
              </tr>
            </thead>
            <!-- detail -->
            <tbody>
      <!--
              <template v-for="(i, location) in monitor">
                <tr style="vertical-align: middle" v-for="j in monitor[location]" :key="j.access">
                  <td><span v-once>{{ location }}</span></td>
                  <td style="text-align: center"><span v-once>{{ access }}</span></td>
                  <td style="text-align: center" v-for="h in hosts.apache" :key="h">0</td>
                </tr>
              </template>
      -->
              <tr style="vertical-align: middle">
                <td></td>
                <td style="text-align: right">total</td>
                <td style="text-align: center" v-for="(obj, index) of alive" :key="index">{{ obj.count }}</td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th><em>as of {{ new Date(refresh).toLocaleTimeString("en-US", { hour12: false }) }}</em></th>
                <th>events</th>
                <th style="text-align: center" v-for="(value, index) in messages" :key="index">{{ value }}</th>
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

    <div id="offcanvas" uk-offcanvas="flip: true; overlay: true">
      <div class="uk-offcanvas-bar">
        <button class="uk-offcanvas-close" type="button" uk-close></button>
        <h2>👁️ Peek Portal</h2>
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
  [fqdn: string]: {
    address: RegExp;
    count: number;
  };
}

interface hosts {
  apache: string[];
  caché: string[];
}

interface monitor {
  [location: string]: {
    [access: string]: {
      match: string
    }
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
  monitor = require("../../../etc/monitor.json");
  vip: vip = require("../../../etc/vip.json");

  private _farm!: string;

  alive: alive = {};
  apache = "";
  caché = "";
  client = [];
  hosts: hosts = { apache: [], caché: [] };
  menu = "";
  messages: { [fqdn: string]: number } = {};
  refresh = 0;

  get farm() {
    return this._farm;
  }
  set farm(value: string) {
    this._farm = value;
    const apache = value.split(",")[1];
    const caché = value.split(",")[0];

    this.hostList("apache", apache);
    this.hostList("caché", caché);

    this.apache = apache;
    this.caché = caché;

    UIkit.offcanvas("#offcanvas").toggle();

    this.webMonitoring()
  }

  hostList(farm: "apache" | "caché", name: string) {
    this.hosts[farm] = [];
    for (let fqdn in this.vip[farm]) {
      const short = fqdn.split(".")[0];
      if (short == name.toLowerCase())
        this.hosts[farm] = this.vip[farm][fqdn].hosts;
    }
  }

  //  Shall we begin?
  webMonitoring() {
    //  init collection(s)
    let messages = 0;
    let peek: { [host: string]: string } = {};

    return new Promise<number>((resolve, reject) => {
      /*
      wss.forEach((s) => {
          s.close()
      })
    */
      let count = this.hosts.apache.length;
      let wss: WebSocket[] = [];

      this.hosts.apache.forEach((server) => {
        this.alive[server] = { address: /(?:)/, count: 0 };
        this.messages[server] = 0;

        const reqUrl = `wss://${server}/peek/apache/`;
        const params = new URLSearchParams({
          VIP: this.apache,
          USER: "peek-monitor",
          host: ".*",
          request: ".*",
          status: ".*",
          webt: String(0),
          verbose: String(+true),
          xtra: String(+false),
          monitor: String(+true),
        }).toString();

        let i = wss.push(new WebSocket(`${reqUrl}?${params}`)) - 1;

        wss[i].onopen = () => {
          //  vt.outln(vt.faint, server, ' opened WebSocket')
        };

        wss[i].onclose = (ev) => {
          if (!count) resolve(1);
        };

        wss[i].onerror = (ev) => {
          //  vt.outln(vt.red, vt.bright, server, ' error ', ev.message)
        };

        wss[i].onmessage = (ev) => {
          try {
            if (messages < 0) messages--;
            else messages++;

            let result = JSON.parse(ev.data);
            if (result.remoteHost) {
              this.messages[server]++;
              if (!peek[result.remoteHost])
                this.alive[server].count++;
              peek[result.remoteHost] = result.time;
              this.refresh = Date.now();
            }
          } catch (err) {
            //  vt.outln(vt.red, 'error: ', vt.reset, err.message)
          }
        };
      });
      if (count == 0) resolve(1);
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
