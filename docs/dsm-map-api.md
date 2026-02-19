# DSM 地图管理 API 文档

## 概述

DSM 地图管理模块提供了地图文件的上传、查询、删除等功能。支持 GeoTIFF 和 ZIP 格式的 3D Tiles 数据。

**基础路径**: `/map/api/v1/workspaces/{workspace_id}`

**认证方式**: 请求头携带 `x-auth-token`

---

## 1. 上传地图

### Request

```http
POST /map/api/v1/workspaces/{workspace_id}/maps/upload
Content-Type: multipart/form-data
x-auth-token: {token}
```

### Parameter

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| workspace_id | String | Path | 是 | 工作区 ID |
| file | File | Form | 是 | 上传的文件 (GeoTIFF 或 ZIP) |
| map_name | String | Form | 否 | 地图名称 |
| map_format | String | Form | 否 | 地图格式，默认 `3dtiles` |

### cURL 示例

```bash
curl -X POST "http://10.39.29.101:6789/map/api/v1/workspaces/e3dea0f5-37f2-4d79-ae58-490af3228069/maps/upload" \
  -H "x-auth-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "file=@test-terrain.zip" \
  -F "map_name=API Test Map" \
  -F "map_format=3dtiles"
```

### Response

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": ""
}
```

**失败响应**:

```json
{
  "code": -1,
  "message": "No file received."
}
```

---

## 2. 获取地图列表

### Request

```http
GET /map/api/v1/workspaces/{workspace_id}/maps?page=1&page_size=10
x-auth-token: {token}
```

### Parameter

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| workspace_id | String | Path | 是 | 工作区 ID |
| page | Integer | Query | 否 | 页码，默认 1 |
| page_size | Integer | Query | 否 | 每页数量，默认 10 |

### cURL 示例

```bash
curl -X GET "http://10.39.29.101:6789/map/api/v1/workspaces/e3dea0f5-37f2-4d79-ae58-490af3228069/maps?page=1&page_size=10" \
  -H "x-auth-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33",
        "map_name": "API Test Map",
        "workspace_id": "e3dea0f5-37f2-4d79-ae58-490af3228069",
        "user_id": "a1559e7c-8dd8-4780-b952-100cc4797da2",
        "username": "adminPC",
        "map_format": "3dtiles",
        "object_key": "map/ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33/tileset.json",
        "file_size": 280,
        "status": 1,
        "create_time": 1771509721202,
        "update_time": 1771509721204
      }
    ],
    "pagination": {
      "page": 1,
      "total": 1,
      "page_size": 10
    }
  }
}
```

---

## 3. 获取地图详情

### Request

```http
GET /map/api/v1/workspaces/{workspace_id}/maps/{map_id}
x-auth-token: {token}
```

### Parameter

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| workspace_id | String | Path | 是 | 工作区 ID |
| map_id | String | Path | 是 | 地图 ID |

### cURL 示例

```bash
curl -X GET "http://10.39.29.101:6789/map/api/v1/workspaces/e3dea0f5-37f2-4d79-ae58-490af3228069/maps/ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33" \
  -H "x-auth-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33",
    "map_name": "API Test Map",
    "workspace_id": "e3dea0f5-37f2-4d79-ae58-490af3228069",
    "user_id": "a1559e7c-8dd8-4780-b952-100cc4797da2",
    "username": "adminPC",
    "map_format": "3dtiles",
    "object_key": "map/ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33/tileset.json",
    "file_size": 280,
    "status": 1,
    "create_time": 1771509721202,
    "update_time": 1771509721204
  }
}
```

**失败响应**:

```json
{
  "code": -1,
  "message": "Map not found."
}
```

---

## 4. 删除地图

### Request

```http
DELETE /map/api/v1/workspaces/{workspace_id}/maps/{map_id}
x-auth-token: {token}
```

### Parameter

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| workspace_id | String | Path | 是 | 工作区 ID |
| map_id | String | Path | 是 | 地图 ID |

### cURL 示例

```bash
curl -X DELETE "http://10.39.29.101:6789/map/api/v1/workspaces/e3dea0f5-37f2-4d79-ae58-490af3228069/maps/ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33" \
  -H "x-auth-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": ""
}
```

**失败响应**:

```json
{
  "code": -1,
  "message": "Failed to delete map."
}
```

---

## 5. 获取所有地图

### Request

```http
GET /map/api/v1/workspaces/{workspace_id}/maps/all
x-auth-token: {token}
```

### Parameter

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| workspace_id | String | Path | 是 | 工作区 ID |

### cURL 示例

```bash
curl -X GET "http://10.39.29.101:6789/map/api/v1/workspaces/e3dea0f5-37f2-4d79-ae58-490af3228069/maps/all" \
  -H "x-auth-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33",
      "map_name": "API Test Map",
      "workspace_id": "e3dea0f5-37f2-4d79-ae58-490af3228069",
      "user_id": "a1559e7c-8dd8-4780-b952-100cc4797da2",
      "username": "adminPC",
      "map_format": "3dtiles",
      "object_key": "map/ec46e3a0-f4f3-45a1-bf3f-0f7968cf9f33/tileset.json",
      "file_size": 280,
      "status": 1,
      "create_time": 1771509721202,
      "update_time": 1771509721204
    }
  ]
}
```

---

## 数据模型

### ManageMap 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 地图唯一标识 (UUID) |
| map_name | String | 地图名称 |
| workspace_id | String | 所属工作区 ID |
| user_id | String | 创建用户 ID |
| username | String | 创建用户名 |
| map_format | String | 地图格式 (3dtiles/terrain/geotiff) |
| object_key | String | MinIO 存储路径 |
| min_longitude | Decimal | 最小经度 |
| max_longitude | Decimal | 最大经度 |
| min_latitude | Decimal | 最小纬度 |
| max_latitude | Decimal | 最大纬度 |
| center_longitude | Decimal | 中心经度 |
| center_latitude | Decimal | 中心纬度 |
| file_size | Long | 文件大小 (字节) |
| status | Integer | 状态: 0-处理中, 1-可用, 2-失败 |
| create_time | Long | 创建时间戳 (毫秒) |
| update_time | Long | 更新时间戳 (毫秒) |

---

## 错误码

| code | message | 说明 |
|------|---------|------|
| 0 | success | 成功 |
| -1 | No file received. | 未接收到文件 |
| -1 | Map not found. | 地图不存在 |
| -1 | Failed to upload DSM file: {error} | 上传失败 |
| -1 | Failed to delete map. | 删除失败 |
| 401 | Unauthorized | 未授权 (缺少或无效 token) |

---

## 测试环境

- **后端地址**: `http://10.39.29.101:6789`
- **工作区 ID**: `e3dea0f5-37f2-4d79-ae58-490af3228069`
- **测试用户**: `adminPC` / `adminPC`
- **MinIO Bucket**: `aircraft-bucket`
- **存储路径**: `map/{map_id}/`

---

## 测试结果

| 接口 | 方法 | 路径 | 测试结果 |
|------|------|------|----------|
| 上传地图 | POST | `/maps/upload` | ✅ 通过 |
| 获取列表 | GET | `/maps` | ✅ 通过 |
| 获取详情 | GET | `/maps/{map_id}` | ✅ 通过 |
| 删除地图 | DELETE | `/maps/{map_id}` | ✅ 通过 |
| 获取所有 | GET | `/maps/all` | ✅ 通过 |
