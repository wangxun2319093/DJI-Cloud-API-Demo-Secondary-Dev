import type { Point } from './geoUtils'

const projectToMeters = (lat: number, lng: number, origin: Point): { x: number; y: number } => {
  const R = 6378137
  const dLat = (lat - origin.lat) * Math.PI / 180
  const dLng = (lng - origin.lng) * Math.PI / 180
  const x = dLng * R * Math.cos(origin.lat * Math.PI / 180)
  const y = dLat * R
  return { x, y }
}

const unprojectFromMeters = (x: number, y: number, origin: Point): { lat: number; lng: number } => {
  const R = 6378137
  const dLat = y / R
  const lat = origin.lat + dLat * 180 / Math.PI
  const dLng = x / (R * Math.cos(origin.lat * Math.PI / 180))
  const lng = origin.lng + dLng * 180 / Math.PI
  return { lat, lng }
}

interface Point2D {
  x: number
  y: number
}

const isPointInPolygon = (point: Point2D, polygon: Point2D[]): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x; const yi = polygon[i].y
    const xj = polygon[j].x; const yj = polygon[j].y
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
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

const rotatePoint = (point: Point2D, angleRad: number): Point2D => {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  }
}

const shrinkPolygon = (polygon: Point2D[], margin: number): Point2D[] => {
  let centerX = 0; let centerY = 0
  polygon.forEach(p => {
    centerX += p.x
    centerY += p.y
  })
  centerX /= polygon.length
  centerY /= polygon.length

  let avgRadius = 0
  polygon.forEach(p => {
    const dx = p.x - centerX
    const dy = p.y - centerY
    avgRadius += Math.sqrt(dx * dx + dy * dy)
  })
  avgRadius /= polygon.length

  const scale = Math.max(0.1, (avgRadius - margin) / avgRadius)

  return polygon.map(p => ({
    x: centerX + (p.x - centerX) * scale,
    y: centerY + (p.y - centerY) * scale
  }))
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

export const generateScanPath = (boundaryPoints: Point[], spacingMeters: number, directionAngle: number = 0, marginMeters: number = 0): Point[] => {
  console.log('generateScanPath called with:', boundaryPoints.length, 'points, spacing:', spacingMeters, 'direction:', directionAngle, 'margin:', marginMeters)

  if (boundaryPoints.length < 3) {
    console.log('Not enough points for scan path')
    return []
  }

  const origin = boundaryPoints[0]

  let polygon: Point2D[] = boundaryPoints.map(p => projectToMeters(p.lat, p.lng, origin))
  const originalPolygon: Point2D[] = polygon

  if (marginMeters > 0) {
    polygon = shrinkPolygon(polygon, marginMeters)
    if (polygon.length < 3) {
      console.log('Polygon too small after applying margin')
      return []
    }
  }

  const angleRad = -(directionAngle + 90) * Math.PI / 180
  const rotatedPolygon = polygon.map(p => rotatePoint(p, angleRad))
  const rotatedOriginalPolygon = originalPolygon.map(p => rotatePoint(p, angleRad))

  const bbox = getBoundingBox(rotatedPolygon)
  console.log('Bounding box after rotation:', bbox)

  const waypoints: Point2D[] = []
  let scanLineY = bbox.minY + spacingMeters / 2
  let isLeftToRight = true

  while (scanLineY <= bbox.maxY) {
    const intersections: number[] = []
    for (let i = 0, j = rotatedPolygon.length - 1; i < rotatedPolygon.length; j = i++) {
      const p1 = rotatedPolygon[i]
      const p2 = rotatedPolygon[j]

      if ((p1.y < scanLineY && p2.y >= scanLineY) || (p2.y < scanLineY && p1.y >= scanLineY)) {
        const x = p1.x + (scanLineY - p1.y) * (p2.x - p1.x) / (p2.y - p1.y)
        intersections.push(x)
      }
    }

    intersections.sort((a, b) => a - b)

    for (let k = 0; k < intersections.length; k += 2) {
      if (k + 1 >= intersections.length) break

      const x1 = intersections[k]
      const x2 = intersections[k + 1]

      if (isLeftToRight) {
        waypoints.push({ x: x1, y: scanLineY })
        waypoints.push({ x: x2, y: scanLineY })
      } else {
        waypoints.push({ x: x2, y: scanLineY })
        waypoints.push({ x: x1, y: scanLineY })
      }
    }

    scanLineY += spacingMeters
    isLeftToRight = !isLeftToRight
  }

  console.log('Generated', waypoints.length, 'scan waypoints')

  const unrotatedWaypoints = waypoints.map(p => rotatePoint(p, -angleRad))
  const unrotatedOriginalPolygon = rotatedOriginalPolygon.map(p => rotatePoint(p, -angleRad))

  const defaultHeight = boundaryPoints[0]?.height || 50
  const defaultSpeed = boundaryPoints[0]?.speed || 10

  return unrotatedWaypoints.map(p => {
    const coords = unprojectFromMeters(p.x, p.y, origin)
    const interpolatedHeight = interpolateHeight(p, boundaryPoints, unrotatedOriginalPolygon, defaultHeight)
    return {
      lat: Number(coords.lat.toFixed(7)),
      lng: Number(coords.lng.toFixed(7)),
      height: Math.round(interpolatedHeight * 10) / 10,
      speed: defaultSpeed
    }
  })
}
