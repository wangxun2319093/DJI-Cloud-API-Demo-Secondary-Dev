<template>
  <div class="wayline-control-panel">
    <div class="panel-header">
      <div class="header-top">
        <div class="header-left">
          <a-button type="link" @click="$emit('back')">
            ←
          </a-button>
          <h1 class="panel-title">航线编辑</h1>
        </div>
        <a-button type="link" @click="$emit('save')">
          💾
        </a-button>
      </div>

      <div class="header-actions">
        <a-upload
          accept=".kmz"
          :show-upload-list="false"
          :before-upload="handleBeforeUpload"
          class="upload-btn"
        >
          <a-button block size="small">
            <span class="btn-icon">📁</span>
            导入 KMZ
          </a-button>
        </a-upload>
        <a-button type="primary" block size="small" class="generate-btn" @click="$emit('generate')">
          生成 KMZ
        </a-button>
      </div>
    </div>

    <div class="mission-stats" v-if="waypoints.length > 0">
      <div class="stat-item">
        <span class="stat-label">总距离</span>
        <span class="stat-value">{{ formatNumber(stats.distance) }} m</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">预计耗时</span>
        <span class="stat-value">{{ formatTime(stats.time) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">航点数量</span>
        <span class="stat-value">{{ stats.waypointCount || waypoints.length }}</span>
      </div>
      <div class="stat-item" v-if="stats.area > 0">
        <span class="stat-label">覆盖面积</span>
        <span class="stat-value">{{ formatArea(stats.area) }}</span>
      </div>
    </div>

    <div class="panel-content">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="config" tab="任务配置">
          <MissionConfig v-model="localMissionConfig" />
        </a-tab-pane>
        <a-tab-pane key="polygon" tab="面状航线" v-if="isPolygonMode">
          <PolygonRouteConfig
            v-model="localMissionConfig"
            :waypoints="waypoints"
            :route-stats="routeStats"
            @generate="$emit('generate-polygon')"
          />
        </a-tab-pane>
        <a-tab-pane key="waypoints" tab="航点列表">
          <WaypointList
            :waypoints="waypoints"
            @update:waypoints="$emit('update:waypoints', $event)"
            @remove="$emit('remove-waypoint', $event)"
            @clear="$emit('clear-waypoints')"
            @reverse="$emit('reverse-waypoints')"
          />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { formatTime } from '/@/utils/wayline/geoUtils'
import MissionConfig from './MissionConfig.vue'
import PolygonRouteConfig from './PolygonRouteConfig.vue'
import WaypointList from './WaypointList.vue'
import type { MissionConfig as IMissionConfig } from '/@/utils/wayline/kmzGenerator'
import type { Point, RouteStats } from '/@/utils/wayline/geoUtils'

interface Props {
  missionConfig: IMissionConfig
  waypoints: Point[]
  missionStats?: { area: number; distance: number; time: number }
  routeStats?: RouteStats | null
}

const props = withDefaults(defineProps<Props>(), {
  missionStats: () => ({ area: 0, distance: 0, time: 0 }),
  routeStats: null
})

watch(() => props.missionStats, (newVal) => {
  console.log('📈 ControlPanel received missionStats update:', newVal)
}, { deep: true })

const stats = computed(() => props.missionStats || { area: 0, distance: 0, time: 0, waypointCount: 0 })

const emit = defineEmits([
  'update:missionConfig',
  'update:waypoints',
  'remove-waypoint',
  'clear-waypoints',
  'reverse-waypoints',
  'generate',
  'generate-polygon',
  'import-kmz',
  'create-mission',
  'back',
  'save'
])

const activeTab = ref('config')

const isPolygonMode = computed(() => {
  return props.missionConfig.routeType === 'mapping' || props.missionConfig.routeType === 'polygon'
})

const localMissionConfig = computed({
  get: () => props.missionConfig,
  set: (val) => emit('update:missionConfig', val)
})

const formatArea = (areaM2: number): string => {
  if (!areaM2 || isNaN(areaM2)) return '0 m²'
  return `${Math.round(areaM2)} m²`
}

const formatNumber = (num: number): string => {
  if (!num || isNaN(num)) return '0'
  return Math.round(num).toString()
}

const handleBeforeUpload = (file: File) => {
  emit('import-kmz', file)
  return false
}
</script>

<style lang="scss" scoped>
.wayline-control-panel {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-right: 1px solid #e5e7eb;
}

.panel-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.upload-btn {
  flex: 1;
}

.generate-btn {
  flex: 1;
}

.btn-icon {
  margin-right: 4px;
}

.mission-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.panel-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  height: 0;

  :deep(.ant-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-tabs-bar) {
    flex-shrink: 0;
    margin-bottom: 0;
  }

  :deep(.ant-tabs-content) {
    flex: 1;
    min-height: 0;
    height: 100%;
  }

  :deep(.ant-tabs-tabpane) {
    height: 100%;
    overflow-y: auto;
    padding: 16px;
    box-sizing: border-box;
  }
}
</style>
