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
    </ul>

    <ul class="uk-switcher">
      <!-- devops -->
      <li>
        <h3>{{ caché }}</h3>
        <table class="uk-table uk-table-divider uk-table-hover"></table>
      </li>

      <!-- monitor -->
      <li>
        <h3>{{ apache }}</h3>
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
            <tr>
              <td rowspan="2" style="vertical-align: middle">East campus</td>
              <td>lan</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>wifi</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td rowspan="2" style="vertical-align: middle">West campus</td>
              <td>lan</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>wifi</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td rowspan="2" style="vertical-align: middle">Remote sites</td>
              <td>lan</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>wifi</td>
              <td class="uk-flex-center">0</td>
              <td class="uk-flex-center">0</td>
            </tr>
            <tr>
              <td rowspan="2" style="vertical-align: middle">Renaissance</td>
              <td>lan</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>vpn</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Internet</td>
              <td>cyber</td>
              <td>0</td>
              <td>0</td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <th>
                <em>as of {{ updated }}</em>
              </th>
              <th>totals</th>
              <th>0</th>
              <th>0</th>
            </tr>
          </thead>
        </table>
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
              <li><a href="#">MYCROFT / webOMR</a></li>
            </ul>
            <hr>

            <ul class="uk-nav-header">Test <span class="uk-margin-small-left" uk-icon="icon: push"></span></ul>
            <ul class="uk-nav-sub">
              <li><a href="#">TOBY / webOMR-test</a></li>
            </ul>
            <hr>

            <ul class="uk-nav-header">Development <span class="uk-margin-small-left" uk-icon="icon: code"></span></ul>
            <ul class="uk-nav-sub">
              <li><a href="#">WATSON / webOMR-dev</a></li>
            </ul>
            <hr>
          </li>
        </ul>

        <h4>About</h4>
        <p>
        </p>
        <p class="uk-align-right">- authored by <em>Robert Hurst</em></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from "vue-property-decorator";

@Component
export default class Portal extends Vue {
  private _farm!: string;
  apache = "";
  caché = "";
  devops = false;
  monitor = false;
  updated = new Date().toLocaleTimeString();

  get farm() {
    return this._farm;
  }

  set farm(value: string) {
    this._farm = value;
    this.caché = value.split(",")[0];
    this.apache = value.split(",")[1];
  }
}
</script>
