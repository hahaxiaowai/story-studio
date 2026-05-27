import type { FantasyMapBrush, FantasyMapPoint, FantasyMapSize, FantasyMapStrokeDraft } from './types'
import { clampMapPoint, DEFAULT_MAP_SIZE } from './coordinates'

const MIN_STROKE_POINTS = 2

export function normalizeStrokePoints(points: FantasyMapPoint[], mapSize: FantasyMapSize = DEFAULT_MAP_SIZE): FantasyMapPoint[] {
  return points.reduce<FantasyMapPoint[]>((result, point) => {
    const clampedPoint = clampMapPoint(point, mapSize)
    const previousPoint = result.at(-1)

    if (previousPoint && previousPoint.x === clampedPoint.x && previousPoint.y === clampedPoint.y)
      return result

    return [...result, clampedPoint]
  }, [])
}

export function createFantasyMapStrokeDraft(
  points: FantasyMapPoint[],
  brush: FantasyMapBrush,
  mapSize: FantasyMapSize = DEFAULT_MAP_SIZE,
): FantasyMapStrokeDraft | undefined {
  const normalizedPoints = normalizeStrokePoints(points, mapSize)

  if (normalizedPoints.length < MIN_STROKE_POINTS)
    return undefined

  return {
    color: brush.color,
    width: brush.width,
    points: normalizedPoints,
  }
}
