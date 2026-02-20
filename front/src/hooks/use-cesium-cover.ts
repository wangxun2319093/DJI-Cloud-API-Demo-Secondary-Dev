import * as Cesium from 'cesium'
import { EFlightAreaType } from '../types/flight-area'
import { getRoot } from '/@/root'
import rootStore from '/@/store'
import { GeojsonCoordinate } from '/@/types/map'

export function useCesiumCover () {
  const root = getRoot()
  const store = rootStore
  const coverMap = store.state.coverMap

  const normalColor = '#2D8CF0'
  const flightAreaColorMap = {
    [EFlightAreaType.DFENCE]: '#19be6b',
    [EFlightAreaType.NFZ]: '#ff0000',
  }
  const disableColor = '#b3b3b3'

  function getCesiumViewer (): Cesium.Viewer | null {
    return (getRoot() as any).$cesiumViewer || null
  }

  function AddCoverToMap (cover: any) {
    console.log('Add cover to Cesium map')
  }

  function init2DPin (name: string, coordinates: GeojsonCoordinate, color?: string, data?: {}) {
    console.log('Init 2D pin in Cesium')
  }

  function AddOverlayGroup (overlayGroup: any) {
    console.log('Add overlay group to Cesium map')
  }

  function initPolyline (name: string, coordinates: GeojsonCoordinate[], color?: string, data?: {}) {
    console.log('Init polyline in Cesium')
  }

  function initPolygon (name: string, coordinates: GeojsonCoordinate[][], color?: string, data?: {}) {
    console.log('Init polygon in Cesium')
  }

  function removeCoverFromMap (id: string) {
    const viewer = getCesiumViewer()
    if (!viewer) return

    const entity = viewer.entities.getById(id)
    if (entity) {
      viewer.entities.remove(entity)
    }
    delete coverMap[id]
  }

  function getElementFromMap (id: string): any[] {
    return coverMap[id] || []
  }

  function updatePinElement (id: string, name: string, coordinates: GeojsonCoordinate, color?: string) {
    console.log('Update pin element in Cesium')
  }

  function updatePolylineElement (id: string, name: string, coordinates: GeojsonCoordinate[], color?: string) {
    console.log('Update polyline element in Cesium')
  }

  function updatePolygonElement (id: string, name: string, coordinates: GeojsonCoordinate[][], color?: string) {
    console.log('Update polygon element in Cesium')
  }

  function initTextInfo (content: string, coordinates: GeojsonCoordinate, id: string) {
    console.log('Init text info in Cesium')
  }

  function initFlightAreaCircle (name: string, radius: number, position: GeojsonCoordinate, data: { id: string, type: EFlightAreaType, enable: boolean }) {
    const viewer = getCesiumViewer()
    if (!viewer) return

    const color = data.enable ? Cesium.Color.fromCssColorString(flightAreaColorMap[data.type] || normalColor) : Cesium.Color.fromCssColorString(disableColor)

    viewer.entities.add({
      id: data.id,
      name: name,
      position: Cesium.Cartesian3.fromDegrees(position[0], position[1]),
      ellipse: {
        semiMinorAxis: radius,
        semiMajorAxis: radius,
        material: color.withAlpha(0.3),
        outline: true,
        outlineColor: color,
        outlineWidth: 2,
        height: 0,
      },
      label: {
        text: name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#333333').withAlpha(0.8),
      }
    })

    coverMap[data.id] = { type: 'circle', id: data.id, name, radius, position, data }
  }

  function updateFlightAreaCircle (id: string, name: string, radius: number, position: GeojsonCoordinate, enable: boolean, type: EFlightAreaType) {
    const viewer = getCesiumViewer()
    if (!viewer) return

    removeCoverFromMap(id)
    initFlightAreaCircle(name, radius, position, { id, type, enable })
  }

  function calcPolygonPosition (coordinate: GeojsonCoordinate[]): GeojsonCoordinate {
    const index = coordinate.length - 1
    return [(coordinate[0][0] + coordinate[index][0]) / 2.0, (coordinate[0][1] + coordinate[index][1]) / 2]
  }

  function initFlightAreaPolygon (name: string, coordinates: GeojsonCoordinate[], data: { id: string, type: EFlightAreaType, enable: boolean }) {
    const viewer = getCesiumViewer()
    if (!viewer) return

    const color = data.enable ? Cesium.Color.fromCssColorString(flightAreaColorMap[data.type] || normalColor) : Cesium.Color.fromCssColorString(disableColor)

    const positions = coordinates.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]))

    viewer.entities.add({
      id: data.id,
      name: name,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: color.withAlpha(0.3),
        outline: true,
        outlineColor: color,
        outlineWidth: 2,
        height: 0,
      },
      label: {
        text: name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        position: Cesium.Cartesian3.fromDegrees(
          coordinates.reduce((sum, c) => sum + c[0], 0) / coordinates.length,
          coordinates.reduce((sum, c) => sum + c[1], 0) / coordinates.length
        ),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#333333').withAlpha(0.8),
      }
    })

    coverMap[data.id] = { type: 'polygon', id: data.id, name, coordinates, data }
  }

  function updateFlightAreaPolygon (id: string, name: string, coordinates: GeojsonCoordinate[], enable: boolean, type: EFlightAreaType) {
    const viewer = getCesiumViewer()
    if (!viewer) return

    removeCoverFromMap(id)
    initFlightAreaPolygon(name, coordinates, { id, type, enable })
  }

  return {
    init2DPin,
    initPolyline,
    initPolygon,
    removeCoverFromMap,
    getElementFromMap,
    updatePinElement,
    updatePolylineElement,
    updatePolygonElement,
    initFlightAreaCircle,
    initFlightAreaPolygon,
    updateFlightAreaPolygon,
    updateFlightAreaCircle,
    calcPolygonPosition,
  }
}
