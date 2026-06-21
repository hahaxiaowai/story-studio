import type { AiProviderConfig, AiProviderKind, AssistantFeatureBinding, AssistantFeatureKey, AssistantSettings, AssistantStoryStyle } from '@story-studio/types'

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

export interface UpdateDefaultStoryStyleInput {
  defaultStoryStyleId: string
}

export interface SetFeatureBindingInput {
  feature: AssistantFeatureKey
  providerId: string
  model: string
}

export interface CreateAssistantStoryStyleInput {
  name: string
  description: string
  constraints: string
  now: string
}

export interface UpdateAssistantStoryStyleInput {
  name?: string
  description?: string
  constraints?: string
  now: string
}

export interface ResolvedFeatureBinding {
  providerId: string
  model: string
}

const ASSISTANT_FEATURES = ['outline', 'characters', 'world', 'content', 'materials'] as const satisfies readonly AssistantFeatureKey[]
const DEFAULT_CODEX_PROVIDER_ID = 'provider-codex-terminal'
const DEFAULT_CODEX_PROVIDER_CREATED_AT = '2026-01-01T00:00:00.000Z'
const DEFAULT_CODEX_TERMINAL_COMMAND = 'if [ -n "$STORY_STUDIO_MODEL" ]; then codex exec -m "$STORY_STUDIO_MODEL" -; else codex exec -; fi'
const DEFAULT_STORY_STYLE_ID = 'story-style-general'
const BUILT_IN_STORY_STYLE_CREATED_AT = '2026-01-01T00:00:00.000Z'

export const builtInAssistantStoryStyles: AssistantStoryStyle[] = [
  {
    id: DEFAULT_STORY_STYLE_ID,
    name: '通用叙事',
    description: '不强行限定类型，保持清晰、连贯和设定一致。',
    constraints: '保持表达清晰，前后设定连贯，避免跳脱既有世界观和人物动机。',
    system: true,
    createdAt: BUILT_IN_STORY_STYLE_CREATED_AT,
    updatedAt: BUILT_IN_STORY_STYLE_CREATED_AT,
  },
  {
    id: 'story-style-epic-fantasy',
    name: '史诗奇幻',
    description: '高魔世界、宏大冲突和阵营命运交织的叙事。',
    constraints: '强调宏大冲突、历史纵深、阵营/世界规则一致性。',
    system: true,
    createdAt: BUILT_IN_STORY_STYLE_CREATED_AT,
    updatedAt: BUILT_IN_STORY_STYLE_CREATED_AT,
  },
  {
    id: 'story-style-mystery',
    name: '悬疑推理',
    description: '以线索、公平误导和可回溯结论驱动的叙事。',
    constraints: '保持线索公平，误导合理，节奏递进，结论可以从前文信息回溯。',
    system: true,
    createdAt: BUILT_IN_STORY_STYLE_CREATED_AT,
    updatedAt: BUILT_IN_STORY_STYLE_CREATED_AT,
  },
  {
    id: 'story-style-healing',
    name: '轻松治愈',
    description: '温暖、低压、关注关系变化和日常情绪的叙事。',
    constraints: '保持温暖语气，控制冲突压力，突出人物关系细节和情绪修复。',
    system: true,
    createdAt: BUILT_IN_STORY_STYLE_CREATED_AT,
    updatedAt: BUILT_IN_STORY_STYLE_CREATED_AT,
  },
  {
    id: 'story-style-dark-realism',
    name: '黑暗现实',
    description: '克制、复杂、强调现实压力和人物代价的叙事。',
    constraints: '表达保持克制，保留复杂动机，避免爽文化处理和轻易和解。',
    system: true,
    createdAt: BUILT_IN_STORY_STYLE_CREATED_AT,
    updatedAt: BUILT_IN_STORY_STYLE_CREATED_AT,
  },
]

export function createAssistantSettings(): AssistantSettings {
  const defaultProvider = createDefaultCodexProvider()

  return {
    defaultProviderId: defaultProvider.id,
    defaultModel: '',
    defaultStoryStyleId: DEFAULT_STORY_STYLE_ID,
    providers: [defaultProvider],
    featureBindings: [],
    storyStyles: [...builtInAssistantStoryStyles],
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
  const storyStyles = normalizeAssistantStoryStyles(settings.storyStyles)

  return {
    defaultProviderId,
    defaultModel: defaultProviderId ? normalizeText(settings.defaultModel) : '',
    providers,
    featureBindings,
    defaultStoryStyleId: normalizeDefaultStoryStyleId(settings.defaultStoryStyleId, storyStyles),
    storyStyles,
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

export function updateDefaultAssistantStoryStyle(settings: AssistantSettings, input: UpdateDefaultStoryStyleInput): AssistantSettings {
  const storyStyles = normalizeAssistantStoryStyles(settings.storyStyles)

  return {
    ...settings,
    defaultStoryStyleId: normalizeDefaultStoryStyleId(input.defaultStoryStyleId, storyStyles),
    storyStyles,
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

export function createAssistantStoryStyle(input: CreateAssistantStoryStyleInput): AssistantStoryStyle {
  return {
    id: createId('story-style', input.now),
    name: normalizeText(input.name) || '自定义风格',
    description: normalizeText(input.description),
    constraints: normalizeText(input.constraints),
    system: false,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateAssistantStoryStyle(settings: AssistantSettings, styleId: string, input: UpdateAssistantStoryStyleInput): AssistantSettings {
  return {
    ...settings,
    storyStyles: normalizeAssistantStoryStyles(settings.storyStyles.map((style) => {
      if (style.id !== styleId || style.system)
        return style

      return {
        ...style,
        ...(input.name !== undefined ? { name: normalizeText(input.name) || style.name } : {}),
        ...(input.description !== undefined ? { description: normalizeText(input.description) } : {}),
        ...(input.constraints !== undefined ? { constraints: normalizeText(input.constraints) } : {}),
        updatedAt: input.now,
      }
    })),
  }
}

export function removeAssistantStoryStyle(settings: AssistantSettings, styleId: string): AssistantSettings {
  const style = settings.storyStyles.find(item => item.id === styleId)

  if (!style || style.system)
    return settings

  const storyStyles = normalizeAssistantStoryStyles(settings.storyStyles.filter(item => item.id !== styleId))

  return {
    ...settings,
    defaultStoryStyleId: normalizeDefaultStoryStyleId(
      settings.defaultStoryStyleId === styleId ? DEFAULT_STORY_STYLE_ID : settings.defaultStoryStyleId,
      storyStyles,
    ),
    storyStyles,
  }
}

export function getDefaultAssistantStoryStyle(settings: AssistantSettings): AssistantStoryStyle {
  return resolveAssistantStoryStyle(settings, settings.defaultStoryStyleId)
}

export function resolveAssistantStoryStyle(settings: AssistantSettings, styleId = settings.defaultStoryStyleId): AssistantStoryStyle {
  const styles = normalizeAssistantStoryStyles(settings.storyStyles)

  return styles.find(style => style.id === styleId) ?? styles.find(style => style.id === DEFAULT_STORY_STYLE_ID) ?? builtInAssistantStoryStyles[0]!
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

function normalizeAssistantStoryStyles(styles: AssistantStoryStyle[] | undefined): AssistantStoryStyle[] {
  const systemStyleIds = new Set(builtInAssistantStoryStyles.map(style => style.id))
  const customStyles = Array.isArray(styles)
    ? styles
        .filter(style => !systemStyleIds.has(normalizeText(style.id)))
        .map(normalizeAssistantStoryStyle)
        .filter(style => style.id && style.name)
    : []
  const customStyleIds = new Set<string>()
  const dedupedCustomStyles = customStyles.filter((style) => {
    if (customStyleIds.has(style.id))
      return false

    customStyleIds.add(style.id)
    return true
  })

  return [
    ...builtInAssistantStoryStyles,
    ...dedupedCustomStyles,
  ]
}

function normalizeAssistantStoryStyle(style: AssistantStoryStyle): AssistantStoryStyle {
  return {
    id: normalizeText(style.id),
    name: normalizeText(style.name),
    description: normalizeText(style.description),
    constraints: normalizeText(style.constraints),
    system: false,
    createdAt: style.createdAt,
    updatedAt: style.updatedAt,
  }
}

function normalizeDefaultStoryStyleId(styleId: string | undefined, storyStyles: AssistantStoryStyle[]): string {
  const normalizedStyleId = normalizeText(styleId)

  if (storyStyles.some(style => style.id === normalizedStyleId))
    return normalizedStyleId

  return storyStyles.some(style => style.id === DEFAULT_STORY_STYLE_ID)
    ? DEFAULT_STORY_STYLE_ID
    : storyStyles[0]?.id ?? ''
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
