## 集成方案概述

将 `/home/kyy/workspace/dji_way_line` 项目作为 `wayline` 的独立子项集成，**不修改 CesiumMap.vue 任何功能**，ControlPanel 采用抽屉方式挂载。

***

## 第一阶段：安装依赖 (0.5天)

### 1.1 新增 npm 依赖

```bash
cd /home/kyy/workspace/DJI-Cloud-API-Demo/front
pnpm add jszip fast-xml-parser
```

***

## 第二阶段：工具函数迁移 (1天)

### 2.1 创建目录结构

```
front/src/utils/waypoint/
├── geoUtils.ts           # 地理计算
├── kmzGenerator.ts       # KMZ 生成
├── kmzParser.ts          # KMZ 解析
├── polygonRouteGenerator.ts  # 面状航线
└── routePlanner.ts       # 航线规划
```

### 2.2 迁移文件清单

| 源文件                                               | 目标文件                                    | 改造内容          |
| ------------------------------------------------- | --------------------------------------- | ------------- |
| dji\_way\_line/src/utils/geoUtils.js              | utils/waypoint/geoUtils.ts              | 转为 TypeScript |
| dji\_way\_line/src/utils/kmzGenerator.js          | utils/waypoint/kmzGenerator.ts          | 转为 TypeScript |
| dji\_way\_line/src/utils/kmzParser.js             | utils/waypoint/kmzParser.ts             | 转为 TypeScript |
| dji\_way\_line/src/utils/polygonRouteGenerator.js | utils/waypoint/polygonRouteGenerator.ts | 转为 TypeScript |
| dji\_way\_line/src/utils/routePlanner.js          | utils/waypoint/routePlanner.ts          | 转为 TypeScript |

***

## 第三阶段：组件迁移 (2天)

### 3.1 创建目录结构

```
front/src/components/waypoint/
├── WaypointEditor.vue        # 主编辑页面（替代 index.vue）
├── WaypointMapViewer.vue     # 地图组件（适配 CesiumMap）
├── ControlPanel.vue          # 控制面板（抽屉方式）
├── MissionConfig.vue         # 任务配置
├── MissionLibrary.vue        # 航线库
├── WaypointList.vue          # 航点列表
├── PolygonRouteConfig.vue    # 面状航线配置
└── CreateMissionModal.vue    # 创建弹窗
```

### 3.2 核心改造：ControlPanel 抽屉化

**WaypointEditor.vue 结构：**

```vue
<template>
  <div class="waypoint-editor">
    <!-- 地图区域：复用 CesiumMap -->
    <CesiumMap ref="cesiumMapRef" />
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <a-button @click="drawerVisible = true">航线配置</a-button>
    </div>
    
    <!-- 抽屉：ControlPanel -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="航线编辑"
      placement="right"
      :width="420"
    >
      <ControlPanel
        :missionConfig="missionConfig"
        :waypoints="waypoints"
        @update:missionConfig="..."
        @generate="handleGenerateKMZ"
      />
    </a-drawer>
  </div>
</template>
```

***

## 第四阶段：路由配置 (0.5天)

### 4.1 新增路由

在 `router/index.ts` 中添加：

```typescript
{
  path: '/' + ERouterName.WAYLINE,
  name: ERouterName.WAYLINE,
  component: () => import('/@/pages/page-web/projects/wayline.vue'),
  children: [
    {
      path: 'editor',
      name: 'WaypointEditor',
      component: () => import('/@/components/waypoint/WaypointEditor.vue')
    },
    {
      path: 'library',
      name: 'WaypointLibrary',
      component: () => import('/@/components/waypoint/MissionLibrary.vue')
    }
  ]
}
```

### 4.2 修改现有 wayline.vue

保留现有航线库功能，添加入口按钮跳转到编辑器。

***

## 第五阶段：类型定义 (0.5天)

### 5.1 创建类型文件

```
front/src/types/waypoint.ts
```

定义：

* `Waypoint` 接口

* `MissionConfig` 接口

* `RouteStats` 接口

* `PolygonRouteConfig` 接口

***

## 第六阶段：状态管理 (0.5天)

### 6.1 创建 Vuex 模块

```
front/src/store/modules/waypoint.ts
```

管理：

* 航点列表

* 任务配置

* 航线库

* 编辑状态

***

## 第七阶段：集成测试 (1天)

### 7.1 功能测试清单

* [ ] 航点点击添加

* [ ] 航点拖拽编辑

* [ ] 航线可视化

* [ ] 面状航线生成

* [ ] KMZ 导出

* [ ] KMZ 导入

* [ ] 航线保存/加载

* [ ] 抽屉面板交互

***

## 文件变更总览

### 新增文件 (15个)

```
front/src/
├── components/waypoint/
│   ├── WaypointEditor.vue
│   ├── WaypointMapViewer.vue
│   ├── ControlPanel.vue
│   ├── MissionConfig.vue
│   ├── MissionLibrary.vue
│   ├── WaypointList.vue
│   ├── PolygonRouteConfig.vue
│   └── CreateMissionModal.vue
├── utils/waypoint/
│   ├── geoUtils.ts
│   ├── kmzGenerator.ts
│   ├── kmzParser.ts
│   ├── polygonRouteGenerator.ts
│   └── routePlanner.ts
├── types/waypoint.ts
└── store/modules/waypoint.ts
```

### 修改文件 (3个)

```
front/package.json          # 添加依赖
front/src/router/index.ts   # 添加路由
front/src/pages/page-web/projects/wayline.vue  # 添加入口
```

### 不修改文件

```
front/src/components/CesiumMap.vue  # 保持不变
```

***

## 工作量估算

| 阶段     | 工作量    |
| ------ | ------ |
| 安装依赖   | 0.5 天  |
| 工具函数迁移 | 1 天    |
| 组件迁移   | 2 天    |
| 路由配置   | 0.5 天  |
| 类型定义   | 0.5 天  |
| 状态管理   | 0.5 天  |
| <br /> | <br /> |

