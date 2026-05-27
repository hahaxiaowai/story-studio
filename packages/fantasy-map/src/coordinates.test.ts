import { describe, expect, it } from 'vitest'
import { clampMapPoint, mapPointToWorld, worldPointToMap } from './coordinates'

describe('fantasy map coordinates', () => {
  it('maps two-dimensional points to centered world coordinates', () => {
    expect(mapPointToWorld({ x: 600, y: 360 })).toEqual({ x: 0, z: 0 })
    expect(mapPointToWorld({ x: 0, y: 0 })).toEqual({ x: -600, z: -360 })
    expect(mapPointToWorld({ x: 1200, y: 720 })).toEqual({ x: 600, z: 360 })
  })

  it('maps world coordinates back to clamped two-dimensional points', () => {
    expect(worldPointToMap({ x: 0, z: 0 })).toEqual({ x: 600, y: 360 })
    expect(worldPointToMap({ x: -800, z: 900 })).toEqual({ x: 0, y: 720 })
  })

  it('clamps and rounds map points to the map boundary', () => {
    expect(clampMapPoint({ x: -10.4, y: 721.8 })).toEqual({ x: 0, y: 720 })
    expect(clampMapPoint({ x: 10.4, y: 20.6 })).toEqual({ x: 10, y: 21 })
  })
})
