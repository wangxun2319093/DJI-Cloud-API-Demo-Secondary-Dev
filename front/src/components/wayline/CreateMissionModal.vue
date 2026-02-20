<template>
  <a-modal
    :visible="visible"
    title="创建新航线"
    :width="900"
    @cancel="$emit('cancel')"
    centered
    class="create-mission-modal"
  >
    <div class="modal-content">
      <div class="section">
        <h3 class="section-title">巡逻巡检航线</h3>
        <a-row :gutter="12">
          <a-col :span="6">
            <div
              class="route-card"
              :class="{ 'route-card-active': form.routeType === 'waypoint' }"
              @click="form.routeType = 'waypoint'"
            >
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 18L9 6L14 14L20 4" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="4" cy="18" r="2" fill="currentColor"/>
                  <circle cx="9" cy="6" r="2" fill="currentColor"/>
                  <circle cx="14" cy="14" r="2" fill="currentColor"/>
                  <circle cx="20" cy="4" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div class="route-name">航点航线</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div
              class="route-card"
              :class="{ 'route-card-active': form.routeType === 'patrol' }"
              @click="form.routeType = 'patrol'"
            >
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <div class="route-name">巡逻航线</div>
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h3 class="section-title">测绘航线</h3>
        <a-row :gutter="12">
          <a-col :span="6">
            <div
              class="route-card"
              :class="{ 'route-card-active': form.routeType === 'mapping' }"
              @click="form.routeType = 'mapping'"
            >
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16v16H4z" stroke-dasharray="2 2" />
                  <path d="M6 8h8M14 8v4M14 12H6M6 12v4M6 16h8" />
                </svg>
              </div>
              <div class="route-name">面状航线</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="route-card route-card-disabled">
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 12c0-4 2-8 6-8s6 4 6 8s2 8 6 8" />
                </svg>
              </div>
              <div class="route-name">带状航线</div>
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h3 class="section-title">精细化测绘航线</h3>
        <a-row :gutter="12">
          <a-col :span="6">
            <div class="route-card route-card-disabled">
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 22L12 2L22 22H2Z" />
                </svg>
              </div>
              <div class="route-name">斜面航线</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="route-card route-card-disabled">
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="route-name">几何体航线</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="route-card route-card-disabled">
              <div class="route-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                  <path d="M8 2v4M16 2v4M8 18v4M16 18v4"/>
                </svg>
              </div>
              <div class="route-name">贴近摄影航线</div>
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h3 class="section-title">选择飞行器</h3>
        <a-row :gutter="12">
          <a-col :span="4" v-for="aircraft in aircraftSeriesList" :key="aircraft.id">
            <div
              class="aircraft-card"
              :class="{ 'aircraft-card-active': form.aircraftSeries === aircraft.id }"
              @click="selectSeries(aircraft.id)"
            >
              {{ aircraft.name }}
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h3 class="section-title">选择型号</h3>
        <a-row :gutter="12">
          <a-col :span="4" v-for="model in currentModels" :key="model.id">
            <div
              class="aircraft-card"
              :class="{ 'aircraft-card-active': form.aircraftModel === model.id }"
              @click="form.aircraftModel = model.id"
            >
              {{ model.name }}
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section section-last">
        <h3 class="section-title">航线名称</h3>
        <a-input
          v-model:value="form.missionName"
          placeholder="请输入航线名称"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <a-button @click="$emit('cancel')">取消</a-button>
        <a-button type="primary" @click="handleConfirm">确定</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['cancel', 'confirm'])

interface AircraftModel {
  id: string
  name: string
  enumValue: number
  payloadValue: number
}

interface AircraftSeries {
  name: string
  models: AircraftModel[]
}

const aircraftData: Record<string, AircraftSeries> = {
  m30: {
    name: '经纬 M30 系列',
    models: [
      { id: 'm30', name: 'Matrice 30', enumValue: 67, payloadValue: 52 },
      { id: 'm30t', name: 'Matrice 30T', enumValue: 67, payloadValue: 53 }
    ]
  },
  m3e: {
    name: 'Mavic 3 行业系列',
    models: [
      { id: 'm3e', name: 'Mavic 3E', enumValue: 77, payloadValue: 66 },
      { id: 'm3t', name: 'Mavic 3T', enumValue: 77, payloadValue: 67 },
      { id: 'm3m', name: 'Mavic 3M', enumValue: 77, payloadValue: 68 }
    ]
  },
  m3d: {
    name: 'Matrice 3D 系列',
    models: [
      { id: 'm3d', name: 'Matrice 3D', enumValue: 90, payloadValue: 80 },
      { id: 'm3td', name: 'Matrice 3TD', enumValue: 90, payloadValue: 81 }
    ]
  },
  m4e: {
    name: 'Matrice 4 行业系列',
    models: [
      { id: 'm4e', name: 'Matrice 4E', enumValue: 99, payloadValue: 88 },
      { id: 'm4t', name: 'Matrice 4T', enumValue: 99, payloadValue: 89 }
    ]
  },
  m4d: {
    name: 'Matrice 4D 系列',
    models: [
      { id: 'm4d', name: 'Matrice 4D', enumValue: 101, payloadValue: 90 }
    ]
  },
  m400: {
    name: 'Matrice 400',
    models: [
      { id: 'm400', name: 'Matrice 400', enumValue: 100, payloadValue: 0 }
    ]
  }
}

const aircraftSeriesList = Object.keys(aircraftData).map(key => ({
  id: key,
  name: aircraftData[key].name
}))

const form = reactive({
  routeType: 'patrol',
  aircraftSeries: 'm4e',
  aircraftModel: 'm4t',
  missionName: '新建巡逻航线'
})

watch(() => form.routeType, (newType) => {
  const names: Record<string, string> = {
    waypoint: '新建航点航线',
    patrol: '新建巡逻航线',
    mapping: '新建面状航线'
  }
  form.missionName = names[newType] || '新建航线'
})

const currentModels = computed(() => {
  return aircraftData[form.aircraftSeries]?.models || []
})

const selectSeries = (seriesId: string) => {
  form.aircraftSeries = seriesId
  if (aircraftData[seriesId]?.models.length > 0) {
    form.aircraftModel = aircraftData[seriesId].models[0].id
  }
}

const handleConfirm = () => {
  const series = aircraftData[form.aircraftSeries]
  const model = series.models.find(m => m.id === form.aircraftModel)

  emit('confirm', {
    ...form,
    droneEnumValue: model?.enumValue,
    payloadEnumValue: model?.payloadValue
  })
}
</script>

<style lang="scss" scoped>
.modal-content {
  padding: 0 16px;
}

.section {
  margin-bottom: 16px;

  &.section-last {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
  font-weight: 500;
}

.route-card {
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 16px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  min-height: 90px;

  &:hover:not(.route-card-disabled) {
    background: #f3f4f6;
    transform: translateY(-2px);
  }
}

.route-card-active {
  background: #dbeafe !important;
  border-color: #3498db !important;
}

.route-card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.route-icon {
  margin-bottom: 8px;
  color: #6b7280;
}

.route-card-active .route-icon {
  color: #3498db;
}

.route-name {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
  text-align: center;
}

.aircraft-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 4px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  color: #374151;
  transition: all 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
}

.aircraft-card-active {
  background: #3498db !important;
  border-color: #3498db !important;
  color: white !important;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
