import type { Point } from './geoUtils'

const EARTH_RADIUS = 6378137

export interface CameraPreset {
  name: string
  sensorWidth: number
  sensorHeight: number
  focalLength: number
  imageWidth: number
  imageHeight: number
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  m3e: {
    name: 'Mavic 3E',
    sensorWidth: 17.3,
    sensorHeight: 13,
    focalLength: 24,
    imageWidth: 5280,
    imageHeight: 3956
  },
  m3t: {
    name: 'Mavic 3T Wide',
    sensorWidth: 6.4,
    sensorHeight: 4.8,
    focalLength: 4.5,
    imageWidth: 1920,
    imageHeight: 1440
  },
  m30t: {
    name: 'M30T Wide',
    sensorWidth: 6.3,
    sensorHeight: 4.7,
    focalLength: 4.88,
    imageWidth: 1920,
    imageHeight: 1440
  },
  m300: {
    name: 'M300 RTK + P1',
    sensorWidth: 35.9,
    sensorHeight: 24,
    focalLength: 35,
    imageWidth: 8192,
    imageHeight: 5460
  }
}

export interface PolygonRouteOptions {
  spacing?: number
  angle?: number
  margin?: number
  height?: number
  speed?: number
  overlapRate?: number
  camera?: CameraPreset | null
  useCamera?: boolean
  optimizePath?: boolean
}

export interface RouteStats {
  totalDistance: string
  flightTime: number
  photoCount: number
}

export const calculateSpacing = (height: number, camera: CameraPreset, overlapRate: number, direction: 'lateral' | 'longitudinal' = 'lateral'): number => {
  const sensor = direction === 'lateral' ? camera.sensorWidth : camera.sensorHeight
  const imageSize = direction === 'lateral' ? camera.imageWidth : camera.imageHeight
  const gsd = (height * sensor) / (camera.focalLength * imageSize)
  const coverageWidth = gsd * imageSize

  return coverageWidth * (1 - overlapRate)
}

interface Point2D {
  x: number
  y: number
}

const projectToMeters = (lat: number, lng: number, origin: Point): Point2D => {
  const dLat = (lat - origin.lat) * Math.PI / 180
  const dLng = (lng - origin.lng) * Math.PI / 180
  const x = dLng * EARTH_RADIUS * Math.cos(origin.lat * Math.PI / 180)
  const y = dLat * EARTH_RADIUS
  return { x, y }
}

const unprojectFromMeters = (x: number, y: number, origin: Point): { lat: number; lng: number } => {
  const dLat = y / EARTH_RADIUS
  const lat = origin.lat + dLat * 180 / Math.PI
  const dLng = x / (EARTH_RADIUS * Math.cos(origin.lat * Math.PI / 180))
  const lng = origin.lng + dLng * 180 / Math.PI
  return { lat, lng }
}

const rotatePoint = (point: Point2D, angleRad: number, center: Point2D = { x: 0, y: 0 }): Point2D => {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  }
}

const getBoundingBox = (polygon: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity
  polygon.forEach(p => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  return { minX, minY, maxX, maxY }
}

const getPolygonCenter = (polygon: Point2D[]): Point2D => {
  let sumX = 0; let sumY = 0
  polygon.forEach(p => {
    sumX += p.x
    sumY += p.y
  })
  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length
  }
}

const pointToSegmentDistance = (point: Point2D, segStart: Point2D, segEnd: Point2D): { distance: number; t: number } => {
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    const dist = Math.sqrt((point.x - segStart.x) ** 2 + (point.y - segStart.y) ** 2)
    return { distance: dist, t: 0 }
  }

  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  const closestX = segStart.x + t * dx
  const closestY = segStart.y + t * dy
  const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2)

  return { distance, t }
}

const interpolateHeight = (
  point: Point2D,
  boundaryPoints: Point[],
  projectedBoundary: Point2D[],
  defaultHeight: number
): number => {
  if (boundaryPoints.length < 2) {
    return defaultHeight
  }

  let minDistance = Infinity
  let bestT = 0
  let bestEdgeIndex = -1

  for (let i = 0; i < projectedBoundary.length; i++) {
    const j = (i + 1) % projectedBoundary.length
    const segStart = projectedBoundary[i]
    const segEnd = projectedBoundary[j]

    const { distance, t } = pointToSegmentDistance(point, segStart, segEnd)

    if (distance < minDistance) {
      minDistance = distance
      bestT = t
      bestEdgeIndex = i
    }
  }

  if (bestEdgeIndex >= 0) {
    const height1 = boundaryPoints[bestEdgeIndex].height ?? defaultHeight
    const nextIndex = (bestEdgeIndex + 1) % boundaryPoints.length
    const height2 = boundaryPoints[nextIndex].height ?? defaultHeight

    return height1 + (height2 - height1) * bestT
  }

  return defaultHeight
}

const shrinkPolygon = (polygon: Point2D[], marginMeters: number): Point2D[] => {
  const center = getPolygonCenter(polygon)

  const distances = polygon.map(p => {
    const dx = p.x - center.x
    const dy = p.y - center.y
    return Math.sqrt(dx * dx + dy * dy)
  })

  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length

  const scale = Math.max(0.1, (avgDistance - marginMeters) / avgDistance)

  return polygon.map(p => ({
    x: center.x + (p.x - center.x) * scale,
    y: center.y + (p.y - center.y) * scale
  }))
}

export const generatePolygonRoute = (boundaryPoints: Point[], options: PolygonRouteOptions = {}): Point[] => {
  console.log('🚁 Generate polygon route - Start')
  console.log('Boundary points:', boundaryPoints.length)
  console.log('Boundary points heights:', boundaryPoints.map(p => p.height))
  console.log('Config:', options)

  if (boundaryPoints.length < 3) {
    console.error('At least 3 boundary points required to generate polygon route')
    return []
  }

  const {
    spacing = 30,
    angle = 0,
    margin = 0,
    height = 50,
    speed = 5,
    overlapRate = 0.7,
    camera = null,
    useCamera = false,
    optimizePath = true
  } = options

  let finalSpacing = spacing
  if (useCamera && camera) {
    finalSpacing = calculateSpacing(height, camera, overlapRate, 'lateral')
    console.log('📷 Calculate spacing based on camera params:', finalSpacing.toFixed(2), 'm')
  }

  const origin = boundaryPoints[0]

  let polygon: Point2D[] = boundaryPoints.map(p => projectToMeters(p.lat, p.lng, origin))
  const originalPolygon: Point2D[] = polygon
  console.log('✓ Projection complete')

  if (margin > 0) {
    polygon = shrinkPolygon(polygon, margin)
    if (polygon.length < 3) {
      console.error('Polygon too small after applying margin')
      return []
    }
    console.log('✓ Margin applied:', margin, 'm')
  }

  const center = getPolygonCenter(polygon)

  const angleRad = -angle * Math.PI / 180
  const rotatedPolygon = polygon.map(p => rotatePoint(p, angleRad, center))
  const rotatedOriginalPolygon = originalPolygon.map(p => rotatePoint(p, angleRad, center))
  console.log('✓ Rotation complete:', angle, 'degrees')

  const bbox = getBoundingBox(rotatedPolygon)
  console.log('✓ Bounding box:', {
    width: (bbox.maxX - bbox.minX).toFixed(2),
    height: (bbox.maxY - bbox.minY).toFixed(2)
  })

  const waypoints: Point2D[] = []
  let currentY = bbox.minY + finalSpacing / 2
  let lineIndex = 0

  while (currentY <= bbox.maxY) {
    const intersections: number[] = []

    for (let i = 0; i < rotatedPolygon.length; i++) {
      const j = (i + 1) % rotatedPolygon.length
      const p1 = rotatedPolygon[i]
      const p2 = rotatedPolygon[j]

      if ((p1.y <= currentY && p2.y > currentY) || (p1.y > currentY && p2.y <= currentY)) {
        const t = (currentY - p1.y) / (p2.y - p1.y)
        const x = p1.x + t * (p2.x - p1.x)
        intersections.push(x)
      }
    }

    intersections.sort((a, b) => a - b)

    const isLeftToRight = lineIndex % 2 === 0
    for (let k = 0; k < intersections.length; k += 2) {
      if (k + 1 >= intersections.length) break

      const x1 = intersections[k]
      const x2 = intersections[k + 1]

      if (isLeftToRight) {
        waypoints.push({ x: x1, y: currentY })
        waypoints.push({ x: x2, y: currentY })
      } else {
        waypoints.push({ x: x2, y: currentY })
        waypoints.push({ x: x1, y: currentY })
      }
    }

    currentY += finalSpacing
    lineIndex++
  }

  console.log('✓ Waypoints generated:', waypoints.length)

  let optimizedWaypoints = waypoints
  if (optimizePath && waypoints.length > 4) {
    optimizedWaypoints = optimizeRoutePath(waypoints)
    console.log('✓ Path optimization complete')
  }

  const unrotatedWaypoints = optimizedWaypoints.map(p => rotatePoint(p, -angleRad, center))
  const unrotatedOriginalPolygon = rotatedOriginalPolygon.map(p => rotatePoint(p, -angleRad, center))

  const result = unrotatedWaypoints.map((p, index) => {
    const coords = unprojectFromMeters(p.x, p.y, origin)
    const interpolatedHeight = interpolateHeight(p, boundaryPoints, unrotatedOriginalPolygon, height)
    return {
      lat: Number(coords.lat.toFixed(7)),
      lng: Number(coords.lng.toFixed(7)),
      height: Math.round(interpolatedHeight * 10) / 10,
      speed: speed,
      index: index
    }
  })

  console.log('🎉 Polygon route generation complete! Total waypoints:', result.length)
  return result
}

const optimizeRoutePath = (waypoints: Point2D[]): Point2D[] => {
  if (waypoints.length <= 2) return waypoints

  const optimized: Point2D[] = [waypoints[0]]

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1]
    const curr = waypoints[i]
    const next = waypoints[i + 1]

    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y

    const crossProduct = Math.abs(dx1 * dy2 - dy1 * dx2)

    if (crossProduct > 0.01) {
      optimized.push(curr)
    }
  }

  optimized.push(waypoints[waypoints.length - 1])
  return optimized
}

export const calculateRouteStats = (waypoints: Point[]): RouteStats => {
  if (waypoints.length < 2) {
    return {
      totalDistance: '0',
      flightTime: 0,
      photoCount: 0
    }
  }

  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    const dx = p2.lng - p1.lng
    const dy = p2.lat - p1.lat
    totalDistance += Math.sqrt(dx * dx + dy * dy) * EARTH_RADIUS * Math.PI / 180
  }

  const avgSpeed = waypoints[0]?.speed || 5
  const flightTime = totalDistance / avgSpeed

  return {
    totalDistance: totalDistance.toFixed(2),
    flightTime: Math.ceil(flightTime),
    photoCount: waypoints.length
  }
}

export const isPolygonValid = (points: Point[]): boolean => {
  if (points.length < 3) return false

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].lng - points[j].lng
      const dy = points[i].lat - points[j].lat
      if (Math.abs(dx) < 0.000001 && Math.abs(dy) < 0.000001) {
        return false
      }
    }
  }

  return true
}

export default {
  generatePolygonRoute,
  calculateSpacing,
  calculateRouteStats,
  isPolygonValid,
  CAMERA_PRESETS
}
