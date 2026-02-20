<template>
  <div class="project-tsa-wrapper ">
    <div>
      <a-row>
        <a-col :span="1"></a-col>
        <a-col :span="11">My Username</a-col>
        <a-col :span="11" align="right" style="font-weight: 700">{{ username }}</a-col>
        <a-col :span="1"></a-col>
      </a-row>
    </div>
    <div class="scrollbar" :style="{ height: scorllHeight + 'px'}">
      <a-collapse :bordered="false" expandIconPosition="right" accordion style="background: #232323;">
        <a-collapse-panel :key="EDeviceTypeName.Dock" header="Dock" style="border-bottom: 1px solid #4f4f4f;">
          <div v-if="onlineDocks.data.length === 0" style="height: 150px; color: white;">
            <a-empty :image="noData" :image-style="{ height: '60px' }" />
          </div>
          <div v-else class="fz12" style="color: white;">
            <div v-for="dock in onlineDocks.data" :key="dock.sn" style="background: #3c3c3c; height: 150px; width: 250px; margin-bottom: 10px;">
              <div style="border-radius: 2px; height: 100%; width: 100%;" class="flex-row flex-justify-between">
                <div style="float: left; padding: 4px 5px 4px 8px; width: 88%; display: flex; flex-direction: column;">
                  <div style="width: 80%; height: 20px; line-height: 20px; font-size: 13px; font-weight: bold; flex-shrink: 0;">
                    <a-tooltip :title="`${dock.gateway.callsign} - ${dock.callsign ?? 'No Drone'}`">
                      <div class="text-hidden" style="max-width: 200px;">{{ dock.gateway.callsign }} - {{ dock.callsign ?? 'No Drone' }}</div>
                    </a-tooltip>
                  </div>
                  <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-around;">
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">🏠</span>
                        <span :style="dockInfo[dock.gateway.sn] && dockInfo[dock.gateway.sn].basic_osd?.mode_code !== EDockModeCode.Disconnected ? 'color: #00ee8b' : 'color: red;'">
                          {{ dockInfo[dock.gateway.sn] ? EDockModeCode[dockInfo[dock.gateway.sn].basic_osd?.mode_code] : '离线' }}
                        </span>
                        <span class="ml5 mr2">🚪</span>
                        <span :style="dockInfo[dock.gateway.sn]?.basic_osd?.cover_state === 0 ? 'color: #00ee8b' : 'color: #ff9f0a'">
                          {{ dockInfo[dock.gateway.sn]?.basic_osd?.cover_state === 0 ? '关闭' : '打开' }}
                        </span>
                        <span class="ml5 mr2">📦</span>
                        <span :style="dockInfo[dock.gateway.sn]?.basic_osd?.drone_in_dock ? 'color: #00ee8b' : 'color: #ff9f0a'">
                          {{ dockInfo[dock.gateway.sn]?.basic_osd?.drone_in_dock ? '在舱' : '离舱' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">🔌</span>
                        <span :style="dockInfo[dock.gateway.sn]?.basic_osd?.drone_charge_state?.state === 1 ? 'color: #00ee8b' : 'color: #ff9f0a'">
                          {{ dockInfo[dock.gateway.sn]?.basic_osd?.drone_charge_state?.state === 1 ? '充电中' : '空闲' }}
                        </span>
                        <span class="ml5 mr2">🔋</span>
                        <span :style="getBatteryColor(dockInfo[dock.gateway.sn]?.basic_osd?.drone_charge_state?.capacity_percent)">
                          {{ dockInfo[dock.gateway.sn]?.basic_osd?.drone_charge_state?.capacity_percent?.toFixed(0) ?? '--' }}%
                        </span>
                        <span class="ml5 mr2">📡</span>
                        <span :style="getNetworkQualityColor(dockInfo[dock.gateway.sn]?.basic_osd?.network_state?.quality)">
                          Q{{ dockInfo[dock.gateway.sn]?.basic_osd?.network_state?.quality ?? '-' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">🌡️</span>
                        <span>{{ dockInfo[dock.gateway.sn]?.basic_osd?.environment_temperature?.toFixed(1) ?? '--' }}°C</span>
                        <span class="ml5 mr2">💧</span>
                        <span>{{ dockInfo[dock.gateway.sn]?.basic_osd?.humidity?.toFixed(0) ?? '--' }}%</span>
                        <span class="ml5 mr2">📊</span>
                        <span>{{ dockInfo[dock.gateway.sn]?.basic_osd?.pressure?.toFixed(0) ?? '--' }}hPa</span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">💨</span>
                        <span>{{ dockInfo[dock.gateway.sn]?.basic_osd?.wind_speed?.toFixed(1) ?? '--' }}m/s</span>
                        <span class="ml5 mr2">🧭</span>
                        <span>{{ getWindDirectionText(dockInfo[dock.gateway.sn]?.basic_osd?.wind_direction) }}</span>
                        <span class="ml5 mr2">🌧️</span>
                        <span>{{ getRainfallText(dockInfo[dock.gateway.sn]?.basic_osd?.rainfall) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style="float: right; background: #595959; height: 100%; width: 40px;" class="flex-row flex-justify-center flex-align-center">
                  <div class="fz16" @click="switchVisible($event, dock, true, dockInfo[dock.gateway.sn] && dockInfo[dock.gateway.sn].basic_osd?.mode_code !== EDockModeCode.Disconnected)">
                    <a v-if="osdVisible.gateway_sn === dock.gateway.sn && osdVisible.visible"><EyeOutlined /></a>
                    <a v-else><EyeInvisibleOutlined /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-collapse-panel>
      </a-collapse>
      <a-collapse :bordered="false" expandIconPosition="right" accordion style="background: #232323;">
        <a-collapse-panel :key="EDeviceTypeName.Aircraft" header="Online Devices" style="border-bottom: 1px solid #4f4f4f;">
          <div v-if="onlineDevices.data.length === 0" style="height: 150px; color: white;">
            <a-empty :image="noData" :image-style="{ height: '60px' }" />
          </div>
          <div v-else class="fz12" style="color: white;">
            <div v-for="device in onlineDevices.data" :key="device.sn" style="background: #3c3c3c; height: 220px; width: 250px; margin-bottom: 10px;">
              <div class="battery-slide" v-if="gatewayInfo[device.gateway.sn]">
                <div style="background: #535759; width: 100%;"></div>
                <div class="capacity-percent" :style="{ width: gatewayInfo[device.gateway.sn].capacity_percent + '%'}"></div>
                <div class="return-home" :style="{ width: '20%' }"></div>
                <div class="landing" :style="{ width: '10%' }"></div>
                <div class="battery" :style="{ left: gatewayInfo[device.gateway.sn].capacity_percent + '%' }"></div>
              </div>
              <div style="border-radius: 2px; height: 100%; width: 100%;" class="flex-row flex-justify-between">
                <div style="float: left; padding: 4px 5px 4px 8px; width: 88%; display: flex; flex-direction: column;">
                  <div style="width: 80%; height: 20px; line-height: 20px; font-size: 13px; flex-shrink: 0;">
                    <a-tooltip>
                      <template #title>{{ device.gateway.model }} - {{ device.gateway.callsign }}</template>
                      <div class="text-hidden" style="max-width: 200px;">{{ device.gateway.model }} - {{ device.gateway.callsign }}</div>
                    </a-tooltip>
                  </div>
                  <div style="flex: 2; display: flex; flex-direction: column; justify-content: space-around;">
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #4a4a4a; height: 18px; font-size: 12px; padding: 0 4px;">
                      <span style="color: #00ee8b;">📱 遥控器</span>
                      <span :style="gatewayInfo[device.gateway.sn] ? 'color: #00ee8b' : 'color: red;'">
                        {{ gatewayInfo[device.gateway.sn] ? 'Online' : 'Offline' }}
                      </span>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">🔋</span>
                        <span :style="getBatteryColor(gatewayInfo[device.gateway.sn]?.capacity_percent)">
                          {{ gatewayInfo[device.gateway.sn]?.capacity_percent?.toFixed(0) ?? '--' }}%
                        </span>
                        <span class="ml5 mr2">📍</span>
                        <span>{{ gatewayInfo[device.gateway.sn]?.latitude?.toFixed(4) ?? '--' }}, {{ gatewayInfo[device.gateway.sn]?.longitude?.toFixed(4) ?? '--' }}</span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">📡</span>
                        <span :style="get4GQualityColor(gatewayInfo[device.gateway.sn]?.wireless_link?.['4g_quality'])">
                          4G: Q{{ gatewayInfo[device.gateway.sn]?.wireless_link?.['4g_quality'] ?? '-' }}
                        </span>
                        <span class="ml5 mr2">📶</span>
                        <span :style="getSDRQualityColor(gatewayInfo[device.gateway.sn]?.wireless_link?.sdr_quality)">
                          SDR: Q{{ gatewayInfo[device.gateway.sn]?.wireless_link?.sdr_quality ?? '-' }}
                        </span>
                        <span class="ml5 mr2">✅</span>
                        <span :style="getLinkStateColor(gatewayInfo[device.gateway.sn]?.wireless_link?.['4g_link_state'], gatewayInfo[device.gateway.sn]?.wireless_link?.sdr_link_state)">
                          {{ getLinkStateText(gatewayInfo[device.gateway.sn]?.wireless_link?.['4g_link_state'], gatewayInfo[device.gateway.sn]?.wireless_link?.sdr_link_state) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-around;">
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #4a4a4a; height: 18px; font-size: 12px; padding: 0 4px;">
                      <span style="color: #00ee8b;">🚁 无人机</span>
                      <span :style="deviceInfo[device.sn] ? 'color: #00ee8b' : 'color: #ff9f0a;'">
                        {{ deviceInfo[device.sn] ? getFlightModeText(deviceInfo[device.sn]?.mode_code) : '待机' }}
                      </span>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">📍</span>
                        <span>{{ deviceInfo[device.sn]?.latitude?.toFixed(5) ?? '--' }}, {{ deviceInfo[device.sn]?.longitude?.toFixed(5) ?? '--' }}</span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">📏</span>
                        <span>高度: {{ deviceInfo[device.sn]?.height?.toFixed(1) ?? '--' }}m</span>
                        <span class="ml5 mr2">📏</span>
                        <span>距离: {{ formatDistance(deviceInfo[device.sn]?.home_distance) }}</span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">🚀</span>
                        <span>{{ formatSpeed(deviceInfo[device.sn]?.horizontal_speed) }}</span>
                        <span class="ml5 mr2">🔋</span>
                        <span :style="getBatteryColor(deviceInfo[device.sn]?.battery?.capacity_percent)">
                          {{ deviceInfo[device.sn]?.battery?.capacity_percent?.toFixed(0) ?? '--' }}%
                        </span>
                      </div>
                    </div>
                    <div class="flex-align-center flex-row flex-justify-between" style="background: #595959; height: 18px; font-size: 12px;">
                      <div class="flex-row flex-align-center ml5">
                        <span class="mr2">💨</span>
                        <span>风速: {{ formatWindSpeed(deviceInfo[device.sn]?.wind_speed) }}</span>
                        <span class="ml5 mr2">🛰️</span>
                        <span>GPS: {{ deviceInfo[device.sn]?.position_state?.gps_number ?? '--' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style="float: right; background: #595959; height: 100%; width: 40px;" class="flex-row flex-justify-center flex-align-center">
                  <div class="fz16" @click="switchVisible($event, device, false, !!gatewayInfo[device.gateway.sn])">
                    <a v-if="osdVisible.sn === device.sn && osdVisible.visible"><EyeOutlined /></a>
                    <a v-else><EyeInvisibleOutlined /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch, WritableComputedRef } from 'vue'
import { EDeviceTypeName, ELocalStorageKey } from '/@/types'
import noData from '/@/assets/icons/no-data.png'
import rc from '/@/assets/icons/rc.png'
import { OnlineDevice, EModeCode, OSDVisible, EDockModeCode, DeviceOsd } from '/@/types/device'
import { useMyStore } from '/@/store'
import { getDeviceTopo, getUnreadDeviceHms, updateDeviceHms } from '/@/api/manage'
import { RocketOutlined, EyeInvisibleOutlined, EyeOutlined, RobotOutlined, DoubleRightOutlined } from '@ant-design/icons-vue'
import { EHmsLevel } from '/@/types/enums'

const store = useMyStore()
const username = ref(localStorage.getItem(ELocalStorageKey.Username))
const workspaceId = ref(localStorage.getItem(ELocalStorageKey.WorkspaceId)!)
const osdVisible = computed(() => store.state.osdVisible)
const hmsVisible = new Map<string, boolean>()
const scorllHeight = ref()

const onlineDevices = reactive({
  data: [] as OnlineDevice[]
})

const onlineDocks = reactive({
  data: [] as OnlineDevice[]
})

const deviceInfo = computed(() => store.state.deviceState.deviceInfo)
const gatewayInfo = computed(() => store.state.deviceState.gatewayInfo)
const dockInfo = computed(() => store.state.deviceState.dockInfo)
const hmsInfo = computed({
  get: () => store.state.hmsInfo,
  set: (val) => {
    return val
  }
})

onMounted(() => {
  getOnlineTopo()
  setTimeout(() => {
    watch(() => store.state.deviceStatusEvent,
      data => {
        getOnlineTopo()
        if (data.deviceOnline.sn) {
          getUnreadHms(data.deviceOnline.sn)
        }
      },
      {
        deep: true
      }
    )
    getOnlineDeviceHms()
  }, 3000)
  const element = document.getElementsByClassName('scrollbar').item(0) as HTMLDivElement
  const parent = element?.parentNode as HTMLDivElement
  scorllHeight.value = parent?.clientHeight - parent?.firstElementChild?.clientHeight
})

function getOnlineTopo () {
  getDeviceTopo(workspaceId.value).then((res) => {
    if (res.code !== 0) {
      return
    }
    onlineDevices.data = []
    onlineDocks.data = []
    res.data.forEach((gateway: any) => {
      const child = gateway.children
      const device: OnlineDevice = {
        model: child?.device_name,
        callsign: child?.nickname,
        sn: child?.device_sn,
        mode: EModeCode.Disconnected,
        gateway: {
          model: gateway?.device_name,
          callsign: gateway?.nickname,
          sn: gateway?.device_sn,
          domain: gateway?.domain
        },
        payload: []
      }
      child?.payloads_list.forEach((payload: any) => {
        device.payload.push({
          index: payload.index,
          model: payload.model,
          payload_name: payload.payload_name,
          payload_sn: payload.payload_sn,
          control_source: payload.control_source,
          payload_index: payload.payload_index
        })
      })
      if (EDeviceTypeName.Dock === gateway.domain) {
        hmsVisible.set(device.sn, false)
        hmsVisible.set(device.gateway.sn, false)
        onlineDocks.data.push(device)
      }
      if (gateway.status && EDeviceTypeName.Gateway === gateway.domain) {
        onlineDevices.data.push(device)
      }
    })
  })
}

function switchVisible (e: any, device: OnlineDevice, isDock: boolean, isClick: boolean) {
  if (!isClick) {
    e.target.style.cursor = 'not-allowed'
    return
  }
  if (device.sn === osdVisible.value.sn) {
    osdVisible.value.visible = !osdVisible.value.visible
  } else {
    osdVisible.value.sn = device.sn
    osdVisible.value.callsign = device.callsign
    osdVisible.value.model = device.model
    osdVisible.value.visible = true
    osdVisible.value.gateway_sn = device.gateway.sn
    osdVisible.value.is_dock = isDock
    osdVisible.value.gateway_callsign = device.gateway.callsign
    osdVisible.value.payloads = device.payload
  }
  store.commit('SET_OSD_VISIBLE_INFO', osdVisible)
}

function getNetworkQualityColor (quality: number | undefined): string {
  if (quality === undefined) return 'color: #999'
  if (quality >= 4) return 'color: #00ee8b'
  if (quality >= 2) return 'color: #ff9f0a'
  return 'color: red'
}

function getBatteryColor (percent: number | undefined): string {
  if (percent === undefined) return 'color: #999'
  if (percent >= 60) return 'color: #00ee8b'
  if (percent >= 30) return 'color: #ff9f0a'
  return 'color: red'
}

function getRainfallText (rainfall: number | undefined): string {
  if (rainfall === undefined) return '--'
  const texts = ['无雨', '小雨', '中雨', '大雨']
  return texts[rainfall] || '--'
}

function get4GQualityColor (quality: number | undefined): string {
  if (quality === undefined) return 'color: #999'
  if (quality >= 4) return 'color: #00ee8b'
  if (quality >= 2) return 'color: #ff9f0a'
  return 'color: red'
}

function getSDRQualityColor (quality: number | undefined): string {
  if (quality === undefined) return 'color: #999'
  if (quality >= 4) return 'color: #00ee8b'
  if (quality >= 2) return 'color: #ff9f0a'
  return 'color: red'
}

function getLinkModeText (mode: number | undefined): string {
  if (mode === undefined) return '--'
  const modes: { [key: number]: string } = {
    0: 'SDR',
    1: '4G',
    2: '4G+SDR'
  }
  return modes[mode] || '--'
}

function getLinkStateColor (fourG: boolean | undefined, sdr: boolean | undefined): string {
  if (fourG === undefined && sdr === undefined) return 'color: #999'
  if (fourG || sdr) return 'color: #00ee8b'
  return 'color: red'
}

function getLinkStateText (fourG: boolean | undefined, sdr: boolean | undefined): string {
  if (fourG === undefined && sdr === undefined) return '--'
  if (fourG && sdr) return '双链路'
  if (fourG) return '4G连接'
  if (sdr) return 'SDR连接'
  return '断开'
}

function getDroneHeight (device: OnlineDevice): string {
  const droneHeight = deviceInfo.value[device.sn]?.height
  if (droneHeight !== undefined) return droneHeight.toFixed(1)
  const gatewayHeight = gatewayInfo.value[device.gateway.sn]?.height
  if (gatewayHeight !== undefined) return gatewayHeight.toFixed(1)
  return '--'
}

function getFlightModeColor (modeCode: number | undefined): string {
  if (modeCode === undefined) return 'color: #999'
  if (modeCode === 0) return 'color: #ff9f0a'
  if (modeCode === 9) return 'color: #00ee8b'
  if (modeCode >= 3 && modeCode <= 8) return 'color: #00ee8b'
  return 'color: #ff9f0a'
}

function getWindDirectionText (direction: number | undefined): string {
  if (direction === undefined || direction === null) return '--'
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(direction / 45) % 8
  return directions[index]
}

function getFlightModeText (modeCode: number | undefined): string {
  if (modeCode === undefined) return '无无人机'
  const modes: { [key: number]: string } = {
    0: '待机',
    1: '准备起飞',
    2: '起飞完成',
    3: '手动飞行',
    4: '自动起飞',
    5: '航线飞行',
    6: '全景拍摄',
    7: '智能跟踪',
    8: 'ADS-B避障',
    9: '自动返航'
  }
  return modes[modeCode] || '未知'
}

function formatSpeed (speed: string | number | undefined): string {
  if (speed === undefined || speed === null) return '-- m/s'
  const num = typeof speed === 'string' ? parseFloat(speed) : speed
  if (isNaN(num)) return '-- m/s'
  return `${num.toFixed(1)} m/s`
}

function formatDistance (distance: string | number | undefined): string {
  if (distance === undefined || distance === null) return '--'
  const num = typeof distance === 'string' ? parseFloat(distance) : distance
  if (isNaN(num)) return '--'
  if (num >= 1000) return `${(num / 1000).toFixed(2)} km`
  return `${num.toFixed(0)} m`
}

function formatWindSpeed (speed: string | number | undefined): string {
  if (speed === undefined || speed === null) return '-- m/s'
  const num = typeof speed === 'string' ? parseFloat(speed) : speed
  if (isNaN(num)) return '-- m/s'
  return `${num.toFixed(1)} m/s`
}

function getUnreadHms (sn: string) {
  getUnreadDeviceHms(workspaceId.value, sn).then(res => {
    if (res.data.length !== 0) {
      hmsInfo.value[sn] = res.data
    }
  })
  console.info(hmsInfo.value)
}

function getOnlineDeviceHms () {
  const snList = Object.keys(dockInfo.value)
  if (snList.length === 0) {
    return
  }
  snList.forEach(sn => {
    getUnreadHms(sn)
  })
  const deviceSnList = Object.keys(deviceInfo.value)
  if (deviceSnList.length === 0) {
    return
  }
  deviceSnList.forEach(sn => {
    getUnreadHms(sn)
  })
}

function readHms (visiable: boolean, sn: string) {
  if (!visiable) {
    updateDeviceHms(workspaceId.value, sn).then(res => {
      if (res.code === 0) {
        delete hmsInfo.value[sn]
      }
    })
  }
}

function openLivestreamOthers () {
  store.commit('SET_LIVESTREAM_OTHERS_VISIBLE', true)
}

function openLivestreamAgora () {
  store.commit('SET_LIVESTREAM_AGORA_VISIBLE', true)
}

</script>

<style lang="scss">
.project-tsa-wrapper > :first-child {
  height: 50px;
  line-height: 50px;
  align-items: center;
  border-bottom: 1px solid #4f4f4f;
}
.project-tsa-wrapper {
  height: 100%;
  .scrollbar {
    overflow: auto;
  }
  ::-webkit-scrollbar {
    display: none;
  }
}
.ant-collapse > .ant-collapse-item > .ant-collapse-header {
  color: white;
  border: 0;
  padding-left: 14px;
}

.text-hidden {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap;
  -o-text-overflow: ellipsis;
}
.font-bold {
  font-weight: 700;
}

.battery-slide {
  width: 100%;
  .capacity-percent {
    background: #00ee8b;
  }
  .return-home {
    background: #ff9f0a;
  }
  .landing {
    background: #f5222d;
  }
  .battery {
    background: white;
    border-radius: 1px;
    width: 8px;
    height: 4px;
    margin-top: -3px;
  }
}
.battery-slide > div {
  position: relative;
  margin-top: -2px;
  min-height: 2px;
  border-radius: 2px;
  white-space: nowrap;
}
.disable {
  cursor: not-allowed;
}

.notice-blink {
  background: $success;
  animation: blink 500ms infinite;
}
.caution-blink {
  background: orange;
  animation: blink 500ms infinite;
}
.warn-blink {
  background: red;
  animation: blink 500ms infinite;
}
.notice {
  background: $success;
  overflow: hidden;
  cursor: pointer;
}
.caution {
  background: orange;
  cursor: pointer;
  overflow: hidden;
}
.warn {
  background: red;
  cursor: pointer;
  overflow: hidden;
}
.word-loop {
  white-space: nowrap;
  display: inline-block;
  animation: 10s loop linear infinite normal;
}
@keyframes blink {
  from {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
  to {
    opacity: 1;
  }
}
@keyframes loop {
  0% {
    transform: translateX(20px);
    -webkit-transform: translateX(20px);
  }
  100% {
    transform: translateX(-100%);
    -webkit-transform: translateX(-100%);
  }
}

</style>
