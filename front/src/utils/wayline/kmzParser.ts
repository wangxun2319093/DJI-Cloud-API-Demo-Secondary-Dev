import JSZip from 'jszip'
import type { MissionConfig } from './kmzGenerator'
import type { Point } from './geoUtils'

export interface ParsedKMZResult {
  waypoints: Point[]
  config: Partial<MissionConfig>
  success: boolean
  error?: string
}

export const parseKMZ = async (file: File): Promise<ParsedKMZResult> => {
  try {
    const zip = await JSZip.loadAsync(file)

    const waylinesFile = zip.file('wpmz/waylines.wpml')
    if (!waylinesFile) {
      throw new Error('waylines.wpml not found in KMZ file')
    }

    const waylinesContent = await waylinesFile.async('string')

    let templateContent: string | null = null
    const templateFile = zip.file('wpmz/template.kml')
    if (templateFile) {
      templateContent = await templateFile.async('string')
    }

    const parser = new DOMParser()
    const waylinesDoc = parser.parseFromString(waylinesContent, 'text/xml')
    const templateDoc = templateContent ? parser.parseFromString(templateContent, 'text/xml') : null

    const config = extractMissionConfig(waylinesDoc, templateDoc)

    const waypoints = extractWaypoints(waylinesDoc)

    return {
      waypoints,
      config,
      success: true
    }
  } catch (error: any) {
    console.error('Error parsing KMZ:', error)
    return {
      waypoints: [],
      config: null,
      success: false,
      error: error.message
    }
  }
}

const getTextContent = (doc: Document, tagName: string): string | null => {
  const simpleName = tagName.replace(/^wpml:/, '')

  let elements = doc.getElementsByTagName('wpml:' + simpleName)
  if (elements.length > 0) {
    return elements[0].textContent?.trim() || null
  }

  elements = doc.getElementsByTagName(simpleName)
  if (elements.length > 0) {
    return elements[0].textContent?.trim() || null
  }

  return null
}

const extractMissionConfig = (waylinesDoc: Document, templateDoc: Document | null): Partial<MissionConfig> => {
  const config: Partial<MissionConfig> = {
    flyToWaylineMode: getTextContent(waylinesDoc, 'wpml:flyToWaylineMode') as any || 'safely',
    finishAction: getTextContent(waylinesDoc, 'wpml:finishAction') as any || 'goHome',
    exitOnRCLost: getTextContent(waylinesDoc, 'wpml:exitOnRCLost') as any || 'goContinue',
    executeRCLostAction: getTextContent(waylinesDoc, 'wpml:executeRCLostAction') as any || 'goBack',
    takeOffSecurityHeight: Number(getTextContent(waylinesDoc, 'wpml:takeOffSecurityHeight')) || 20,
    globalTransitionalSpeed: Number(getTextContent(waylinesDoc, 'wpml:globalTransitionalSpeed')) || 10,
    executeHeightMode: getTextContent(waylinesDoc, 'wpml:executeHeightMode') as any || 'relativeToStartPoint',
    droneEnumValue: Number(getTextContent(waylinesDoc, 'wpml:droneEnumValue')) || 99,
    droneSubEnumValue: Number(getTextContent(waylinesDoc, 'wpml:droneSubEnumValue')) || 1,
    globalAction: 'none',
    isClosedLoop: true,
    flightHeight: 60,
    realtimeFollowSurface: false,
    climbMode: 'vertical',
    aiPatrol: {
      enabled: false,
      scanSpacing: 20,
      direction: 0,
      margin: 0,
      gimbalPitchAngle: -45,
      targets: {
        people: false,
        vehicle: false,
        boat: false
      }
    }
  }

  if (templateDoc) {
    const templateType = getTextContent(templateDoc, 'wpml:templateType')
    config.aiPatrol!.enabled = templateType === 'targetdetection'

    if (config.aiPatrol!.enabled) {
      config.aiPatrol!.direction = Number(getTextContent(templateDoc, 'wpml:direction')) || 0
      config.aiPatrol!.margin = Number(getTextContent(templateDoc, 'wpml:margin')) || 0

      const heightMode = getTextContent(templateDoc, 'wpml:heightMode')
      if (heightMode) {
        config.executeHeightMode = heightMode as any
      }

      const globalShootHeight = getTextContent(templateDoc, 'wpml:globalShootHeight')
      if (globalShootHeight) {
        config.flightHeight = Number(globalShootHeight)
      }

      const isRealtimeSurfaceFollow = getTextContent(templateDoc, 'wpml:isRealtimeSurfaceFollow')
      if (isRealtimeSurfaceFollow) {
        config.realtimeFollowSurface = isRealtimeSurfaceFollow === '1'
      }

      const targetType = getTextContent(templateDoc, 'wpml:targetType')
      if (targetType) {
        const targets = targetType.split(',')
        config.aiPatrol!.targets!.people = targets.includes('person')
        config.aiPatrol!.targets!.vehicle = targets.includes('car')
        config.aiPatrol!.targets!.boat = targets.includes('boat')
      }
    }
  }

  const gimbalAngle = getTextContent(waylinesDoc, 'wpml:gimbalPitchRotateAngle')
  if (gimbalAngle) {
    config.aiPatrol!.gimbalPitchAngle = Number(gimbalAngle)
  }

  return config
}

const extractWaypoints = (waylinesDoc: Document): Point[] => {
  const waypoints: Point[] = []
  const placemarks = waylinesDoc.getElementsByTagName('Placemark')

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i]

    const indexElements = placemark.getElementsByTagName('wpml:index')
    if (indexElements.length === 0) continue

    const coordinates = placemark.getElementsByTagName('coordinates')[0]
    if (!coordinates) continue

    const coordText = coordinates.textContent?.trim() || ''
    const [lng, lat] = coordText.split(',').map(Number)

    const heightElements = placemark.getElementsByTagName('wpml:executeHeight')
    const speedElements = placemark.getElementsByTagName('wpml:waypointSpeed')

    const height = heightElements.length > 0 ? Number(heightElements[0].textContent) : 50
    const speed = speedElements.length > 0 ? Number(speedElements[0].textContent) : 10

    waypoints.push({
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
      height,
      speed
    })
  }

  return waypoints
}
