<template>
  <div v-if="visible" class="mapdsm-drawer-wrapper">
    <div class="mapdsm-drawer-panel">
      <div class="drawer-header">
        <span class="drawer-title">DSM 地图管理</span>
        <a-button type="text" size="small" @click="$emit('close')">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="drawer-container">
        <MapLibrary
          v-if="currentView === 'library'"
          :maps="maps"
          :loading="loading"
          @create="handleCreate"
          @select="$emit('select', $event)"
          @delete="$emit('delete', $event)"
          @fly-to="$emit('flyTo', $event)"
          class="drawer-content"
        />

        <CreateMapModal
          v-else
          :visible="currentView === 'create'"
          @cancel="currentView = 'library'"
          @confirm="handleMapCreated"
          class="drawer-content"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import MapLibrary from './MapLibrary.vue'
import CreateMapModal from './CreateMapModal.vue'
import type { ManageMap } from '/@/api/map'

const props = defineProps<{
  visible: boolean
  maps: ManageMap[]
  loading: boolean
}>()

const emit = defineEmits([
  'close',
  'create',
  'select',
  'delete',
  'flyTo',
  'mapCreated'
])

const currentView = ref<'library' | 'create'>('library')

const handleCreate = () => {
  currentView.value = 'create'
}

const handleMapCreated = (data: any) => {
  currentView.value = 'library'
  emit('mapCreated', data)
}

watch(() => props.visible, (val) => {
  if (!val) {
    currentView.value = 'library'
  }
})
</script>

<style lang="scss" scoped>
.mapdsm-drawer-wrapper {
  position: fixed;
  top: 0;
  left: 50px;
  width: 420px;
  height: 100vh;
  z-index: 1000;
  pointer-events: auto;
}

.mapdsm-drawer-panel {
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
