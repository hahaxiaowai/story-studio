import { describe, expect, it, vi } from 'vitest'
import { createFantasyMapDisposeRegistry } from './dispose'

describe('fantasy map dispose registry', () => {
  it('runs registered cleanups once even when disposed repeatedly', () => {
    const registry = createFantasyMapDisposeRegistry()
    const cleanup = vi.fn()

    registry.add(cleanup)
    registry.dispose()
    registry.dispose()

    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('runs late cleanup immediately after disposal', () => {
    const registry = createFantasyMapDisposeRegistry()
    const cleanup = vi.fn()

    registry.dispose()
    registry.add(cleanup)

    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
