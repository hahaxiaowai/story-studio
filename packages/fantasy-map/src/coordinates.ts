import type { FantasyMapPoint, FantasyMapSize, FantasyMapWorldPoint } from './types'

export const DEFAULT_MAP_SIZE: FantasyMapSize = {
  width: 1200,
  height: 720,
}

export function clampMapPoint(point: FantasyMapPoint, mapSize: FantasyMapSize = DEFAULT_MAP_SIZE): FantasyMapPoint {
  return {
    x: clamp(Math.round(point.x), 0, mapSize.width),
    y: clamp(Math.round(point.y), 0, mapSize.height),
  }
}

export function mapPointToWorld(point: FantasyMapPoint, mapSize: FantasyMapSize = DEFAULT_MAP_SIZE): FantasyMapWorldPoint {
  const clampedPoint = clampMapPoint(point, mapSize)

  return {
    x: clampedPoint.x - mapSize.width / 2,
    z: clampedPoint.y - mapSize.height / 2,
  }
}

export function worldPointToMap(point: FantasyMapWorldPoint, mapSize: FantasyMapSize = DEFAULT_MAP_SIZE): FantasyMapPoint {
  return clampMapPoint({
    x: point.x + mapSize.width / 2,
    y: point.z + mapSize.height / 2,
  }, mapSize)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
