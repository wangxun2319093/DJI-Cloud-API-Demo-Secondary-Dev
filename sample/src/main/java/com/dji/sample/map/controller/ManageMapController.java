package com.dji.sample.map.controller;

import com.dji.sample.common.model.CustomClaim;
import com.dji.sample.map.model.dto.ManageMapDTO;
import com.dji.sample.map.service.IManageMapService;
import com.dji.sdk.common.HttpResultResponse;
import com.dji.sdk.common.PaginationData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Objects;

import static com.dji.sample.component.AuthInterceptor.TOKEN_CLAIM;

@RestController
@RequestMapping("${url.map.prefix:${url.wayline.prefix}}${url.map.version:${url.wayline.version}}/workspaces")
public class ManageMapController {

    private static final Logger log = LoggerFactory.getLogger(ManageMapController.class);

    @Autowired
    private IManageMapService manageMapService;

    @PostMapping("/{workspace_id}/maps/upload")
    public HttpResultResponse uploadDsmFile(
            HttpServletRequest request,
            @PathVariable("workspace_id") String workspaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "map_name", required = false) String mapName,
            @RequestParam(value = "map_format", required = false, defaultValue = "3dtiles") String mapFormat) {
        
        log.info("=== DSM Upload Request ===");
        log.info("workspaceId: {}", workspaceId);
        log.info("mapName: {}", mapName);
        log.info("mapFormat: {}", mapFormat);
        log.info("file isEmpty: {}", file == null || file.isEmpty());
        log.info("file size: {}", file != null ? file.getSize() : 0);
        log.info("file name: {}", file != null ? file.getOriginalFilename() : "null");
        
        if (Objects.isNull(file) || file.isEmpty()) {
            log.error("No file received in request");
            return HttpResultResponse.error("No file received.");
        }

        try {
            CustomClaim customClaim = (CustomClaim) request.getAttribute(TOKEN_CLAIM);
            if (customClaim == null) {
                log.error("No authentication claim found in request");
                return HttpResultResponse.error("Unauthorized request.");
            }
            
            String userId = customClaim.getId();
            String username = customClaim.getUsername();
            log.info("userId: {}, username: {}", userId, username);

            manageMapService.uploadDsmFile(file, workspaceId, userId, username, mapName, mapFormat);
            log.info("DSM file uploaded successfully");
            return HttpResultResponse.success();
        } catch (Exception e) {
            log.error("Failed to upload DSM file: {}", e.getMessage(), e);
            return HttpResultResponse.error("Failed to upload DSM file: " + e.getMessage());
        }
    }

    @GetMapping("/{workspace_id}/maps")
    public HttpResultResponse<PaginationData<ManageMapDTO>> getMapList(
            @PathVariable("workspace_id") String workspaceId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "10") int pageSize) {
        
        PaginationData<ManageMapDTO> data = manageMapService.getMapsByWorkspaceId(workspaceId, page, pageSize);
        return HttpResultResponse.success(data);
    }

    @GetMapping("/{workspace_id}/maps/all")
    public HttpResultResponse<List<ManageMapDTO>> getAllMaps(
            @PathVariable("workspace_id") String workspaceId) {
        
        List<ManageMapDTO> maps = manageMapService.getMapsByWorkspaceIdList(workspaceId);
        return HttpResultResponse.success(maps);
    }

    @GetMapping("/{workspace_id}/maps/{map_id}")
    public HttpResultResponse<ManageMapDTO> getMapDetail(
            @PathVariable("workspace_id") String workspaceId,
            @PathVariable("map_id") String mapId) {
        
        ManageMapDTO map = manageMapService.getMapByMapId(workspaceId, mapId);
        if (map == null) {
            return HttpResultResponse.error("Map not found.");
        }
        return HttpResultResponse.success(map);
    }

    @DeleteMapping("/{workspace_id}/maps/{map_id}")
    public HttpResultResponse deleteMap(
            @PathVariable("workspace_id") String workspaceId,
            @PathVariable("map_id") String mapId) {
        
        boolean isDeleted = manageMapService.deleteByMapId(workspaceId, mapId);
        return isDeleted ? HttpResultResponse.success() : HttpResultResponse.error("Failed to delete map.");
    }

    @GetMapping("/{workspace_id}/maps/{map_id}/url")
    public void getMapUrl(
            @PathVariable("workspace_id") String workspaceId,
            @PathVariable("map_id") String mapId,
            HttpServletRequest req,
            HttpServletResponse rsp) {
        try {
            URL url = manageMapService.getObjectUrl(workspaceId, mapId);
            rsp.sendRedirect(url.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
