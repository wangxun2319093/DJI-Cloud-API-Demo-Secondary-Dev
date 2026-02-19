package com.dji.sample.map.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ManageMapDTO {

    @JsonProperty("id")
    private String mapId;

    @JsonProperty("map_name")
    private String mapName;

    @JsonProperty("workspace_id")
    private String workspaceId;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("username")
    private String username;

    @JsonProperty("map_format")
    private String mapFormat;

    @JsonProperty("object_key")
    private String objectKey;

    @JsonProperty("min_longitude")
    private BigDecimal minLongitude;

    @JsonProperty("max_longitude")
    private BigDecimal maxLongitude;

    @JsonProperty("min_latitude")
    private BigDecimal minLatitude;

    @JsonProperty("max_latitude")
    private BigDecimal maxLatitude;

    @JsonProperty("center_longitude")
    private BigDecimal centerLongitude;

    @JsonProperty("center_latitude")
    private BigDecimal centerLatitude;

    @JsonProperty("file_size")
    private Long fileSize;

    @JsonProperty("status")
    private Integer status;

    @JsonProperty("create_time")
    private Long createTime;

    @JsonProperty("update_time")
    private Long updateTime;
}
