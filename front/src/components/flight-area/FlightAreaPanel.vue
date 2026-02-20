<template>
  <div class="flight-area-panel">
    <div v-if="data.length === 0">
      <a-empty :image-style="{ height: '60px', marginTop: '60px' }" />
    </div>
    <div v-else v-for="area in flightAreaList" :key="area.area_id">
      <FlightAreaItem :data="area" @delete="deleteArea" @update="updateArea" @location="clickLocation"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import FlightAreaItem from './FlightAreaItem.vue'
import { GetFlightArea } from '/@/api/flight-area'

const emit = defineEmits(['deleteArea', 'updateArea', 'locationArea'])

const props = defineProps<{
  data: GetFlightArea[]
}>()

const flightAreaList = computed(() => props.data)

const deleteArea = (areaId: string) => {
  emit('deleteArea', areaId)
}

const updateArea = (area: GetFlightArea) => {
  emit('updateArea', area)
}

const clickLocation = (areaId: string) => {
  const area = flightAreaList.value.find(a => a.area_id === areaId)
  if (area) {
    emit('locationArea', area)
  }
}
</script>

<style lang="scss" scoped>
  .flight-area-panel {
    overflow-y: auto;
    height: calc(100vh - 150px);
  }
</style>
