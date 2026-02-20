import { GeojsonCoordinate } from '../utils/genjson'
import { getRoot } from '/@/root'
import * as Cesium from 'cesium'

export function useMapTool () {
  const root = getRoot()
  const AMap = root.$aMap

  function waitForAMap (timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const map = getRoot().$map
      if (map) {
        resolve(map)
        return
      }

      const startTime = Date.now()
      const interval = setInterval(() => {
        const map = getRoot().$map
        if (map) {
          clearInterval(interval)
          resolve(map)
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          reject(new Error('AMap initialization timeout'))
        }
      }, 100)
    })
  }

  function waitForCesiumViewer (timeout: number = 5000): Promise<Cesium.Viewer | null> {
    return new Promise((resolve, reject) => {
      const cesiumViewer = (getRoot() as any).$cesiumViewer
      if (cesiumViewer) {
        resolve(cesiumViewer)
        return
      }

      const startTime = Date.now()
      const interval = setInterval(() => {
        const cesiumViewer = (getRoot() as any).$cesiumViewer
        if (cesiumViewer) {
          clearInterval(interval)
          resolve(cesiumViewer)
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          reject(new Error('Cesium initialization timeout'))
        }
      }, 100)
    })
  }

  async function panTo (coordinate: GeojsonCoordinate) {
    const aMap = getRoot().$map
    if (aMap) {
      aMap.panTo(coordinate, 100)
      aMap.setZoom(18, false, 100)
      return
    }

    try {
      const cesiumViewer = await waitForCesiumViewer()
      if (cesiumViewer) {
        cesiumViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1], 1000),
          duration: 1
        })
        return
      }
    } catch (e) {
      console.warn('Cesium viewer not available:', e)
    }

    try {
      const map = await waitForAMap()
      map.panTo(coordinate, 100)
      map.setZoom(18, false, 100)
    } catch (e) {
      console.warn('Map is not initialized:', e)
    }
  }
  return {
    panTo,
    waitForAMap,
    waitForCesiumViewer,
  }
}
