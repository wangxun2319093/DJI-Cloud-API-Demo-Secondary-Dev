package com.dji.sample.map.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dji.sample.component.oss.model.OssConfiguration;
import com.dji.sample.component.oss.service.impl.OssServiceContext;
import com.dji.sample.map.dao.IManageMapMapper;
import com.dji.sample.map.model.dto.ManageMapDTO;
import com.dji.sample.map.model.entity.ManageMapEntity;
import com.dji.sample.map.service.IManageMapService;
import com.dji.sdk.common.Pagination;
import com.dji.sdk.common.PaginationData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URL;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@Transactional
public class ManageMapServiceImpl implements IManageMapService {

    private static final Logger log = LoggerFactory.getLogger(ManageMapServiceImpl.class);

    @Autowired
    private IManageMapMapper mapper;

    @Autowired
    private OssServiceContext ossService;

    @Value("${map.dsm.temp-dir:./temp/dsm}")
    private String tempDir;

    private static final String MAP_OBJECT_PREFIX = "map/";

    @Override
    public PaginationData<ManageMapDTO> getMapsByWorkspaceId(String workspaceId, int page, int pageSize) {
        Page<ManageMapEntity> pageResult = mapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<ManageMapEntity>()
                        .eq(ManageMapEntity::getWorkspaceId, workspaceId)
                        .orderByDesc(ManageMapEntity::getCreateTime)
        );

        List<ManageMapDTO> records = pageResult.getRecords()
                .stream()
                .map(this::entityConvertToDTO)
                .collect(Collectors.toList());

        return new PaginationData<>(records, new Pagination(pageResult.getCurrent(), pageResult.getSize(), pageResult.getTotal()));
    }

    @Override
    public ManageMapDTO getMapByMapId(String workspaceId, String mapId) {
        ManageMapEntity entity = mapper.selectOne(
                new LambdaQueryWrapper<ManageMapEntity>()
                        .eq(ManageMapEntity::getWorkspaceId, workspaceId)
                        .eq(ManageMapEntity::getMapId, mapId)
        );
        return entityConvertToDTO(entity);
    }

    @Override
    public Integer saveMap(String workspaceId, String userId, String username, ManageMapDTO mapDTO) {
        ManageMapEntity entity = dtoConvertToEntity(mapDTO);
        entity.setMapId(UUID.randomUUID().toString());
        entity.setWorkspaceId(workspaceId);
        entity.setUserId(userId);
        entity.setUsername(username);
        
        int result = mapper.insert(entity);
        return result > 0 ? entity.getId() : result;
    }

    @Override
    public Boolean deleteByMapId(String workspaceId, String mapId) {
        ManageMapDTO map = getMapByMapId(workspaceId, mapId);
        if (map == null) {
            return true;
        }

        boolean isDel = mapper.delete(
                new LambdaQueryWrapper<ManageMapEntity>()
                        .eq(ManageMapEntity::getWorkspaceId, workspaceId)
                        .eq(ManageMapEntity::getMapId, mapId)
        ) > 0;

        if (isDel && StringUtils.hasText(map.getObjectKey())) {
            ossService.deleteObject(OssConfiguration.bucket, map.getObjectKey());
        }
        return isDel;
    }

    @Override
    public void uploadDsmFile(MultipartFile file, String workspaceId, String userId, String username, String mapName, String mapFormat) {
        log.info("Starting uploadDsmFile - workspaceId: {}, userId: {}, mapName: {}, mapFormat: {}, fileSize: {}", 
                workspaceId, userId, mapName, mapFormat, file.getSize());
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unknown.tiff";
        }

        String mapId = UUID.randomUUID().toString();
        String objectKey = MAP_OBJECT_PREFIX + mapId + "/tileset.json";

        ManageMapEntity entity = ManageMapEntity.builder()
                .mapId(mapId)
                .mapName(StringUtils.hasText(mapName) ? mapName : originalFilename)
                .workspaceId(workspaceId)
                .userId(userId)
                .username(username)
                .mapFormat(StringUtils.hasText(mapFormat) ? mapFormat : "3dtiles")
                .objectKey(objectKey)
                .fileSize(file.getSize())
                .status(0)
                .build();

        log.info("Inserting map entity to database - mapId: {}", mapId);
        mapper.insert(entity);
        log.info("Map entity inserted successfully");

        try {
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            log.info("File extension: {}", fileExtension);
            
            if (".tiff".equals(fileExtension) || ".tif".equals(fileExtension)) {
                log.info("Processing GeoTIFF file...");
                processGeoTiffFile(file, mapId, entity);
            } else if (".zip".equals(fileExtension)) {
                log.info("Processing ZIP file...");
                processZipFile(file, mapId, entity);
            } else {
                throw new RuntimeException("Unsupported file format. Please upload GeoTIFF or ZIP file containing 3D Tiles.");
            }
            
            log.info("File processing completed successfully - mapId: {}", mapId);
        } catch (Exception e) {
            log.error("Failed to process DSM file - mapId: {}, error: {}", mapId, e.getMessage(), e);
            entity.setStatus(2);
            mapper.updateById(entity);
            throw new RuntimeException("Failed to process DSM file: " + e.getMessage(), e);
        }
    }

    private void processGeoTiffFile(MultipartFile file, String mapId, ManageMapEntity entity) throws IOException {
        log.info("Processing GeoTIFF file for mapId: {}", mapId);
        
        String objectKeyPrefix = MAP_OBJECT_PREFIX + mapId + "/";
        String tiffObjectKey = objectKeyPrefix + "original.tiff";
        
        log.info("Uploading GeoTIFF to MinIO - bucket: {}, key: {}", OssConfiguration.bucket, tiffObjectKey);
        
        try (InputStream inputStream = file.getInputStream()) {
            ossService.putObject(OssConfiguration.bucket, tiffObjectKey, inputStream);
            log.info("GeoTIFF uploaded to MinIO successfully");
        } catch (Exception e) {
            log.error("Failed to upload GeoTIFF to MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to storage: " + e.getMessage(), e);
        }
        
        entity.setObjectKey(tiffObjectKey);
        entity.setStatus(1);
        entity.setMapFormat("geotiff");
        mapper.updateById(entity);
        
        log.info("GeoTIFF processing completed - mapId: {}, objectKey: {}", mapId, tiffObjectKey);
    }

    private void processZipFile(MultipartFile file, String mapId, ManageMapEntity entity) throws IOException {
        log.info("Processing ZIP file for mapId: {}", mapId);
        
        String objectKeyPrefix = MAP_OBJECT_PREFIX + mapId + "/";
        String tilesetKey = null;
        
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            int fileCount = 0;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    String entryName = entry.getName();
                    String objectKey = objectKeyPrefix + entryName;
                    
                    log.debug("Extracting file: {} -> {}", entryName, objectKey);
                    
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                    }
                    
                    ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
                    ossService.putObject(OssConfiguration.bucket, objectKey, bais);
                    fileCount++;
                    
                    if (entryName.endsWith("tileset.json")) {
                        tilesetKey = objectKey;
                        log.info("Found tileset.json: {}", tilesetKey);
                    }
                }
            }
            log.info("Extracted {} files from ZIP", fileCount);
        }
        
        if (tilesetKey != null) {
            entity.setObjectKey(tilesetKey);
        } else {
            entity.setObjectKey(objectKeyPrefix + "tileset.json");
        }
        
        entity.setStatus(1);
        entity.setMapFormat("3dtiles");
        mapper.updateById(entity);
        
        log.info("ZIP processing completed - mapId: {}, objectKey: {}", mapId, entity.getObjectKey());
    }

    @Override
    public URL getObjectUrl(String workspaceId, String mapId) {
        ManageMapDTO map = getMapByMapId(workspaceId, mapId);
        if (map == null || !StringUtils.hasText(map.getObjectKey())) {
            throw new RuntimeException("Map not found: " + mapId);
        }
        return ossService.getObjectUrl(OssConfiguration.bucket, map.getObjectKey());
    }

    @Override
    public List<ManageMapDTO> getMapsByWorkspaceIdList(String workspaceId) {
        return mapper.selectList(
                new LambdaQueryWrapper<ManageMapEntity>()
                        .eq(ManageMapEntity::getWorkspaceId, workspaceId)
                        .eq(ManageMapEntity::getStatus, 1)
                        .orderByDesc(ManageMapEntity::getCreateTime)
        ).stream().map(this::entityConvertToDTO).collect(Collectors.toList());
    }

    private ManageMapDTO entityConvertToDTO(ManageMapEntity entity) {
        if (entity == null) {
            return null;
        }
        return ManageMapDTO.builder()
                .mapId(entity.getMapId())
                .mapName(entity.getMapName())
                .workspaceId(entity.getWorkspaceId())
                .userId(entity.getUserId())
                .username(entity.getUsername())
                .mapFormat(entity.getMapFormat())
                .objectKey(entity.getObjectKey())
                .minLongitude(entity.getMinLongitude())
                .maxLongitude(entity.getMaxLongitude())
                .minLatitude(entity.getMinLatitude())
                .maxLatitude(entity.getMaxLatitude())
                .centerLongitude(entity.getCenterLongitude())
                .centerLatitude(entity.getCenterLatitude())
                .fileSize(entity.getFileSize())
                .status(entity.getStatus())
                .createTime(entity.getCreateTime())
                .updateTime(entity.getUpdateTime())
                .build();
    }

    private ManageMapEntity dtoConvertToEntity(ManageMapDTO dto) {
        if (dto == null) {
            return null;
        }
        return ManageMapEntity.builder()
                .mapId(dto.getMapId())
                .mapName(dto.getMapName())
                .workspaceId(dto.getWorkspaceId())
                .userId(dto.getUserId())
                .username(dto.getUsername())
                .mapFormat(dto.getMapFormat())
                .objectKey(dto.getObjectKey())
                .minLongitude(dto.getMinLongitude())
                .maxLongitude(dto.getMaxLongitude())
                .minLatitude(dto.getMinLatitude())
                .maxLatitude(dto.getMaxLatitude())
                .centerLongitude(dto.getCenterLongitude())
                .centerLatitude(dto.getCenterLatitude())
                .fileSize(dto.getFileSize())
                .status(dto.getStatus())
                .build();
    }
}
