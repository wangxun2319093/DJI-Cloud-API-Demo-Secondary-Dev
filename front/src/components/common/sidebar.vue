<template>
  <div class="demo-project-sidebar-wrapper flex-justify-between">
    <div>
    <router-link
      v-for="item in options"
      :key="item.key"
      :to="item.path"
      :class="{
        'menu-item': true,
        selected: selectedRoute(item),
      }"
    >
      <a-tooltip :title="item.label" placement="right">
        <Icon class="fz20" style="width: 50px;" :icon="item.icon"/>
      </a-tooltip>
    </router-link>
    <div
      :class="{
        'menu-item': true,
        selected: waylineEditorVisible,
      }"
      @click="toggleWaylineEditor"
    >
      <a-tooltip title="航线编辑" placement="right">
        <Icon class="fz20" style="width: 50px;" icon="EditOutlined"/>
      </a-tooltip>
    </div>
    <div
      :class="{
        'menu-item': true,
        selected: mapDsmVisible,
      }"
      @click="toggleMapDsmEditor"
    >
      <a-tooltip title="DSM 地图管理" placement="right">
        <Icon class="fz20" style="width: 50px;" icon="GlobalOutlined"/>
      </a-tooltip>
    </div>
    </div>
    <div class="mb20 flex-display flex-column flex-align-center flex-justify-between">
      <a-tooltip title="Back to home" placement="right">
        <a @click="goHome"> <Icon icon="ImportOutlined" style="font-size: 22px; color: white"/></a>
      </a-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { createVNode, defineComponent, computed } from 'vue'
import { getRoot } from '/@/root'
import * as icons from '@ant-design/icons-vue'
import { ERouterName } from '/@/types'
import { useMyStore } from '/@/store'

interface IOptions {
  key: number
  label: string
  path:
    | string
    | {
        path: string
        query?: any
      }
  icon: string
}

const Icon = (props: {icon: string}) => {
  return createVNode((icons as any)[props.icon])
}

export default defineComponent({
  components: {
    Icon,
  },
  name: 'Sidebar',
  emits: ['toggle-wayline-editor'],
  setup (props, { emit }) {
    const root = getRoot()
    const store = useMyStore()
    const options = [
      { key: 0, label: 'Tsa', path: '/' + ERouterName.TSA, icon: 'TeamOutlined' },
      { key: 1, label: 'Livestream', path: '/' + ERouterName.LIVESTREAM, icon: 'VideoCameraOutlined' },
      { key: 2, label: 'Annotations', path: '/' + ERouterName.LAYER, icon: 'EnvironmentOutlined' },
      { key: 3, label: 'Media Files', path: '/' + ERouterName.MEDIA, icon: 'PictureOutlined' },
      { key: 4, label: 'Flight Route Library', path: '/' + ERouterName.WAYLINE, icon: 'NodeIndexOutlined' },
      { key: 5, label: 'Task Plan Library', path: '/' + ERouterName.TASK, icon: 'CalendarOutlined' },
      { key: 6, label: 'Flight Area', path: '/' + ERouterName.FLIGHT_AREA, icon: 'GroupOutlined' },
    ]

    const waylineEditorVisible = computed(() => store.state.waylineEditorVisible || false)
    const mapDsmVisible = computed(() => store.state.mapDsmVisible || false)

    function selectedRoute (item: IOptions) {
      const path = typeof item.path === 'string' ? item.path : item.path.path
      return root.$route.path?.indexOf(path) === 0
    }

    function goHome () {
      root.$router.push('/' + ERouterName.MEMBERS)
    }

    function toggleWaylineEditor () {
      if (waylineEditorVisible.value) {
        store.commit('SET_WAYLINE_EDITOR_VISIBLE', false)
        root.$router.push('/' + ERouterName.TSA)
      } else {
        store.commit('SET_WAYLINE_EDITOR_VISIBLE', true)
        root.$router.push('/' + ERouterName.EDIT_WAYLINE)
      }
    }

    function toggleMapDsmEditor () {
      if (mapDsmVisible.value) {
        store.commit('SET_MAP_DSM_VISIBLE', false)
        root.$router.push('/' + ERouterName.TSA)
      } else {
        store.commit('SET_MAP_DSM_VISIBLE', true)
        root.$router.push('/' + ERouterName.MAP_DSM)
      }
    }

    return {
      options,
      selectedRoute,
      goHome,
      waylineEditorVisible,
      toggleWaylineEditor,
      mapDsmVisible,
      toggleMapDsmEditor,
    }
  }
})
</script>

<style scoped lang="scss">
.demo-project-sidebar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
  border-right: 1px solid #4f4f4f;
  color: $text-white-basic;
  overflow: hidden;
  position: relative;
  z-index: 1001;
  background-color: #232323;
  .menu-item {
    width: 100%;
    padding: 16px 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $text-white-basic;
    cursor: pointer;
    &.selected {
      background-color: #101010;
      color: $primary;
    }
    &.disabled {
      pointer-events: none;
      opacity: 0.45;
    }
  }
  .filling {
    flex: 1;
  }

  .setting-icon {
    font-size: 24px;
    margin-bottom: 24px;
    color: $text-white-basic;
  }

}
.ant-tooltip-open {
  border: 0;
}
</style>
