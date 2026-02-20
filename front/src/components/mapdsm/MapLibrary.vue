<template>
  <div class="map-library">
    <div class="library-header">
      <div class="header-top">
        <h2 class="library-title">地图库</h2>
        <a-button type="link" size="small" @click="$emit('create')">
          <span class="add-icon">+</span>
        </a-button>
      </div>

      <div class="filter-bar">
        <a-dropdown>
          <a class="filter-link" @click.prevent>
            {{ formatFilter }}
            <span class="filter-arrow">▼</span>
          </a>
          <template #overlay>
            <a-menu @click="handleFormatFilter">
              <a-menu-item key="all">全部格式</a-menu-item>
              <a-menu-item key="3dtiles">3D Tiles</a-menu-item>
              <a-menu-item key="terrain">Terrain</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <a-dropdown>
          <a class="filter-link" @click.prevent>
            {{ sortFilter }}
            <span class="filter-arrow">▼</span>
          </a>
          <template #overlay>
            <a-menu @click="handleSortFilter">
              <a-menu-item key="time_desc">时间倒序</a-menu-item>
              <a-menu-item key="time_asc">时间正序</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <div class="library-content">
      <a-spin :spinning="loading">
        <a-list :data-source="filteredMaps" :split="false">
          <template #renderItem="{ item }">
            <div class="map-card" @click="$emit('select', item)">
              <div class="card-header">
                <span class="map-name">{{ item.map_name }}</span>
                <div class="card-actions">
                  <a-button
                    type="link"
                    size="small"
                    class="action-btn"
                    @click.stop="$emit('flyTo', item)"
                    title="定位到地图"
                  >
                    <span class="action-icon">📍</span>
                  </a-button>
                  <a-popconfirm
                    title="确定要删除该地图吗？"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="$emit('delete', item.id)"
                    @click.stop
                  >
                    <a-button type="link" danger size="small" class="action-btn" @click.stop>
                      <span class="action-icon">🗑️</span>
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>

              <div class="card-info">
                <div class="info-row">
                  <span class="info-icon">🗺️</span>
                  <span>{{ item.map_format?.toUpperCase() || '3D Tiles' }}</span>
                  <a-tag
                    :color="getStatusColor(item.status)"
                    size="small"
                    style="margin-left: 8px;"
                  >
                    {{ getStatusText(item.status) }}
                  </a-tag>
                </div>
                <div class="info-row" v-if="item.file_size">
                  <span class="info-icon">📦</span>
                  <span>{{ formatFileSize(item.file_size) }}</span>
                </div>
                <div class="info-row" v-if="item.center_longitude && item.center_latitude">
                  <span class="info-icon">📍</span>
                  <span>{{ item.center_longitude.toFixed(6) }}, {{ item.center_latitude.toFixed(6) }}</span>
                </div>
                <div class="info-time">
                  <span>更新时间 {{ formatDate(item.update_time || item.create_time) }}</span>
                </div>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="empty-state">
              <a-empty description="暂无地图数据" :image="simpleImage" />
              <a-button type="primary" class="create-btn" @click="$emit('create')">上传地图</a-button>
            </div>
          </template>
        </a-list>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Empty } from 'ant-design-vue'
import type { ManageMap } from '/@/api/map'

const props = defineProps<{
  maps: ManageMap[]
  loading: boolean
}>()

defineEmits(['create', 'select', 'delete', 'flyTo'])

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const currentFormat = ref('all')
const currentSort = ref('time_desc')

const formatFilter = computed(() => {
  const map: Record<string, string> = {
    all: '全部格式',
    '3dtiles': '3D Tiles',
    terrain: 'Terrain'
  }
  return map[currentFormat.value] || '全部格式'
})

const sortFilter = computed(() => {
  const map: Record<string, string> = {
    time_desc: '时间倒序',
    time_asc: '时间正序'
  }
  return map[currentSort.value] || '时间倒序'
})

const filteredMaps = computed(() => {
  let result = [...props.maps]

  if (currentFormat.value !== 'all') {
    result = result.filter(m => m.map_format === currentFormat.value)
  }

  result.sort((a, b) => {
    const timeA = a.update_time || a.create_time || 0
    const timeB = b.update_time || b.create_time || 0
    return currentSort.value === 'time_desc' ? timeB - timeA : timeA - timeB
  })

  return result
})

const handleFormatFilter = ({ key }: { key: string }) => {
  currentFormat.value = key
}

const handleSortFilter = ({ key }: { key: string }) => {
  currentSort.value = key
}

const getStatusColor = (status: number): string => {
  const map: Record<number, string> = {
    0: 'processing',
    1: 'success',
    2: 'error'
  }
  return map[status] || 'default'
}

const getStatusText = (status: number): string => {
  const map: Record<number, string> = {
    0: '处理中',
    1: '可用',
    2: '失败'
  }
  return map[status] || '未知'
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const formatDate = (timestamp: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}
</script>

<style lang="scss" scoped>
.map-library {
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
}

.library-header {
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.library-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.add-icon {
  font-size: 18px;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.filter-link {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  &:hover {
    color: #2d8cf0;
  }
}

.filter-arrow {
  font-size: 10px;
}

.library-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.map-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #f3f4f6;

    .card-actions {
      opacity: 1;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.map-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 32px;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  position: absolute;
  right: 8px;
  top: 8px;
}

.action-btn {
  padding: 0 4px !important;
  height: 24px !important;
}

.action-icon {
  font-size: 12px;
}

.card-info {
  font-size: 12px;
  color: #4b5563;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.info-icon {
  font-size: 12px;
}

.info-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 8px;
}

.empty-state {
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.create-btn {
  margin-top: 16px;
}

:deep(.ant-list-empty-text) {
  padding: 0;
}
</style>
