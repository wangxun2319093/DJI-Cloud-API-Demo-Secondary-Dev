import * as Cesium from 'cesium'
import store from '/@/store'
import { getRoot } from '/@/root'
import { ELocalStorageKey, EDeviceTypeName } from '/@/types'
import { getDeviceBySn } from '/@/api/manage'
import { message } from 'ant-design-vue'

export function deviceTsaUpdate () {
  const root = getRoot()

  const markers = store.state.markerInfo.coverMap
  const paths = store.state.markerInfo.pathMap

  const trackLine = null as any

  function getTrackLineInstance () {
    if (!trackLine) {
      // Cesium 中创建轨迹线的逻辑
      console.log('Create track line in Cesium')
    }
    return trackLine
  }

  function initMarker (type: number, name: string, sn: string, lng?: number, lat?: number) {
    if (markers[sn]) {
      return
    }
    // Cesium 中创建标记的逻辑
    console.log('Init marker in Cesium')
  }

  function removeMarker (sn: string) {
    if (!markers[sn]) {
      return
    }
    // Cesium 中移除标记的逻辑
    console.log('Remove marker in Cesium')
    delete markers[sn]
    delete paths[sn]
  }

  function addMarker (sn: string, lng?: number, lat?: number) {
    getDeviceBySn(localStorage.getItem(ELocalStorageKey.WorkspaceId)!, sn)
      .then(data => {
        if (data.code !== 0) {
          message.error(data.message)
          return
        }
        initMarker(data.data.domain, data.data.nickname, sn, lng, lat)
      })
  }

  function moveTo (sn: string, lng: number, lat: number) {
    let marker = markers[sn]
    if (!marker) {
      addMarker(sn, lng, lat)
      marker = markers[sn]
      return
    }
    // Cesium 中移动标记的逻辑
    console.log('Move marker in Cesium')
  }

  return {
    marker: markers,
    initMarker,
    removeMarker,
    moveTo
  }
}
