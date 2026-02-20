import * as Cesium from 'cesium'
import { App, reactive, ref } from 'vue'

export function useCesiumMapManage () {
  const state = reactive({
    cesium: Cesium,
    viewer: null as Cesium.Viewer | null,
  })

  function initMap (container: string, app: App) {
    console.log('Initializing Cesium map...')
    // 这里不需要初始化，因为初始化逻辑在CesiumMap.vue中
  }

  function globalPropertiesConfig (app: App) {
    initMap('cesium-container', app)
  }

  return {
    globalPropertiesConfig,
  }
}
