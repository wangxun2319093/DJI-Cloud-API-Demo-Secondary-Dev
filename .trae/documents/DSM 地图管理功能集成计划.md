# DSM 地图管理功能集成详细计划

## 一、数据库层修改

### 1.1 新建 manage\_map 表 (MySQL)

```sql
CREATE TABLE `manage_map` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `map_id` varchar(64) NOT NULL COMMENT 'uuid',
  `map_name` varchar(100) NOT NULL COMMENT '地图名称',
  `workspace_id` varchar(64) NOT NULL COMMENT '工作区ID',
  `user_id` varchar(64) NOT NULL COMMENT '用户ID',
  `map_format` varchar(32) NOT NULL COMMENT '地图格式: 3dtiles/terrain',
  `object_key` varchar(1000) NOT NULL COMMENT 'MinIO存储路径',
  `min_longitude` decimal(18,14) DEFAULT NULL COMMENT '最小经度',
  `max_longitude` decimal(18,14) DEFAULT NULL COMMENT '最大经度',
  `min_latitude` decimal(17,14) DEFAULT NULL COMMENT '最小纬度',
  `max_latitude` decimal(17,14) DEFAULT NULL COMMENT '最大纬度',
  `center_longitude` decimal(18,14) DEFAULT NULL COMMENT '中心经度',
  `center_latitude` decimal(17,14) DEFAULT NULL COMMENT '中心纬度',
  `file_size` bigint DEFAULT 0 COMMENT '文件大小(字节)',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态: 0-处理中, 1-可用, 2-失败',
  `create_time` bigint NOT NULL,
  `update_time` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `map_id_UNIQUE` (`map_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='DSM地图管理表';
```

***

## 二、后端修改 (Java Spring Boot)

### 2.1 新建实体和DTO

* `sample/src/main/java/com/dji/sample/map/model/entity/ManageMapEntity.java`

* `sample/src/main/java/com/dji/sample/map/model/dto/ManageMapDTO.java`

### 2.2 新建Mapper

* `sample/src/main/java/com/dji/sample/map/dao/IManageMapMapper.java`

* `sample/src/main/resources/mapper/ManageMapMapper.xml`

### 2.3 新建Service

* `sample/src/main/java/com/dji/sample/map/service/IManageMapService.java`

* `sample/src/main/java/com/dji/sample/map/service/impl/ManageMapServiceImpl.java`

### 2.4 新建Controller

* `sample/src/main/java/com/dji/sample/map/controller/ManageMapController.java`

**API 接口设计：**

| 方法     | 路径                                                    | 功能        |
| ------ | ----------------------------------------------------- | --------- |
| POST   | `/map/api/v1/workspaces/{workspace_id}/maps/upload`   | 上传TIFF并转换 |
| GET    | `/map/api/v1/workspaces/{workspace_id}/maps`          | 获取地图列表    |
| GET    | `/map/api/v1/workspaces/{workspace_id}/maps/{map_id}` | 获取地图详情    |
| DELETE | `/map/api/v1/workspaces/{workspace_id}/maps/{map_id}` | 删除地图      |

### 2.5 DSM转换服务

* `sample/src/main/java/com/dji/sample/map/service/IDsmConverterService.java`

* `sample/src/main/java/com/dji/sample/map/service/impl/DsmConverterServiceImpl.java`

**转换流程：**

1. 上传 GeoTIFF 到临时目录
2. 使用 GDAL/CesiumIon 转换为 3D Tiles
3. 将转换结果上传到 MinIO `aircraft_bucket/map/{map_id}/`
4. 更新数据库状态

***

## 三、前端修改 (Vue 3 + TypeScript)

### 3.1 新建组件文件

```
front/src/components/mapdsm/
├── index.vue              # DSM管理主组件(抽屉)
├── MapLibrary.vue         # 地图库列表
├── CreateMapModal.vue     # 创建地图弹窗
└── MapPreview.vue         # 地图预览组件
```

### 3.2 修改路由配置

**文件:** `front/src/router/index.ts`

```typescript
{
  path: '/' + ERouterName.MAP_DSM,
  name: ERouterName.MAP_DSM,
  component: () => import('/@/pages/page-web/projects/tsa.vue')
}
```

### 3.3 修改枚举定义

**文件:** `front/src/types/enums.ts`

```typescript
export enum ERouterName {
  // ... 现有枚举
  MAP_DSM = 'map-dsm',
}

export enum EComponentName {
  // ... 现有枚举
  MAP_DSM = 'MapDsm',
}
```

### 3.4 修改状态管理

**文件:** `front/src/store/index.ts`

```typescript
state: {
  // ... 现有状态
  mapDsmVisible: false,  // DSM管理器显示状态
}

mutations: {
  SET_MAP_DSM_VISIBLE(state, bool) {
    state.mapDsmVisible = bool
  }
}
```

### 3.5 修改侧边栏

**文件:** `front/src/components/common/sidebar.vue`

* 添加 DSM 地图管理菜单项

* 添加 `toggleMapDsmEditor()` 函数

### 3.6 修改工作区

**文件:** `front/src/pages/page-web/projects/workspace.vue`

* 引入 MapDsmDrawer 组件

* 添加 DSM 相关状态和方法

### 3.7 修改 CesiumMap

**文件:** `front/src/components/CesiumMap.vue`

* 添加 `dsmMaps` prop

* 添加 `loadDsmMap()` 方法加载 3D Tiles/Terrain

* 添加 `removeDsmMap()` 方法移除地图

* 添加 `flyToMap()` 方法定位到地图

### 3.8 新建API接口

**文件:** `front/src/api/map.ts`

```typescript
// 上传DSM文件
export const uploadDsmFile = async (workspaceId: string, file: FormData)
// 获取地图列表
export const getMapList = async (workspaceId: string, page: IPage)
// 删除地图
export const deleteMap = async (workspaceId: string, mapId: string)
```

***

## 四、MinIO 存储结构

```
aircraft_bucket/
└── map/
    └── {map_id}/
        ├── tileset.json      # 3D Tiles 入口文件
        └── {tile_files}      # 瓦片文件
```

***

## 五、实现步骤顺序

### 阶段一：数据库和后端基础 (预计文件数: 8)

1. 创建 SQL 表 `manage_map`
2. 创建 Entity、DTO、Mapper
3. 创建 Service 接口和实现
4. 创建 Controller

### 阶段二：DSM转换服务 (预计文件数: 2)

1. 实现 DSM 转 3D Tiles 服务
2. 集成 GDAL 或调用 Cesium Ion API

### 阶段三：前端组件 (预计文件数: 5)

1. 创建 `mapdsm/index.vue` 主组件
2. 创建 `MapLibrary.vue` 列表组件
3. 创建 `CreateMapModal.vue` 弹窗组件
4. 创建 `front/src/api/map.ts` API

### 阶段四：集成修改 (预计文件数: 5)

1. 修改 `router/index.ts` 添加路由
2. 修改 `types/enums.ts` 添加枚举
3. 修改 `store/index.ts` 添加状态
4. 修改 `sidebar.vue` 添加菜单
5. 修改 `workspace.vue` 集成组件

### 阶段五：Cesium集成 (预计文件数: 1)

1. 修改 `CesiumMap.vue` 添加 DSM 加载功能

***

## 六、关键技术点

### 6.1 GeoTIFF 转 3D Tiles

**方案B:** 本地 GDAL + 3d-tiles-tools

* 使用 GDAL 处理 GeoTIFF

* 使用 CesiumGS/3d-tiles-tools 生成瓦片

### 6.2 Cesium 加载 3D Tiles

```typescript
const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl)
viewer.scene.primitives.add(tileset)
```

### 6.3 Cesium 加载 Terrain

```typescript
const terrain = await Cesium.CesiumTerrainProvider.fromUrl(terrainUrl)
viewer.terrainProvider = terrain
```

***

## 七、预计新增/修改文件统计

| 类型         | 新增     | 修改    | 合计     |
| ---------- | ------ | ----- | ------ |
| SQL        | 1      | 0     | 1      |
| Java       | 8      | 0     | 8      |
| Vue        | 4      | 3     | 7      |
| TypeScript | 1      | 3     | 4      |
| **总计**     | **14** | **6** | **20** |

