import request, { IPage, IWorkspaceResponse, IListWorkspaceResponse } from '/@/api/http/request'

const HTTP_PREFIX = '/map/api/v1'

export interface ManageMap {
  id: string
  map_name: string
  workspace_id: string
  user_id: string
  username: string
  map_format: string
  object_key: string
  min_longitude: number | null
  max_longitude: number | null
  min_latitude: number | null
  max_latitude: number | null
  center_longitude: number | null
  center_latitude: number | null
  file_size: number
  status: number
  create_time: number
  update_time: number
}

export const getMapList = async function (workspaceId: string, page: IPage): Promise<IWorkspaceResponse<any>> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps?page=${page.page}&page_size=${page.page_size}`
  const result = await request.get(url)
  return result.data
}

export const getAllMaps = async function (workspaceId: string): Promise<IWorkspaceResponse<ManageMap[]>> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps/all`
  const result = await request.get(url)
  return result.data
}

export const getMapDetail = async function (workspaceId: string, mapId: string): Promise<IWorkspaceResponse<ManageMap>> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps/${mapId}`
  const result = await request.get(url)
  return result.data
}

export const deleteMap = async function (workspaceId: string, mapId: string): Promise<IWorkspaceResponse<any>> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps/${mapId}`
  const result = await request.delete(url)
  return result.data
}

export const uploadDsmFile = async function (
  workspaceId: string,
  file: File,
  mapName?: string,
  mapFormat?: string
): Promise<IWorkspaceResponse<any>> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps/upload`
  const formData = new FormData()
  formData.append('file', file)
  if (mapName) {
    formData.append('map_name', mapName)
  }
  if (mapFormat) {
    formData.append('map_format', mapFormat)
  }
  const result = await request.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return result.data
}

export const getMapUrl = async function (workspaceId: string, mapId: string): Promise<string> {
  const url = `${HTTP_PREFIX}/workspaces/${workspaceId}/maps/${mapId}/url`
  return url
}
