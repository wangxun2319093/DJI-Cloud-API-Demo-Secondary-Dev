package com.dji.sample.map.service;

import com.dji.sample.map.model.dto.ManageMapDTO;
import com.dji.sdk.common.PaginationData;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.util.List;

public interface IManageMapService {

    PaginationData<ManageMapDTO> getMapsByWorkspaceId(String workspaceId, int page, int pageSize);

    ManageMapDTO getMapByMapId(String workspaceId, String mapId);

    Integer saveMap(String workspaceId, String userId, String username, ManageMapDTO mapDTO);

    Boolean deleteByMapId(String workspaceId, String mapId);

    void uploadDsmFile(MultipartFile file, String workspaceId, String userId, String username, String mapName, String mapFormat);

    URL getObjectUrl(String workspaceId, String mapId);

    List<ManageMapDTO> getMapsByWorkspaceIdList(String workspaceId);
}
