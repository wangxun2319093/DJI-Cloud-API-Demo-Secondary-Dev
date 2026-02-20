const R = 6378137

const toRad = (d: number): number => d * Math.PI / 180

export interface Point {
  lat: number
  lng: number
  height?: number
  speed?: number
}

export const getDistance = (p1: Point, p2: Point): number => {
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const getPathLength = (path: Point[]): number => {
  let length = 0
  for (let i = 0; i < path.length - 1; i++) {
    length += getDistance(path[i], path[i + 1])
  }
  return length
}

export const getPolygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0

  let area = 0
  const origin = points[0]

  const project = (p: Point): { x: number; y: number } => {
    const x = (p.lng - origin.lng) * Math.PI / 180 * R * Math.cos(toRad(origin.lat))
    const y = (p.lat - origin.lat) * Math.PI / 180 * R
    return { x, y }
  }

  const projected = points.map(project)

  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length
    area += projected[i].x * projected[j].y
    area -= projected[j].x * projected[i].y
  }

  return Math.abs(area / 2)
}

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}分${s}秒`
}

interface Point2D {
  x: number
  y: number
}

const checkIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
  const ccw = (a: Point2D, b: Point2D, c: Point2D): boolean => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
  const p1_: Point2D = { x: p1.lng, y: p1.lat }
  const p2_: Point2D = { x: p2.lng, y: p2.lat }
  const p3_: Point2D = { x: p3.lng, y: p3.lat }
  const p4_: Point2D = { x: p4.lng, y: p4.lat }

  return (ccw(p1_, p3_, p4_) !== ccw(p2_, p3_, p4_)) && (ccw(p1_, p2_, p3_) !== ccw(p1_, p2_, p4_))
}

export const willSelfIntersect = (newPoint: Point, currentPoints: Point[]): boolean => {
  if (currentPoints.length < 2) return false

  const lastPoint = currentPoints[currentPoints.length - 1]

  for (let i = 0; i < currentPoints.length - 2; i++) {
    const p1 = currentPoints[i]
    const p2 = currentPoints[i + 1]

    if (checkIntersection(lastPoint, newPoint, p1, p2)) {
      return true
    }
  }

  return false
}
