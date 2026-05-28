import type { AiProviderConfig, AssistantSettings } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  createAssistantSettings,
  createProvider,
  getFeatureModelBinding,
  removeFeatureBinding,
  removeProvider,
  setFeatureBinding,
  updateAssistantSettings,
  updateProvider,
} from './assistant'

describe('assistant settings', () => {
  it('creates empty assistant settings by default', () => {
    expect(createAssistantSettings()).toEqual({
      defaultProviderId: '',
      defaultModel: '',
      providers: [],
      featureBindings: [],
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

  it('resolves feature bindings with global fallback and clears overrides', () => {
    const settings: AssistantSettings = {
      defaultProviderId: 'provider-default',
      defaultModel: 'global-model',
      providers: [
        createProviderRecord({ id: 'provider-default', model: 'global-model' }),
        createProviderRecord({ id: 'provider-outline', model: 'outline-model' }),
      ],
      featureBindings: [],
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
      providers: [
        createProviderRecord({ id: 'provider-1' }),
        createProviderRecord({ id: 'provider-2' }),
      ],
      featureBindings: [
        { feature: 'outline', providerId: 'provider-1', model: 'outline-model' },
        { feature: 'content', providerId: 'provider-2', model: 'content-model' },
      ],
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
      providers: [provider],
      featureBindings: [],
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
