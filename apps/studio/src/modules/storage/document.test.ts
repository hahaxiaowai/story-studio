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
      contents: [],
      materials: [],
      materialTags: [],
      materialRefs: [],
      assistantChatThreads: [],
      assistantSettings: {
        defaultProviderId: 'provider-codex-terminal',
        defaultModel: '5.5',
        defaultStoryStyleId: 'story-style-general',
        providers: [
          {
            id: 'provider-codex-terminal',
            kind: 'local-terminal',
            name: 'Codex',
            baseUrl: '',
            apiKey: '',
            model: '5.5',
            terminalCommand: 'if [ -n "$STORY_STUDIO_MODEL" ]; then codex exec -m "$STORY_STUDIO_MODEL" -; else codex exec -; fi',
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        featureBindings: [],
        storyStyles: [
          expect.objectContaining({ id: 'story-style-general', name: '通用叙事', system: true }),
          expect.objectContaining({ id: 'story-style-epic-fantasy', name: '史诗奇幻', system: true }),
          expect.objectContaining({ id: 'story-style-mystery', name: '悬疑推理', system: true }),
          expect.objectContaining({ id: 'story-style-healing', name: '轻松治愈', system: true }),
          expect.objectContaining({ id: 'story-style-dark-realism', name: '黑暗现实', system: true }),
        ],
      },
    })
    expect(document.schemaVersion).toBe(12)
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
      materialTags: [],
      materialRefs: [],
      assistantSettings: {
        defaultProviderId: '',
        defaultModel: '',
        defaultStoryStyleId: '',
        providers: [],
        featureBindings: [],
      },
      createdAt: '2026-05-24T08:00:00.000Z',
      updatedAt: '2026-05-24T09:00:00.000Z',
    }

    const document = resolveStudioDataDocument(v2Document as unknown as StudioDataDocument)

    expect(document).toMatchObject({
      schemaVersion: 12,
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

    expect(document.schemaVersion).toBe(12)
    expect(document.worlds.map(world => world.workspaceId)).toEqual(['workspace-mo-shou-shi-jie'])
    expect(document.worlds[0]?.maps[0]?.title).toBe('世界地图')
  })

  it('migrates v4 documents by adding empty markdown contents', () => {
    const v4Document = {
      ...createDefaultStudioDataDocument(),
      schemaVersion: 4,
      contents: undefined,
      workspaces: createDefaultStudioDataDocument().workspaces.map(workspace => ({
        ...workspace,
        moduleCounts: {
          ...workspace.moduleCounts,
          content: 12,
        },
      })),
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v4Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.contents).toEqual([])
    expect(document.workspaces[0]?.moduleCounts.content).toBe(0)
  })

  it('normalizes workspace character counts from entity records', () => {
    const documentWithStaleCount = createDefaultStudioDataDocument()
    const firstCharacter = documentWithStaleCount.entityRecords.find(record => record.kind === 'character')!
    const staleDocument = {
      ...documentWithStaleCount,
      workspaces: documentWithStaleCount.workspaces.map(workspace => ({
        ...workspace,
        moduleCounts: {
          ...workspace.moduleCounts,
          characters: 9,
        },
      })),
      entityRecords: [firstCharacter],
    } as StudioDataDocument

    const document = resolveStudioDataDocument(staleDocument)

    expect(document.workspaces[0]?.moduleCounts.characters).toBe(1)
  })

  it('migrates v5 documents by adding material tags and normalizing materials', () => {
    const v5Document = {
      ...createDefaultStudioDataDocument(),
      schemaVersion: 5,
      materialTags: undefined,
      materials: [
        {
          id: 'material-legacy',
          title: '旧素材',
          kind: 'reference',
          createdAt: '2026-05-24T08:00:00.000Z',
          updatedAt: '2026-05-24T09:00:00.000Z',
        },
      ],
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v5Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.materialTags).toEqual([])
    expect(document.materials).toEqual([
      {
        id: 'material-legacy',
        title: '旧素材',
        url: '',
        text: '',
        imageUrl: '',
        tagIds: [],
        createdAt: '2026-05-24T08:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      },
    ])
  })

  it('migrates v6 documents by adding assistant settings and chat threads', () => {
    const v6Document = {
      ...createDefaultStudioDataDocument(),
      schemaVersion: 6,
      assistantSettings: undefined,
      assistantChatThreads: undefined,
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v6Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.assistantSettings).toEqual({
      defaultProviderId: 'provider-codex-terminal',
      defaultModel: '5.5',
      defaultStoryStyleId: 'story-style-general',
      providers: [
        {
          id: 'provider-codex-terminal',
          kind: 'local-terminal',
          name: 'Codex',
          baseUrl: '',
          apiKey: '',
          model: '5.5',
          terminalCommand: 'if [ -n "$STORY_STUDIO_MODEL" ]; then codex exec -m "$STORY_STUDIO_MODEL" -; else codex exec -; fi',
          enabled: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      featureBindings: [],
      storyStyles: [
        expect.objectContaining({ id: 'story-style-general', name: '通用叙事', system: true }),
        expect.objectContaining({ id: 'story-style-epic-fantasy', name: '史诗奇幻', system: true }),
        expect.objectContaining({ id: 'story-style-mystery', name: '悬疑推理', system: true }),
        expect.objectContaining({ id: 'story-style-healing', name: '轻松治愈', system: true }),
        expect.objectContaining({ id: 'story-style-dark-realism', name: '黑暗现实', system: true }),
      ],
    })
    expect(document.assistantChatThreads).toEqual([])
  })

  it('migrates v7 documents by adding assistant chat threads and normalizing interrupted messages', () => {
    const v7Document = {
      ...createDefaultStudioDataDocument(),
      schemaVersion: 7,
      assistantChatThreads: [
        {
          id: 'thread-1',
          workspaceId: 'workspace-mo-shou-shi-jie',
          title: '测试对话',
          providerId: 'provider-codex-terminal',
          model: '',
          messages: [
            {
              id: 'message-1',
              role: 'assistant',
              content: '半截回复',
              status: 'streaming',
              createdAt: '2026-05-24T08:00:00.000Z',
              updatedAt: '2026-05-24T08:00:00.000Z',
            },
          ],
          createdAt: '2026-05-24T08:00:00.000Z',
          updatedAt: '2026-05-24T08:00:00.000Z',
        },
      ],
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v7Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.assistantChatThreads[0]?.messages[0]).toMatchObject({
      status: 'error',
      error: '上次生成已中断。',
    })
  })

  it('migrates v8 documents by adding story styles and moving workspace style to global default', () => {
    const defaultDocument = createDefaultStudioDataDocument()
    const v8Document = {
      ...defaultDocument,
      schemaVersion: 8,
      assistantSettings: {
        ...defaultDocument.assistantSettings,
        storyStyles: undefined,
      },
      workspaces: [
        {
          ...defaultDocument.workspaces[0],
          storyStyleId: 'story-style-epic-fantasy',
        },
        {
          ...defaultDocument.workspaces[0],
          id: 'workspace-invalid-style',
          storyStyleId: 'missing-style',
        },
      ],
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v8Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.assistantSettings.storyStyles.map(style => style.id)).toContain('story-style-general')
    expect(document.assistantSettings.defaultStoryStyleId).toBe('story-style-epic-fantasy')
    expect('storyStyleId' in document.workspaces[0]!).toBe(false)
    expect('storyStyleId' in document.workspaces[1]!).toBe(false)
  })

  it('migrates legacy world setting groups into configurable records', () => {
    const v4Document = {
      ...createDefaultStudioDataDocument(),
      propertyDefinitions: createDefaultStudioDataDocument().propertyDefinitions.filter(property => !String(property.kind).startsWith('world-setting')),
      entityRecords: createDefaultStudioDataDocument().entityRecords.filter(record => String(record.kind) !== 'world-setting'),
    } as unknown as StudioDataDocument

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

  it('migrates v9 documents by normalizing valid outline beat links on contents', () => {
    const defaultDocument = createDefaultStudioDataDocument()
    const v9Document = {
      ...defaultDocument,
      schemaVersion: 9,
      contents: [
        {
          id: 'content-valid',
          workspaceId: 'workspace-mo-shou-shi-jie',
          outlineBeatId: 'beat-dark-portal',
          volume: '第一卷',
          chapter: '第一章',
          body: '',
          order: 0,
          createdAt: '2026-06-16T08:00:00.000Z',
          updatedAt: '2026-06-16T08:00:00.000Z',
        },
        {
          id: 'content-invalid',
          workspaceId: 'workspace-mo-shou-shi-jie',
          outlineBeatId: 'missing-beat',
          volume: '第一卷',
          chapter: '第二章',
          body: '',
          order: 1,
          createdAt: '2026-06-16T08:00:00.000Z',
          updatedAt: '2026-06-16T08:00:00.000Z',
        },
      ],
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v9Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.contents.map(entry => ({
      id: entry.id,
      outlineBeatId: entry.outlineBeatId,
    }))).toEqual([
      { id: 'content-valid', outlineBeatId: 'beat-dark-portal' },
      { id: 'content-invalid', outlineBeatId: undefined },
    ])
  })

  it('migrates v10 documents by preserving assistant message source content entry links', () => {
    const defaultDocument = createDefaultStudioDataDocument()
    const v10Document = {
      ...defaultDocument,
      schemaVersion: 10,
      assistantChatThreads: [
        {
          id: 'thread-1',
          workspaceId: 'workspace-mo-shou-shi-jie',
          title: '测试对话',
          providerId: 'provider-codex-terminal',
          model: '',
          messages: [
            {
              id: 'message-with-source',
              role: 'assistant',
              content: '第二章草稿',
              status: 'complete',
              sourceContentEntryId: ' content-2 ',
              createdAt: '2026-06-16T08:00:00.000Z',
              updatedAt: '2026-06-16T08:00:00.000Z',
            },
            {
              id: 'message-without-source',
              role: 'assistant',
              content: '无来源草稿',
              status: 'complete',
              sourceContentEntryId: '   ',
              createdAt: '2026-06-16T08:00:00.000Z',
              updatedAt: '2026-06-16T08:00:00.000Z',
            },
          ],
          createdAt: '2026-06-16T08:00:00.000Z',
          updatedAt: '2026-06-16T08:00:00.000Z',
        },
      ],
    } as unknown as StudioDataDocument

    const document = resolveStudioDataDocument(v10Document)

    expect(document.schemaVersion).toBe(12)
    expect(document.assistantChatThreads[0]?.messages.map(message => ({
      id: message.id,
      sourceContentEntryId: message.sourceContentEntryId,
    }))).toEqual([
      { id: 'message-with-source', sourceContentEntryId: 'content-2' },
      { id: 'message-without-source', sourceContentEntryId: undefined },
    ])
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
