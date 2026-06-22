import type { AiProviderConfig, AssistantSettings } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  createAssistantSettings,
  createAssistantStoryStyle,
  createProvider,
  getDefaultAssistantStoryStyle,
  getFeatureModelBinding,
  removeAssistantStoryStyle,
  removeFeatureBinding,
  removeProvider,
  resolveAssistantStoryStyle,
  setFeatureBinding,
  updateAssistantSettings,
  updateAssistantStoryStyle,
  updateDefaultAssistantStoryStyle,
  updateProvider,
} from './assistant'

describe('assistant settings', () => {
  it('creates Codex terminal settings by default', () => {
    expect(createAssistantSettings()).toEqual({
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
        expect.objectContaining({
          id: 'story-style-general',
          name: '通用叙事',
          system: true,
        }),
        expect.objectContaining({
          id: 'story-style-epic-fantasy',
          name: '史诗奇幻',
          system: true,
        }),
        expect.objectContaining({
          id: 'story-style-mystery',
          name: '悬疑推理',
          system: true,
        }),
        expect.objectContaining({
          id: 'story-style-healing',
          name: '轻松治愈',
          system: true,
        }),
        expect.objectContaining({
          id: 'story-style-dark-realism',
          name: '黑暗现实',
          system: true,
        }),
      ],
    })
  })

  it('creates custom story styles with normalized fields', () => {
    const style = createAssistantStoryStyle({
      name: '  新怪谈  ',
      description: '  都市民俗恐怖  ',
      constraints: '  控制信息密度，避免直接解释怪异来源。  ',
      now: '2026-06-10T08:00:00.000Z',
    })

    expect(style).toMatchObject({
      name: '新怪谈',
      description: '都市民俗恐怖',
      constraints: '控制信息密度，避免直接解释怪异来源。',
      system: false,
      createdAt: '2026-06-10T08:00:00.000Z',
      updatedAt: '2026-06-10T08:00:00.000Z',
    })
    expect(style.id).toMatch(/^story-style-20260610080000-/)
  })

  it('updates custom story styles but preserves system styles', () => {
    const settings = createAssistantSettings()
    const customStyle = createAssistantStoryStyle({
      name: '新怪谈',
      description: '都市民俗恐怖',
      constraints: '克制解释。',
      now: '2026-06-10T08:00:00.000Z',
    })
    const withCustom = {
      ...settings,
      storyStyles: [...settings.storyStyles, customStyle],
    }

    const updated = updateAssistantStoryStyle(withCustom, customStyle.id, {
      name: '  民俗悬疑  ',
      constraints: '  保留不确定性。  ',
      now: '2026-06-10T09:00:00.000Z',
    })
    const unchangedSystem = updateAssistantStoryStyle(updated, 'story-style-general', {
      name: '  被改名  ',
      now: '2026-06-10T09:00:00.000Z',
    })

    expect(updated.storyStyles.find(style => style.id === customStyle.id)).toMatchObject({
      name: '民俗悬疑',
      description: '都市民俗恐怖',
      constraints: '保留不确定性。',
      updatedAt: '2026-06-10T09:00:00.000Z',
    })
    expect(unchangedSystem.storyStyles.find(style => style.id === 'story-style-general')?.name).toBe('通用叙事')
  })

  it('prevents deleting system story styles and deletes custom styles', () => {
    const settings = createAssistantSettings()
    const customStyle = createAssistantStoryStyle({
      name: '新怪谈',
      description: '',
      constraints: '',
      now: '2026-06-10T08:00:00.000Z',
    })
    const withCustom = {
      ...settings,
      storyStyles: [...settings.storyStyles, customStyle],
    }

    expect(removeAssistantStoryStyle(withCustom, 'story-style-general').storyStyles.some(style => style.id === 'story-style-general')).toBe(true)
    expect(removeAssistantStoryStyle(withCustom, customStyle.id).storyStyles.some(style => style.id === customStyle.id)).toBe(false)
    expect(removeAssistantStoryStyle({
      ...withCustom,
      defaultStoryStyleId: customStyle.id,
    }, customStyle.id).defaultStoryStyleId).toBe('story-style-general')
  })

  it('updates and resolves the global story style', () => {
    const settings = createAssistantSettings()
    const updated = updateDefaultAssistantStoryStyle(settings, {
      defaultStoryStyleId: 'story-style-epic-fantasy',
    })

    expect(getDefaultAssistantStoryStyle(updated)).toMatchObject({
      id: 'story-style-epic-fantasy',
      name: '史诗奇幻',
    })
    expect(resolveAssistantStoryStyle(updated)).toMatchObject({
      id: 'story-style-epic-fantasy',
      name: '史诗奇幻',
    })
    expect(updateDefaultAssistantStoryStyle(settings, {
      defaultStoryStyleId: 'missing-style',
    }).defaultStoryStyleId).toBe('story-style-general')
  })

  it('resolves invalid style ids to the default story style', () => {
    const settings = createAssistantSettings()

    expect(getDefaultAssistantStoryStyle(settings)).toMatchObject({
      id: 'story-style-general',
      name: '通用叙事',
    })
    expect(resolveAssistantStoryStyle(settings, 'missing-style')).toMatchObject({
      id: 'story-style-general',
      name: '通用叙事',
    })
    expect(resolveAssistantStoryStyle(settings, 'story-style-epic-fantasy')).toMatchObject({
      id: 'story-style-epic-fantasy',
      name: '史诗奇幻',
    })
  })

  it('creates OpenAI-compatible providers with normalized fields', () => {
    const provider = createProvider({
      kind: 'openai-compatible',
      name: '  DeepSeek  ',
      baseUrl: ' https://api.deepseek.com/v1 ',
      apiKey: ' sk-test ',
      model: ' deepseek-chat ',
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(provider).toMatchObject({
      kind: 'openai-compatible',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-test',
      model: 'deepseek-chat',
      terminalCommand: '',
      enabled: true,
      createdAt: '2026-05-28T10:00:00.000Z',
      updatedAt: '2026-05-28T10:00:00.000Z',
    })
    expect(provider.id).toMatch(/^ai-provider-20260528100000-/)
  })

  it('updates provider fields without clearing unrelated values', () => {
    const provider = createProviderRecord({
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-old',
      model: 'deepseek-chat',
    })

    expect(updateProvider(provider, {
      apiKey: ' sk-new ',
      model: ' deepseek-reasoner ',
      now: '2026-05-28T11:00:00.000Z',
    })).toMatchObject({
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-new',
      model: 'deepseek-reasoner',
      updatedAt: '2026-05-28T11:00:00.000Z',
    })
  })

  it('stores local terminal providers as configuration only', () => {
    const provider = createProvider({
      kind: 'local-terminal',
      name: '  Codex CLI  ',
      model: ' gpt-5-codex ',
      terminalCommand: ' codex --model gpt-5-codex ',
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(provider).toMatchObject({
      kind: 'local-terminal',
      name: 'Codex CLI',
      baseUrl: '',
      apiKey: '',
      model: 'gpt-5-codex',
      terminalCommand: 'codex --model gpt-5-codex',
      enabled: true,
    })
  })

  it('prefills new local terminal providers with Codex', () => {
    const provider = createProvider({
      kind: 'local-terminal',
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(provider).toMatchObject({
      kind: 'local-terminal',
      name: 'Codex',
      model: '5.5',
      terminalCommand: 'if [ -n "$STORY_STUDIO_MODEL" ]; then codex exec -m "$STORY_STUDIO_MODEL" -; else codex exec -; fi',
      enabled: true,
    })
  })

  it('resolves feature bindings with global fallback and clears overrides', () => {
    const settings: AssistantSettings = {
      defaultProviderId: 'provider-default',
      defaultModel: 'global-model',
      defaultStoryStyleId: 'story-style-general',
      providers: [
        createProviderRecord({ id: 'provider-default', model: 'global-model' }),
        createProviderRecord({ id: 'provider-outline', model: 'outline-model' }),
      ],
      featureBindings: [],
      storyStyles: [],
    }

    const withOverride = setFeatureBinding(settings, {
      feature: 'outline',
      providerId: 'provider-outline',
      model: ' outline-custom ',
    })

    expect(getFeatureModelBinding(withOverride, 'outline')).toEqual({
      providerId: 'provider-outline',
      model: 'outline-custom',
    })
    expect(getFeatureModelBinding(withOverride, 'content')).toEqual({
      providerId: 'provider-default',
      model: 'global-model',
    })
    expect(removeFeatureBinding(withOverride, 'outline').featureBindings).toEqual([])
  })

  it('removes providers and clears dependent defaults and feature bindings', () => {
    const settings: AssistantSettings = {
      defaultProviderId: 'provider-1',
      defaultModel: 'global-model',
      defaultStoryStyleId: 'story-style-general',
      providers: [
        createProviderRecord({ id: 'provider-1' }),
        createProviderRecord({ id: 'provider-2' }),
      ],
      featureBindings: [
        { feature: 'outline', providerId: 'provider-1', model: 'outline-model' },
        { feature: 'content', providerId: 'provider-2', model: 'content-model' },
      ],
      storyStyles: [],
    }

    expect(removeProvider(settings, 'provider-1')).toMatchObject({
      defaultProviderId: '',
      defaultModel: '',
      providers: [
        { id: 'provider-2' },
      ],
      featureBindings: [
        { feature: 'content', providerId: 'provider-2', model: 'content-model' },
      ],
    })
  })

  it('updates global defaults without touching providers', () => {
    const settings = createAssistantSettings()
    const provider = createProviderRecord({ id: 'provider-1' })

    expect(updateAssistantSettings({ ...settings, providers: [provider] }, {
      defaultProviderId: 'provider-1',
      defaultModel: ' global-model ',
    })).toEqual({
      defaultProviderId: 'provider-1',
      defaultModel: 'global-model',
      defaultStoryStyleId: settings.defaultStoryStyleId,
      providers: [provider],
      featureBindings: [],
      storyStyles: settings.storyStyles,
    })
  })
})

function createProviderRecord(input: Partial<AiProviderConfig>): AiProviderConfig {
  return {
    id: input.id ?? 'provider-1',
    kind: input.kind ?? 'openai-compatible',
    name: input.name ?? 'Provider',
    baseUrl: input.baseUrl ?? '',
    apiKey: input.apiKey ?? '',
    model: input.model ?? '',
    terminalCommand: input.terminalCommand ?? '',
    enabled: input.enabled ?? true,
    createdAt: input.createdAt ?? '2026-05-28T10:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-05-28T10:00:00.000Z',
  }
}
