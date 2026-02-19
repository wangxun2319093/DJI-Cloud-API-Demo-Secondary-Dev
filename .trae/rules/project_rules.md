# DJI-Cloud-API-Demo 航线编辑功能集成文档

## 一、功能概述

将 `/home/kyy/workspace/dji_way_line` 航线编辑项目集成到 DJI-Cloud-API-Demo 项目中，实现了完整的航线规划、编辑和导出功能。

---

## 二、核心功能模块

### 1. 航线管理

| 文件 | 功能 |
|------|------|
| `src/components/wayline/MissionLibrary.vue` | 航线库管理，显示已保存的航线列表 |
| `src/components/wayline/CreateMissionModal.vue` | 创建新航线的弹窗配置 |
| `src/components/wayline/index.vue` | 航线编辑主入口（抽屉容器） |

### 2. 航线编辑

| 文件 | 功能 |
|------|------|
| `src/components/wayline/ControlPanel.vue` | 主控制面板，包含 Tabs 切换 |
| `src/components/wayline/MissionConfig.vue` | 任务配置（飞行模式、高度模式、智能识别等） |
| `src/components/wayline/WaypointList.vue` | 航点列表管理 |
| `src/components/wayline/PolygonRouteConfig.vue` | 面状航线配置（扫描间距、重叠率等） |

### 3. 工具函数

| 文件 | 功能 |
|------|------|
| `src/utils/wayline/coordTransform.ts` | WGS84/GCJ02/BD09 坐标系转换 |
| `src/utils/wayline/geoUtils.ts` | 地理计算（距离、面积、方位角） |
| `src/utils/wayline/kmzGenerator.ts` | KMZ 文件生成（DJI 航线格式） |
| `src/utils/wayline/kmzParser.ts` | KMZ 文件解析导入 |
| `src/utils/wayline/routePlanner.ts` | 扫描路径规划 |
| `src/utils/wayline/polygonRouteGenerator.ts` | 面状航线自动生成 |

---

## 三、用户操作流程

```
1. 进入航线编辑
   └─> 点击 sidebar "航线编辑" 图标
   └─> 路由跳转至 /edit-wayline

2. 创建新航线
   └─> 点击 "创建新航线" 按钮
   └─> 配置航线名称、飞行器型号、航线类型
   └─> 确认后进入绘制模式

3. 绘制航点
   └─> 在地图上点击添加航点
   └─> 右键结束绘制

4. 配置航线参数
   ├─> 任务配置：飞行模式、高度模式、完成动作
   ├─> 面状航线：扫描间距、重叠率、航线角度
   └─> 航点列表：调整各航点高度、速度

5. 导出/保存
   ├─> 生成 KMZ 文件下载
   ├─> 导入已有 KMZ 文件
   └─> 保存到本地航线库
```

---

## 四、技术架构

### 1. 前端架构

```
Vue 3 + TypeScript
├── Vue Router (路由管理)
├── Vuex (状态管理)
├── Ant Design Vue 2.x (UI 组件)
└── Cesium (地图引擎)
```

### 2. 状态管理

```typescript
// store/index.ts
state: {
  waylineEditorVisible: boolean  // 航线编辑器显示状态
}

mutations: {
  SET_WAYLINE_EDITOR_VISIBLE  // 控制抽屉显示/隐藏
}
```

### 3. 路由配置

```typescript
// router/index.ts
{
  path: '/edit-wayline',
  name: ERouterName.EDIT_WAYLINE,
  component: () => import('/@/pages/page-web/projects/tsa.vue')
}
```

---

## 五、技术特点

### 1. 坐标系统支持

- **WGS84**: GPS 原始坐标
- **GCJ02**: 国测局坐标（高德、腾讯）
- **BD09**: 百度坐标
- 支持相互转换，确保与 DJI 设备兼容

### 2. KMZ 文件格式

- 符合 DJI 航线标准格式
- 包含 `waylines.wpml` 航线定义
- 包含 `template.kml` 模板信息
- 支持导入/导出双向操作

### 3. 航线类型

| 类型 | 说明 |
|------|------|
| `waypoint` | 航点航线 - 依次飞过各航点 |
| `mapping` | 建图航线 - 面状扫描，支持重叠率配置 |
| `patrol` | 巡检航线 - 区域扫描 |

### 4. 飞行配置

- **高度模式**: 海拔高度 / 相对起飞点 / 相对地形（仿地飞行）
- **完成动作**: 自动返航 / 自动降落 / 原地悬停 / 返回首航点
- **爬升模式**: 垂直爬升 / 倾斜爬升
- **智能识别**: 人/车/船检测告警

### 5. 相机预设

```typescript
CAMERA_PRESETS = {
  m3e: { sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, ... },
  m3t: { sensorWidth: 6.3, sensorHeight: 4.7, focalLength: 4.88, ... },
  m30t: { sensorWidth: 6.3, sensorHeight: 4.7, focalLength: 4.88, ... },
  m300: { sensorWidth: 35.9, sensorHeight: 24, focalLength: 35, ... }
}
```

---

## 六、集成修改点

### 1. 新增文件

- `src/components/wayline/` - 9 个 Vue 组件
- `src/utils/wayline/` - 6 个工具文件

### 2. 修改文件

| 文件 | 修改内容 |
|------|----------|
| `router/index.ts` | 添加 EDIT_WAYLINE 路由 |
| `types/enums.ts` | 添加 EDIT_WAYLINE 枚举 |
| `components/common/sidebar.vue` | 添加航线编辑入口 |
| `pages/page-web/projects/workspace.vue` | 集成航线编辑抽屉 |
| `components/CesiumMap.vue` | 添加航点绘制功能 |
| `store/index.ts` | 添加 waylineEditorVisible 状态 |

---

## 七、关键技术难点解决

### 1. 抽屉不遮挡 Sidebar

- 使用 `position: fixed; left: 50px` 定位
- Sidebar 设置 `z-index: 1001` 高于抽屉

```scss
// wayline/index.vue
.wayline-drawer-wrapper {
  position: fixed;
  top: 0;
  left: 50px;  // 不遮挡 sidebar
  width: 420px;
  height: 100vh;
  z-index: 1000;
}

// sidebar.vue
.demo-project-sidebar-wrapper {
  position: relative;
  z-index: 1001;  // 高于抽屉
  background-color: #232323;
}
```

### 2. 多层嵌套滚动问题

- 每层 flex 容器设置 `min-height: 0`
- 使用 `height: 0` 配合 `flex: 1` 实现高度约束
- 滚动容器设置 `overflow-y: auto`

```scss
// 关键样式模式
.container {
  flex: 1;
  min-height: 0;  // 关键：允许 flex 子元素收缩
  height: 0;      // 配合 flex: 1 实现高度约束
}

.scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

### 3. Ant Design Vue 2.x Tabs 适配

- 使用 `:deep()` 穿透样式
- 正确设置 `.ant-tabs-bar`、`.ant-tabs-content`、`.ant-tabs-tabpane`

```scss
.panel-content {
  flex: 1;
  min-height: 0;
  height: 0;

  :deep(.ant-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-tabs-bar) {
    flex-shrink: 0;
  }

  :deep(.ant-tabs-content) {
    flex: 1;
    min-height: 0;
    height: 100%;
  }

  :deep(.ant-tabs-tabpane) {
    height: 100%;
    overflow-y: auto;
  }
}
```

### 4. Cesium 地图点击事件

- 使用 `ScreenSpaceEventHandler` 处理点击
- 添加重试机制确保 viewer 初始化完成
- 右键结束绘制模式

```typescript
const addWaylineClickHandler = () => {
  if (!cesiumViewer.value) {
    setTimeout(addWaylineClickHandler, 100)  // 重试机制
    return
  }
  
  const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.value.scene.canvas)
  
  handler.setInputAction((event: any) => {
    if (!props.waylineEditMode) return
    // 左键添加航点
    const cartesian = cesiumViewer.value.camera.pickEllipsoid(event.position)
    // ...
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  
  handler.setInputAction(() => {
    emit('drawing-end')  // 右键结束绘制
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}
```

---

## 八、文件结构

```
front/src/
├── components/
│   ├── wayline/
│   │   ├── index.vue              # 航线编辑主入口
│   │   ├── ControlPanel.vue       # 主控制面板
│   │   ├── MissionLibrary.vue     # 航线库
│   │   ├── CreateMissionModal.vue # 创建航线弹窗
│   │   ├── MissionConfig.vue      # 任务配置
│   │   ├── WaypointList.vue       # 航点列表
│   │   ├── PolygonRouteConfig.vue # 面状航线配置
│   │   └── use-wayline.ts         # 航线编辑 Hook
│   ├── common/
│   │   └── sidebar.vue            # 侧边栏（已修改）
│   └── CesiumMap.vue              # 地图组件（已修改）
├── pages/page-web/projects/
│   └── workspace.vue              # 工作区（已修改）
├── utils/wayline/
│   ├── coordTransform.ts          # 坐标转换
│   ├── geoUtils.ts                # 地理计算
│   ├── kmzGenerator.ts            # KMZ 生成
│   ├── kmzParser.ts               # KMZ 解析
│   ├── routePlanner.ts            # 路径规划
│   └── polygonRouteGenerator.ts   # 面状航线生成
├── router/index.ts                # 路由配置（已修改）
├── store/index.ts                 # 状态管理（已修改）
└── types/enums.ts                 # 枚举定义（已修改）
```
