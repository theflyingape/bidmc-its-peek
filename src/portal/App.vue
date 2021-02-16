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
