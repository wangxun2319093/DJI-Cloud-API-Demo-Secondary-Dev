<template>
  <div class="project-flight-area-wrapper height-100">
    <a-spin :spinning="loading" :delay="300" tip="loading" size="large" class="height-100">
      <Title title="Custom Flight Area" />
      <FlightAreaPanel :data="flightAreaList" @location-area="clickArea" @delete-area="deleteAreaById"/>
      <DividerLine />
      <FlightAreaSyncPanel />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Title from '/@/components/workspace/Title.vue'
import DividerLine from '/@/components/workspace/DividerLine.vue'
import FlightAreaPanel from '/@/components/flight-area/FlightAreaPanel.vue'
import FlightAreaSyncPanel from '/@/components/flight-area/FlightAreaSyncPanel.vue'
import { GetFlightArea, deleteFlightArea, getFlightAreaList } from '/@/api/flight-area'
import { useCesiumCover } from '/@/hooks/use-cesium-cover'
import { useMapTool } from '/@/hooks/use-map-tool'
import { EFlightAreaType, EGeometryType, FlightAreaUpdate } from '/@/types/flight-area'
import { useFlightArea } from '/@/components/flight-area/use-flight-area'
import { useFlightAreaUpdateEvent } from '/@/components/flight-area/use-flight-area-update'

const loading = ref(false)
const flightAreaList = ref<GetFlightArea[]>([])
const selectedAreaId = ref<string | null>(null)
let useCesiumCoverHook = useCesiumCover()
let useMapToolHook = useMapTool()

onMounted(() => {
  getDataList()
})
const { getGcj02 } = useFlightArea()

const initMapFlightArea = () => {
  useMapToolHook = useMapTool()
  useCesiumCoverHook = useCesiumCover()
  flightAreaList.value.forEach(area => {
    if (!selectedAreaId.value || area.area_id === selectedAreaId.value) {
      updateMapFlightArea(area)
    }
  })
}

const clearAllFlightAreasFromMap = () => {
  flightAreaList.value.forEach(area => {
    useCesiumCoverHook.removeCoverFromMap(area.area_id)
  })
}

const updateMapFlightArea = (area: GetFlightArea) => {
  switch (area.content.geometry.type) {
    case EGeometryType.CIRCLE:
      useCesiumCoverHook.updateFlightAreaCircle(area.area_id, area.name, area.content.geometry.radius, getGcj02(area.content.geometry.coordinates), area.status, area.type)
      break
    case 'Polygon':
      useCesiumCoverHook.updateFlightAreaPolygon(area.area_id, area.name, getGcj02(area.content.geometry.coordinates[0]), area.status, area.type)
      break
  }
}

const getDataList = () => {
  loading.value = true
  getFlightAreaList().then(res => {
    flightAreaList.value = res.data
    setTimeout(initMapFlightArea, 2000)
  }).finally(() => {
    loading.value = false
  })
}

const deleteAreaById = (areaId: string) => {
  deleteFlightArea(areaId)
}

const deleteArea = (area: FlightAreaUpdate) => {
  flightAreaList.value = flightAreaList.value.filter(data => data.area_id !== area.area_id)
  useCesiumCoverHook.removeCoverFromMap(area.area_id)
}

const updateArea = (area: FlightAreaUpdate) => {
  flightAreaList.value = flightAreaList.value.map(data => data.area_id === area.area_id ? area : data)
  updateMapFlightArea(area as GetFlightArea)
}

const addArea = (area: FlightAreaUpdate) => {
  flightAreaList.value.push(area as GetFlightArea)
  updateMapFlightArea(area as GetFlightArea)
}

useFlightAreaUpdateEvent(addArea, deleteArea, updateArea)

const clickArea = (area: GetFlightArea) => {
  console.info(area)
  clearAllFlightAreasFromMap()
  selectedAreaId.value = area.area_id
  updateMapFlightArea(area)
  let coordinate
  switch (area.content.geometry.type) {
    case EGeometryType.CIRCLE:
      coordinate = getGcj02(area.content.geometry.coordinates)
      break
    case 'Polygon':
      coordinate = useCesiumCoverHook.calcPolygonPosition(getGcj02(area.content.geometry.coordinates[0]))
      break
  }
  useMapToolHook.panTo(coordinate)
}
</script>
