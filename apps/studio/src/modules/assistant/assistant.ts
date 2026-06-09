import type { AiProviderConfig, AiProviderKind, AssistantFeatureBinding, AssistantFeatureKey, AssistantSettings } from '@story-studio/types'

export interface CreateProviderInput {
  kind: AiProviderKind
  name?: string
  baseUrl?: string
  apiKey?: string
  model?: string
  terminalCommand?: string
  now: string
}

export interface UpdateProviderInput {
  name?: string
  baseUrl?: string
  apiKey?: string
  model?: string
  terminalCommand?: string
  enabled?: boolean
  now: string
}

export interface UpdateAssistantSettingsInput {
  defaultProviderId?: string
  defaultModel?: string
}

export interface SetFeatureBindingInput {
  feature: AssistantFeatureKey
  providerId: string
  model: string
}

export interface ResolvedFeatureBinding {
  providerId: string
  model: string
}

const ASSISTANT_FEATURES = ['outline', 'characters', 'world', 'content', 'materials'] as const satisfies readonly AssistantFeatureKey[]
const DEFAULT_CODEX_PROVIDER_ID = 'provider-codex-terminal'
const DEFAULT_CODEX_PROVIDER_CREATED_AT = '2026-01-01T00:00:00.000Z'
const DEFAULT_CODEX_TERMINAL_COMMAND = 'if [ -n "$STORY_STUDIO_MODEL" ]; then codex exec -m "$STORY_STUDIO_MODEL" -; else codex exec -; fi'

export function createAssistantSettings(): AssistantSettings {
  const defaultProvider = createDefaultCodexProvider()

  return {
    defaultProviderId: defaultProvider.id,
    defaultModel: '',
    providers: [defaultProvider],
    featureBindings: [],
  }
}

export function normalizeAssistantSettings(settings: Partial<AssistantSettings> | undefined): AssistantSettings {
  if (!settings)
    return createAssistantSettings()

  const providers = Array.isArray(settings.providers)
    ? settings.providers.map(normalizeProvider)
    : []
  const providerIds = new Set(providers.map(provider => provider.id))
  const featureBindings = Array.isArray(settings.featureBindings)
    ? settings.featureBindings
        .filter(binding => isAssistantFeature(binding.feature))
        .map(binding => ({
          feature: binding.feature,
          providerId: providerIds.has(binding.providerId) ? binding.providerId : '',
          model: normalizeText(binding.model),
        }))
        .filter(binding => binding.providerId || binding.model)
    : []
  const defaultProviderId = providerIds.has(settings.defaultProviderId ?? '') ? settings.defaultProviderId ?? '' : ''

  return {
    defaultProviderId,
    defaultModel: defaultProviderId ? normalizeText(settings.defaultModel) : '',
    providers,
    featureBindings,
  }
}

export function createProvider(input: CreateProviderInput): AiProviderConfig {
  const defaultLocalTerminalProvider = input.kind === 'local-terminal'
    ? createDefaultCodexProvider(input.now)
    : undefined

  return {
    id: createId('ai-provider', input.now),
    kind: input.kind,
    name: normalizeName(input.name, defaultLocalTerminalProvider?.name ?? 'API 模型'),
    baseUrl: input.kind === 'openai-compatible' ? normalizeText(input.baseUrl) : '',
    apiKey: input.kind === 'openai-compatible' ? normalizeText(input.apiKey) : '',
    model: normalizeText(input.model) || defaultLocalTerminalProvider?.model || '',
    terminalCommand: input.kind === 'local-terminal'
      ? normalizeText(input.terminalCommand) || DEFAULT_CODEX_TERMINAL_COMMAND
      : '',
    enabled: true,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateProvider(provider: AiProviderConfig, input: UpdateProviderInput): AiProviderConfig {
  return normalizeProvider({
    ...provider,
    ...(input.name !== undefined ? { name: normalizeName(input.name, provider.kind === 'openai-compatible' ? 'API 模型' : '本地 Terminal') } : {}),
    ...(input.baseUrl !== undefined ? { baseUrl: provider.kind === 'openai-compatible' ? normalizeText(input.baseUrl) : '' } : {}),
    ...(input.apiKey !== undefined ? { apiKey: provider.kind === 'openai-compatible' ? normalizeText(input.apiKey) : '' } : {}),
    ...(input.model !== undefined ? { model: normalizeText(input.model) } : {}),
    ...(input.terminalCommand !== undefined ? { terminalCommand: provider.kind === 'local-terminal' ? normalizeText(input.terminalCommand) : '' } : {}),
    ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    updatedAt: input.now,
  })
}

export function updateAssistantSettings(settings: AssistantSettings, input: UpdateAssistantSettingsInput): AssistantSettings {
  const providers = settings.providers
  const providerIds = new Set(providers.map(provider => provider.id))
  const nextDefaultProviderId = input.defaultProviderId !== undefined
    ? normalizeText(input.defaultProviderId)
    : settings.defaultProviderId
  const defaultProviderId = providerIds.has(nextDefaultProviderId) ? nextDefaultProviderId : ''

  return {
    ...settings,
    defaultProviderId,
    defaultModel: defaultProviderId
      ? normalizeText(input.defaultModel !== undefined ? input.defaultModel : settings.defaultModel)
      : '',
  }
}

export function setFeatureBinding(settings: AssistantSettings, input: SetFeatureBindingInput): AssistantSettings {
  const providerIds = new Set(settings.providers.map(provider => provider.id))
  const providerId = providerIds.has(input.providerId) ? input.providerId : ''
  const model = normalizeText(input.model)

  if (!providerId && !model)
    return removeFeatureBinding(settings, input.feature)

  const binding: AssistantFeatureBinding = {
    feature: input.feature,
    providerId,
    model,
  }

  return {
    ...settings,
    featureBindings: [
      ...settings.featureBindings.filter(item => item.feature !== input.feature),
      binding,
    ],
  }
}

export function removeFeatureBinding(settings: AssistantSettings, feature: AssistantFeatureKey): AssistantSettings {
  return {
    ...settings,
    featureBindings: settings.featureBindings.filter(binding => binding.feature !== feature),
  }
}

export function getFeatureModelBinding(settings: AssistantSettings, feature: AssistantFeatureKey): ResolvedFeatureBinding {
  const binding = settings.featureBindings.find(item => item.feature === feature)

  return {
    providerId: binding?.providerId || settings.defaultProviderId,
    model: binding?.model || settings.defaultModel,
  }
}

export function removeProvider(settings: AssistantSettings, providerId: string): AssistantSettings {
  const providers = settings.providers.filter(provider => provider.id !== providerId)
  const removedDefault = settings.defaultProviderId === providerId

  return {
    ...settings,
    defaultProviderId: removedDefault ? '' : settings.defaultProviderId,
    defaultModel: removedDefault ? '' : settings.defaultModel,
    providers,
    featureBindings: settings.featureBindings.filter(binding => binding.providerId !== providerId),
  }
}

export function getAssistantFeatures(): readonly AssistantFeatureKey[] {
  return ASSISTANT_FEATURES
}

function normalizeProvider(provider: AiProviderConfig): AiProviderConfig {
  const kind = provider.kind === 'local-terminal' ? 'local-terminal' : 'openai-compatible'

  return {
    id: normalizeText(provider.id),
    kind,
    name: normalizeName(provider.name, kind === 'openai-compatible' ? 'API 模型' : '本地 Terminal'),
    baseUrl: kind === 'openai-compatible' ? normalizeText(provider.baseUrl) : '',
    apiKey: kind === 'openai-compatible' ? normalizeText(provider.apiKey) : '',
    model: normalizeText(provider.model),
    terminalCommand: kind === 'local-terminal' ? normalizeText(provider.terminalCommand) : '',
    enabled: provider.enabled !== false,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  }
}

function createDefaultCodexProvider(now = DEFAULT_CODEX_PROVIDER_CREATED_AT): AiProviderConfig {
  return {
    id: DEFAULT_CODEX_PROVIDER_ID,
    kind: 'local-terminal',
    name: 'Codex',
    baseUrl: '',
    apiKey: '',
    model: '',
    terminalCommand: DEFAULT_CODEX_TERMINAL_COMMAND,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  }
}

function isAssistantFeature(value: string): value is AssistantFeatureKey {
  return ASSISTANT_FEATURES.includes(value as AssistantFeatureKey)
}

function normalizeName(name: string | undefined, fallback: string): string {
  return normalizeText(name) || fallback
}

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? ''
}

function createId(prefix: string, now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `${prefix}-${stamp}-${randomSegment}`
}
