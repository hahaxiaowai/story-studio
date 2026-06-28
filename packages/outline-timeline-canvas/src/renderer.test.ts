import { describe, expect, it, vi } from 'vitest'
import { createOutlineTimelineDisposeRegistry } from './renderer'

describe('outline timeline renderer utilities', () => {
  it('runs dispose callbacks once', () => {
    const registry = createOutlineTimelineDisposeRegistry()
    const cleanup = vi.fn()

    registry.add(cleanup)
    registry.dispose()
    registry.dispose()

    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('runs late dispose callbacks immediately', () => {
    const registry = createOutlineTimelineDisposeRegistry()
    const cleanup = vi.fn()

    registry.dispose()
    registry.add(cleanup)

    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
