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
      activeWorkspaceId: 'workspace-mo-shou-shi-jie',
      preferences: {
        locale: 'zh-CN',
        themeMode: 'light',
      },
      materials: [],
      materialRefs: [],
    })
    expect(document.schemaVersion).toBe(4)
    expect(document.workspaces.map(workspace => workspace.title)).toEqual(['魔兽世界'])
    expect(document.propertyDefinitions.map(property => property.id)).toEqual([
      'character-name',
      'character-role',
      'character-faction',
      'character-appearance',
      'character-personality',
      'character-motivation',
      'character-relationship-notes',
      'world-setting-name',
      'world-setting-category',
      'world-setting-summary',
      'world-setting-detail',
      'world-setting-links',
    ])
    expect(document.entityRecords.map(record => record.title)).toEqual([
      '萨尔',
      '吉安娜·普罗德摩尔',
      '安度因·乌瑞恩',
      '希尔瓦娜斯·风行者',
      '伊利丹·怒风',
      '东部王国',
      '卡利姆多',
      '联盟与部落',
    ])
    expect(document.entityRecords.every(record => record.workspaceId === 'workspace-mo-shou-shi-jie')).toBe(true)
    expect(document.outlines).toHaveLength(1)
    expect(document.outlines[0]).toMatchObject({
      workspaceId: 'workspace-mo-shou-shi-jie',
    })
    expect(document.outlines[0]?.plotLines.map(line => line.title)).toEqual([
      '艾泽拉斯主线',
      '联盟与部落',
      '燃烧军团',
      '天灾与暗影',
    ])
    expect(document.outlines[0]?.eventTags.map(tag => tag.label)).toEqual([
      '冲突',
      '高潮',
      '转折',
      '日常',
      '战争',
      '背叛',
      '牺牲',
    ])
    expect(document.outlines[0]?.beats.map(beat => beat.title)).toEqual([
      '黑暗之门开启',
      '萨尔建立新部落',
      '海加尔山并肩作战',
      '天谴之门灾变',
      '燃烧军团再临',
      '第四次大战爆发',
    ])
    expect(document.outlines[0]?.beats[5]?.characterChanges.map(change => change.characterId)).toEqual([
      'character-sylvanas-windrunner',
      'character-anduin-wrynn',
      'character-jaina-proudmoore',
    ])
    expect(document.worlds).toHaveLength(1)
    expect(document.worlds[0]).toMatchObject({
      workspaceId: 'workspace-mo-shou-shi-jie',
      settingGroups: [
        {
          title: '地理与势力',
        },
        {
          title: '历史与规则',
        },
      ],
      maps: [
        {
          title: '世界地图',
          strokes: [],
        },
      ],
    })
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

  it('resets older documents to the v3 prototype seed data', () => {
    const v2Document = {
      schemaVersion: 2,
      preferences: {
        locale: 'en-US',
        themeMode: 'dark',
      },
      workspaces: [
        {
          id: 'workspace-old',
          title: '旧项目',
          status: 'draft',
          moduleCounts: {
            characters: 9,
            content: 8,
            maps: 7,
            outline: 6,
          },
          createdAt: '2026-05-24T08:00:00.000Z',
          updatedAt: '2026-05-24T09:00:00.000Z',
        },
      ],
      activeWorkspaceId: 'workspace-wu-gang-lai-xin',
      propertyDefinitions: [
        {
          id: 'outline-title',
          kind: 'outline',
          name: '标题',
          valueType: 'text',
          required: true,
          visible: true,
          order: 0,
          system: true,
        },
      ],
      entityRecords: [
        {
          id: 'outline-old',
          workspaceId: 'workspace-old',
          kind: 'outline',
          title: '旧大纲',
          values: {
            'outline-title': '旧大纲',
          },
          createdAt: '2026-05-24T08:00:00.000Z',
          updatedAt: '2026-05-24T09:00:00.000Z',
        },
      ],
      worlds: [],
      materials: [],
      materialRefs: [],
      createdAt: '2026-05-24T08:00:00.000Z',
      updatedAt: '2026-05-24T09:00:00.000Z',
    }

    const document = resolveStudioDataDocument(v2Document as unknown as StudioDataDocument)

    expect(document).toMatchObject({
      schemaVersion: 4,
      activeWorkspaceId: 'workspace-mo-shou-shi-jie',
      preferences: {
        locale: 'zh-CN',
        themeMode: 'light',
      },
    })
    expect(document.workspaces.map(workspace => workspace.id)).toEqual(['workspace-mo-shou-shi-jie'])
    expect(document.entityRecords.map(record => record.id)).toContain('character-thrall')
    expect(document.propertyDefinitions.some(property => property.id.startsWith('outline-'))).toBe(false)
    expect(document.outlines.map(outline => outline.workspaceId)).toEqual(['workspace-mo-shou-shi-jie'])
  })

  it('migrates v3 documents by adding workspace worlds', () => {
    const v3Document = {
      ...createDefaultStudioDataDocument(),
      schemaVersion: 3,
      worlds: undefined,
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v3Document)

    expect(document.schemaVersion).toBe(4)
    expect(document.worlds.map(world => world.workspaceId)).toEqual(['workspace-mo-shou-shi-jie'])
    expect(document.worlds[0]?.maps[0]?.title).toBe('世界地图')
  })

  it('migrates legacy world setting groups into configurable records', () => {
    const v4Document = {
      ...createDefaultStudioDataDocument(),
      propertyDefinitions: createDefaultStudioDataDocument().propertyDefinitions.filter(property => !String(property.kind).startsWith('world-setting')),
      entityRecords: createDefaultStudioDataDocument().entityRecords.filter(record => String(record.kind) !== 'world-setting'),
    } as StudioDataDocument

    const document = resolveStudioDataDocument(v4Document)
    const worldSettingProperties = document.propertyDefinitions.filter(property => property.kind === 'world-setting')
    const worldSettingRecords = document.entityRecords.filter(record => record.kind === 'world-setting')

    expect(worldSettingProperties.map(property => property.id)).toEqual([
      'world-setting-name',
      'world-setting-category',
      'world-setting-summary',
      'world-setting-detail',
      'world-setting-links',
    ])
    expect(worldSettingRecords.map(record => record.title)).toEqual([
      '东部王国',
      '卡利姆多',
      '联盟与部落',
    ])
    expect(worldSettingRecords[0]?.values).toMatchObject({
      'world-setting-name': '东部王国',
      'world-setting-category': 'geography',
    })
  })

  it('replaces the old prototype seed document with the Warcraft sample', () => {
    const legacySeedDocument = {
      ...createDefaultStudioDataDocument(),
      workspaces: [
        {
          id: 'workspace-long-ye-shou-gao',
          title: '长夜手稿',
          status: 'draft',
          moduleCounts: {
            characters: 2,
            content: 4,
            maps: 1,
            outline: 3,
          },
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z',
        },
        {
          id: 'workspace-wu-gang-lai-xin',
          title: '雾港来信',
          status: 'draft',
          moduleCounts: {
            characters: 1,
            content: 2,
            maps: 2,
            outline: 1,
          },
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z',
        },
      ],
      activeWorkspaceId: 'workspace-long-ye-shou-gao',
      entityRecords: [],
      outlines: [],
    } as StudioDataDocument

    const document = resolveStudioDataDocument(legacySeedDocument)

    expect(document.workspaces.map(workspace => workspace.title)).toEqual(['魔兽世界'])
    expect(document.activeWorkspaceId).toBe('workspace-mo-shou-shi-jie')
    expect(document.outlines[0]?.beats).toHaveLength(6)
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
