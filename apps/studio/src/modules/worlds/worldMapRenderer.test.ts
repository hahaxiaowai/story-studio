import { describe, expect, it, vi } from 'vitest'
import { createWorldMapStrokeHandler } from './worldMapRenderer'

describe('world map renderer adapter', () => {
  it('persists completed renderer strokes through the world module', () => {
    const addMapStroke = vi.fn()
    const handleStrokeComplete = createWorldMapStrokeHandler(addMapStroke)

    handleStrokeComplete({
      color: '#1d4ed8',
      width: 4,
      points: [{ x: 10, y: 20 }, { x: 40, y: 80 }],
    })

    expect(addMapStroke).toHaveBeenCalledWith({
      color: '#1d4ed8',
      width: 4,
      points: [{ x: 10, y: 20 }, { x: 40, y: 80 }],
    })
  })
})
