<template>
  <div class="create-map-panel">
    <div class="panel-header">
      <span class="panel-title">上传 DSM 地图</span>
      <a-button type="text" size="small" @click="$emit('cancel')">
        <template #icon><CloseOutlined /></template>
      </a-button>
    </div>

    <div class="panel-content">
      <div class="section">
        <h3 class="section-title">地图名称</h3>
        <a-input
          v-model:value="form.mapName"
          placeholder="请输入地图名称"
        />
      </div>

      <div class="section">
        <h3 class="section-title">地图格式</h3>
        <a-row :gutter="12">
          <a-col :span="12">
            <div
              class="format-card"
              :class="{ 'format-card-active': form.mapFormat === '3dtiles' }"
              @click="form.mapFormat = '3dtiles'"
            >
              <div class="format-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="format-name">3D Tiles</div>
              <div class="format-desc">Cesium 3D Tiles 格式</div>
            </div>
          </a-col>
          <a-col :span="12">
            <div
              class="format-card"
              :class="{ 'format-card-active': form.mapFormat === 'terrain' }"
              @click="form.mapFormat = 'terrain'"
            >
              <div class="format-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 20L8 12L12 16L16 8L20 14"/>
                  <path d="M2 22h20"/>
                </svg>
              </div>
              <div class="format-name">Terrain</div>
              <div class="format-desc">Cesium Terrain 格式</div>
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h3 class="section-title">上传文件</h3>
        <a-upload-dragger
          v-model:fileList="fileList"
          :before-upload="beforeUpload"
          :accept="acceptTypes"
          :max-count="1"
          @remove="handleRemove"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">
            支持格式: GeoTIFF (.tiff, .tif) 或 3D Tiles 压缩包 (.zip)
          </p>
        </a-upload-dragger>
      </div>

      <div class="section" v-if="uploadProgress > 0">
        <h3 class="section-title">上传进度</h3>
        <a-progress :percent="uploadProgress" :status="uploadStatus" />
      </div>
    </div>

    <div class="panel-footer">
      <a-button @click="$emit('cancel')">取消</a-button>
      <a-button
        type="primary"
        :loading="uploading"
        :disabled="!canSubmit"
        @click="handleConfirm"
      >
        上传
      </a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'
import { CloseOutlined, InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'
import { uploadDsmFile } from '/@/api/map'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['cancel', 'confirm'])

const form = reactive({
  mapName: '',
  mapFormat: '3dtiles'
})

const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'active' | 'success' | 'exception' | 'normal'>('active')

const acceptTypes = computed(() => {
  return '.tiff,.tif,.zip'
})

const canSubmit = computed(() => {
  return selectedFile.value !== null && form.mapName.trim() !== ''
})

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  console.log('beforeUpload called, file:', file.name, 'size:', file.size)

  const isValidType = file.name.endsWith('.tiff') ||
                      file.name.endsWith('.tif') ||
                      file.name.endsWith('.zip')

  if (!isValidType) {
    message.error('只能上传 GeoTIFF 或 ZIP 文件!')
    return false
  }

  selectedFile.value = file
  console.log('File selected and saved:', file.name)

  return false
}

const handleRemove = () => {
  selectedFile.value = null
  fileList.value = []
}

const handleConfirm = async () => {
  console.log('handleConfirm called')
  console.log('canSubmit:', canSubmit.value)
  console.log('selectedFile:', selectedFile.value)
  console.log('form.mapName:', form.mapName)
  console.log('fileList:', fileList.value)

  if (!canSubmit.value) {
    message.warning('请填写地图名称并选择文件')
    return
  }

  const workspaceId = localStorage.getItem('workspace_id') || ''
  console.log('workspaceId:', workspaceId)

  if (!workspaceId) {
    message.error('无法获取工作区ID，请重新登录')
    return
  }

  const file = selectedFile.value
  if (!file) {
    message.error('请选择要上传的文件')
    return
  }

  console.log('Starting upload for file:', file.name, 'size:', file.size)

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = 'active'

  try {
    uploadProgress.value = 50

    console.log('Calling uploadDsmFile API...')
    const result = await uploadDsmFile(workspaceId, file, form.mapName, form.mapFormat)
    console.log('uploadDsmFile result:', result)

    if (result.code === 0) {
      uploadProgress.value = 100
      uploadStatus.value = 'success'
      message.success('地图上传成功')

      emit('confirm', {
        mapName: form.mapName,
        mapFormat: form.mapFormat,
        file: file,
        success: true
      })
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error: any) {
    uploadStatus.value = 'exception'
    console.error('Upload error:', error)
    message.error(error.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-map-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
  font-weight: 500;
}

.format-card {
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  min-height: 100px;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
  }
}

.format-card-active {
  background: #dbeafe !important;
  border-color: #3498db !important;
}

.format-icon {
  margin-bottom: 8px;
  color: #6b7280;
}

.format-card-active .format-icon {
  color: #3498db;
}

.format-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 4px;
}

.format-desc {
  font-size: 11px;
  color: #9ca3af;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

:deep(.ant-upload-drag) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;

  &:hover {
    border-color: #3498db;
  }
}

:deep(.ant-upload-drag-icon) {
  color: #3498db;
}
</style>
