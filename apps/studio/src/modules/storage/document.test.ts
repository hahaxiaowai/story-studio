import type { StudioDataDocument } from '@story-studio/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDefaultStudioDataDocument,
  mergeLegacyPreferences,
  resolveStudioDataDocument,
  STUDIO_DATA_SCHEMA_VERSION,
} from './document'

describe('studio data document', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createTestStorage())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'))
  })

  it('creates a default document from seed workspaces', () => {
    const document = createDefaultStudioDataDocument()

    expect(document).toMatchObject({
      schemaVersion: STUDIO_DATA_SCHEMA_VERSION,
      activeWorkspaceId: 'workspace-long-ye-shou-gao',
      preferences: {
        locale: 'zh-CN',
        themeMode: 'light',
      },
      materials: [],
      materialRefs: [],
    })
    expect(document.workspaces.map(workspace => workspace.title)).toEqual(['长夜手稿', '雾港来信'])
    expect(document.createdAt).toBe('2026-05-24T12:00:00.000Z')
    expect(document.updatedAt).toBe('2026-05-24T12:00:00.000Z')
  })

  it('merges valid legacy preferences from localStorage', () => {
    localStorage.setItem('story-studio:locale', 'en-US')
    localStorage.setItem('story-studio:theme-mode', 'dark')

    const document = mergeLegacyPreferences(createDefaultStudioDataDocument())

    expect(document.preferences).toEqual({
      locale: 'en-US',
      themeMode: 'dark',
    })
  })

  it('ignores invalid legacy preferences', () => {
    localStorage.setItem('story-studio:locale', 'fr-FR')
    localStorage.setItem('story-studio:theme-mode', 'system')

    const document = mergeLegacyPreferences(createDefaultStudioDataDocument())

    expect(document.preferences).toEqual({
      locale: 'zh-CN',
      themeMode: 'light',
    })
  })

  it('uses stored documents without applying legacy preferences again', () => {
    localStorage.setItem('story-studio:locale', 'en-US')
    localStorage.setItem('story-studio:theme-mode', 'dark')

    const storedDocument: StudioDataDocument = {
      ...createDefaultStudioDataDocument(),
      preferences: {
        locale: 'zh-CN',
        themeMode: 'light',
      },
      updatedAt: '2026-05-24T09:00:00.000Z',
    }

    expect(resolveStudioDataDocument(storedDocument).preferences).toEqual({
      locale: 'zh-CN',
      themeMode: 'light',
    })
  })
})

function createTestStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  }
}
