package com.dji.sample.map.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@TableName("manage_map")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ManageMapEntity implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    @TableField("map_id")
    private String mapId;

    @TableField("map_name")
    private String mapName;

    @TableField("workspace_id")
    private String workspaceId;

    @TableField("user_id")
    private String userId;

    @TableField("username")
    private String username;

    @TableField("map_format")
    private String mapFormat;

    @TableField("object_key")
    private String objectKey;

    @TableField("min_longitude")
    private BigDecimal minLongitude;

    @TableField("max_longitude")
    private BigDecimal maxLongitude;

    @TableField("min_latitude")
    private BigDecimal minLatitude;

    @TableField("max_latitude")
    private BigDecimal maxLatitude;

    @TableField("center_longitude")
    private BigDecimal centerLongitude;

    @TableField("center_latitude")
    private BigDecimal centerLatitude;

    @TableField("file_size")
    private Long fileSize;

    @TableField("status")
    private Integer status;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private Long createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private Long updateTime;
}
