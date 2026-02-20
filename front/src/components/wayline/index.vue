<template>
  <div v-if="visible" class="wayline-drawer-wrapper">
    <div class="wayline-drawer-panel">
      <div class="drawer-header">
        <span class="drawer-title">航线编辑</span>
        <a-button type="text" size="small" @click="$emit('close')">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="drawer-container">
        <MissionLibrary
          v-if="currentView === 'library'"
          :missions="missions"
          @create="handleCreate"
          @select="$emit('select', $event)"
          @edit="$emit('select', $event)"
          @delete="$emit('delete', $event)"
          class="drawer-content"
        />

        <ControlPanel
          v-else
          :mission-config="missionConfig"
          :waypoints="waypoints"
          :mission-stats="missionStats"
          :route-stats="routeStats"
          @update:mission-config="$emit('update:missionConfig', $event)"
          @update:waypoints="$emit('update:waypoints', $event)"
          @remove-waypoint="$emit('removeWaypoint', $event)"
          @clear-waypoints="$emit('clearWaypoints')"
          @reverse-waypoints="$emit('reverseWaypoints')"
          @generate="$emit('generate')"
          @generate-polygon="$emit('generatePolygon')"
          @import-kmz="$emit('importKmz', $event)"
          @create-mission="$emit('create')"
          @back="currentView = 'library'"
          @save="$emit('save')"
          class="drawer-content"
        />
      </div>
    </div>

    <CreateMissionModal
      :visible="showCreateModal"
      @cancel="showCreateModal = false"
      @confirm="handleMissionCreated"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import MissionLibrary from './MissionLibrary.vue'
import ControlPanel from './ControlPanel.vue'
import CreateMissionModal from './CreateMissionModal.vue'
import type { MissionConfig } from '/@/utils/wayline/kmzGenerator'
import type { Point, RouteStats } from '/@/utils/wayline/geoUtils'

const props = defineProps<{
  visible: boolean
  missions: any[]
  missionConfig: MissionConfig
  waypoints: Point[]
  missionStats: { area: number; distance: number; time: number }
  routeStats: RouteStats | null
}>()

const emit = defineEmits([
  'close',
  'create',
  'select',
  'delete',
  'update:missionConfig',
  'update:waypoints',
  'removeWaypoint',
  'clearWaypoints',
  'reverseWaypoints',
  'generate',
  'generatePolygon',
  'importKmz',
  'save',
  'missionCreated'
])

const currentView = ref<'library' | 'editor'>('library')
const showCreateModal = ref(false)

const handleCreate = () => {
  showCreateModal.value = true
}

const handleMissionCreated = (config: any) => {
  showCreateModal.value = false
  currentView.value = 'editor'
  emit('missionCreated', config)
}

watch(() => props.visible, (val) => {
  if (!val) {
    currentView.value = 'library'
  }
})

watch(currentView, (val) => {
  if (val === 'editor') {
    showCreateModal.value = false
  }
})
</script>

<style lang="scss" scoped>
.wayline-drawer-wrapper {
  position: fixed;
  top: 0;
  left: 50px;
  width: 420px;
  height: 100vh;
  z-index: 1000;
  pointer-events: auto;
}

.wayline-drawer-panel {
  width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.drawer-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-content {
  flex: 1;
  min-height: 0;
  height: 0;
}
</style>
