import { describe, expect, it } from 'vitest'
import { createFantasyMapStrokeDraft, normalizeStrokePoints } from './strokes'

describe('fantasy map strokes', () => {
  it('normalizes consecutive duplicate points and clamps boundaries', () => {
    expect(normalizeStrokePoints([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1300, y: -5 },
    ])).toEqual([
      { x: 1, y: 1 },
      { x: 1200, y: 0 },
    ])
  })

  it('creates a stroke draft when at least two points remain', () => {
    expect(createFantasyMapStrokeDraft([
      { x: 10, y: 20 },
      { x: 40, y: 80 },
    ], {
      color: '#1d4ed8',
      width: 4,
    })).toEqual({
      color: '#1d4ed8',
      width: 4,
      points: [
        { x: 10, y: 20 },
        { x: 40, y: 80 },
      ],
    })
  })

  it('skips drafts with fewer than two unique points', () => {
    expect(createFantasyMapStrokeDraft([
      { x: 10, y: 20 },
      { x: 10, y: 20 },
    ], {
      color: '#1d4ed8',
      width: 4,
    })).toBeUndefined()
  })
})
