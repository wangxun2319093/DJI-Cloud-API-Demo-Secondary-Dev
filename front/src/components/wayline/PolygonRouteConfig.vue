<template>
  <div class="polygon-route-config">
    <a-divider orientation="left" class="divider-title">
      面状航线配置
    </a-divider>

    <a-form layout="vertical">
      <a-form-item label="相机型号">
        <a-select
          :value="localConfig.cameraPreset"
          @change="onCameraPresetChange"
          placeholder="选择相机型号或手动配置"
        >
          <a-select-option value="custom">手动配置</a-select-option>
          <a-select-option value="m3e">Mavic 3E</a-select-option>
          <a-select-option value="m3t">Mavic 3T 广角</a-select-option>
          <a-select-option value="m30t">M30T 广角</a-select-option>
          <a-select-option value="m300">M300 RTK + P1</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="间距计算">
        <a-radio-group
          :value="localConfig.spacingMode"
          @change="e => updateLocalConfig('spacingMode', e.target.value)"
          button-style="solid"
          class="w-full radio-group"
        >
          <a-radio-button value="manual" class="radio-btn">手动设置</a-radio-button>
          <a-radio-button value="auto" class="radio-btn">相机自动</a-radio-button>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="localConfig.spacingMode === 'manual'"
        label="航线间距 (米)"
      >
        <a-input-number
          :value="localConfig.spacing"
          @change="val => updateLocalConfig('spacing', val)"
          :min="5"
          :max="500"
          :step="5"
          class="w-full"
        />
        <div class="field-hint">
          相邻航线之间的距离
        </div>
      </a-form-item>

      <template v-if="localConfig.spacingMode === 'auto'">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="横向重叠率 (%)">
              <a-input-number
                :value="(localConfig.overlapLateral || 0.7) * 100"
                @change="val => updateLocalConfig('overlapLateral', (val || 70) / 100)"
                :min="50"
                :max="90"
                :step="5"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="纵向重叠率 (%)">
              <a-input-number
                :value="(localConfig.overlapLongitudinal || 0.7) * 100"
                @change="val => updateLocalConfig('overlapLongitudinal', (val || 70) / 100)"
                :min="50"
                :max="90"
                :step="5"
                class="w-full"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert
          v-if="calculatedSpacing > 0"
          type="info"
          show-icon
          class="spacing-alert"
        >
          <template #message>
            <div class="alert-content">
              <div><strong>航线间距:</strong> {{ calculatedSpacing.toFixed(2) }} 米</div>
              <div class="alert-hint">基于飞行高度 {{ modelValue.globalHeight }}m 和相机参数自动计算</div>
            </div>
          </template>
        </a-alert>
      </template>

      <a-form-item label="航线角度">
        <div class="angle-control">
          <a-slider
            :value="localConfig.angle"
            @change="val => updateLocalConfig('angle', val)"
            :min="0"
            :max="180"
            :step="15"
            class="angle-slider"
            :marks="{ 0: '0°', 45: '45°', 90: '90°', 135: '135°', 180: '180°' }"
          />
          <a-input-number
            :value="localConfig.angle"
            @change="val => updateLocalConfig('angle', val)"
            :min="0"
            :max="180"
            class="angle-input"
            size="small"
          />
        </div>
        <div class="field-hint">
          0° = 南北向，90° = 东西向
        </div>
      </a-form-item>

      <a-form-item label="安全边距 (米)">
        <a-input-number
          :value="localConfig.margin"
          @change="val => updateLocalConfig('margin', val)"
          :min="0"
          :max="50"
          :step="1"
          class="w-full"
        />
        <div class="field-hint">
          多边形边界向内收缩的距离
        </div>
      </a-form-item>

      <a-form-item label="路径优化">
        <a-switch
          :checked="localConfig.optimizePath"
          @change="val => updateLocalConfig('optimizePath', val)"
        />
        <span class="switch-label">
          自动移除冗余航点，优化飞行路径
        </span>
      </a-form-item>

      <template v-if="localConfig.cameraPreset === 'custom' && localConfig.spacingMode === 'auto'">
        <a-divider orientation="left" class="custom-divider">自定义相机参数</a-divider>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="传感器宽度 (mm)">
              <a-input-number
                :value="localConfig.customCamera?.sensorWidth"
                @change="val => updateCustomCamera('sensorWidth', val)"
                :min="1"
                :step="0.1"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="传感器高度 (mm)">
              <a-input-number
                :value="localConfig.customCamera?.sensorHeight"
                @change="val => updateCustomCamera('sensorHeight', val)"
                :min="1"
                :step="0.1"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="焦距 (mm)">
              <a-input-number
                :value="localConfig.customCamera?.focalLength"
                @change="val => updateCustomCamera('focalLength', val)"
                :min="1"
                :step="0.1"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="图像宽度 (px)">
              <a-input-number
                :value="localConfig.customCamera?.imageWidth"
                @change="val => updateCustomCamera('imageWidth', val)"
                :min="100"
                :step="10"
                class="w-full"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </template>

      <a-alert
        type="success"
        show-icon
        class="generate-alert"
        v-if="canGenerate"
      >
        <template #message>
          <div class="alert-content">
            <strong>✨ 实时生成中</strong>
            <div class="alert-hint">航线将随着边界点和参数变化自动更新</div>
          </div>
        </template>
      </a-alert>

      <!-- <a-button
        block
        size="large"
        @click="handleGenerate"
        :disabled="!canGenerate"
        class="generate-btn"
      >
        <template #icon>
          <span>🔄</span>
        </template>
        手动刷新航线
      </a-button> -->

      <!-- <a-card v-if="routeStats && routeStats.photoCount > 0" size="small" class="stats-card">
        <template #title>
          <span class="stats-title">📊 航线统计</span>
        </template>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value stat-blue">{{ routeStats.photoCount }}</div>
            <div class="stat-label">航点数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value stat-green">{{ routeStats.totalDistance }}</div>
            <div class="stat-label">航程(m)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value stat-orange">{{ Math.ceil(routeStats.flightTime / 60) }}</div>
            <div class="stat-label">预计(分)</div>
          </div>
        </div>
      </a-card> -->

      <a-alert
        v-else-if="waypoints.length < 3"
        type="info"
        show-icon
        class="hint-alert"
      >
        <template #message>
          <div class="alert-content">
            <strong>📍 绘制边界</strong>
            <div class="alert-hint">请在地图上点击至少 3 个点绘制作业区域</div>
          </div>
        </template>
      </a-alert>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { CAMERA_PRESETS, calculateSpacing } from '/@/utils/wayline/polygonRouteGenerator'
import type { MissionConfig } from '/@/utils/wayline/kmzGenerator'
import type { Point, RouteStats } from '/@/utils/wayline/geoUtils'

interface PolygonRouteConfig {
  spacingMode: string
  spacing: number
  angle: number
  margin: number
  overlapLateral: number
  overlapLongitudinal: number
  optimizePath: boolean
  cameraPreset: string
  customCamera: {
    sensorWidth: number
    sensorHeight: number
    focalLength: number
    imageWidth: number
    imageHeight: number
  }
}

const props = defineProps<{
  modelValue: MissionConfig
  waypoints: Point[]
  routeStats: RouteStats | null
}>()

const emit = defineEmits(['update:modelValue', 'generate'])

const defaultConfig: PolygonRouteConfig = {
  spacingMode: 'manual',
  spacing: 30,
  angle: 0,
  margin: 0,
  overlapLateral: 0.7,
  overlapLongitudinal: 0.7,
  optimizePath: true,
  cameraPreset: 'custom',
  customCamera: {
    sensorWidth: 6.3,
    sensorHeight: 4.7,
    focalLength: 4.88,
    imageWidth: 1920,
    imageHeight: 1440
  }
}

const localConfig = ref<PolygonRouteConfig>({ ...defaultConfig })

if (props.modelValue.polygonRoute) {
  Object.assign(localConfig.value, props.modelValue.polygonRoute)
}

const calculatedSpacing = computed(() => {
  if (localConfig.value.spacingMode !== 'auto') return 0

  const camera = localConfig.value.cameraPreset === 'custom'
    ? localConfig.value.customCamera
    : CAMERA_PRESETS[localConfig.value.cameraPreset]

  if (!camera) return 0

  return calculateSpacing(
    props.modelValue.globalHeight || 50,
    camera,
    localConfig.value.overlapLateral,
    'lateral'
  )
})

const canGenerate = computed(() => {
  return props.waypoints.length >= 3
})

const updateLocalConfig = (key: string, value: any) => {
  (localConfig.value as any)[key] = value
  emitConfig()
}

const updateCustomCamera = (key: string, value: any) => {
  if (localConfig.value.customCamera) {
    (localConfig.value.customCamera as any)[key] = value
    emitConfig()
  }
}

const onCameraPresetChange = (preset: string) => {
  localConfig.value.cameraPreset = preset
  emitConfig()
}

const emitConfig = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    polygonRoute: { ...localConfig.value }
  })
}

const handleGenerate = () => {
  emit('generate')
}

watch(() => props.modelValue.globalHeight, () => {
  if (localConfig.value.spacingMode === 'auto') {
    emitConfig()
  }
})
</script>

<style lang="scss" scoped>
.polygon-route-config {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;

  .divider-title {
    margin-top: 0 !important;
    margin-bottom: 16px !important;
    color: #1f2937 !important;
    font-weight: 600 !important;
  }

  .custom-divider {
    font-size: 14px !important;
  }
}

.w-full {
  width: 100%;
}

.radio-group {
  width: 100%;
  display: flex;
}

.radio-btn {
  flex: 1;
  text-align: center;
}

.field-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.spacing-alert,
.generate-alert,
.hint-alert {
  margin-bottom: 16px;
}

.alert-content {
  font-size: 12px;
}

.alert-hint {
  color: #6b7280;
  margin-top: 4px;
}

.angle-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.angle-slider {
  flex: 1;
}

.angle-input {
  width: 80px;
}

.switch-label {
  margin-left: 8px;
  font-size: 14px;
  color: #4b5563;
}

.generate-btn {
  margin-top: 8px;
}

.stats-card {
  margin-top: 16px;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;

  &.stat-blue {
    color: #2563eb;
  }

  &.stat-green {
    color: #16a34a;
  }

  &.stat-orange {
    color: #ea580c;
  }
}

.stat-label {
  font-size: 12px;
  color: #4b5563;
}

:deep(.ant-slider-mark-text) {
  font-size: 11px;
}
</style>
