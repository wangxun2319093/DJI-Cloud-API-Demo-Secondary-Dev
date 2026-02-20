<template>
  <div class="demo-app">
    <router-view />
    <!-- <div class="map-wrapper">
      <GMap/>
    </div> -->
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, provide, ref } from 'vue'
import { useMyStore } from './store'
import * as Cesium from 'cesium'

export default defineComponent({
  name: 'App',

  setup () {
    const store = useMyStore()
    const cesiumViewer = ref<Cesium.Viewer | null>(null)

    onMounted(() => {
      console.log('App mounted')
    })

    onUnmounted(() => {
      if (cesiumViewer.value) {
        cesiumViewer.value.destroy()
        cesiumViewer.value = null
        console.log('Cesium Viewer destroyed')
      }
    })

    provide('cesiumViewer', cesiumViewer)

    return {
      cesiumViewer
    }
  }
})
</script>
<style lang="scss" scoped>
.demo-app {
  width: 100%;
  height: 100%;

  .map-wrapper {
    height: 100%;
    width: 100%;
  }
}
</style>

<style lang="scss">
#demo-app {
  width: 100%;
  height: 100%
}
</style>
