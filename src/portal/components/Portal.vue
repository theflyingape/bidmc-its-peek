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
          <h3 style="text-align: right;">{{ caché }}</h3>
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
          <h3 style="text-align: right;">{{ apache }}</h3>
          <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto">
            <thead>
              <tr>
                <th>location</th>
                <th>access</th>
                <th>cccdevweb01</th>
                <th>cccdevweb02</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(i, location) in monitor">
                <tr style="vertical-align: middle" v-for="(j, access) in monitor[location]" :key="`${access}-${j}`">
                  <td><span v-once>{{ location }}</span></td>
                  <td><span v-once>{{ access }}</span></td>
                  <td>0</td>
                  <td>0</td>
                </tr>
              </template>
            </tbody>
            <thead>
              <tr>
                <th>
                  <em>as of {{ refresh }}</em>
                </th>
                <th>totals</th>
                <th>0</th>
                <th>0</th>
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
        <h2>Peek Portal</h2>
        <hr>

        <ul class="uk-nav uk-nav-default">
          <li class="uk-parent">
            <ul class="uk-nav-header">Production <span class="uk-margin-small-left" uk-icon="icon: world"></span></ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm='MYCROFT,webOMR'">MYCROFT / webOMR</a></li>
            </ul>
            <hr>

            <ul class="uk-nav-header">Test <span class="uk-margin-small-left" uk-icon="icon: push"></span></ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm='TOBY,webomr-test'">TOBY / webOMR-test</a></li>
            </ul>
            <hr>

            <ul class="uk-nav-header">Development <span class="uk-margin-small-left" uk-icon="icon: code"></span></ul>
            <ul class="uk-nav-sub">
              <li><a href="#" @click="farm='WATSON,webomr-dev'">WATSON / webOMR-dev</a></li>
            </ul>
            <hr>
          </li>
        </ul>

        <h4>About</h4>
        <p>
        </p>
        <p class="uk-align-right">- <em>Robert Hurst</em></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from "vue-property-decorator";
const UIkit = require("uikit");

interface alive {
  address: RegExp
  count: number
}

interface monitor {
  location: { access: { address: string } }
}

@Component
export default class Portal extends Vue {
  monitor = require("../../../etc/monitor.json");

  private _farm!: string;
  private _refresh!: string;
  apache = "";
  caché = "";
  client = [];
  menu = "";

  get farm() {
    return this._farm;
  }
  set farm(value: string) {
    this._farm = value;
    this.caché = value.split(",")[0];
    this.apache = value.split(",")[1];
    UIkit.offcanvas('#offcanvas').toggle();
  }

  get refresh() {
    return this._refresh;
  }
  set refresh(value: string) {
    this._refresh = value;
  }

  beforeCreate() {}

  created() {
    this.menu = 'peek'
    this.refresh = 'never'
  }

  beforeMount() {}
  mounted() {}
  beforeUpdate() {}
  updated() {}
  beforeDestroy() {}
  destroyed() {}
}

</script>
