import type { AiProviderConfig, AssistantChatMessage, AssistantChatThread, AssistantStoryStyle, Workspace } from '@story-studio/types'

export const ASSISTANT_CHAT_TAURI_UNAVAILABLE = '本地 Terminal 仅 Tauri 可用。'
export const ASSISTANT_API_CHAT_TAURI_UNAVAILABLE = 'API 对话仅 Tauri 可用。'

export interface AssistantChatRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AssistantChatTransportKind = 'local-terminal' | 'openai-compatible'

export interface CreateAssistantThreadInput {
  workspaceId: string
  providerId: string
  model: string
  now: string
  titleSeed?: string
  idFactory?: (prefix: string) => string
}

export interface CreateUserAssistantTurnInput {
  userContent: string
  userMessageId: string
  assistantMessageId: string
  sourceContentEntryId?: string
  now: string
}

export interface PrepareLocalTerminalPromptInput {
  workspace: Workspace | undefined
  provider: AiProviderConfig | undefined
  storyStyle: AssistantStoryStyle | undefined
  moduleName: string
  userMessage: string
}

export interface AssistantChatContextInput {
  workspace: Workspace | undefined
  moduleName: string
  storyStyle: AssistantStoryStyle | undefined
}

export interface AssistantContextUsageEstimate {
  source: 'estimate'
  messageCount: number
  characterCount: number
  estimatedTokens: number
}

export interface AssistantActualTokenUsage {
  source: 'actual'
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export type AssistantContextUsage = AssistantContextUsageEstimate | AssistantActualTokenUsage

export interface AssistantContextUsageSummary {
  source: AssistantContextUsage['source']
  label: string
}

export interface AssistantModelSummary {
  providerName: string
  providerKind: string
  modelName: string
  label: string
}

export interface CreateAssistantTransportContextUsageInput extends AssistantChatContextInput {
  provider: AiProviderConfig | undefined
  thread: AssistantChatThread | undefined
  userMessage: string
}

export interface AssistantMessageSourceContentEntry {
  id: string
  volume: string
  chapter: string
}

export function filterAssistantThreadsByWorkspace(threads: AssistantChatThread[], workspaceId: string): AssistantChatThread[] {
  return threads
    .filter(thread => thread.workspaceId === workspaceId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function formatAssistantMessageSourceLabel(
  message: AssistantChatMessage,
  entries: AssistantMessageSourceContentEntry[],
): string {
  if (!message.sourceContentEntryId)
    return ''

  const entry = entries.find(entry => entry.id === message.sourceContentEntryId)

  if (!entry)
    return 'missing'

  return `${entry.volume || '未命名卷'} / ${entry.chapter || '未命名章'}`
}

export function createAssistantThread(input: CreateAssistantThreadInput): AssistantChatThread {
  const title = normalizeTitle(input.titleSeed)

  return {
    id: createId(input.idFactory, 'assistant-thread'),
    workspaceId: input.workspaceId,
    title,
    providerId: input.providerId,
    model: input.model,
    messages: [],
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function createUserAssistantTurn(thread: AssistantChatThread, input: CreateUserAssistantTurnInput): AssistantChatThread {
  const userMessage: AssistantChatMessage = {
    id: input.userMessageId,
    role: 'user',
    content: input.userContent.trim(),
    status: 'complete',
    createdAt: input.now,
    updatedAt: input.now,
  }
  const assistantMessage: AssistantChatMessage = {
    id: input.assistantMessageId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    ...(input.sourceContentEntryId ? { sourceContentEntryId: input.sourceContentEntryId } : {}),
    createdAt: input.now,
    updatedAt: input.now,
  }

  return {
    ...thread,
    title: thread.messages.length ? thread.title : normalizeTitle(input.userContent),
    messages: [...thread.messages, userMessage, assistantMessage],
    updatedAt: input.now,
  }
}

export function appendAssistantChunk(thread: AssistantChatThread, assistantMessageId: string, chunk: string): AssistantChatThread {
  return updateAssistantMessage(thread, assistantMessageId, message => ({
    ...message,
    content: `${message.content}${chunk}`,
  }))
}

export function completeAssistantMessage(thread: AssistantChatThread, assistantMessageId: string, now: string): AssistantChatThread {
  return updateAssistantMessage(thread, assistantMessageId, message => ({
    ...message,
    status: 'complete',
    error: undefined,
    updatedAt: now,
  }), now)
}

export function failAssistantMessage(thread: AssistantChatThread, assistantMessageId: string, error: string, now: string): AssistantChatThread {
  return updateAssistantMessage(thread, assistantMessageId, message => ({
    ...message,
    status: 'error',
    error,
    updatedAt: now,
  }), now)
}

export function prepareLocalTerminalPrompt(input: PrepareLocalTerminalPromptInput): string {
  return [
    'Story Studio 本地 AI 对话上下文',
    `当前作品：${input.workspace?.title || '未选择作品'}`,
    `当前模块：${input.moduleName}`,
    `当前 Provider：${input.provider?.name || '未选择 Provider'}`,
    `当前模型：${input.provider?.model || '默认模型'}`,
    ...createAssistantChatContextLines(input),
    '',
    `用户输入：\n${input.userMessage.trim()}`,
  ].join('\n')
}

export function normalizeOpenAiCompatibleBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function toAssistantChatRequestMessages(thread: AssistantChatThread, context?: AssistantChatContextInput): AssistantChatRequestMessage[] {
  const contextMessage = context ? createAssistantChatContextMessage(context) : undefined
  const historyMessages = thread.messages.flatMap((message) => {
    const content = message.content.trim()

    if (!content)
      return []

    if (message.role === 'assistant' && message.status !== 'complete')
      return []

    if (message.role === 'system' || message.role === 'user' || message.role === 'assistant') {
      return [{
        role: message.role,
        content,
      }]
    }

    return []
  })

  return contextMessage ? [contextMessage, ...historyMessages] : historyMessages
}

export function createAssistantTransportContextUsage(input: CreateAssistantTransportContextUsageInput): AssistantContextUsageEstimate {
  if (input.provider?.kind === 'local-terminal') {
    return estimateAssistantContextUsage([
      prepareLocalTerminalPrompt({
        workspace: input.workspace,
        provider: input.provider,
        storyStyle: input.storyStyle,
        moduleName: input.moduleName,
        userMessage: input.userMessage,
      }),
    ], 2)
  }

  const messages = createAssistantUsageRequestMessages(input)

  return estimateAssistantContextUsage(messages.map(message => message.content), messages.length)
}

export function buildAssistantContextUsageSummary(usage: AssistantContextUsage | undefined): AssistantContextUsageSummary {
  if (!usage) {
    return {
      source: 'estimate',
      label: '上下文用量待计算',
    }
  }

  if (usage.source === 'actual') {
    return {
      source: 'actual',
      label: [
        `Prompt ${usage.promptTokens ?? '未知'}`,
        `Completion ${usage.completionTokens ?? '未知'}`,
        `Total ${usage.totalTokens ?? '未知'} tokens`,
      ].join(' · '),
    }
  }

  return {
    source: 'estimate',
    label: `${usage.messageCount} 条消息 · ${usage.characterCount} 字符 · 约 ${usage.estimatedTokens} tokens`,
  }
}

export function formatAssistantModelSummary(provider: AiProviderConfig | undefined): AssistantModelSummary {
  if (!provider) {
    return {
      providerName: '未选择 Provider',
      providerKind: '',
      modelName: '未设置模型',
      label: '未选择 Provider',
    }
  }

  const providerKind = provider.kind === 'openai-compatible' ? 'API 模型' : '本地 Terminal'
  const modelName = provider.model.trim() || '未设置模型'

  return {
    providerName: provider.name,
    providerKind,
    modelName,
    label: `${provider.name} · ${providerKind} · ${modelName}`,
  }
}

export function getAssistantChatDisabledReason(input: {
  isTauri: boolean
  loading: boolean
  provider: AiProviderConfig | undefined
  prompt: string
}): string {
  if (input.loading)
    return '正在生成回复。'

  if (!input.provider)
    return '请先选择 Provider。'

  if (input.provider.kind === 'openai-compatible') {
    if (!input.isTauri)
      return ASSISTANT_API_CHAT_TAURI_UNAVAILABLE

    if (!normalizeOpenAiCompatibleBaseUrl(input.provider.baseUrl))
      return '请先填写 API Base URL。'

    if (!input.provider.apiKey.trim())
      return '请先填写 API Key。'

    if (!input.provider.model.trim())
      return '请先填写模型名称。'

    if (!input.prompt.trim())
      return '请先输入消息。'

    return ''
  }

  if (!input.isTauri)
    return ASSISTANT_CHAT_TAURI_UNAVAILABLE

  if (!input.provider.terminalCommand.trim())
    return '请先填写 Terminal 命令。'

  if (!input.prompt.trim())
    return '请先输入消息。'

  return ''
}

function updateAssistantMessage(
  thread: AssistantChatThread,
  assistantMessageId: string,
  updater: (message: AssistantChatMessage) => AssistantChatMessage,
  updatedAt = thread.updatedAt,
): AssistantChatThread {
  return {
    ...thread,
    messages: thread.messages.map(message => message.id === assistantMessageId ? updater(message) : message),
    updatedAt,
  }
}

function normalizeTitle(value: string | undefined): string {
  const title = value?.trim().replace(/\s+/g, ' ').slice(0, 24)

  return title || '新对话'
}

function createAssistantChatContextMessage(input: AssistantChatContextInput): AssistantChatRequestMessage | undefined {
  const content = [
    'Story Studio AI 对话上下文',
    `当前作品：${input.workspace?.title || '未选择作品'}`,
    `当前模块：${input.moduleName}`,
    ...createAssistantChatContextLines(input),
  ].join('\n').trim()

  if (!content)
    return undefined

  return {
    role: 'system',
    content,
  }
}

function createAssistantUsageRequestMessages(input: CreateAssistantTransportContextUsageInput): AssistantChatRequestMessage[] {
  const thread = input.thread ?? createAssistantThread({
    workspaceId: input.workspace?.id ?? '',
    providerId: input.provider?.id ?? '',
    model: input.provider?.model ?? '',
    now: '',
  })
  const requestMessages = toAssistantChatRequestMessages(thread, {
    workspace: input.workspace,
    moduleName: input.moduleName,
    storyStyle: input.storyStyle,
  })
  const userMessage = input.userMessage.trim()

  if (!userMessage)
    return requestMessages

  const lastUserMessage = [...requestMessages].reverse().find(message => message.role === 'user')

  if (lastUserMessage?.content === userMessage)
    return requestMessages

  return [
    ...requestMessages,
    {
      role: 'user',
      content: userMessage,
    },
  ]
}

function estimateAssistantContextUsage(contents: string[], messageCount: number): AssistantContextUsageEstimate {
  const characterCount = contents
    .join('')
    .replace(/\s/g, '')
    .length

  return {
    source: 'estimate',
    messageCount,
    characterCount,
    estimatedTokens: Math.ceil(characterCount / 4),
  }
}

function createAssistantChatContextLines(input: Pick<AssistantChatContextInput, 'storyStyle'>): string[] {
  const storyStyle = input.storyStyle

  if (!storyStyle)
    return []

  return [
    `故事风格：${storyStyle.name}`,
    ...(storyStyle.description.trim() ? [`风格说明：${storyStyle.description.trim()}`] : []),
    ...(storyStyle.constraints.trim() ? [`风格约束：${storyStyle.constraints.trim()}`] : []),
  ]
}

function createId(idFactory: ((prefix: string) => string) | undefined, prefix: string): string {
  if (idFactory)
    return idFactory(prefix)

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
