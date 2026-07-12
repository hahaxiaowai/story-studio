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

  it('uses workspace-oriented outline page titles without timeline wording', () => {
    expect(translate('zh-CN', 'outline.title')).toBe('大纲工作台')
    expect(translate('en-US', 'outline.title')).toBe('Outline workspace')
  })

  it('translates the backup workflow and compatibility errors', () => {
    expect(translate('zh-CN', 'backup.open')).toBe('数据备份')
    expect(translate('en-US', 'backup.open')).toBe('Data backup')
    expect(translate('zh-CN', 'backup.sensitiveWarning')).toContain('API Key')
    expect(translate('en-US', 'backup.sensitiveWarning')).toContain('API keys')
    expect(translate('zh-CN', 'backup.error.schema-too-old')).toBeTruthy()
    expect(translate('en-US', 'backup.error.schema-too-new')).toBeTruthy()
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
