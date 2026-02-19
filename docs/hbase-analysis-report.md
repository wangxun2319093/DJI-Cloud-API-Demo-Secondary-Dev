# HBase 数据结构分析报告

**分析日期**: 2026-02-18  
**分析工具**: HBase MCP  
**服务器**: 118.195.150.246:9090

---

## 一、表结构概览

| 表名 | 列族 | 状态 | 说明 |
|------|------|------|------|
| `newData` | `cf_data` | ✅ 活跃 | GPS位移传感器数据 |
| `JianCeYuJing:sensorData` | `iotData`, `iotInfo` | ✅ 活跃 | IoT监测传感器数据 |
| `sensor_data` | `cf_data` | ⚠️ 已禁用 | 废弃表 |

---

## 二、表详细分析

### 2.1 newData 表

**用途**: 存储 GPS 位移传感器数据

**Row Key 设计**:
```
{传感器ID}_{时间戳}
示例: D009G3201010101001M00_2024-11-20T11:56:25.8531
```

**列族配置**:
| 属性 | 值 |
|------|-----|
| 名称 | cf_data |
| 压缩 | NONE |
| 布隆过滤器 | ROW |
| 块缓存 | True |
| 最大版本数 | 1 |
| TTL | 2147483647 (永不过期) |

**列定义**:
| 列名 | 数据类型 | 说明 |
|------|----------|------|
| `displacement2d` | float | 2D位移量 |
| `displacement3d` | float | 3D位移量 |
| `gpsTotalX` | float | GPS X坐标累计值 |
| `gpsTotalY` | float | GPS Y坐标累计值 |
| `gpsTotalZ` | float | GPS Z坐标累计值 |
| `recordTime` | string | 记录时间 |
| `sensor_type` | string | 传感器类型 (009) |

**数据示例**:
```json
{
  "row_key": "D009G3201010101001M00_2024-11-20T11:56:25.8531",
  "data": {
    "cf_data:displacement2d": "-3.7260677329980467",
    "cf_data:displacement3d": "-12.611548888795108",
    "cf_data:gpsTotalX": "-7.553242394025879",
    "cf_data:gpsTotalY": "-4.6632449424860845",
    "cf_data:gpsTotalZ": "5.374350938779088",
    "cf_data:recordTime": "2024-11-20T11:56:25",
    "cf_data:sensor_type": "009"
  }
}
```

---

### 2.2 JianCeYuJing:sensorData 表

**用途**: 存储 IoT 监测传感器数据

**Row Key 设计**:
```
{传感器ID}_{时间戳}
示例: D008G1901020101001M00_2025-01-26T00:48:58.000536
```

**列族配置**:
| 属性 | iotData | iotInfo |
|------|---------|---------|
| 压缩 | NONE | NONE |
| 布隆过滤器 | ROW | ROW |
| 块缓存 | True | True |
| 最大版本数 | 1 | 1 |

**列定义**:
| 列名 | 数据类型 | 说明 |
|------|----------|------|
| `electric_quantity` | float | 电量百分比 |
| `monitoring_value` | float | 监测值 |
| `recordTime` | string | 记录时间 |
| `sensor_type` | string | 传感器类型 (008) |

**数据示例**:
```json
{
  "row_key": "D008G1901020101001M00_2025-01-26T00:48:58.000536",
  "data": {
    "iotData:electric_quantity": "90.0",
    "iotData:monitoring_value": "106.88785328745067",
    "iotData:recordTime": "2025-01-26 00:48:58",
    "iotData:sensor_type": "008"
  }
}
```

---

### 2.3 sensor_data 表

**状态**: 已禁用 (disabled)

**建议**: 如果确认不再使用，应删除以释放资源。

---

## 三、发现的问题

### 3.1 压缩未启用

**问题描述**: 所有列族都使用 `compression: NONE`

**影响**:
- 存储空间浪费约 40-60%
- I/O 读写性能下降 20-30%
- 网络传输开销增加

### 3.2 Row Key 设计问题

**问题描述**:
- 时间戳格式 `2024-11-20T11:56:25` 包含特殊字符 `-` 和 `:`
- 使用下划线 `_` 分隔传感器ID和时间戳

**影响**:
- 字典排序可能与时间顺序不一致
- 范围扫描效率降低

### 3.3 数据冗余

**问题描述**:
- `recordTime` 同时出现在 Row Key 和列值中
- `sensor_type` 在每行都重复存储

**影响**:
- 存储空间浪费 10-20%
- 数据一致性风险

### 3.4 命名空间不一致

**问题描述**:
- `newData` 没有命名空间
- `JianCeYuJing:sensorData` 使用了命名空间

**影响**:
- 管理混乱
- 权限控制困难

---

## 四、优化建议

### 4.1 启用压缩 (高优先级)

```bash
# 在 HBase Shell 中执行

# 优化 newData 表
disable 'newData'
alter 'newData', {NAME => 'cf_data', COMPRESSION => 'SNAPPY'}
enable 'newData'

# 优化 JianCeYuJing:sensorData 表
disable 'JianCeYuJing:sensorData'
alter 'JianCeYuJing:sensorData', {NAME => 'iotData', COMPRESSION => 'SNAPPY'}
alter 'JianCeYuJing:sensorData', {NAME => 'iotInfo', COMPRESSION => 'SNAPPY'}
enable 'JianCeYuJing:sensorData'
```

### 4.2 优化 Row Key 设计 (中优先级)

**方案一**: 紧凑时间格式
```
当前: D009G3201010101001M00_2024-11-20T11:56:25.8531
优化: D009G3201010101001M00_20241120T1156258531
```

**方案二**: 反转时间戳 (支持最新数据优先查询)
```
优化: D009G3201010101001M00_99999999999999-20241120T1156258531
```

### 4.3 启用布隆过滤器 (中优先级)

```bash
# 优化随机读取性能
alter 'newData', {NAME => 'cf_data', BLOOMFILTER => 'ROWCOL'}
alter 'JianCeYuJing:sensorData', {NAME => 'iotData', BLOOMFILTER => 'ROWCOL'}
```

### 4.4 清理禁用表 (低优先级)

```bash
# 如果 sensor_data 确认不再使用
drop 'sensor_data'
```

### 4.5 统一命名空间 (低优先级)

```bash
# 创建命名空间
create_namespace 'JianCeYuJing'

# 迁移 newData 表
create 'JianCeYuJing:newData', 'cf_data'
# 迁移数据后删除旧表
disable 'newData'
drop 'newData'
```

---

## 五、性能影响预估

| 优化项 | 存储节省 | 查询性能提升 | 实施难度 |
|--------|----------|--------------|----------|
| 启用 SNAPPY 压缩 | 40-60% | 20-30% | 低 |
| 优化 Row Key | - | 30-50% | 高 |
| 布隆过滤器 | - | 50-80% (随机读) | 低 |
| 清理冗余数据 | 10-20% | 5-10% | 中 |
| 统一命名空间 | - | - | 中 |

---

## 六、实施优先级建议

| 优先级 | 优化项 | 预计收益 | 风险 |
|--------|--------|----------|------|
| P0 | 启用 SNAPPY 压缩 | 高 | 低 |
| P1 | 启用布隆过滤器 | 中 | 低 |
| P2 | 清理禁用表 | 低 | 低 |
| P3 | 统一命名空间 | 低 | 中 |
| P4 | 优化 Row Key | 高 | 高 |

---

## 七、附录

### 7.1 当前表配置详情

**newData 表**:
```
'name': b'cf_data:'
'max_versions': 1
'compression': b'NONE'
'in_memory': False
'bloom_filter_type': b'ROW'
'block_cache_enabled': True
'time_to_live': 2147483647
```

**JianCeYuJing:sensorData 表**:
```
# iotData 列族
'name': b'iotData:'
'max_versions': 1
'compression': b'NONE'
'in_memory': False
'bloom_filter_type': b'ROW'
'block_cache_enabled': True
'time_to_live': 2147483647

# iotInfo 列族
'name': b'iotInfo:'
'max_versions': 1
'compression': b'NONE'
'in_memory': False
'bloom_filter_type': b'ROW'
'block_cache_enabled': True
'time_to_live': 2147483647
```

### 7.2 传感器类型编码

| 编码 | 类型 | 说明 |
|------|------|------|
| 008 | IoT监测传感器 | 电量、监测值 |
| 009 | GPS位移传感器 | 2D/3D位移、GPS坐标 |

---

**报告生成工具**: HBase MCP Server v0.1.0  
**分析完成时间**: 2026-02-18
