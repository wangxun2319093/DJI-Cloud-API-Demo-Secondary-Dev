# DJI Cloud API 数据库结构文档

## 概述

本文档描述 DJI Cloud API Demo 项目中 MySQL 数据库的结构，重点分析设备信息展示相关的表结构。

---

## 数据库表清单

| 表名 | 说明 |
|------|------|
| manage_device | 设备信息表（核心） |
| manage_device_dictionary | 设备字典表 |
| manage_device_payload | 设备负载表 |
| manage_device_firmware | 固件信息表 |
| manage_device_hms | 设备 HMS 健康信息表 |
| manage_device_logs | 设备日志表 |
| manage_workspace | 工作空间表 |
| manage_user | 用户表 |

---

## 核心表结构详解

### 1. manage_device（设备信息表）

**用途**：存储所有设备（无人机、遥控器、机场、负载）的基本信息。

```sql
CREATE TABLE `manage_device` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `device_sn` varchar(32) NOT NULL DEFAULT '' COMMENT '设备序列号，唯一标识',
  `device_name` varchar(64) NOT NULL DEFAULT 'undefined' COMMENT '设备型号名称',
  `user_id` varchar(64) DEFAULT '' COMMENT '绑定设备时使用的账户',
  `nickname` varchar(64) NOT NULL COMMENT '设备自定义名称',
  `workspace_id` varchar(64) DEFAULT '' COMMENT '所属工作空间ID',
  `device_type` int(11) NOT NULL DEFAULT '-1' COMMENT '设备类型，对应 device_dictionary',
  `sub_type` int(11) NOT NULL DEFAULT '-1' COMMENT '设备子类型，对应 device_dictionary',
  `domain` int(11) NOT NULL DEFAULT '-1' COMMENT '设备域：0=无人机, 1=负载, 2=遥控器, 3=机场',
  `firmware_version` varchar(32) DEFAULT '' COMMENT '固件版本',
  `compatible_status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '固件版本一致性：1=一致, 0=不一致',
  `version` varchar(32) DEFAULT '' COMMENT '协议版本（暂未使用）',
  `device_index` varchar(32) DEFAULT '' COMMENT '控制权：A控或B控',
  `child_sn` varchar(32) DEFAULT '' COMMENT '子设备SN（遥控器/机场控制的无人机）',
  `create_time` bigint(20) NOT NULL,
  `update_time` bigint(20) NOT NULL,
  `bound_time` bigint(20) DEFAULT NULL COMMENT '绑定工作空间的时间',
  `bound_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '绑定状态：1=已绑定, 0=未绑定',
  `login_time` bigint(20) DEFAULT NULL COMMENT '最后登录时间',
  `device_desc` varchar(100) DEFAULT '',
  `url_normal` varchar(200) DEFAULT '' COMMENT '遥控器显示的图标',
  `url_select` varchar(200) DEFAULT '' COMMENT '遥控器选中时显示的图标',
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_sn_UNIQUE` (`device_sn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='设备信息';
```

**关键字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `device_sn` | varchar(32) | ✅ | 设备唯一标识，必须唯一 |
| `domain` | int | ✅ | 设备域，决定设备类型 |
| `device_type` | int | ✅ | 设备类型编码 |
| `sub_type` | int | ✅ | 设备子类型编码 |
| `child_sn` | varchar(32) | | 子设备SN，用于遥控器/机场关联无人机 |
| `bound_status` | tinyint | ✅ | 绑定状态，必须为1才能在前端展示 |
| `workspace_id` | varchar(64) | ✅ | 所属工作空间，必须绑定才能展示 |

**domain 值对照表**：

| 值 | 含义 | 说明 |
|----|------|------|
| 0 | DRONE | 无人机 |
| 1 | PAYLOAD | 负载（相机等） |
| 2 | REMOTE_CONTROL | 遥控器 |
| 3 | DOCK | 机场 |

---

### 2. manage_device_dictionary（设备字典表）

**用途**：定义设备型号与类型编码的映射关系。

```sql
CREATE TABLE `manage_device_dictionary` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` int(11) NOT NULL COMMENT '设备域',
  `device_type` int(11) NOT NULL COMMENT '设备类型',
  `sub_type` int(11) NOT NULL COMMENT '设备子类型',
  `device_name` varchar(32) NOT NULL DEFAULT '' COMMENT '设备名称',
  `device_desc` varchar(100) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='设备产品枚举';
```

**常用设备类型**：

| domain | device_type | sub_type | device_name |
|--------|-------------|----------|-------------|
| 0 | 60 | 0 | Matrice 300 RTK |
| 0 | 89 | 0 | Matrice 350 RTK |
| 0 | 99 | 0 | Matrice 4E |
| 2 | 56 | 0 | DJI Smart Controller |
| 2 | 119 | 0 | DJI RC Plus |
| 2 | 174 | 0 | DJI RC Plus 2 |
| 3 | 1 | 0 | DJI Dock |
| 3 | 2 | 0 | DJI Dock2 |

---

### 3. manage_device_payload（设备负载表）

**用途**：存储无人机挂载的负载（相机）信息。

```sql
CREATE TABLE `manage_device_payload` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `payload_sn` varchar(32) NOT NULL DEFAULT '' COMMENT '负载序列号',
  `payload_name` varchar(64) NOT NULL DEFAULT 'undefined' COMMENT '负载型号',
  `payload_type` smallint(6) NOT NULL COMMENT '负载类型',
  `sub_type` smallint(6) NOT NULL COMMENT '负载子类型',
  `firmware_version` varchar(32) DEFAULT NULL COMMENT '固件版本',
  `payload_index` smallint(6) NOT NULL COMMENT '负载位置',
  `device_sn` varchar(32) NOT NULL DEFAULT '' COMMENT '所属设备SN',
  `payload_desc` varchar(100) DEFAULT NULL,
  `control_source` varchar(1) DEFAULT NULL,
  `create_time` bigint(20) NOT NULL,
  `update_time` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payload_sn_UNIQUE` (`payload_sn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='设备负载信息';
```

---

### 4. manage_workspace（工作空间表）

**用途**：定义工作空间（项目组），设备必须绑定到工作空间才能展示。

```sql
CREATE TABLE `manage_workspace` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `workspace_id` varchar(64) NOT NULL DEFAULT '' COMMENT 'UUID',
  `workspace_name` varchar(64) NOT NULL DEFAULT '' COMMENT '工作空间名称',
  `workspace_desc` varchar(100) NOT NULL DEFAULT '' COMMENT '描述',
  `platform_name` varchar(64) NOT NULL DEFAULT '' COMMENT '平台名称',
  `create_time` bigint(20) NOT NULL,
  `update_time` bigint(20) NOT NULL,
  `bind_code` varchar(32) NOT NULL DEFAULT '' COMMENT '绑定码',
  PRIMARY KEY (`id`),
  UNIQUE KEY `workspace_id_UNIQUE` (`workspace_id`),
  UNIQUE KEY `bind_code_UNIQUE` (`bind_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

---

### 5. manage_user（用户表）

**用途**：存储用户账户信息。

```sql
CREATE TABLE `manage_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(64) NOT NULL COMMENT 'UUID',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `password` varchar(64) NOT NULL COMMENT '密码',
  `workspace_id` varchar(64) DEFAULT '' COMMENT '所属工作空间',
  `user_type` int(11) NOT NULL COMMENT '用户类型：1=Web用户, 2=Pilot用户',
  `mqtt_username` varchar(64) DEFAULT '' COMMENT 'MQTT用户名',
  `mqtt_password` varchar(64) DEFAULT '' COMMENT 'MQTT密码',
  `create_time` bigint(20) NOT NULL,
  `update_time` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

---

## 设备信息展示的数据要求

### 前端展示条件

设备要在前端 Online Devices 页面展示，必须满足以下条件：

1. **数据库记录存在**
   - `manage_device` 表中必须有该设备的记录
   - `device_sn` 必须唯一且不为空

2. **绑定状态正确**
   - `bound_status = 1`（已绑定）
   - `workspace_id` 必须有效（对应 `manage_workspace` 表）

3. **设备类型正确**
   - `domain` 值必须正确：
     - `0` = 无人机（Aircraft 页面）
     - `2` = 遥控器（Remote Control 页面）
     - `3` = 机场（Dock 页面）

4. **父子关系正确**
   - 遥控器/机场的 `child_sn` 必须指向正确的无人机 SN
   - 无人机的 `domain` 必须为 `0`

### Redis 缓存要求

设备在线状态存储在 Redis 中：

- **Key 格式**：`online:{device_sn}`
- **数据来源**：设备发送 `sys/product/{sn}/status` 消息时创建
- **关键字段**：
  - `status`: 在线状态（true/false）
  - `child_device_sn`: 子设备 SN
  - `children`: 子设备详细信息

### 数据流程

```
1. 设备上线
   └─> 发送 status 消息到 EMQX
       └─> 后端处理 updateTopoOnline
           ├─> 从数据库查询设备信息
           ├─> 创建/更新 Redis 缓存
           └─> 推送 WebSocket 到前端

2. 前端查询
   └─> 调用 API /devices/{workspace_id}/devices/bound?domain=X
       └─> 后端查询数据库 + Redis
           └─> 返回设备列表（包含在线状态）
```

---

## 当前数据库设备配置

| device_sn | device_name | domain | child_sn | bound_status |
|-----------|-------------|--------|----------|--------------|
| GATEWAYSIM001 | DJI RC Plus | 2 | DRONE_GATEWAY_001 | 1 |
| DRONE_GATEWAY_001 | DJI M30T | 0 | | 1 |
| DOCKSIM001 | SimDock1 | 3 | DRONE_SIM001 | 1 |
| DRONE_SIM001 | DJI M30T | 0 | | 1 |

---

## 常见问题

### Q1: 设备不显示在 Online Devices 页面

**检查步骤**：
1. 确认数据库中 `bound_status = 1`
2. 确认 `workspace_id` 正确
3. 确认 `domain` 值正确
4. 确认设备发送了 `status` 消息
5. 检查 Redis 中是否有 `online:{device_sn}` 缓存

### Q2: 子设备不显示

**检查步骤**：
1. 确认父设备的 `child_sn` 指向正确的子设备 SN
2. 确认子设备的 `domain = 0`
3. 确认子设备发送了 OSD 数据
4. 检查 status 消息中的 `subDevices` 字段

### Q3: 设备显示离线

**检查步骤**：
1. 确认设备发送了 `status` 消息
2. 检查 Redis 中 `online:{device_sn}` 的 `status` 字段
3. 检查后端日志是否有错误

---

## 相关代码文件

- 设备服务：`sample/src/main/java/com/dji/sample/manage/service/impl/DeviceServiceImpl.java`
- Status 处理：`sample/src/main/java/com/dji/sample/manage/service/impl/SDKDeviceService.java`
- Redis 服务：`sample/src/main/java/com/dji/sample/manage/service/impl/DeviceRedisServiceImpl.java`
- 前端页面：`front/src/pages/page-web/projects/devices.vue`
