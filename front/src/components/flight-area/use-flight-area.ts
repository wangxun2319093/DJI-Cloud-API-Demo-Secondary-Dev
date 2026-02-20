import { message, notification } from 'ant-design-vue'
import { MapDoodleEnum } from '/@/types/map-enum'
import { getRoot } from '/@/root'
import { PostFlightAreaBody, saveFlightArea } from '/@/api/flight-area'
import { generateCircleContent, generatePolyContent } from '/@/utils/map-layer-utils'
import { GeojsonCoordinate } from '/@/utils/genjson'
import { gcj02towgs84, wgs84togcj02 } from '/@/vendors/coordtransform.js'
import { uuidv4 } from '/@/utils/uuid'
import { CommonHostWs } from '/@/websocket'
import { FlightAreasDroneLocation } from '/@/types/flight-area'
import rootStore from '/@/store'
import { h } from 'vue'
import { useCesiumCover } from '/@/hooks/use-cesium-cover'
import moment from 'moment'
import { DATE_FORMAT } from '/@/utils/constants'

export function useFlightArea () {
  const root = getRoot()
  const store = rootStore
  const coverMap = store.state.coverMap

  let useCesiumCoverHook = useCesiumCover()

  const MIN_RADIUS = 10
  function checkCircle (obj: any): boolean {
    const radius = obj.geometry?.radius ?? obj.getRadius?.()
    if (radius < MIN_RADIUS) {
      message.error(`The radius must be greater than ${MIN_RADIUS}m.`)
      return false
    }
    return true
  }

  function checkPolygon (obj: any): boolean {
    const path = obj.geometry?.coordinates?.[0] ?? obj.getPath?.()
    if (!path || path.length < 3) {
      message.error('The path of the polygon cannot be crossed.')
      return false
    }
    return true
  }

  function setExtData (obj: any) {
    const ext = obj.properties ?? obj.getExtData?.() ?? {}
    const id = uuidv4()
    const name = `${ext.type}-${moment().format(DATE_FORMAT)}`
    const newExt = Object.assign({}, ext, { id, name })
    if (obj.properties) {
      obj.properties = newExt
    } else if (obj.setExtData) {
      obj.setExtData(newExt)
    }
    return newExt
  }

  function createFlightArea (obj: any) {
    const ext = obj.properties ?? obj.getExtData?.() ?? {}
    const data = {
      id: ext.id,
      type: ext.type,
      name: ext.name,
    }
    let coordinates: GeojsonCoordinate | GeojsonCoordinate[][]
    let content

    if (ext.mapType === 'circle' || obj.type === 'circle') {
      const center = obj.geometry?.coordinates ?? obj.getCenter?.()
      const radius = obj.geometry?.radius ?? obj.getRadius?.()
      const centerPosition = Array.isArray(center)
        ? { lng: center[0], lat: center[1], KL: 0, className: '', kT: 0 }
        : center
      const feature = generateCircleContent(centerPosition, radius)
      coordinates = getWgs84(feature.geometry.coordinates as GeojsonCoordinate)
      content = {
        properties: feature.properties,
        geometry: {
          type: feature.geometry.type,
          coordinates: coordinates,
          radius: feature.geometry.radius,
        }
      }
    } else if (ext.mapType === 'polygon' || obj.type === 'polygon') {
      const path = obj.geometry?.coordinates?.[0] ?? obj.getPath?.()
      const pathPositions = Array.isArray(path) && Array.isArray(path[0])
        ? path.map((p: number[]) => ({ lng: p[0], lat: p[1], KL: 0, className: '', kT: 0 }))
        : path
      const feature = generatePolyContent(pathPositions)
      coordinates = [getWgs84(feature.content.geometry.coordinates[0] as GeojsonCoordinate[])]
      content = {
        properties: feature.content.properties,
        geometry: {
          type: feature.content.geometry.type,
          coordinates: coordinates,
        }
      }
    } else {
      message.error(`Invalid type: ${ext.mapType}`)
      return
    }

    saveFlightArea(Object.assign({}, data, { content }) as PostFlightAreaBody).then(res => {
      if (res.code !== 0) {
        useCesiumCoverHook.removeCoverFromMap(ext.id)
      }
    })
  }

  function getDrawFlightAreaCallback (obj: any) {
    useCesiumCoverHook = useCesiumCover()
    const ext = setExtData(obj)
    switch (ext.mapType) {
      case 'circle':
      case MapDoodleEnum.CIRCLE:
        if (!checkCircle(obj)) {
          return
        }
        break
      case 'polygon':
      case MapDoodleEnum.POLYGON:
        if (!checkPolygon(obj)) {
          return
        }
        break
      default:
        break
    }
    createFlightArea(obj)
  }

  const getWgs84 = <T extends GeojsonCoordinate | GeojsonCoordinate[]>(coordinate: T): T => {
    if (coordinate[0] instanceof Array) {
      return (coordinate as GeojsonCoordinate[]).map(c => gcj02towgs84(c[0], c[1])) as T
    }
    return gcj02towgs84(coordinate[0], coordinate[1])
  }

  const getGcj02 = <T extends GeojsonCoordinate | GeojsonCoordinate[]>(coordinate: T): T => {
    if (coordinate[0] instanceof Array) {
      return (coordinate as GeojsonCoordinate[]).map(c => wgs84togcj02(c[0], c[1])) as T
    }
    return wgs84togcj02(coordinate[0], coordinate[1])
  }

  const onFlightAreaDroneLocationWs = (data: CommonHostWs<FlightAreasDroneLocation>) => {
    const nearArea = data.host.drone_locations.filter(val => !val.is_in_area)
    const inArea = data.host.drone_locations.filter(val => val.is_in_area)
    notification.warning({
      key: `flight-area-${data.sn}`,
      message: `Drone(${data.sn}) flight area information`,
      description: h('div',
        [
          h('div', [
            h('span', { class: 'fz18' }, 'In the flight area: '),
            h('ul', [
              ...inArea.map(val => h('li', `There are ${val.area_distance} meters from the edge of the area(${coverMap[val.area_id][1]?.getText() || val.area_id}).`))
            ])
          ]),
          h('div', [
            h('span', { class: 'fz18' }, 'Near the flight area: '),
            h('ul', [
              ...nearArea.map(val => h('li', `There are ${val.area_distance} meters from the edge of the area(${coverMap[val.area_id][1]?.getText() || val.area_id}).`))
            ])
          ])
        ]),
      duration: null,
      style: {
        width: '420px',
        marginTop: '-8px',
        marginLeft: '-28px',
      }
    })
  }

  return {
    getDrawFlightAreaCallback,
    getGcj02,
    getWgs84,
    onFlightAreaDroneLocationWs,
  }
}
