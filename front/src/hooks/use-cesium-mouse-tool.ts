import * as Cesium from 'cesium'
import { reactive } from 'vue'
import { MapDoodleType } from '/@/constants/map'
import { getRoot } from '/@/root'
import { MapDoodleEnum } from '/@/types/map-enum'
import { EFlightAreaType } from '../types/flight-area'
import { message } from 'ant-design-vue'

export function useCesiumMouseTool () {
  const root = getRoot()

  const state = reactive({
    pinNum: 0,
    polylineNum: 0,
    polygonNum: 0,
    currentType: '',
    handler: null as Cesium.ScreenSpaceEventHandler | null,
    activeShapePoints: [] as Cesium.Cartesian3[],
    activeShape: null as Cesium.Entity | null,
    floatingPoint: null as Cesium.Entity | null,
  })

  const flightAreaColorMap = {
    [EFlightAreaType.DFENCE]: Cesium.Color.fromCssColorString('#19be6b'),
    [EFlightAreaType.NFZ]: Cesium.Color.fromCssColorString('#ff0000'),
  }

  function getCesiumViewer (): Cesium.Viewer | null {
    return (getRoot() as any).$cesiumViewer || null
  }

  function clearHandler () {
    if (state.handler) {
      state.handler.destroy()
      state.handler = null
    }
    state.activeShapePoints = []
    state.activeShape = null
    state.floatingPoint = null
  }

  function createPoint (worldPosition: Cesium.Cartesian3, color?: Cesium.Color): Cesium.Entity | undefined {
    const viewer = getCesiumViewer()
    if (!viewer) return

    return viewer.entities.add({
      position: worldPosition,
      point: {
        color: color || Cesium.Color.WHITE,
        pixelSize: 8,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    })
  }

  function drawShape (positions: Cesium.Cartesian3[], type: string, color?: Cesium.Color, fillOpacity?: number): Cesium.Entity | undefined {
    const viewer = getCesiumViewer()
    if (!viewer) return

    if (type === 'polyline') {
      return viewer.entities.add({
        polyline: {
          positions: positions,
          clampToGround: true,
          width: 3,
          material: color || Cesium.Color.fromCssColorString('#2d8cf0'),
        },
      })
    } else if (type === 'polygon') {
      return viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: (color || Cesium.Color.fromCssColorString('#1791fc')).withAlpha(fillOpacity ?? 0.4),
          outline: true,
          outlineColor: color || Cesium.Color.fromCssColorString('#2d8cf0'),
          outlineWidth: 2,
          height: 0,
        },
      })
    }
    return undefined
  }

  function drawPin (type: MapDoodleType, getDrawCallback: Function) {
    const viewer = getCesiumViewer()
    if (!viewer) {
      message.warning('Cesium viewer not initialized')
      return
    }

    clearHandler()
    state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
      if (!earthPosition) return

      const point = createPoint(earthPosition)
      const cartographic = Cesium.Cartographic.fromCartesian(earthPosition)
      const longitude = Cesium.Math.toDegrees(cartographic.longitude)
      const latitude = Cesium.Math.toDegrees(cartographic.latitude)

      const obj = {
        type: 'pin',
        position: [longitude, latitude],
        name: type + state.pinNum,
        entity: point,
      }

      state.pinNum++
      if (getDrawCallback) {
        getDrawCallback({ obj })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    state.handler.setInputAction(() => {
      clearHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  function drawPolyline (type: MapDoodleType, getDrawCallback: Function) {
    const viewer = getCesiumViewer()
    if (!viewer) {
      message.warning('Cesium viewer not initialized')
      return
    }

    clearHandler()
    state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    state.activeShapePoints = []

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
      if (!earthPosition) return

      state.activeShapePoints.push(earthPosition)
      createPoint(earthPosition)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.activeShapePoints.length < 1) return

      const newPosition = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid)
      if (!newPosition) return

      if (Cesium.defined(state.floatingPoint)) {
        viewer.entities.remove(state.floatingPoint)
      }
      state.floatingPoint = createPoint(newPosition, Cesium.Color.YELLOW)

      if (state.activeShape) {
        viewer.entities.remove(state.activeShape)
      }
      const positions = [...state.activeShapePoints, newPosition]
      state.activeShape = drawShape(positions, 'polyline')
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    state.handler.setInputAction(() => {
      if (state.activeShapePoints.length >= 2) {
        const coordinates: number[][] = []
        state.activeShapePoints.forEach((point) => {
          const cartographic = Cesium.Cartographic.fromCartesian(point)
          coordinates.push([
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
          ])
        })

        const obj = {
          type: 'polyline',
          coordinates: coordinates,
          name: type + state.polylineNum,
          entity: state.activeShape,
        }

        state.polylineNum++
        if (getDrawCallback) {
          getDrawCallback({ obj })
        }
      }
      clearHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  function drawPolygon (type: MapDoodleType, getDrawCallback: Function) {
    const viewer = getCesiumViewer()
    if (!viewer) {
      message.warning('Cesium viewer not initialized')
      return
    }

    clearHandler()
    state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    state.activeShapePoints = []

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
      if (!earthPosition) return

      state.activeShapePoints.push(earthPosition)
      createPoint(earthPosition)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.activeShapePoints.length < 1) return

      const newPosition = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid)
      if (!newPosition) return

      if (Cesium.defined(state.floatingPoint)) {
        viewer.entities.remove(state.floatingPoint)
      }
      state.floatingPoint = createPoint(newPosition, Cesium.Color.YELLOW)

      if (state.activeShape) {
        viewer.entities.remove(state.activeShape)
      }
      const positions = [...state.activeShapePoints, newPosition]
      state.activeShape = drawShape(positions, 'polygon')
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (state.activeShapePoints.length >= 3) {
        const coordinates: number[][] = []
        state.activeShapePoints.forEach((point) => {
          const cartographic = Cesium.Cartographic.fromCartesian(point)
          coordinates.push([
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
          ])
        })

        const obj = {
          type: 'polygon',
          coordinates: [coordinates],
          name: type + state.polygonNum,
          entity: state.activeShape,
        }

        state.polygonNum++
        if (getDrawCallback) {
          getDrawCallback({ obj })
        }
      }
      clearHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  function drawOff (type: MapDoodleType) {
    clearHandler()
  }

  function drawFlightAreaPolygon (flightAreaType: EFlightAreaType, getDrawFlightAreaCallback: Function) {
    const viewer = getCesiumViewer()
    if (!viewer) {
      message.warning('Cesium viewer not initialized')
      return
    }

    const color = flightAreaColorMap[flightAreaType] || flightAreaColorMap[EFlightAreaType.NFZ]

    clearHandler()
    state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    state.activeShapePoints = []

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
      if (!earthPosition) return

      state.activeShapePoints.push(earthPosition)
      createPoint(earthPosition, color)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.activeShapePoints.length < 1) return

      const newPosition = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid)
      if (!newPosition) return

      if (Cesium.defined(state.floatingPoint)) {
        viewer.entities.remove(state.floatingPoint)
      }
      state.floatingPoint = createPoint(newPosition, Cesium.Color.YELLOW)

      if (state.activeShape) {
        viewer.entities.remove(state.activeShape)
      }

      const positions = [...state.activeShapePoints, newPosition]
      state.activeShape = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: color.withAlpha(flightAreaType === EFlightAreaType.NFZ ? 0.3 : 0),
          outline: true,
          outlineColor: color,
          outlineWidth: 4,
          height: 0,
        },
      })
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    state.handler.setInputAction(() => {
      if (state.activeShapePoints.length >= 3) {
        const coordinates: number[][] = []
        state.activeShapePoints.forEach((point) => {
          const cartographic = Cesium.Cartographic.fromCartesian(point)
          coordinates.push([
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
          ])
        })

        const obj = {
          type: 'polygon',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {
            type: flightAreaType,
            mapType: 'polygon',
          },
          entity: state.activeShape,
        }

        if (getDrawFlightAreaCallback) {
          getDrawFlightAreaCallback({ obj })
        }
      }
      clearHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  function drawFlightAreaCircle (flightAreaType: EFlightAreaType, getDrawFlightAreaCallback: Function) {
    const viewer = getCesiumViewer()
    if (!viewer) {
      message.warning('Cesium viewer not initialized')
      return
    }

    const color = flightAreaColorMap[flightAreaType] || flightAreaColorMap[EFlightAreaType.NFZ]
    let centerPoint: Cesium.Cartesian3 | null = null
    let radiusEntity: Cesium.Entity | null = null

    clearHandler()
    state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!centerPoint) {
        centerPoint = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
        if (!centerPoint) return
        createPoint(centerPoint, color)
      } else {
        const edgePoint = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
        if (!edgePoint || !centerPoint) return

        const cartographic1 = Cesium.Cartographic.fromCartesian(centerPoint)
        const cartographic2 = Cesium.Cartographic.fromCartesian(edgePoint)

        const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2)
        const radius = geodesic.surfaceDistance

        const centerCartographic = Cesium.Cartographic.fromCartesian(centerPoint)
        const centerLon = Cesium.Math.toDegrees(centerCartographic.longitude)
        const centerLat = Cesium.Math.toDegrees(centerCartographic.latitude)

        const obj = {
          type: 'circle',
          geometry: {
            type: 'Circle',
            coordinates: [centerLon, centerLat],
            radius: radius,
          },
          properties: {
            type: flightAreaType,
            mapType: 'circle',
          },
          entity: radiusEntity,
        }

        if (getDrawFlightAreaCallback) {
          getDrawFlightAreaCallback({ obj })
        }
        clearHandler()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    state.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (!centerPoint) return

      const edgePoint = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid)
      if (!edgePoint) return

      const cartographic1 = Cesium.Cartographic.fromCartesian(centerPoint)
      const cartographic2 = Cesium.Cartographic.fromCartesian(edgePoint)

      const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2)
      const radius = geodesic.surfaceDistance

      if (radiusEntity) {
        viewer.entities.remove(radiusEntity)
      }

      radiusEntity = viewer.entities.add({
        position: centerPoint,
        ellipse: {
          semiMinorAxis: radius,
          semiMajorAxis: radius,
          material: color.withAlpha(flightAreaType === EFlightAreaType.NFZ ? 0.3 : 0),
          outline: true,
          outlineColor: color,
          outlineWidth: 6,
          height: 0,
        },
      })
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    state.handler.setInputAction(() => {
      clearHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  function mouseTool (type: MapDoodleType, getDrawCallback: Function, flightAreaType?: EFlightAreaType) {
    state.currentType = type
    if (flightAreaType) {
      switch (type) {
        case MapDoodleEnum.POLYGON:
          drawFlightAreaPolygon(flightAreaType, getDrawCallback)
          return
        case MapDoodleEnum.CIRCLE:
          drawFlightAreaCircle(flightAreaType, getDrawCallback)
          return
        default:
          message.error(`Invalid type: ${flightAreaType}`)
          return
      }
    }
    switch (type) {
      case MapDoodleEnum.PIN:
        drawPin(type, getDrawCallback)
        break
      case MapDoodleEnum.POLYLINE:
        drawPolyline(type, getDrawCallback)
        break
      case MapDoodleEnum.POLYGON:
        drawPolygon(type, getDrawCallback)
        break
      case MapDoodleEnum.Close:
        drawOff(type)
        break
    }
  }

  return {
    mouseTool
  }
}
