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
      entityRecords: [],
    })
    expect(document.workspaces.map(workspace => workspace.title)).toEqual(['长夜手稿', '雾港来信'])
    expect(document.propertyDefinitions.map(property => property.id)).toEqual([
      'character-name',
      'character-role',
      'character-faction',
      'character-appearance',
      'character-personality',
      'character-motivation',
      'character-relationship-notes',
      'outline-title',
      'outline-stage',
      'outline-summary',
      'outline-conflict',
      'outline-result',
    ])
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

  it('migrates v1 documents to v2 without losing workspace data', () => {
    const v1Document = {
      schemaVersion: 1,
      preferences: {
        locale: 'en-US',
        themeMode: 'dark',
      },
      workspaces: createDefaultStudioDataDocument().workspaces,
      activeWorkspaceId: 'workspace-wu-gang-lai-xin',
      materials: [],
      materialRefs: [],
      createdAt: '2026-05-24T08:00:00.000Z',
      updatedAt: '2026-05-24T09:00:00.000Z',
    }

    const document = resolveStudioDataDocument(v1Document as unknown as StudioDataDocument)

    expect(document).toMatchObject({
      schemaVersion: 2,
      activeWorkspaceId: 'workspace-wu-gang-lai-xin',
      preferences: {
        locale: 'en-US',
        themeMode: 'dark',
      },
      entityRecords: [],
      createdAt: '2026-05-24T08:00:00.000Z',
      updatedAt: '2026-05-24T09:00:00.000Z',
    })
    expect(document.workspaces[0]?.moduleCounts).toMatchObject({
      characters: 2,
      outline: 3,
    })
    expect(document.propertyDefinitions.some(property => property.id === 'outline-stage')).toBe(true)
    expect(document.propertyDefinitions.some(property => String(property.kind) === 'task')).toBe(false)
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
