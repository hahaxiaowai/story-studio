import { describe, expect, it } from 'vitest'
import { isLocale, translate } from './useLocale'

describe('useLocale', () => {
  it('translates shared keys in Chinese and English', () => {
    expect(translate('zh-CN', 'nav.project')).toBe('项目')
    expect(translate('en-US', 'nav.project')).toBe('Project')
  })

  it('recognizes supported locales', () => {
    expect(isLocale('zh-CN')).toBe(true)
    expect(isLocale('en-US')).toBe(true)
    expect(isLocale('fr-FR')).toBe(false)
  })
})
