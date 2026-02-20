<template>
  <div class="mission-config">
    <a-divider orientation="left" class="divider-title">任务配置</a-divider>

    <a-form layout="vertical">
      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="飞向首航点模式">
            <a-select :value="modelValue.flyToWaylineMode" @change="val => updateConfig('flyToWaylineMode', val)">
              <a-select-option value="safely">安全模式</a-select-option>
              <a-select-option value="pointToPoint">点对点</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="完成动作">
            <a-select :value="modelValue.finishAction" @change="val => updateConfig('finishAction', val)">
              <a-select-option value="goHome">自动返航</a-select-option>
              <a-select-option value="autoLand">自动降落</a-select-option>
              <a-select-option value="hover">原地悬停</a-select-option>
              <a-select-option value="backToStart">返回首航点</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="失控动作">
            <a-select :value="modelValue.executeRCLostAction" @change="val => updateConfig('executeRCLostAction', val)">
              <a-select-option value="goBack">自动返航</a-select-option>
              <a-select-option value="hover">原地悬停</a-select-option>
              <a-select-option value="landing">自动降落</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="航线失联行为">
            <a-select :value="modelValue.exitOnRCLost" @change="val => updateConfig('exitOnRCLost', val)">
              <a-select-option value="executeLostAction">执行失联动作</a-select-option>
              <a-select-option value="goContinue">继续执行航线</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="航线模式">
            <a-select :value="modelValue.isClosedLoop" @change="val => updateConfig('isClosedLoop', val)">
              <a-select-option :value="true">闭合巡逻航线</a-select-option>
              <a-select-option :value="false">单程航线</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="全局动作">
            <a-select :value="modelValue.globalAction" @change="val => updateConfig('globalAction', val)">
              <a-select-option value="none">无</a-select-option>
              <a-select-option value="takePhoto">拍照</a-select-option>
              <a-select-option value="startRecord">开始录像</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="安全起飞高度 (m)">
            <a-input-number :value="modelValue.takeOffSecurityHeight"
              @change="val => updateConfig('takeOffSecurityHeight', val)" :min="0" class="w-full" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item label="全局飞行速度 (m/s)">
            <a-input-number :value="modelValue.globalTransitionalSpeed"
              @change="val => updateConfig('globalTransitionalSpeed', val)" :min="0" class="w-full" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="航点高度模式">
        <a-radio-group :value="modelValue.executeHeightMode" button-style="solid" class="w-full radio-group"
          @change="e => updateConfig('executeHeightMode', e.target.value)">
          <a-radio-button value="WGS84" class="radio-btn">海拔高度</a-radio-button>
          <a-radio-button value="relativeToStartPoint" class="radio-btn">相对起飞点</a-radio-button>
          <a-radio-button value="realTimeFollowSurface" class="radio-btn">相对地形</a-radio-button>
        </a-radio-group>

        <div class="height-diagram-container">
          <div class="diagram-box">
            <svg v-if="modelValue.executeHeightMode === 'realTimeFollowSurface'" viewBox="0 0 320 150"
              xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
              <line x1="10" y1="135" x2="310" y2="135" stroke="#4a90e2" stroke-width="1" stroke-dasharray="2,2" />
              <text x="10" y="148" fill="#4a90e2" font-size="5">海平面 (WGS84)</text>
              <path d="M 10 120 L 50 115 L 90 110 L 130 105 L 170 100 L 210 108 L 250 112 L 290 118 L 310 120"
                fill="none" stroke="#8b7355" stroke-width="2" />
              <text x="10" y="92" fill="#8b7355" font-size="5">地面</text>
              <g transform="translate(180, 60)">
                <circle cx="0" cy="0" r="8" fill="#333" />
                <path d="M -4 -4 L 4 4 M -4 4 L 4 -4" stroke="#fff" stroke-width="2" />
              </g>
              <line x1="190" y1="72" x2="190" y2="112" stroke="#2ecc71" stroke-width="2" />
              <path d="M 190 72 L 187 77 L 193 77 Z" fill="#2ecc71" />
              <path d="M 190 112 L 187 107 L 193 107 Z" fill="#2ecc71" />
              <text x="200" y="80" fill="#2ecc71" font-size="5" font-weight="bold">相对地面高度</text>
              <text x="200" y="92" fill="#999" font-size="4">(AGL)</text>
              <circle cx="60" cy="120" r="6" fill="#4a90e2" stroke="#fff" stroke-width="2" />
              <text x="70" y="125" fill="#4a90e2" font-size="5">起飞点</text>
            </svg>

            <svg v-if="modelValue.executeHeightMode === 'WGS84'" viewBox="0 0 320 150"
              xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
              <line x1="10" y1="135" x2="310" y2="135" stroke="#4a90e2" stroke-width="2" />
              <text x="10" y="148" fill="#4a90e2" font-size="5" font-weight="bold">海平面 / 椭球面 (WGS84)</text>
              <path d="M 10 120 L 50 115 L 90 110 L 130 105 L 170 100 L 210 108 L 250 112 L 290 118 L 310 120"
                fill="none" stroke="#8b7355" stroke-width="2" />
              <text x="10" y="92" fill="#8b7355" font-size="5">地面</text>
              <circle cx="60" cy="120" r="6" fill="#4a90e2" stroke="#fff" stroke-width="2" />
              <text x="70" y="125" fill="#4a90e2" font-size="5">起飞点</text>
              <g transform="translate(170, 50)">
                <circle cx="0" cy="0" r="8" fill="#333" />
                <path d="M -4 -4 L 4 4 M -4 4 L 4 -4" stroke="#fff" stroke-width="2" />
              </g>
              <line x1="170" y1="58" x2="170" y2="135" stroke="#9b59b6" stroke-width="2" />
              <path d="M 170 58 L 167 63 L 173 63 Z" fill="#9b59b6" />
              <path d="M 170 135 L 167 130 L 173 130 Z" fill="#9b59b6" />
              <text x="145" y="35" fill="#9b59b6" font-size="5" font-weight="bold">绝对高度</text>
              <text x="145" y="47" fill="#999" font-size="4">(MSL)</text>
            </svg>

            <svg v-if="modelValue.executeHeightMode === 'relativeToStartPoint'" viewBox="0 0 320 150"
              xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
              <line x1="10" y1="135" x2="310" y2="135" stroke="#4a90e2" stroke-width="1" stroke-dasharray="2,2" />
              <text x="10" y="148" fill="#999" font-size="5">海平面 (参考)</text>
              <circle cx="70" cy="115" r="6" fill="#4a90e2" stroke="#fff" stroke-width="2" />
              <text x="80" y="120" fill="#4a90e2" font-size="5">起飞点</text>
              <g transform="translate(210, 55)">
                <circle cx="0" cy="0" r="8" fill="#333" />
                <path d="M -4 -4 L 4 4 M -4 4 L 4 -4" stroke="#fff" stroke-width="2" />
              </g>
              <line x1="215" y1="65" x2="215" y2="115" stroke="#e74c3c" stroke-width="2" />
              <path d="M 215 65 L 212 70 L 218 70 Z" fill="#e74c3c" />
              <path d="M 215 115 L 212 110 L 218 110 Z" fill="#e74c3c" />
              <text x="185" y="35" fill="#e74c3c" font-size="5" font-weight="bold">相对起飞点高度</text>
              <text x="185" y="47" fill="#999" font-size="4">(ALT)</text>
            </svg>
          </div>

          <div class="height-controls">
            <a-button size="small" @click="adjustHeight(100)">+100</a-button>
            <a-button size="small" @click="adjustHeight(10)">+10</a-button>
            <div class="height-display">
              <a-input-number :value="modelValue.flightHeight || 60"
                @change="val => updateConfig('flightHeight', val)" :min="20" :max="500" :bordered="false"
                class="height-input" :controls="false" />
              <span class="height-unit">m</span>
            </div>
            <a-button size="small" @click="adjustHeight(-10)">-10</a-button>
            <a-button size="small" @click="adjustHeight(-100)">-100</a-button>
          </div>
        </div>
      </a-form-item>

      <a-form-item v-if="modelValue.executeHeightMode === 'realTimeFollowSurface'">
        <div class="realtime-surface">
          <div class="surface-info">
            <div class="surface-title">实时仿地</div>
            <div class="surface-desc">开启后根据传感器实时采集的高度信息仿地飞行</div>
          </div>
          <a-switch :checked="modelValue.realtimeFollowSurface"
            @change="val => updateConfig('realtimeFollowSurface', val)" />
        </div>
      </a-form-item>

      <a-form-item label="飞向首航点模式">
        <a-radio-group :value="modelValue.climbMode" button-style="solid" class="w-full radio-group"
          @change="e => updateConfig('climbMode', e.target.value)">
          <a-radio-button value="vertical" class="radio-btn">垂直爬升</a-radio-button>
          <a-radio-button value="oblique" class="radio-btn">倾斜爬升</a-radio-button>
        </a-radio-group>

        <div class="height-diagram-container">
          <div class="diagram-box">
            <svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
              <line x1="10" y1="110" x2="310" y2="110" stroke="#8b7355" stroke-width="2" />
              <text x="10" y="103" fill="#8b7355" font-size="5">地面</text>
              <circle cx="40" cy="110" r="6" fill="#4a90e2" stroke="#fff" stroke-width="2" />
              <text x="50" y="115" fill="#4a90e2" font-size="5">起飞点</text>
              <g transform="translate(280, 30)">
                <path d="M 0 -10 L -8 5 L 8 5 Z" fill="#e74c3c" />
              </g>
              <text x="275" y="15" fill="#e74c3c" font-size="5">首航点</text>
              <g v-if="modelValue.climbMode === 'vertical'">
                <path d="M 40 110 L 40 50 L 280 30" fill="none" stroke="#2ecc71" stroke-width="2"
                  stroke-dasharray="4,2" />
                <text x="50" y="35" fill="#2ecc71" font-size="5">垂直爬升 + 巡航</text>
                <line x1="55" y1="52" x2="55" y2="110" stroke="#f39c12" stroke-width="2" />
                <path d="M 55 52 L 52 57 L 58 57 Z" fill="#f39c12" />
                <path d="M 55 110 L 52 105 L 58 105 Z" fill="#f39c12" />
                <text x="25" y="75" fill="#f39c12" font-size="5">安全起飞高度</text>
              </g>
              <g v-else>
                <path d="M 40 110 L 280 30" fill="none" stroke="#9b59b6" stroke-width="2" stroke-dasharray="4,2" />
                <text x="90" y="45" fill="#9b59b6" font-size="5">倾斜爬升飞行轨迹</text>
              </g>
              <g transform="translate(180, 100)">
                <rect x="-3" y="-10" width="6" height="20" fill="#8b7355" />
                <circle cx="0" cy="-15" r="12" fill="#27ae60" opacity="0.7" />
              </g>
            </svg>
          </div>

          <div class="height-controls">
            <a-button size="small" @click="adjustSafetyHeight(100)">+100</a-button>
            <a-button size="small" @click="adjustSafetyHeight(10)">+10</a-button>
            <div class="height-display">
              <a-input-number :value="modelValue.takeOffSecurityHeight || 20"
                @change="val => updateConfig('takeOffSecurityHeight', val)" :min="10" :max="200" :bordered="false"
                class="height-input" :controls="false" />
              <span class="height-unit">m</span>
            </div>
            <a-button size="small" @click="adjustSafetyHeight(-10)">-10</a-button>
            <a-button size="small" @click="adjustSafetyHeight(-100)">-100</a-button>
          </div>
        </div>
      </a-form-item>

      <a-form-item label="标定飞行" v-if="['mapping', 'patrol'].includes(modelValue.routeType || '')">
        <div class="calibration-flight">
          <a-switch :checked="modelValue.caliFlightEnable"
            @change="val => updateConfig('caliFlightEnable', val)" />
          <span class="calibration-desc">
            {{ modelValue.caliFlightEnable ? '开启：自动进行惯导标定，提高模型精度（会增加额外飞行轨迹）' : '关闭：仅执行标准航线' }}
          </span>
        </div>
      </a-form-item>

      <a-card v-if="modelValue.routeType === 'mapping' || modelValue.routeType === 'patrol'" title="扫描参数设置" size="small"
        class="scan-settings-card">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="扫描间距 (m)" class="mb-2">
              <a-input-number :value="modelValue.aiPatrol?.scanSpacing || 20"
                @change="val => updateAiPatrol('scanSpacing', val)" :min="5" :max="200" class="w-full" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="航线方向角度 (°)" class="mb-2">
              <a-input-number :value="modelValue.aiPatrol?.direction || 0"
                @change="val => updateAiPatrol('direction', val)" :min="0" :max="359" class="w-full" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="边距 (m)" class="mb-2">
              <a-input-number :value="modelValue.aiPatrol?.margin || 0"
                @change="val => updateAiPatrol('margin', val)" :min="0" :max="50" class="w-full" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="云台俯仰角 (°)" class="mb-2">
              <a-input-number :value="modelValue.aiPatrol?.gimbalPitchAngle || -45"
                @change="val => updateAiPatrol('gimbalPitchAngle', val)" :min="-90" :max="30" class="w-full" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <div class="smart-detection">
        <div class="detection-header">
          <div class="detection-title">
            <span class="detection-icon">🔍</span>
            <h3 class="detection-label">智能识别告警</h3>
          </div>
          <a-switch :checked="modelValue.aiPatrol?.enabled" @change="val => updateAiPatrol('enabled', val)"
            size="small" />
        </div>

        <div v-if="modelValue.aiPatrol?.enabled" class="detection-content">
          <a-tabs type="card" size="small" class="detection-tabs">
            <a-tab-pane key="1" tab="可见光识别" />
            <a-tab-pane key="2" tab="红外温度识别" />
            <a-tab-pane key="3" tab="三方机载算法" />
          </a-tabs>

          <a-card size="small" title="告警条件" class="alert-card">
            <div class="alert-condition">
              <div class="target-tag target-active">
                <span class="target-icon">🚶</span> 人
              </div>
              <a-select value="<" size="small" class="condition-select">
                <a-select-option value="<">&lt;</a-select-option>
                <a-select-option value=">">&gt;</a-select-option>
              </a-select>
              <a-input-number value="1" size="small" class="condition-value" />
            </div>
            <div class="alert-condition">
              <div class="target-tag">
                <span class="target-icon">🚗</span> 车
              </div>
              <a-select value=">" size="small" class="condition-select">
                <a-select-option value=">">&gt;</a-select-option>
              </a-select>
              <a-input-number value="1" size="small" class="condition-value" />
            </div>
            <div class="alert-condition">
              <div class="target-tag">
                <span class="target-icon">🚢</span> 船
              </div>
              <a-select value=">" size="small" class="condition-select">
                <a-select-option value=">">&gt;</a-select-option>
              </a-select>
              <a-input-number value="1" size="small" class="condition-value" />
            </div>
          </a-card>

          <a-card size="small" class="confidence-card">
            <div class="confidence-header">
              <div class="confidence-label">置信度</div>
              <div class="confidence-value">83 %</div>
            </div>
            <div class="confidence-slider">
              <span class="slider-label">更全</span>
              <a-slider :value="83" :min="1" :max="100" class="slider" />
              <span class="slider-label">更准</span>
            </div>
            <div class="confidence-warning">
              ⚠️ 修改置信度超出了推荐范围，可能导致目标丢失
            </div>
          </a-card>

          <a-card size="small" class="operation-card">
            <div class="operation-row">
              <label class="operation-label">作业镜头</label>
              <a-radio-group value="visible" size="small" button-style="solid">
                <a-radio-button value="visible">可见光</a-radio-button>
                <a-radio-button value="infrared">红外</a-radio-button>
              </a-radio-group>
            </div>
            <div class="operation-row">
              <label class="operation-label">全程录像</label>
              <a-switch size="small" />
            </div>
            <div class="operation-column">
              <label class="operation-label">触发动作</label>
              <a-button size="small" type="dashed" block>选择动作</a-button>
            </div>
          </a-card>

          <a-card size="small" title="告警信息">
            <a-input placeholder="请输入告警标题" class="alert-input" size="small" />
            <a-textarea placeholder="识别到异常目标" :rows="2" class="alert-textarea" size="small" />
          </a-card>
        </div>
        <div v-else class="detection-disabled">
          关闭智能识别，飞行过程中将不使用自动识别，需要人工识别
        </div>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import type { MissionConfig } from '/@/utils/wayline/kmzGenerator'

const props = defineProps<{
  modelValue: MissionConfig
}>()

const emit = defineEmits(['update:modelValue'])

const updateConfig = (key: string, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const updateAiPatrol = (key: string, value: any) => {
  const currentAiPatrol = props.modelValue.aiPatrol || {}
  const newAiPatrol = { ...currentAiPatrol, [key]: value }
  updateConfig('aiPatrol', newAiPatrol)
}

const adjustHeight = (delta: number) => {
  const currentHeight = props.modelValue.flightHeight || 60
  const newHeight = Math.max(20, Math.min(500, currentHeight + delta))
  updateConfig('flightHeight', newHeight)
}

const adjustSafetyHeight = (delta: number) => {
  const currentHeight = props.modelValue.takeOffSecurityHeight || 20
  const newHeight = Math.max(10, Math.min(200, currentHeight + delta))
  updateConfig('takeOffSecurityHeight', newHeight)
}
</script>

<style lang="scss" scoped>
.mission-config {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;

  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
}

.divider-title {
  margin-top: 0 !important;
  margin-bottom: 16px !important;
  color: #1f2937 !important;
  font-weight: 600 !important;
}

.w-full {
  width: 100%;
}

.radio-group {
  display: flex;
  width: 100%;
}

.radio-btn {
  flex: 1;
  text-align: center;
}

.height-diagram-container {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.diagram-box {
  background: #f9fafb;
  border-radius: 6px;
  padding: 16px;
  flex: 1;
  min-height: 120px;
}

.diagram-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.height-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 90px;
}

.height-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #f9fafb;
  padding: 8px;
  border-radius: 4px;
  border: 2px solid #2d8cf0;
}

.height-input {
  width: 50px;
  padding: 0;
  text-align: center;
  font-weight: 700;
  color: #2d8cf0;
}

.height-unit {
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
}

.realtime-surface {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.surface-title {
  font-weight: 500;
}

.surface-desc {
  font-size: 12px;
  color: #6b7280;
}

.calibration-flight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calibration-desc {
  color: #6b7280;
  font-size: 12px;
}

.scan-settings-card {
  margin-top: 16px;
  background: #f9fafb;
}

.mb-2 {
  margin-bottom: 8px;
}

.smart-detection {
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #8b5cf6;
  overflow: hidden;
  margin-top: 16px;
}

.detection-header {
  background: linear-gradient(to right, #2c2035, #1f2937);
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c4b5fd;
}

.detection-icon {
  font-size: 16px;
}

.detection-label {
  margin: 0;
  font-size: 16px;
}

.detection-content {
  padding: 16px;
}

.detection-tabs {
  margin-bottom: 16px;
}

.alert-card {
  margin-bottom: 12px;
}

.alert-condition {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.target-tag {
  flex: 1;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
}

.target-active {
  background: #2d8cf0;
  color: #1f2937;
  border-color: #2d8cf0;
}

.target-icon {
  font-size: 14px;
}

.condition-select {
  width: 64px;
}

.condition-value {
  width: 64px;
}

.confidence-card {
  margin-bottom: 12px;
}

.confidence-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.confidence-label {
  font-size: 12px;
  color: #6b7280;
}

.confidence-value {
  color: #2d8cf0;
  font-weight: 700;
  font-size: 14px;
}

.confidence-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.slider-label {
  font-size: 11px;
  color: #6b7280;
}

.slider {
  flex: 1;
}

.confidence-warning {
  font-size: 11px;
  color: #f59e0b;
  line-height: 1.4;
}

.operation-card {
  margin-bottom: 12px;
}

.operation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.operation-label {
  font-size: 12px;
  color: #4b5563;
}

.operation-column {
  display: flex;
  flex-direction: column;
}

.alert-input {
  margin-bottom: 8px;
  font-size: 12px;
}

.alert-textarea {
  font-size: 12px;
}

.detection-disabled {
  padding: 20px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}
</style>
