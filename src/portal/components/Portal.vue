<template>
  <div class="uk-container">
    <!-- header -->
    <div class="uk-margin-auto" uk-height-viewport="offset-top: true" id="viewport">
      <div class="uk-align-left">
        <h2>Peek Portal</h2>
      </div>
      <div class="uk-align-right">
        <div uk-form-custom=" target:> * > span:first-child">
          <select onchange="selectWebOmr(this);">
            <option value="webomr"><span class="uk-margin-small-right" uk-icon="icon: world"></span>Production
            </option>
            <option value="webomr-test" selected><span class="uk-margin-small-right" uk-icon="icon: push"></span>Test
            </option>
            <option value="webomr-dev"><span class="uk-margin-small-right" uk-icon="icon: code"></span>Development
            </option>
          </select>
          <button class="uk-button uk-button-default" type="button" tabindex="-1">
            <span></span><span uk-icon="icon: chevron-down"></span>
          </button>
          </ul>
        </div>
      </div>

      <!-- app page -->
      <div class="uk-align-center" id="app">
        <!-- tabs -->
        <ul class="uk-tab" uk-switcher="animation: uk-animation-fade">
          <li><a href="#">DevOps<span class="uk-margin-small-left" uk-icon="icon: users" /></a></li>
          <li class="uk-active"><a href="#">Monitor<span class="uk-margin-small-left" uk-icon="icon: list" /></a></li>
        </ul>

        <ul class="uk-switcher">
          <!-- devops -->
          <li>
            <table class="uk-table uk-table-divider uk-table-hover">
              <caption style="text-align: right;" id="caché">
                <h3>Mycroft</h3>
              </caption>
            </table>
          </li>

          <!-- monitor -->
          <li>
            <table class="uk-table uk-table-divider uk-table-hover uk-overflow-auto">
              <caption style="text-align: right;" id="apache">
                <h3>webOMR</h3><em>as of 12:34:56</em>
              </caption>
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
                  <td rowspan=2 style="vertical-align: middle;">East campus</td>
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
                  <td rowspan=2 style="vertical-align: middle;">West campus</td>
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
                  <td rowspan=2 style="vertical-align: middle;">Remote sites</td>
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
                  <td rowspan=2 style="vertical-align: middle;">Renaissance</td>
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
                  <th></th>
                  <th>totals</th>
                  <th>0</th>
                  <th>0</th>
                </tr>
              </thead>
            </table>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Portal extends Vue {
  @Prop() private msg!: string
}
</script>
