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

export function filterAssistantThreadsByWorkspace(threads: AssistantChatThread[], workspaceId: string): AssistantChatThread[] {
  return threads
    .filter(thread => thread.workspaceId === workspaceId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
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
