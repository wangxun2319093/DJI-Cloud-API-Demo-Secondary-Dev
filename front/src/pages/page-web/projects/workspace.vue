<template>
  <div class="project-app-wrapper">
    <div class="left">
      <Sidebar />
      <div class="main-content uranus-scrollbar dark">
        <router-view />
      </div>
    </div>
    <div class="right">
      <div class="map-wrapper">
        <CesiumMap
          :wayline-edit-mode="waylineEditorVisible && isDrawingMode"
          :waypoints="waypoints"
          :scan-path="scanPath"
          :boundary-points="waypoints"
          :route-type="missionConfig.routeType"
          :dsm-maps="dsmMaps"
          :active-dsm-map-id="activeDsmMapId"
          @map-click="onMapClick"
          @drawing-end="onDrawingEnd"
        />
      </div>
      <div class="media-wrapper" v-if="root.$route.name === ERouterName.MEDIA">
        <MediaPanel />
      </div>
      <div class="task-wrapper" v-if="root.$route.name === ERouterName.TASK">
        <TaskPanel />
      </div>
    </div>
    <!-- 航线编辑抽屉 -->
    <WaylineDrawer
      :visible="waylineEditorVisible"
      :missions="missions"
      :mission-config="missionConfig"
      :waypoints="waypoints"
      :mission-stats="missionStats"
      :route-stats="routeStats"
      @close="closeWaylineEditor"
      @create="showCreateModal = true"
      @select="selectMission"
      @delete="deleteMission"
      @update:mission-config="onMissionConfigUpdate"
      @update:waypoints="onWaypointsUpdate"
      @remove-waypoint="removeWaypoint"
      @clear-waypoints="clearWaypoints"
      @reverse-waypoints="reverseWaypoints"
      @generate="handleGenerateKMZ"
      @generate-polygon="handleGeneratePolygonRoute"
      @import-kmz="handleImportKMZ"
      @save="saveCurrentMission"
      @mission-created="onMissionCreated"
    />
    <!-- DSM 地图管理抽屉 -->
    <MapDsmDrawer
      :visible="mapDsmVisible"
      :maps="dsmMaps"
      :loading="dsmLoading"
      @close="closeMapDsmEditor"
      @select="selectDsmMap"
      @delete="deleteDsmMap"
      @fly-to="flyToDsmMap"
      @map-created="onDsmMapCreated"
    />
  </div>
</template>
<script lang="ts" setup>
import Sidebar from '/@/components/common/sidebar.vue'
import MediaPanel from '/@/components/MediaPanel.vue'
import TaskPanel from '/@/components/task/TaskPanel.vue'
import CesiumMap from '/@/components/CesiumMap.vue'
import WaylineDrawer from '/@/components/wayline/index.vue'
import MapDsmDrawer from '/@/components/mapdsm/index.vue'
import { EBizCode, ERouterName } from '/@/types'
import { getRoot } from '/@/root'
import { useMyStore } from '/@/store'
import { useConnectWebSocket } from '/@/hooks/use-connect-websocket'
import EventBus from '/@/event-bus'
import { computed, ref, watch, onMounted } from 'vue'
import { getPolygonArea } from '/@/utils/wayline/geoUtils'
import { generateKMZ } from '/@/utils/wayline/kmzGenerator'
import type { MissionConfig } from '/@/utils/wayline/kmzGenerator'
import { parseKMZ } from '/@/utils/wayline/kmzParser'
import { calculateRouteStats, CAMERA_PRESETS, generatePolygonRoute } from '/@/utils/wayline/polygonRouteGenerator'
import { generateScanPath } from '/@/utils/wayline/routePlanner'
import type { Point, RouteStats } from '/@/utils/wayline/geoUtils'
import { getMapList, deleteMap, getAllMaps, type ManageMap } from '/@/api/map'
import { message } from 'ant-design-vue'

const root = getRoot()
const store = useMyStore()

// 航线编辑状态
const waylineEditorVisible = computed(() => store.state.waylineEditorVisible || false)
const waypoints = ref<Point[]>([])
const missions = ref<any[]>([])
const showCreateModal = ref(false)
const scanPath = ref<Point[]>([])
const routeStats = ref<RouteStats | null>(null)
const isDrawingMode = ref(false)

// DSM 地图状态
const mapDsmVisible = computed(() => store.state.mapDsmVisible || false)
const dsmMaps = ref<ManageMap[]>([])
const dsmLoading = ref(false)
const activeDsmMapId = ref('')

const defaultMissionConfig: MissionConfig = {
  missionName: '未命名航线',
  routeType: 'waypoint',
  aircraftSeries: 'm30',
  aircraftModel: 'm30t',
  droneEnumValue: 67,
  payloadEnumValue: 53,
  flyToWaylineMode: 'safely',
  finishAction: 'goHome',
  exitOnRCLost: 'executeLostAction',
  executeRCLostAction: 'goBack',
  takeOffSecurityHeight: 20,
  globalSpeed: 5,
  globalHeight: 50,
  globalTransitionalSpeed: 5,
  globalYawMode: 'path',
  isClosedLoop: false,
  isReverse: false,
  globalAction: 'none',
  gimbalPitch: -90,
  hoverTime: 0,
  photoInterval: 2,
  shootPhoto: false,
  recordVideo: false,
  executeHeightMode: 'realTimeFollowSurface',
  climbMode: 'vertical',
  caliFlightEnable: false,
  scanSetting: {
    overlap: 20,
    angle: 0,
    margin: 0
  }
}

const missionConfig = ref<MissionConfig>({ ...defaultMissionConfig })

// 加载保存的航线
onMounted(() => {
  const saved = localStorage.getItem('dji-wayline-missions')
  if (saved) {
    try {
      missions.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load missions', e)
    }
  }
})

const saveMissionsToStorage = () => {
  localStorage.setItem('dji-wayline-missions', JSON.stringify(missions.value))
}

watch(() => root.$route.name, (routeName) => {
  if (routeName === ERouterName.EDIT_WAYLINE) {
    if (!waylineEditorVisible.value) {
      store.commit('SET_WAYLINE_EDITOR_VISIBLE', true)
    }
  } else {
    if (waylineEditorVisible.value) {
      store.commit('SET_WAYLINE_EDITOR_VISIBLE', false)
    }
  }
}, { immediate: true })

// 地图点击处理
const onMapClick = (coords: { lat: number; lng: number }) => {
  waypoints.value.push({
    lat: coords.lat,
    lng: coords.lng,
    height: missionConfig.value.globalHeight || 50,
    speed: missionConfig.value.globalSpeed || 5
  })
}

// 航线操作
const onMissionCreated = (config: Partial<MissionConfig>) => {
  missionConfig.value = { ...defaultMissionConfig, ...config }
  waypoints.value = []
  scanPath.value = []
  showCreateModal.value = false
  isDrawingMode.value = true
}

const onDrawingEnd = () => {
  isDrawingMode.value = false
}

const selectMission = (id: number) => {
  const mission = missions.value.find(m => m.id === id)
  if (mission) {
    missionConfig.value = { ...mission.config }
    waypoints.value = [...mission.waypoints]
  }
}

const deleteMission = (id: number) => {
  missions.value = missions.value.filter(m => m.id !== id)
  saveMissionsToStorage()
}

const onMissionConfigUpdate = (newConfig: MissionConfig) => {
  missionConfig.value = newConfig
}

const onWaypointsUpdate = (newWaypoints: Point[]) => {
  waypoints.value = newWaypoints
}

const removeWaypoint = (index: number) => {
  waypoints.value.splice(index, 1)
}

const clearWaypoints = () => {
  waypoints.value = []
  scanPath.value = []
}

const reverseWaypoints = () => {
  waypoints.value.reverse()
}

// 生成 KMZ
const handleGenerateKMZ = async () => {
  try {
    const pointsToUse = (missionConfig.value.routeType === 'mapping' || missionConfig.value.routeType === 'patrol')
      ? scanPath.value
      : waypoints.value

    const kmzBlob = await generateKMZ(missionConfig.value, pointsToUse, waypoints.value)
    const url = URL.createObjectURL(kmzBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${missionConfig.value.missionName || '航线'}.kmz`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('Generate KMZ failed', e)
  }
}

// 导入 KMZ
const handleImportKMZ = async (file: File) => {
  try {
    const result = await parseKMZ(file)
    if (result.success && result.config) {
      missionConfig.value = { ...missionConfig.value, ...result.config }
      waypoints.value = result.waypoints
    }
  } catch (e: any) {
    console.error('Import KMZ failed', e)
  }
}

// 保存航线
const saveCurrentMission = () => {
  const mission = {
    id: Date.now(),
    name: missionConfig.value.missionName || '未命名航线',
    config: { ...missionConfig.value },
    waypoints: [...waypoints.value],
    updatedAt: Date.now()
  }
  missions.value.push(mission)
  saveMissionsToStorage()
}

// 生成面状航线
const handleGeneratePolygonRoute = () => {
  if (waypoints.value.length < 3) {
    return
  }

  try {
    const polygonConfig = missionConfig.value.polygonRoute || {}

    const options: any = {
      height: missionConfig.value.globalHeight || 50,
      speed: missionConfig.value.globalSpeed || 5,
      angle: polygonConfig.angle || 0,
      margin: polygonConfig.margin || 0,
      optimizePath: polygonConfig.optimizePath !== false
    }

    if (polygonConfig.spacingMode === 'auto') {
      options.useCamera = true
      options.overlapRate = polygonConfig.overlapLateral || 0.7

      if (polygonConfig.cameraPreset === 'custom') {
        options.camera = polygonConfig.customCamera
      } else if (CAMERA_PRESETS[polygonConfig.cameraPreset]) {
        options.camera = CAMERA_PRESETS[polygonConfig.cameraPreset]
      } else {
        options.camera = CAMERA_PRESETS.m30t
      }
    } else {
      options.spacing = polygonConfig.spacing || 30
    }

    const generatedPath = generatePolygonRoute(waypoints.value, options)
    scanPath.value = generatedPath
    routeStats.value = calculateRouteStats(generatedPath)
  } catch (error: any) {
    console.error('生成面状航线失败:', error)
  }
}

// 关闭航线编辑器
const closeWaylineEditor = () => {
  store.commit('SET_WAYLINE_EDITOR_VISIBLE', false)
  if (root.$route.name === ERouterName.EDIT_WAYLINE) {
    root.$router.push('/' + ERouterName.TSA)
  }
}

// DSM 地图相关函数
const loadDsmMaps = async () => {
  dsmLoading.value = true
  try {
    const workspaceId = localStorage.getItem('workspace_id') || ''
    if (workspaceId) {
      const result = await getAllMaps(workspaceId)
      if (result.code === 0 && result.data) {
        dsmMaps.value = result.data
      }
    }
  } catch (error) {
    console.error('加载DSM地图失败:', error)
  } finally {
    dsmLoading.value = false
  }
}

const closeMapDsmEditor = () => {
  store.commit('SET_MAP_DSM_VISIBLE', false)
  if (root.$route.name === ERouterName.MAP_DSM) {
    root.$router.push('/' + ERouterName.TSA)
  }
}

const selectDsmMap = (map: ManageMap) => {
  activeDsmMapId.value = map.id
}

const deleteDsmMap = async (mapId: string) => {
  try {
    const workspaceId = localStorage.getItem('workspace_id') || ''
    if (workspaceId) {
      await deleteMap(workspaceId, mapId)
      dsmMaps.value = dsmMaps.value.filter(m => m.id !== mapId)
      message.success('地图删除成功')
    }
  } catch (error) {
    message.error('删除地图失败')
  }
}

const flyToDsmMap = (map: ManageMap) => {
  activeDsmMapId.value = map.id
}

const onDsmMapCreated = async (data: any) => {
  if (data.success) {
    await loadDsmMaps()
  }
}

// 监听 DSM 地图管理路由变化
watch(() => root.$route.name, (routeName) => {
  if (routeName === ERouterName.MAP_DSM) {
    if (!mapDsmVisible.value) {
      store.commit('SET_MAP_DSM_VISIBLE', true)
      loadDsmMaps()
    }
  } else {
    if (mapDsmVisible.value) {
      store.commit('SET_MAP_DSM_VISIBLE', false)
    }
  }
}, { immediate: true })

// 航线统计
const missionStats = computed(() => {
  const points = (missionConfig.value.routeType === 'mapping' || missionConfig.value.routeType === 'patrol')
    ? scanPath.value
    : waypoints.value

  console.log('📊 missionStats recalculating...')
  console.log('  - routeType:', missionConfig.value.routeType)
  console.log('  - points count:', points.length)
  if (points.length > 0) {
    console.log('  - first point height:', points[0].height)
    console.log('  - last point height:', points[points.length - 1].height)
  }

  let distance = 0
  const defaultHeight = missionConfig.value.globalHeight || 50

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const R = 6378137
    const dLat = (p2.lat - p1.lat) * Math.PI / 180
    const dLng = (p2.lng - p1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const horizontalDistance = R * c

    const height1 = p1.height || defaultHeight
    const height2 = p2.height || defaultHeight
    const heightDiff = Math.abs(height2 - height1)

    const distance3D = Math.sqrt(horizontalDistance * horizontalDistance + heightDiff * heightDiff)
    distance += distance3D
  }

  console.log('  - total distance:', distance.toFixed(2), 'm')

  let area = 0
  if ((missionConfig.value.routeType === 'mapping' || missionConfig.value.routeType === 'patrol') && waypoints.value.length >= 3) {
    area = getPolygonArea(waypoints.value)
  }

  return {
    distance: distance,
    time: distance / (missionConfig.value.globalSpeed || 5),
    waypointCount: points.length,
    area: area
  }
})

// 监听航线类型变化自动生成扫描路径
watch(
  [
    waypoints,
    () => missionConfig.value.routeType,
    () => missionConfig.value.globalHeight,
    () => missionConfig.value.globalSpeed,
    () => missionConfig.value.polygonRoute,
    () => missionConfig.value.scanSetting
  ],
  () => {
    if (missionConfig.value.routeType === 'mapping') {
      if (waypoints.value.length >= 3) {
        handleGeneratePolygonRoute()
      } else {
        scanPath.value = []
        routeStats.value = null
      }
    } else if (missionConfig.value.routeType === 'patrol') {
      if (waypoints.value.length >= 3) {
        const height = missionConfig.value.globalHeight || 50
        const overlap = missionConfig.value.scanSetting?.overlap || 20
        const spacing = 20 * (1 - overlap / 100)

        scanPath.value = generateScanPath(
          waypoints.value,
          spacing,
          missionConfig.value.scanSetting?.angle || 0,
          missionConfig.value.scanSetting?.margin || 0
        )
      } else {
        scanPath.value = []
      }
    } else {
      scanPath.value = []
      routeStats.value = null
    }
  },
  { deep: true }
)

const messageHandler = async (payload: any) => {
  if (!payload) {
    return
  }

  switch (payload.biz_code) {
    case EBizCode.GatewayOsd: {
      store.commit('SET_GATEWAY_INFO', payload.data)
      break
    }
    case EBizCode.DeviceOsd: {
      store.commit('SET_DEVICE_INFO', payload.data)
      break
    }
    case EBizCode.DockOsd: {
      store.commit('SET_DOCK_INFO', payload.data)
      break
    }
    case EBizCode.MapElementCreate: {
      store.commit('SET_MAP_ELEMENT_CREATE', payload.data)
      break
    }
    case EBizCode.MapElementUpdate: {
      store.commit('SET_MAP_ELEMENT_UPDATE', payload.data)
      break
    }
    case EBizCode.MapElementDelete: {
      store.commit('SET_MAP_ELEMENT_DELETE', payload.data)
      break
    }
    case EBizCode.DeviceOnline: {
      store.commit('SET_DEVICE_ONLINE', payload.data)
      break
    }
    case EBizCode.DeviceOffline: {
      store.commit('SET_DEVICE_OFFLINE', payload.data)
      break
    }
    case EBizCode.FlightTaskProgress:
    case EBizCode.FlightTaskMediaProgress:
    case EBizCode.FlightTaskMediaHighestPriority: {
      EventBus.emit('flightTaskWs', payload)
      break
    }
    case EBizCode.DeviceHms: {
      store.commit('SET_DEVICE_HMS_INFO', payload.data)
      break
    }
    case EBizCode.DeviceReboot:
    case EBizCode.DroneOpen:
    case EBizCode.DroneClose:
    case EBizCode.CoverOpen:
    case EBizCode.CoverClose:
    case EBizCode.PutterOpen:
    case EBizCode.PutterClose:
    case EBizCode.ChargeOpen:
    case EBizCode.ChargeClose:
    case EBizCode.DeviceFormat:
    case EBizCode.DroneFormat:
    {
      store.commit('SET_DEVICES_CMD_EXECUTE_INFO', {
        biz_code: payload.biz_code,
        timestamp: payload.timestamp,
        ...payload.data,
      })
      break
    }
    case EBizCode.ControlSourceChange:
    case EBizCode.FlyToPointProgress:
    case EBizCode.TakeoffToPointProgress:
    case EBizCode.JoystickInvalidNotify:
    case EBizCode.DrcStatusNotify:
    {
      EventBus.emit('droneControlWs', payload)
      break
    }
    case EBizCode.FlightAreasSyncProgress: {
      EventBus.emit('flightAreasSyncProgressWs', payload.data)
      break
    }
    case EBizCode.FlightAreasDroneLocation: {
      EventBus.emit('flightAreasDroneLocationWs', payload)
      break
    }
    case EBizCode.FlightAreasUpdate: {
      EventBus.emit('flightAreasUpdateWs', payload.data)
      break
    }
    default:
      break
  }
}

// 监听ws 消息
useConnectWebSocket(messageHandler)

</script>
<style lang="scss" scoped>
@import '/@/styles/index.scss';

.project-app-wrapper {
  display: flex;
  transition: width 0.2s ease;
  height: 100%;
  width: 100%;

  .left {
    display: flex;
    width: 335px;
    flex: 0 0 335px;
    background-color: #232323;

    .main-content {
      flex: 1;
      color: $text-white-basic;
      width: 285px;
    }
  }

  .right {
    flex-grow: 1;
    position: relative;

    .map-wrapper{
      width: 100%;
      height: 100%;
    }

    .media-wrapper,
    .task-wrapper {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: #f6f8fa;
    }
  }
}
</style>
