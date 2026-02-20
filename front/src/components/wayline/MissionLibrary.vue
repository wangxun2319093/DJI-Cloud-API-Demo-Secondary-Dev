<template>
  <div class="mission-library">
    <div class="library-header">
      <div class="header-top">
        <h2 class="library-title">航线库</h2>
        <a-button type="link" size="small" @click="$emit('create')">
          <span class="add-icon">+</span>
        </a-button>
      </div>

      <div class="filter-bar">
        <a-dropdown>
          <a class="filter-link" @click.prevent>
            全部机型
            <span class="filter-arrow">▼</span>
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item>全部机型</a-menu-item>
              <a-menu-item>Matrice 30</a-menu-item>
              <a-menu-item>Mavic 3E/T</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <a-dropdown>
          <a class="filter-link" @click.prevent>
            时间倒序
            <span class="filter-arrow">▼</span>
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item>时间倒序</a-menu-item>
              <a-menu-item>时间正序</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <div class="library-content">
      <a-list :data-source="missions" :split="false">
        <template #renderItem="{ item }">
          <div
            class="mission-card"
            @click="$emit('select', item.id)"
          >
            <div class="card-header">
              <span class="mission-name">{{ item.name }}</span>
              <div class="card-actions">
                <a-button type="link" size="small" class="action-btn" @click.stop="$emit('edit', item.id)">
                  <span class="action-icon">✎</span>
                </a-button>
                <a-popconfirm
                  title="确定要删除该航线吗？"
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
                <span class="info-icon">✈️</span>
                <span>{{ getDroneName(item.config.droneEnumValue) }}</span>
              </div>
              <div class="info-time">
                <span>更新时间 {{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #empty>
          <div class="empty-state">
            <a-empty description="暂无航线" :image="simpleImage" />
            <a-button type="primary" class="create-btn" @click="$emit('create')">新建航线</a-button>
          </div>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Empty } from 'ant-design-vue'

interface Mission {
  id: number
  name: string
  config: {
    droneEnumValue: number
    [key: string]: any
  }
  updatedAt: number
}

defineProps<{
  missions: Mission[]
}>()

defineEmits(['create', 'select', 'edit', 'delete'])

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const getDroneName = (enumValue: number): string => {
  const map: Record<number, string> = {
    67: 'Matrice 30',
    77: 'Mavic 3E/T',
    90: 'Matrice 3D',
    99: 'Matrice 4T',
    100: 'Matrice 400'
  }
  return map[enumValue] || '未知机型'
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
.mission-library {
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

.mission-card {
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

.mission-name {
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
