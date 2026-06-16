import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '@/modules/storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '@/modules/storage/document'
import { resetStudioDataForTest, useStudioData } from '@/modules/storage/useStudioData'
import { getNextThemeMode, useThemeMode } from './useThemeMode'

describe('useThemeMode', () => {
  beforeEach(() => {
    resetStudioDataForTest()
  })

  it('toggles between light and dark', () => {
    expect(getNextThemeMode('light')).toBe('dark')
    expect(getNextThemeMode('dark')).toBe('light')
  })

  it('persists theme changes to the studio data document', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    useThemeMode().toggleThemeMode()
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      preferences: expect.objectContaining({
        themeMode: 'dark',
      }),
    }))
  })
})

function createDriver(document: StudioDataDocument): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
