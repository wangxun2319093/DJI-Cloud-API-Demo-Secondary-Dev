<template>
  <div class="cesium-map-wrapper">
    <!-- 地图区域 -->
    <div id="cesium-container" :style="{ width: '100%', height: '100%' }" />
    <!-- 绘制面板 -->
    <div
      class="g-action-panel"
      :style="{ right: drawVisible ? '316px' : '16px' }"
    >
      <div :class="state.currentType === 'pin' ? 'g-action-item selection' : 'g-action-item'" @click="draw('pin', true)">
        <a><a-image :src="pin" :preview="false" /></a>
      </div>
      <div :class="state.currentType === 'polyline' ? 'g-action-item selection' : 'g-action-item'" @click="draw('polyline', true)">
        <a><LineOutlined :rotate="135" class="fz20"/></a>
      </div>
      <div :class="state.currentType === 'polygon' && !state.isFlightArea ? 'g-action-item selection' : 'g-action-item'" @click="draw('polygon', true)">
        <a><BorderOutlined class="fz18" /></a>
      </div>
      <FlightAreaActionIcon class="g-action-item mt10" :class="{'selection': mouseMode && state.isFlightArea}" @select-action="selectFlightAreaAction" @click="selectFlightAreaAction"/>
      <div v-if="mouseMode" class="g-action-item" @click="draw('off', false)">
        <a style="color: red;"><CloseOutlined /></a>
      </div>
    </div>
    <!-- 航线编辑模式提示 -->
    <div v-if="waylineEditMode" class="wayline-edit-hint">
      <span>航线编辑模式：左键添加航点，右键结束绘制</span>
    </div>
    <!-- 坐标系统信息 -->
    <div class="coord-info">
      <span>WGS84</span>
    </div>
    <!-- 飞机OSD -->
    <div v-if="osdVisible.visible && !osdVisible.is_dock" v-drag-window class="osd-panel fz12">
      <div class="drag-title pl5 pr5 flex-align-center flex-row flex-justify-between" style="border-bottom: 1px solid #515151; height: 18%;">
        <span>{{ osdVisible.callsign }}</span>
        <span><a class="fz16" style="color: white;" @click="() => osdVisible.visible = false"><CloseOutlined /></a></span>
      </div>
      <div style="height: 82%;">
        <div class="flex-column flex-align-center flex-justify-center" style="margin-top: -5px; padding-top: 25px; float: left; width: 60px; background: #2d2d2d;">
          <a-tooltip :title="osdVisible.model">
            <div style="width: 90%;" class="flex-column flex-align-center flex-justify-center">
              <span><a-image :src="M30" :preview="false"/></span>
              <span>{{ osdVisible.model }}</span>
            </div>
          </a-tooltip>
        </div>
        <div class="osd">
            <a-row>
              <a-col span="16" :style="deviceInfo.device.mode_code === EModeCode.Disconnected ? 'color: red; font-weight: 700;': 'color: rgb(25,190,107)'">
                {{ EModeCode[deviceInfo.device.mode_code] }}
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Signal strength">
                  <span>HD</span>
                  <span class="ml10">{{ deviceInfo.gateway?.transmission_signal_quality }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="RC Battery Level">
                  <span><ThunderboltOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.gateway && deviceInfo.gateway.capacity_percent !== str ? deviceInfo.gateway?.capacity_percent + ' %' : deviceInfo.gateway?.capacity_percent }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Drone Battery Level">
                  <span><ThunderboltOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.device.battery.capacity_percent !== str ? deviceInfo.device.battery.capacity_percent + ' %' : deviceInfo.device.battery.capacity_percent }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-tooltip title="RTK Fixed">
                <a-col span="6" class="flex-row flex-align-center flex-justify-start">
                  <span>Fixed</span>
                  <span class="ml10 circle" :style="deviceInfo.device.position_state.is_fixed === 1 ? 'backgroud: rgb(25,190,107);' : ' background: red;'"/>
                </a-col>
              </a-tooltip>
              <a-col span="6">
                <a-tooltip title="GPS">
                  <span>GPS</span>
                  <span class="ml10">{{ deviceInfo.device.position_state.gps_number }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="RTK">
                  <span><TrademarkOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.device.position_state.rtk_number }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Flight Mode">
                  <span><ControlOutlined class="fz16" /></span>
                  <span class="ml10">{{ EGear[deviceInfo.device.gear] }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Altitude above sea level">
                  <span>ASL</span>
                  <span class="ml10">{{ deviceInfo.device.height === str ? str : deviceInfo.device.height.toFixed(2) + ' m'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Altitude above takeoff level">
                  <span>ALT</span>
                  <span class="ml10">{{ deviceInfo.device.elevation === str ? str : deviceInfo.device.elevation.toFixed(2) + ' m' }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Distance to Home Point">
                  <span>H</span>
                  <span class="ml10">{{ deviceInfo.device.home_distance === str ? str : deviceInfo.device.home_distance.toFixed(2) + ' m' }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Horizontal Speed">
                  <span>H.S</span>
                  <span class="ml10">{{ deviceInfo.device.horizontal_speed === str ? str : deviceInfo.device.horizontal_speed.toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Vertical Speed">
                  <span>V.S</span>
                  <span class="ml10">{{ deviceInfo.device.vertical_speed === str ? str : deviceInfo.device.vertical_speed.toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Wind Speed">
                  <span>W.S</span>
                  <span class="ml10">{{ deviceInfo.device.wind_speed === str ? str : (deviceInfo.device.wind_speed / 10).toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
            </a-row>
        </div>
      </div>
      <div class="battery-slide" v-if="deviceInfo.device.battery.remain_flight_time !== 0">
        <div style="background: #535759;" class="width-100"/>
        <div class="capacity-percent" :style="{ width: deviceInfo.device.battery.capacity_percent + '%'}"/>
        <div class="return-home" :style="{ width: deviceInfo.device.battery.return_home_power + '%'}"/>
        <div class="landing" :style="{ width: deviceInfo.device.battery.landing_power + '%'}"/>
        <div class="white-point" :style="{ left: deviceInfo.device.battery.landing_power + '%'}"/>
        <div class="battery" :style="{ left: deviceInfo.device.battery.capacity_percent + '%' }">
          {{ Math.floor(deviceInfo.device.battery.remain_flight_time / 60) }}:
          {{ 10 > (deviceInfo.device.battery.remain_flight_time % 60) ? '0' : ''}}{{deviceInfo.device.battery.remain_flight_time % 60 }}
        </div>
      </div>
    </div>
    <!-- 机场OSD -->
    <div v-if="osdVisible.visible && osdVisible.is_dock" v-drag-window class="osd-panel fz12">
      <div class="drag-title fz16 pl5 pr5 flex-align-center flex-row flex-justify-between" style="border-bottom: 1px solid #515151; height: 10%;">
        <span>{{ osdVisible.gateway_callsign }}</span>
      </div>
      <span><a style="color: white; position: absolute; top: 5px; right: 5px;" @click="() => osdVisible.visible = false"><CloseOutlined /></a></span>
      <!-- 机场 -->
      <div class="flex-display" style="border-bottom: 1px solid #515151;">
        <div class="flex-column flex-align-stretch flex-justify-center" style="width: 60px; background: #2d2d2d;">
          <a-tooltip :title="osdVisible.model">
            <div class="flex-column  flex-align-center flex-justify-center" style="width: 90%;">
              <span><RobotFilled style="font-size: 48px;"/></span>
              <span class="mt10">Dock</span>
            </div>
          </a-tooltip>
        </div>
        <div class="osd flex-1">
            <a-row>
              <a-col span="16" :style="deviceInfo.dock.basic_osd?.mode_code === EDockModeCode.Disconnected ? 'color: red; font-weight: 700;': 'color: rgb(25,190,107)'">
                {{ EDockModeCode[deviceInfo.dock.basic_osd?.mode_code] }}
              </a-col>
            </a-row>
            <a-row>
              <a-col span="12">
                <a-tooltip title="Accumulated Running Time">
                  <span><HistoryOutlined /></span>
                  <span class="ml10">
                    <span v-if="deviceInfo.dock.work_osd?.acc_time >= 2592000"> {{ Math.floor(deviceInfo.dock.work_osd?.acc_time / 2592000) }}m </span>
                    <span v-if="(deviceInfo.dock.work_osd?.acc_time % 2592000) >= 86400"> {{ Math.floor((deviceInfo.dock.work_osd?.acc_time % 2592000) / 86400) }}d </span>
                    <span v-if="(deviceInfo.dock.work_osd?.acc_time % 2592000 % 86400) >= 3600"> {{ Math.floor((deviceInfo.dock.work_osd?.acc_time % 2592000 % 86400) / 3600) }}h </span>
                    <span v-if="(deviceInfo.dock.work_osd?.acc_time % 2592000 % 86400 % 3600) >= 60"> {{ Math.floor((deviceInfo.dock.work_osd?.acc_time % 2592000 % 86400 % 3600) / 60) }}min </span>
                    <span>{{ Math.floor(deviceInfo.dock.work_osd?.acc_time % 2592000 % 86400 % 3600 % 60) }} s</span>
                  </span>
                </a-tooltip>
              </a-col>
              <a-col span="12">
                <a-tooltip title="Activation time">
                  <span><FieldTimeOutlined /></span>
                  <span class="ml10">{{ new Date((deviceInfo.dock.work_osd?.activation_time ?? 0) * 1000).toLocaleString() }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Network State">
                  <span :style="qualityStyle">
                    <span v-if="deviceInfo.dock.basic_osd?.network_state?.type === NetworkStateTypeEnum.FOUR_G"><SignalFilled /></span>
                    <span v-else><GlobalOutlined /></span>
                  </span>
                  <span class="ml10" >{{ deviceInfo.dock.basic_osd?.network_state?.rate }} kb/s</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="The total number of times the dock has performed missions.">
                  <span><CarryOutOutlined /></span>
                  <span class="ml10" >{{ deviceInfo.dock.work_osd?.job_number }} </span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Media File Remain Upload">
                  <span><CloudUploadOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.dock.link_osd?.media_file_detail?.remain_upload }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip>
                  <template #title>
                    <p>total: {{ deviceInfo.dock.basic_osd?.storage?.total }}</p>
                    <p>used: {{ deviceInfo.dock.basic_osd?.storage?.used  }}</p>
                  </template>
                  <span><FolderOpenOutlined /></span>
                  <span class="ml10" v-if="deviceInfo.dock.basic_osd?.storage?.total > 0">
                    <a-progress type="circle" :width="20" :percent="deviceInfo.dock.basic_osd?.storage?.used * 100/ deviceInfo.dock.basic_osd?.storage?.total"
                      :strokeWidth="20" :showInfo="false" :strokeColor="deviceInfo.dock.basic_osd?.storage?.used * 100 / deviceInfo.dock.basic_osd?.storage?.total > 80 ? 'red' : '#00ee8b' "/>
                  </span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Wind Speed">
                  <span>W.S</span>
                  <span class="ml10">{{ (deviceInfo.dock.basic_osd?.wind_speed ?? str) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Rainfall">
                  <span>🌧</span>
                  <span class="ml10">{{ RainfallEnum[deviceInfo.dock.basic_osd?.rainfall] }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Environment Temperature">
                  <span>°C</span>
                  <span class="ml10">{{ deviceInfo.dock.basic_osd?.environment_temperature }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Dock Temperature">
                  <span>°C</span>
                  <span class="ml10">{{ deviceInfo.dock.basic_osd?.temperature }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Dock Humidity">
                  <span>💦</span>
                  <span class="ml10">{{ deviceInfo.dock.basic_osd?.humidity }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Working Voltage">
                  <span style="border: 1px solid; border-radius: 50%; width: 18px; height: 18px; line-height: 16px; text-align: center; float: left;">V</span>
                  <span class="ml10">{{ (deviceInfo.dock.work_osd?.working_voltage ?? str) + ' mV' }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Working Current">
                  <span style="border: 1px solid; border-radius: 50%; width: 18px; height: 18px; line-height: 15px; text-align: center; float: left;" >A</span>
                  <span class="ml10">{{ (deviceInfo.dock.work_osd?.working_current ?? str) + ' mA' }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Drone in dock">
                  <span><RocketOutlined /></span>
                  <span class="ml10">{{ deviceInfo.dock.basic_osd?.drone_in_dock }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row class="p5">
              <a-col span="24">
                <a-button type="primary" :disabled="dockControlPanelVisible" size="small" @click="setDockControlPanelVisible(true)">
                  Actions
                </a-button>
              </a-col>
            </a-row>
            <!-- 机场控制面板 -->
            <DockControlPanel v-if="dockControlPanelVisible" :sn="osdVisible.gateway_sn"  :deviceInfo="deviceInfo" @close-control-panel="onCloseControlPanel">
            </DockControlPanel>
        </div>
      </div>
      <!--  飞机-->
      <div class="flex-display">
        <div class="flex-column flex-align-stretch flex-justify-center" style="width: 60px;  background: #2d2d2d;">
          <a-tooltip :title="osdVisible.model">
            <div style="width: 90%;" class="flex-column flex-align-center flex-justify-center">
              <span><a-image :src="M30" :preview="false"/></span>
              <span>M30</span>
            </div>
          </a-tooltip>
        </div>
        <div class="osd flex-1">
            <a-row>
              <a-col span="16" :style="!deviceInfo.device || deviceInfo.device?.mode_code === EModeCode.Disconnected ? 'color: red; font-weight: 700;': 'color: rgb(25,190,107)'">
                {{ !deviceInfo.device ? EModeCode[EModeCode.Disconnected] : EModeCode[deviceInfo.device?.mode_code] }}
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Upward Quality">
                  <span><SignalFilled /><ArrowUpOutlined style="font-size: 9px; vertical-align: top;" /></span>
                  <span class="ml10">{{ deviceInfo.dock.link_osd?.sdr?.up_quality }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Downward Quality">
                  <span><SignalFilled /><ArrowDownOutlined style="font-size: 9px; vertical-align: top;" /></span>
                  <span class="ml10">{{ deviceInfo.dock.link_osd?.sdr?.down_quality }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Drone Battery Level">
                  <span><ThunderboltOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.device && deviceInfo.device.battery.capacity_percent !== str ? deviceInfo.device?.battery.capacity_percent + ' %' : str }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip>
                  <template #title>
                    <p>total: {{ deviceInfo.device?.storage?.total }}</p>
                    <p>used: {{ deviceInfo.device?.storage?.used  }}</p>
                  </template>
                  <span><FolderOpenOutlined /></span>
                  <span class="ml10" v-if="deviceInfo.device?.storage?.total > 0">
                    <a-progress type="circle" :width="20" :percent="deviceInfo.device?.storage?.used * 100/ deviceInfo.device?.storage?.total"
                      :strokeWidth="20" :showInfo="false" :strokeColor="deviceInfo.device?.storage?.used * 100 / deviceInfo.device?.storage?.total > 80 ? 'red' : '#00ee8b' "/>
                  </span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-tooltip title="RTK Fixed">
                <a-col span="6" class="flex-row flex-align-center flex-justify-start">
                  <span>Fixed</span>
                  <span class="ml10 circle" :style="deviceInfo.device?.position_state.is_fixed === 1 ? 'backgroud: rgb(25,190,107);' : ' background: red;'"/>
                </a-col>
              </a-tooltip>
              <a-col span="6">
                <a-tooltip title="GPS">
                  <span>GPS</span>
                  <span class="ml10">{{ deviceInfo.device ? deviceInfo.device.position_state.gps_number : str }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="RTK">
                  <span><TrademarkOutlined class="fz14"/></span>
                  <span class="ml10">{{ deviceInfo.device ? deviceInfo.device.position_state.rtk_number : str }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Flight Mode">
                  <span><ControlOutlined class="fz16" /></span>
                  <span class="ml10">{{ deviceInfo.device ? EGear[deviceInfo.device?.gear] : str }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Altitude above sea level">
                  <span>ASL</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device.height === str ? str : deviceInfo.device?.height.toFixed(2) + ' m'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Altitude above takeoff level">
                  <span>ALT</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device.elevation === str ? str : deviceInfo.device?.elevation.toFixed(2) + ' m' }}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Distance to Home Point">
                  <span style="border: 1px solid; border-radius: 50%; width: 18px; height: 18px; line-height: 15px; text-align: center;  display: block; float: left;" >H</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device.home_distance === str ? str : deviceInfo.device?.home_distance.toFixed(2) + ' m' }}</span>
                </a-tooltip>
              </a-col>
            </a-row>
            <a-row>
              <a-col span="6">
                <a-tooltip title="Horizontal Speed">
                  <span>H.S</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device?.horizontal_speed === str ? str : deviceInfo.device?.horizontal_speed.toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Vertical Speed">
                  <span>V.S</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device.vertical_speed === str ? str : deviceInfo.device?.vertical_speed.toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
              <a-col span="6">
                <a-tooltip title="Wind Speed">
                  <span>W.S</span>
                  <span class="ml10">{{ !deviceInfo.device || deviceInfo.device.wind_speed === str ? str : (deviceInfo.device?.wind_speed / 10).toFixed(2) + ' m/s'}}</span>
                </a-tooltip>
              </a-col>
            </a-row>
        </div>
      </div>
      <div class="battery-slide" v-if="deviceInfo.device && deviceInfo.device.battery.remain_flight_time !== 0" style="border: 1px solid red">
        <div style="background: #535759;" class="width-100"/>
        <div class="capacity-percent" :style="{ width: deviceInfo.device.battery.capacity_percent + '%'}"/>
        <div class="return-home" :style="{ width: deviceInfo.device.battery.return_home_power + '%'}"/>
        <div class="landing" :style="{ width: deviceInfo.device.battery.landing_power + '%'}"/>
        <div class="white-point" :style="{ left: deviceInfo.device.battery.landing_power + '%'}"/>
        <div class="battery" :style="{ left: deviceInfo.device.battery.capacity_percent + '%' }">
          {{ Math.floor(deviceInfo.device.battery.remain_flight_time / 60) }}:
          {{ 10 > (deviceInfo.device.battery.remain_flight_time % 60) ? '0' : ''}}{{deviceInfo.device.battery.remain_flight_time % 60 }}
        </div>
      </div>
      <!-- 飞行指令 -->
      <DroneControlPanel :sn="osdVisible.gateway_sn" :deviceInfo="deviceInfo" :payloads="osdVisible.payloads"></DroneControlPanel>
    </div>
    <!-- liveview -->
    <div class="liveview" v-if="livestreamOthersVisible" v-drag-window  >
      <div style="height: 40px; width: 100%" class="drag-title"></div>
      <a style="position: absolute; right: 10px; top: 10px; font-size: 16px; color: white;" @click="closeLivestreamOthers"><CloseOutlined /></a>
      <LivestreamOthers />
    </div>
    <div class="liveview" v-if="livestreamAgoraVisible" v-drag-window  >
      <div style="height: 40px; width: 100%" class="drag-title"></div>
      <a style="position: absolute; right: 10px; top: 10px; font-size: 16px; color: white;" @click="closeLivestreamAgora"><CloseOutlined /></a>
      <LivestreamAgora />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch, Ref } from 'vue'
import * as Cesium from 'cesium'
import {
  generateLineContent,
  generatePointContent,
  generatePolyContent
} from '../utils/map-layer-utils'
import { postElementsReq } from '/@/api/layer'
import { MapDoodleType, MapElementEnum } from '/@/constants/map'
import { useCesiumMapManage } from '/@/hooks/use-cesium-map'
import { useCesiumCover } from '/@/hooks/use-cesium-cover'
import { useCesiumMouseTool } from '/@/hooks/use-cesium-mouse-tool'
import { getApp, getRoot } from '/@/root'
import { useMyStore } from '/@/store'
import { GeojsonCoordinate } from '/@/types/map'
import { MapDoodleEnum } from '/@/types/map-enum'
import { PostElementsBody } from '/@/types/mapLayer'
import { uuidv4 } from '/@/utils/uuid'
import { gcj02towgs84, wgs84togcj02 } from '/@/vendors/coordtransform'
import { deviceTsaUpdate } from '/@/hooks/use-cesium-tsa'
import {
  DeviceOsd, DeviceStatus, DockOsd, EGear, EModeCode, GatewayOsd, EDockModeCode,
  NetworkStateQualityEnum, NetworkStateTypeEnum, RainfallEnum, DroneInDockEnum
} from '/@/types/device'
import pin from '/@/assets/icons/pin-2d8cf0.svg'
import M30 from '/@/assets/icons/m30.png'
import {
  BorderOutlined, LineOutlined, CloseOutlined, ControlOutlined, TrademarkOutlined, ArrowDownOutlined,
  ThunderboltOutlined, SignalFilled, GlobalOutlined, HistoryOutlined, CloudUploadOutlined, RocketOutlined,
  FieldTimeOutlined, CloudOutlined, CloudFilled, FolderOpenOutlined, RobotFilled, ArrowUpOutlined, CarryOutOutlined
} from '@ant-design/icons-vue'
import { EDeviceTypeName } from '../types'
import DockControlPanel from './g-map/DockControlPanel.vue'
import { useDockControl } from './g-map/use-dock-control'
import DroneControlPanel from './g-map/DroneControlPanel.vue'
import { useConnectMqtt } from './g-map/use-connect-mqtt'
import LivestreamOthers from './livestream-others.vue'
import LivestreamAgora from './livestream-agora.vue'
import FlightAreaActionIcon from './flight-area/FlightAreaActionIcon.vue'
import { EFlightAreaType } from '../types/flight-area'
import { useFlightArea } from './flight-area/use-flight-area'
import { useFlightAreaDroneLocationEvent } from './flight-area/use-flight-area-drone-location-event'
import { useRoute } from 'vue-router'

export default defineComponent({
  components: {
    BorderOutlined,
    LineOutlined,
    CloseOutlined,
    ControlOutlined,
    TrademarkOutlined,
    ThunderboltOutlined,
    SignalFilled,
    GlobalOutlined,
    HistoryOutlined,
    CloudUploadOutlined,
    FieldTimeOutlined,
    CloudOutlined,
    CloudFilled,
    FolderOpenOutlined,
    RobotFilled,
    ArrowUpOutlined,
    ArrowDownOutlined,
    DockControlPanel,
    DroneControlPanel,
    CarryOutOutlined,
    RocketOutlined,
    LivestreamOthers,
    LivestreamAgora,
    FlightAreaActionIcon,
  },
  name: 'CesiumMap',
  props: {
    waylineEditMode: {
      type: Boolean,
      default: false
    },
    waypoints: {
      type: Array,
      default: () => []
    },
    scanPath: {
      type: Array,
      default: () => []
    },
    boundaryPoints: {
      type: Array,
      default: () => []
    },
    routeType: {
      type: String,
      default: 'waypoint'
    },
    dsmMaps: {
      type: Array,
      default: () => []
    },
    activeDsmMapId: {
      type: String,
      default: ''
    }
  },
  emits: ['map-click', 'update:waypoints', 'drawing-end', 'dsm-loaded', 'dsm-error'],
  setup (props: any, { emit }: any) {
    const route = useRoute()
    const useCesiumMouseToolHook = useCesiumMouseTool()
    const useCesiumMapManageHook = useCesiumMapManage()
    const deviceTsaUpdateHook = deviceTsaUpdate()
    const root = getRoot()

    const cesiumViewer = inject<Ref<Cesium.Viewer | null>>('cesiumViewer') || ref(null)

    const mouseMode = ref(false)
    const store = useMyStore()
    const state = reactive({
      currentType: '',
      coverIndex: 0,
      isFlightArea: false,
    })
    const str: string = '--'
    const deviceInfo = reactive({
      gateway: {
        capacity_percent: str,
        transmission_signal_quality: str,
      } as GatewayOsd,
      dock: {

      } as DockOsd,
      device: {
        gear: -1,
        mode_code: EModeCode.Disconnected,
        height: str,
        home_distance: str,
        horizontal_speed: str,
        vertical_speed: str,
        wind_speed: str,
        wind_direction: str,
        elevation: str,
        position_state: {
          gps_number: str,
          is_fixed: 0,
          rtk_number: str
        },
        battery: {
          capacity_percent: str,
          landing_power: str,
          remain_flight_time: 0,
          return_home_power: str,
        },
        latitude: 0,
        longitude: 0,
      } as DeviceOsd
    })
    const shareId = computed(() => {
      return store.state.layerBaseInfo.share
    })
    const defaultId = computed(() => {
      return store.state.layerBaseInfo.default
    })
    const drawVisible = computed(() => {
      return store.state.drawVisible
    })
    const livestreamOthersVisible = computed(() => {
      return store.state.livestreamOthersVisible
    })
    const livestreamAgoraVisible = computed(() => {
      return store.state.livestreamAgoraVisible
    })
    const osdVisible = computed(() => {
      return store.state.osdVisible
    })
    const qualityStyle = computed(() => {
      if (deviceInfo.dock.basic_osd?.network_state?.type === NetworkStateTypeEnum.ETHERNET ||
        (deviceInfo.dock.basic_osd?.network_state?.quality || 0) > NetworkStateQualityEnum.FAIR) {
        return 'color: #00ee8b'
      }
      if ((deviceInfo.dock.basic_osd?.network_state?.quality || 0) === NetworkStateQualityEnum.FAIR) {
        return 'color: yellow'
      }
      return 'color: red'
    })
    watch(() => store.state.deviceStatusEvent,
      data => {
        if (Object.keys(data.deviceOnline).length !== 0) {
          deviceTsaUpdateHook.initMarker(data.deviceOnline.domain, data.deviceOnline.device_callsign, data.deviceOnline.sn)
          store.state.deviceStatusEvent.deviceOnline = {} as DeviceStatus
        }
        if (Object.keys(data.deviceOffline).length !== 0) {
          deviceTsaUpdateHook.removeMarker(data.deviceOffline.sn)
          if ((data.deviceOffline.sn === osdVisible.value.sn) || (osdVisible.value.is_dock && data.deviceOffline.sn === osdVisible.value.gateway_sn)) {
            osdVisible.value.visible = false
            store.commit('SET_OSD_VISIBLE_INFO', osdVisible)
          }
          store.state.deviceStatusEvent.deviceOffline = {}
        }
      },
      {
        deep: true
      }
    )

    watch(() => store.state.deviceState, data => {
      if (data.currentType === EDeviceTypeName.Gateway && data.gatewayInfo[data.currentSn]) {
        const coordinate = wgs84togcj02(data.gatewayInfo[data.currentSn].longitude, data.gatewayInfo[data.currentSn].latitude)
        deviceTsaUpdateHook.moveTo(data.currentSn, coordinate[0], coordinate[1])
        if (osdVisible.value.visible && osdVisible.value.gateway_sn !== '') {
          deviceInfo.gateway = data.gatewayInfo[osdVisible.value.gateway_sn]
        }
      }
      if (data.currentType === EDeviceTypeName.Aircraft && data.deviceInfo[data.currentSn]) {
        const coordinate = wgs84togcj02(data.deviceInfo[data.currentSn].longitude, data.deviceInfo[data.currentSn].latitude)
        deviceTsaUpdateHook.moveTo(data.currentSn, coordinate[0], coordinate[1])
        if (osdVisible.value.visible && osdVisible.value.sn !== '') {
          deviceInfo.device = data.deviceInfo[osdVisible.value.sn]
        }
      }
      if (data.currentType === EDeviceTypeName.Dock && data.dockInfo[data.currentSn]) {
        const coordinate = wgs84togcj02(data.dockInfo[data.currentSn].basic_osd?.longitude, data.dockInfo[data.currentSn].basic_osd?.latitude)
        deviceTsaUpdateHook.initMarker(EDeviceTypeName.Dock, EDeviceTypeName[EDeviceTypeName.Dock], data.currentSn, coordinate[0], coordinate[1])
        if (osdVisible.value.visible && osdVisible.value.is_dock && osdVisible.value.gateway_sn !== '') {
          deviceInfo.dock = data.dockInfo[osdVisible.value.gateway_sn]
          deviceInfo.device = data.deviceInfo[deviceInfo.dock.basic_osd.sub_device?.device_sn ?? osdVisible.value.sn]
        }
      }
    }, {
      deep: true
    })

    watch(
      () => store.state.wsEvent,
      newData => {
        const useCesiumCoverHook = useCesiumCover()
        const event = newData
        let exist = false
        if (Object.keys(event.mapElementCreat).length !== 0) {
          console.log(event.mapElementCreat)
          const ele = event.mapElementCreat
          store.state.Layers.forEach(layer => {
            layer.elements.forEach(e => {
              if (e.id === ele.id) {
                exist = true
                console.log('true')
              }
            })
          })
          if (exist === false) {
            setLayers({
              id: ele.id,
              name: ele.name,
              resource: ele.resource
            })

            updateCoordinates('wgs84-gcj02', ele)
            const data = { id: ele.id, name: ele.name }
            if (MapElementEnum.PIN === ele.resource?.type) {
              useCesiumCoverHook.init2DPin(
                ele.name,
                ele.resource.content.geometry.coordinates,
                ele.resource.content.properties.color,
                data
              )
            } else if (MapElementEnum.LINE === ele.resource?.type) {
              useCesiumCoverHook.initPolyline(
                ele.name,
                ele.resource.content.geometry.coordinates,
                ele.resource.content.properties.color,
                data
              )
            } else if (MapElementEnum.POLY === ele.resource?.type) {
              useCesiumCoverHook.initPolygon(
                ele.name,
                ele.resource.content.geometry.coordinates,
                ele.resource.content.properties.color,
                data
              )
            }
          }

          store.state.wsEvent.mapElementCreat = {}
        }
        if (Object.keys(event.mapElementUpdate).length !== 0) {
          console.log(event.mapElementUpdate)
          console.log('该功能还未实现，请开发商自己增加')
          store.state.wsEvent.mapElementUpdate = {}
        }
        if (Object.keys(event.mapElementDelete).length !== 0) {
          console.log(event.mapElementDelete)
          console.log('该功能还未实现，请开发商自己增加')
          store.state.wsEvent.mapElementDelete = {}
        }
      },
      {
        deep: true
      }
    )

    function draw (type: MapDoodleType, bool: boolean, flightAreaType?: EFlightAreaType) {
      state.currentType = type
      mouseMode.value = bool
      state.isFlightArea = !!flightAreaType
      useCesiumMouseToolHook.mouseTool(type, getDrawCallback, flightAreaType)
    }

    // dock 控制面板
    const {
      dockControlPanelVisible,
      setDockControlPanelVisible,
      onCloseControlPanel,
    } = useDockControl()

    // 连接或断开drc
    useConnectMqtt()

    onMounted(() => {
      nextTick(() => {
        initCesiumViewer()
      })
    })

    watch(() => route.path, () => {
      nextTick(() => {
        ensureCesiumViewer()
      })
    })

    function ensureCesiumViewer () {
      const app = getApp()
      const existingViewer = app?.config.globalProperties.$cesiumViewer

      if (existingViewer && !existingViewer.isDestroyed()) {
        console.log('Cesium Viewer exists on route change')
        cesiumViewer.value = existingViewer
        return
      }

      console.log('Cesium Viewer missing on route change, reinitializing...')
      initCesiumViewer()
    }

    function initCesiumViewer () {
      const app = getApp()
      const existingViewer = app?.config.globalProperties.$cesiumViewer

      if (existingViewer && !existingViewer.isDestroyed()) {
        console.log('Cesium Viewer already exists:', existingViewer)
        cesiumViewer.value = existingViewer
        useCesiumMapManageHook.globalPropertiesConfig(app)
        return
      }

      if (cesiumViewer.value && !cesiumViewer.value.isDestroyed()) {
        console.log('Cesium Viewer from inject:', cesiumViewer.value)
        useCesiumMapManageHook.globalPropertiesConfig(app)
        return
      }

      console.log('Initializing Cesium Viewer...')
      const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''
      Cesium.Ion.defaultAccessToken = cesiumToken

      const tiandituKey = import.meta.env.VITE_TIANDITU_KEY || ''

      const container = document.getElementById('cesium-container')
      if (!container) {
        console.error('Cesium container not found, retrying...')
        setTimeout(initCesiumViewer, 50)
        return
      }

      if (container.children.length > 0) {
        console.log('Cesium container already has content, viewer may exist')
        return
      }

      const viewer = new Cesium.Viewer('cesium-container', {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: false,
        baseLayer: false,
        terrain: cesiumToken ? Cesium.Terrain.fromWorldTerrain() : undefined
      })

      if (tiandituKey) {
        const imgProvider = new Cesium.UrlTemplateImageryProvider({
          url: `https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${tiandituKey}`,
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maximumLevel: 18
        })
        viewer.imageryLayers.addImageryProvider(imgProvider)

        const ciaProvider = new Cesium.UrlTemplateImageryProvider({
          url: `https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${tiandituKey}`,
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maximumLevel: 18
        })
        viewer.imageryLayers.addImageryProvider(ciaProvider)
      } else {
        const osmProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/'
        })
        viewer.imageryLayers.addImageryProvider(osmProvider)
      }

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(113.943225499, 22.577673716, 1000),
      })
      cesiumViewer.value = viewer
      console.log('Cesium Viewer initialized:', viewer)
      if (app) {
        app.config.globalProperties.$cesiumViewer = viewer
      }
      useCesiumMapManageHook.globalPropertiesConfig(app)
    }

    // 航线编辑相关实体管理
    const waylineEntities = ref<Cesium.Entity[]>([])
    const scanPathEntities = ref<Cesium.Entity[]>([])
    const boundaryEntities = ref<Cesium.Entity[]>([])

    // DSM 地图相关
    const dsmTilesets = ref<Map<string, Cesium.Cesium3DTileset>>(new Map())
    const dsmTerrains = ref<Map<string, Cesium.TerrainProvider>>(new Map())

    // 清除航线相关实体
    const clearWaylineEntities = () => {
      if (!cesiumViewer.value) return
      waylineEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      waylineEntities.value = []
      scanPathEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      scanPathEntities.value = []
      boundaryEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      boundaryEntities.value = []
    }

    // 加载 DSM 3D Tiles
    const loadDsm3DTiles = async (mapId: string, tilesetUrl: string) => {
      if (!cesiumViewer.value) return null

      try {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
          maximumScreenSpaceError: 16,
          maximumMemoryUsage: 512,
        })

        cesiumViewer.value.scene.primitives.add(tileset)
        dsmTilesets.value.set(mapId, tileset)

        tileset.readyPromise.then(() => {
          emit('dsm-loaded', { mapId, type: '3dtiles' })
        }).catch((error: any) => {
          emit('dsm-error', { mapId, error })
        })

        return tileset
      } catch (error) {
        emit('dsm-error', { mapId, error })
        return null
      }
    }

    // 移除 DSM 地图
    const removeDsmMap = (mapId: string) => {
      if (!cesiumViewer.value) return

      const tileset = dsmTilesets.value.get(mapId)
      if (tileset) {
        cesiumViewer.value.scene.primitives.remove(tileset)
        dsmTilesets.value.delete(mapId)
      }

      const terrain = dsmTerrains.value.get(mapId)
      if (terrain) {
        dsmTerrains.value.delete(mapId)
      }
    }

    // 定位到 DSM 地图
    const flyToDsmMap = async (map: any) => {
      if (!cesiumViewer.value) return

      if (map.center_longitude && map.center_latitude) {
        cesiumViewer.value.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            map.center_longitude,
            map.center_latitude,
            1000
          ),
          duration: 1.5
        })
      }
    }

    // 加载所有 DSM 地图
    const loadAllDsmMaps = async () => {
      if (!cesiumViewer.value) return

      const maps = props.dsmMaps as any[]
      for (const map of maps) {
        if (map.status === 1 && map.object_key) {
          const tilesetUrl = `${import.meta.env.VITE_OSS_ENDPOINT || ''}/${map.object_key}`
          await loadDsm3DTiles(map.id, tilesetUrl)
        }
      }
    }

    // 监听 DSM 地图列表变化
    watch(() => props.dsmMaps, (newMaps, oldMaps) => {
      if (!cesiumViewer.value) return

      const newMapIds = new Set((newMaps as any[]).map((m: any) => m.id))
      const oldMapIds = new Set((oldMaps as any[])?.map((m: any) => m.id) || [])

      oldMapIds.forEach((mapId: string) => {
        if (!newMapIds.has(mapId)) {
          removeDsmMap(mapId)
        }
      })

      ;(newMaps as any[]).forEach((map: any) => {
        if (!oldMapIds.has(map.id) && map.status === 1 && map.object_key) {
          const tilesetUrl = `${import.meta.env.VITE_OSS_ENDPOINT || ''}/${map.object_key}`
          loadDsm3DTiles(map.id, tilesetUrl)
        }
      })
    }, { deep: true })

    // 监听活动 DSM 地图变化
    watch(() => props.activeDsmMapId, (newId, oldId) => {
      if (oldId) {
        removeDsmMap(oldId)
      }
      if (newId) {
        const map = (props.dsmMaps as any[]).find((m: any) => m.id === newId)
        if (map && map.status === 1 && map.object_key) {
          const tilesetUrl = `${import.meta.env.VITE_OSS_ENDPOINT || ''}/${map.object_key}`
          loadDsm3DTiles(newId, tilesetUrl).then(() => {
            flyToDsmMap(map)
          })
        }
      }
    })

    // 渲染航点
    const renderWaypoints = () => {
      if (!cesiumViewer.value) return

      // 清除旧的航点实体
      waylineEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      waylineEntities.value = []

      const waypoints = props.waypoints as any[]
      if (!waypoints || waypoints.length === 0) return

      // 添加航点标记
      waypoints.forEach((wp, index) => {
        const entity = cesiumViewer.value!.entities.add({
          position: Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat, wp.height || 50),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#3498db'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.NONE
          },
          label: {
            text: `${index + 1}`,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15)
          }
        })
        waylineEntities.value.push(entity)
      })

      // 添加航线连接线
      if (waypoints.length >= 2) {
        const positions = waypoints.map(wp =>
          Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat, wp.height || 50)
        )
        const polyline = cesiumViewer.value!.entities.add({
          polyline: {
            positions: positions,
            width: 3,
            material: Cesium.Color.fromCssColorString('#3498db'),
            clampToGround: false
          }
        })
        waylineEntities.value.push(polyline)
      }
    }

    // 渲染扫描路径
    const renderScanPath = () => {
      if (!cesiumViewer.value) return

      // 清除旧的扫描路径实体
      scanPathEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      scanPathEntities.value = []

      const scanPath = props.scanPath as any[]
      if (!scanPath || scanPath.length === 0) return

      // 添加扫描路径点
      scanPath.forEach((wp, index) => {
        const entity = cesiumViewer.value!.entities.add({
          position: Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat, wp.height || 50),
          point: {
            pixelSize: 6,
            color: Cesium.Color.fromCssColorString('#2ecc71'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.NONE
          }
        })
        scanPathEntities.value.push(entity)
      })

      // 添加扫描路径连接线
      if (scanPath.length >= 2) {
        const positions = scanPath.map(wp =>
          Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat, wp.height || 50)
        )
        const polyline = cesiumViewer.value!.entities.add({
          polyline: {
            positions: positions,
            width: 2,
            material: Cesium.Color.fromCssColorString('#2ecc71'),
            clampToGround: false
          }
        })
        scanPathEntities.value.push(polyline)
      }
    }

    // 渲染边界多边形
    const renderBoundary = () => {
      if (!cesiumViewer.value) return

      // 清除旧的边界实体
      boundaryEntities.value.forEach(entity => {
        cesiumViewer.value?.entities.remove(entity)
      })
      boundaryEntities.value = []

      const boundaryPoints = props.boundaryPoints as any[]
      const waypoints = props.waypoints as any[]
      const points = (props.routeType === 'mapping' || props.routeType === 'patrol') ? boundaryPoints : waypoints

      if (!points || points.length < 3) return

      // 添加多边形
      const positions = points.map(p =>
        Cesium.Cartesian3.fromDegrees(p.lng, p.lat, (p.height || 50) + 1)
      )
      const polygon = cesiumViewer.value!.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: Cesium.Color.fromCssColorString('#3498db').withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#3498db'),
          outlineWidth: 2,
          height: 0,
          heightReference: Cesium.HeightReference.NONE
        }
      })
      boundaryEntities.value.push(polygon)
    }

    // 监听航点变化
    watch(() => props.waypoints, () => {
      renderWaypoints()
      renderBoundary()
    }, { deep: true })

    // 监听扫描路径变化
    watch(() => props.scanPath, () => {
      renderScanPath()
    }, { deep: true })

    // 监听边界点变化
    watch(() => props.boundaryPoints, () => {
      renderBoundary()
    }, { deep: true })

    // 监听航线编辑模式
    watch(() => props.waylineEditMode, (newVal) => {
      if (newVal) {
        // 进入航线编辑模式，添加地图点击事件
        addWaylineClickHandler()
      } else {
        // 退出航线编辑模式，移除点击事件
        removeWaylineClickHandler()
      }
    })

    let waylineClickHandler: Cesium.ScreenSpaceEventHandler | null = null

    // 添加航线编辑点击处理
    const addWaylineClickHandler = () => {
      if (!cesiumViewer.value) return

      removeWaylineClickHandler()

      waylineClickHandler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.value.scene.canvas)
      // 左键点击添加航点
      waylineClickHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const cartesian = cesiumViewer.value!.camera.pickEllipsoid(event.position, cesiumViewer.value!.scene.globe.ellipsoid)
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
          const lng = Cesium.Math.toDegrees(cartographic.longitude)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          emit('map-click', { lat, lng })
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      // 右键点击结束绘制
      waylineClickHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        emit('drawing-end')
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }

    // 移除航线编辑点击处理
    const removeWaylineClickHandler = () => {
      if (waylineClickHandler) {
        waylineClickHandler.destroy()
        waylineClickHandler = null
      }
    }

    onUnmounted(() => {
      console.log('CesiumMap unmounted')
      // 销毁鼠标事件
      useCesiumMouseToolHook.mouseTool('off', () => {})
      // 销毁航线编辑点击处理
      removeWaylineClickHandler()
      // 清除航线实体
      clearWaylineEntities()
      // 清除 DSM 地图
      dsmTilesets.value.forEach((tileset, mapId) => {
        removeDsmMap(mapId)
      })
      dsmTilesets.value.clear()
      dsmTerrains.value.clear()

      // 销毁 Cesium Viewer
      const app = getApp()
      if (app?.config.globalProperties.$cesiumViewer) {
        try {
          app.config.globalProperties.$cesiumViewer.destroy()
          console.log('Cesium Viewer destroyed on unmount')
        } catch (e) {
          console.warn('Error destroying Cesium Viewer:', e)
        }
        app.config.globalProperties.$cesiumViewer = null
      }
      if (cesiumViewer.value) {
        cesiumViewer.value = null
      }
    })

    const { getDrawFlightAreaCallback, onFlightAreaDroneLocationWs } = useFlightArea()
    useFlightAreaDroneLocationEvent(onFlightAreaDroneLocationWs)

    function selectFlightAreaAction ({ type, isCircle }: { type: EFlightAreaType, isCircle: boolean }) {
      draw(isCircle ? MapDoodleEnum.CIRCLE : MapDoodleEnum.POLYGON, true, type)
    }

    function getDrawCallback ({ obj }: { obj : any }) {
      if (state.isFlightArea) {
        getDrawFlightAreaCallback(obj)
        return
      }
      switch (state.currentType) {
        case MapDoodleEnum.PIN:
          postPinPositionResource(obj)
          break
        case MapDoodleEnum.POLYLINE:
          postPolylineResource(obj)
          break
        case MapDoodleEnum.POLYGON:
          postPolygonResource(obj)
          break
        default:
          break
      }
    }
    async function postPinPositionResource (obj) {
      const req = getPinPositionResource(obj)
      setLayers(req)
      const coordinates = req.resource.content.geometry.coordinates
      updateCoordinates('gcj02-wgs84', req);
      (req.resource.content.geometry.coordinates as GeojsonCoordinate).push((coordinates as GeojsonCoordinate)[2])
      const result = await postElementsReq(shareId.value, req)
      if (obj.setExtData) {
        obj.setExtData({ id: req.id, name: req.name })
      }
      store.state.coverMap[req.id] = [obj]
    }
    async function postPolylineResource (obj) {
      const req = getPolylineResource(obj)
      setLayers(req)
      updateCoordinates('gcj02-wgs84', req)
      const result = await postElementsReq(shareId.value, req)
      if (obj.setExtData) {
        obj.setExtData({ id: req.id, name: req.name })
      }
      store.state.coverMap[req.id] = [obj]
    }
    async function postPolygonResource (obj) {
      const req = getPoygonResource(obj)
      setLayers(req)
      updateCoordinates('gcj02-wgs84', req)
      const result = await postElementsReq(shareId.value, req)
      if (obj.setExtData) {
        obj.setExtData({ id: req.id, name: req.name })
      }
      store.state.coverMap[req.id] = [obj]
    }

    function getPinPositionResource (obj) {
      const position = obj.position ? { lng: obj.position[0], lat: obj.position[1], KL: 0, className: '', kT: 0 } : obj.getPosition()
      const resource = generatePointContent(position)
      const name = obj.name || obj._originOpts?.title || 'pin'
      const id = uuidv4()
      return {
        id,
        name,
        resource
      }
    }
    function getPolylineResource (obj) {
      const path = obj.coordinates ? obj.coordinates.map((c: number[]) => ({ lng: c[0], lat: c[1], KL: 0, className: '', kT: 0 })) : obj.getPath()
      const resource = generateLineContent(path)
      const name = obj.name || obj._opts?.title || 'polyline'
      const id = uuidv4()
      return {
        id,
        name,
        resource
      }
    }
    function getPoygonResource (obj) {
      const path = obj.coordinates ? obj.coordinates.map((c: number[]) => ({ lng: c[0], lat: c[1], KL: 0, className: '', kT: 0 })) : obj.getPath()
      const resource = generatePolyContent(path)
      const name = obj.name || obj._opts?.title || 'polygon'
      const id = uuidv4()
      return {
        id,
        name,
        resource
      }
    }
    function getBaseInfo (obj) {
      const name = obj.title
      const id = uuidv4()
      return { name, id }
    }
    function setLayers (resource: PostElementsBody) {
      const layers = store.state.Layers
      const layer = layers.find(item => item.id.includes(shareId.value))
      if (layer?.elements) {
        ;(layer?.elements as any[]).push(resource)
      }
      console.log('layers', layers)
      store.commit('SET_LAYER_INFO', layers)
    }
    function closeLivestreamOthers () {
      store.commit('SET_LIVESTREAM_OTHERS_VISIBLE', false)
    }
    function closeLivestreamAgora () {
      store.commit('SET_LIVESTREAM_AGORA_VISIBLE', false)
    }
    function updateCoordinates (transformType: string, element: any) {
      const geoType = element.resource?.content.geometry.type
      const type = element.resource?.type as number
      if (element.resource) {
        if (MapElementEnum.PIN === type) {
          const coordinates = element.resource?.content.geometry
            .coordinates as GeojsonCoordinate
          if (transformType === 'wgs84-gcj02') {
            const transResult = wgs84togcj02(
              coordinates[0],
              coordinates[1]
            ) as GeojsonCoordinate
            element.resource.content.geometry.coordinates = transResult
          } else if (transformType === 'gcj02-wgs84') {
            const transResult = gcj02towgs84(
              coordinates[0],
              coordinates[1]
            ) as GeojsonCoordinate
            element.resource.content.geometry.coordinates = transResult
          }
        } else if (MapElementEnum.LINE === type) {
          const coordinates = element.resource?.content.geometry
            .coordinates as GeojsonCoordinate[]
          if (transformType === 'wgs84-gcj02') {
            coordinates.forEach((coordinate, i, arr) => {
              arr[i] = wgs84togcj02(
                coordinate[0],
                coordinate[1]
              ) as GeojsonCoordinate
            })
          } else if (transformType === 'gcj02-wgs84') {
            coordinates.forEach((coordinate, i, arr) => {
              arr[i] = gcj02towgs84(
                coordinate[0],
                coordinate[1]
              ) as GeojsonCoordinate
            })
          }
          element.resource.content.geometry.coordinates = coordinates
        } else if (MapElementEnum.POLY === type) {
          const coordinates = element.resource?.content.geometry
            .coordinates[0] as GeojsonCoordinate[]
          if (transformType === 'wgs84-gcj02') {
            coordinates.forEach((coordinate, i, arr) => {
              arr[i] = wgs84togcj02(
                coordinate[0],
                coordinate[1]
              ) as GeojsonCoordinate
            })
          } else if (transformType === 'gcj02-wgs84') {
            coordinates.forEach((coordinate, i, arr) => {
              arr[i] = gcj02towgs84(
                coordinate[0],
                coordinate[1]
              ) as GeojsonCoordinate
            })
          }
          element.resource.content.geometry.coordinates = [coordinates]
        }
      }
    }
    return {
      draw,
      mouseMode,
      drawVisible,
      livestreamOthersVisible,
      livestreamAgoraVisible,
      osdVisible,
      pin,
      state,
      M30,
      deviceInfo,
      EGear,
      EModeCode,
      str,
      EDockModeCode,
      dockControlPanelVisible,
      setDockControlPanelVisible,
      onCloseControlPanel,
      NetworkStateTypeEnum,
      NetworkStateQualityEnum,
      RainfallEnum,
      DroneInDockEnum,
      closeLivestreamOthers,
      closeLivestreamAgora,
      qualityStyle,
      selectFlightAreaAction,
    }
  }
})
</script>

<style lang="scss" scoped>
.cesium-map-wrapper {
  height: 100%;
  width: 100%;

  .g-action-panel {
    position: absolute;
    top: 16px;
    right: 16px;
    .g-action-item {
      width: 28px;
      height: 28px;
      background: white;
      color: $primary;
      border-radius: 2px;
      line-height: 28px;
      text-align: center;
      margin-bottom: 2px;
    }
    .g-action-item:hover {
      border: 1px solid $primary;
      border-radius: 2px;
    }
  }
  .selection {
    border: 1px solid $primary;
    border-radius: 2px;
  }

  &:deep(.ant-btn){
    &::after {
      display: none;
    }
  }
}

.osd-panel {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 5px;
  padding: 10px;
  width: 350px;
  height: 250px;
  z-index: 1000;
  margin-bottom: 10px;

  .battery-slide {
    position: relative;
    height: 10px;
    background: #535759;
    width: 100%;
    margin-top: 5px;

    .capacity-percent {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #00ee8b;
    }

    .return-home {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #ffcc00;
    }

    .landing {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #ff3300;
    }

    .white-point {
      position: absolute;
      top: -2px;
      width: 6px;
      height: 14px;
      background: white;
    }

    .battery {
      position: absolute;
      top: -20px;
      color: white;
      font-size: 12px;
    }
  }

  .osd {
    height: 100%;
    padding: 5px;

    .circle {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-left: 5px;
    }
  }
}

.liveview {
  position: absolute;
  top: 100px;
  right: 16px;
  width: 320px;
  height: 180px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  z-index: 1000;
}

.mt10 {
  margin-top: 10px;
}

.pl5 {
  padding-left: 5px;
}

.pr5 {
  padding-right: 5px;
}

.p5 {
  padding: 5px;
}

.fz12 {
  font-size: 12px;
}

.fz14 {
  font-size: 14px;
}

.fz16 {
  font-size: 16px;
}

.fz18 {
  font-size: 18px;
}

.fz20 {
  font-size: 20px;
}

.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-align-center {
  align-items: center;
}

.flex-align-stretch {
  align-items: stretch;
}

.flex-justify-center {
  justify-content: center;
}

.flex-justify-between {
  justify-content: space-between;
}

.flex-display {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.width-100 {
  width: 100%;
}

.drag-title {
  cursor: move;
}

.ml10 {
  margin-left: 10px;
}

.wayline-edit-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(52, 152, 219, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 100;
  pointer-events: none;
}

.coord-info {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 12px;
  z-index: 100;
}
</style>
