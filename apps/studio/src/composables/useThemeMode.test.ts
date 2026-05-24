import { describe, expect, it } from 'vitest'
import { getNextThemeMode } from './useThemeMode'

describe('useThemeMode', () => {
  it('toggles between light and dark', () => {
    expect(getNextThemeMode('light')).toBe('dark')
    expect(getNextThemeMode('dark')).toBe('light')
  })
})
