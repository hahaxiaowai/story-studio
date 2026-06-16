import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '@/modules/storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '@/modules/storage/document'
import { resetStudioDataForTest, useStudioData } from '@/modules/storage/useStudioData'
import { isLocale, translate, useLocale } from './useLocale'

describe('useLocale', () => {
  beforeEach(() => {
    resetStudioDataForTest()
  })

  it('translates shared keys in Chinese and English', () => {
    expect(translate('zh-CN', 'nav.project')).toBe('项目')
    expect(translate('en-US', 'nav.project')).toBe('Project')
  })

  it('recognizes supported locales', () => {
    expect(isLocale('zh-CN')).toBe(true)
    expect(isLocale('en-US')).toBe(true)
    expect(isLocale('fr-FR')).toBe(false)
  })

  it('persists locale changes to the studio data document', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    useLocale().setLocale('en-US')
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      preferences: expect.objectContaining({
        locale: 'en-US',
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
