<template>
    <div id="app">
        <Portal />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Portal from "./components/Portal.vue";

@Component({
    components: {
        Portal
    },
})
export default class App extends Vue {}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
