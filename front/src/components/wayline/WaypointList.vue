<template>
  <div class="waypoint-list">
    <div class="list-header">
      <h2 class="list-title">航点 ({{ waypoints.length }})</h2>
      <div class="header-actions">
        <a-button
          size="small"
          type="primary"
          ghost
          :disabled="waypoints.length < 2"
          @click="$emit('reverse')"
        >
          反转航线
        </a-button>
        <a-popconfirm
          title="确定要清空所有航点吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="$emit('clear')"
        >
          <a-button size="small" danger>清空</a-button>
        </a-popconfirm>
      </div>
    </div>

    <div class="list-content">
      <div v-for="(wp, index) in waypoints" :key="index" class="waypoint-card">
        <div class="card-header">
          <span class="waypoint-index">航点 {{ index + 1 }}</span>
          <a-button
            type="link"
            danger
            size="small"
            class="delete-btn"
            @click="$emit('remove', index)"
          >
            删除
          </a-button>
        </div>
        <div class="card-fields">
          <div class="field-group">
            <label class="field-label">纬度</label>
            <a-input-number
              :value="wp.lat"
              :step="0.000001"
              class="field-input"
              size="small"
              @change="val => updateWaypoint(index, 'lat', val)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">经度</label>
            <a-input-number
              :value="wp.lng"
              :step="0.000001"
              class="field-input"
              size="small"
              @change="val => updateWaypoint(index, 'lng', val)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">高度 (m)</label>
            <a-input-number
              :value="wp.height"
              class="field-input"
              size="small"
              @change="val => updateWaypoint(index, 'height', val)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">速度 (m/s)</label>
            <a-input-number
              :value="wp.speed"
              class="field-input"
              size="small"
              @change="val => updateWaypoint(index, 'speed', val)"
            />
          </div>
        </div>
      </div>

      <a-empty v-if="waypoints.length === 0" description="暂无航点，请在地图上点击添加" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Point } from '/@/utils/wayline/geoUtils'

const props = defineProps<{
  waypoints: Point[]
}>()

const emit = defineEmits(['update:waypoints', 'remove', 'clear', 'reverse'])

const updateWaypoint = (index: number, key: string, value: number) => {
  const newWaypoints = [...props.waypoints]
  newWaypoints[index] = { ...newWaypoints[index], [key]: value }
  emit('update:waypoints', newWaypoints)
}
</script>

<style lang="scss" scoped>
.waypoint-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.list-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.waypoint-card {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.waypoint-index {
  font-weight: 600;
  font-size: 14px;
}

.delete-btn {
  padding: 0 4px !important;
  height: 24px !important;
}

.card-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 12px;
}

.field-input {
  width: 100%;
}
</style>
