import type { AiProviderConfig, AssistantChatThread, Workspace } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  appendAssistantChunk,
  completeAssistantMessage,
  createAssistantThread,
  createUserAssistantTurn,
  failAssistantMessage,
  filterAssistantThreadsByWorkspace,
  getAssistantChatDisabledReason,
  normalizeOpenAiCompatibleBaseUrl,
  prepareLocalTerminalPrompt,
  toAssistantChatRequestMessages,
} from './assistantChat'

describe('assistant chat state', () => {
  it('filters threads by current workspace', () => {
    const threads = [
      createThread({ id: 'thread-1', workspaceId: 'workspace-1' }),
      createThread({ id: 'thread-2', workspaceId: 'workspace-2' }),
    ]

    expect(filterAssistantThreadsByWorkspace(threads, 'workspace-1').map(thread => thread.id)).toEqual(['thread-1'])
  })

  it('creates a workspace-bound thread with provider metadata', () => {
    const thread = createAssistantThread({
      workspaceId: 'workspace-1',
      providerId: 'provider-local',
      model: 'gpt-5-codex',
      now: '2026-06-09T08:00:00.000Z',
      titleSeed: '帮我规划第一章',
      idFactory: prefix => `${prefix}-fixed`,
    })

    expect(thread).toMatchObject({
      id: 'assistant-thread-fixed',
      workspaceId: 'workspace-1',
      title: '帮我规划第一章',
      providerId: 'provider-local',
      model: 'gpt-5-codex',
      messages: [],
    })
  })

  it('creates a user and streaming assistant turn', () => {
    const thread = createThread({ messages: [] })
    const nextThread = createUserAssistantTurn(thread, {
      userContent: '写一个开头',
      assistantMessageId: 'assistant-1',
      userMessageId: 'user-1',
      now: '2026-06-09T08:00:00.000Z',
    })

    expect(nextThread.messages).toMatchObject([
      { id: 'user-1', role: 'user', content: '写一个开头', status: 'complete' },
      { id: 'assistant-1', role: 'assistant', content: '', status: 'streaming' },
    ])
  })

  it('appends stdout chunks and completes assistant message', () => {
    const thread = createUserAssistantTurn(createThread({ messages: [] }), {
      userContent: '写一个开头',
      assistantMessageId: 'assistant-1',
      userMessageId: 'user-1',
      now: '2026-06-09T08:00:00.000Z',
    })
    const withChunk = appendAssistantChunk(thread, 'assistant-1', '第一段')
    const complete = completeAssistantMessage(withChunk, 'assistant-1', '2026-06-09T08:00:01.000Z')

    expect(complete.messages[1]).toMatchObject({
      content: '第一段',
      status: 'complete',
      updatedAt: '2026-06-09T08:00:01.000Z',
    })
  })

  it('marks assistant message as failed with stderr detail', () => {
    const thread = createUserAssistantTurn(createThread({ messages: [] }), {
      userContent: '写一个开头',
      assistantMessageId: 'assistant-1',
      userMessageId: 'user-1',
      now: '2026-06-09T08:00:00.000Z',
    })
    const failed = failAssistantMessage(thread, 'assistant-1', '命令失败', '2026-06-09T08:00:01.000Z')

    expect(failed.messages[1]).toMatchObject({
      status: 'error',
      error: '命令失败',
    })
  })

  it('builds a local terminal prompt with basic workspace context', () => {
    const prompt = prepareLocalTerminalPrompt({
      workspace: createWorkspace(),
      provider: createProvider(),
      moduleName: '助手',
      userMessage: '写一个开头',
    })

    expect(prompt).toContain('当前作品：魔兽世界')
    expect(prompt).toContain('当前模块：助手')
    expect(prompt).toContain('当前 Provider：Codex')
    expect(prompt).toContain('用户输入：\n写一个开头')
  })

  it('disables send for web, empty input, running state, and invalid local terminal providers', () => {
    expect(getAssistantChatDisabledReason({
      isTauri: false,
      loading: false,
      provider: createProvider(),
      prompt: '你好',
    })).toBe('本地 Terminal 仅 Tauri 可用。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createProvider({ terminalCommand: '   ' }),
      prompt: '你好',
    })).toBe('请先填写 Terminal 命令。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createProvider({ kind: 'openai-compatible' }),
      prompt: '你好',
    })).toBe('请先填写 API Base URL。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createProvider(),
      prompt: '   ',
    })).toBe('请先输入消息。')
  })

  it('disables api providers when desktop-only or required fields are missing', () => {
    expect(getAssistantChatDisabledReason({
      isTauri: false,
      loading: false,
      provider: createApiProvider(),
      prompt: '你好',
    })).toBe('API 对话仅 Tauri 可用。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createApiProvider({ baseUrl: '   ' }),
      prompt: '你好',
    })).toBe('请先填写 API Base URL。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createApiProvider({ apiKey: '   ' }),
      prompt: '你好',
    })).toBe('请先填写 API Key。')
    expect(getAssistantChatDisabledReason({
      isTauri: true,
      loading: false,
      provider: createApiProvider({ model: '   ' }),
      prompt: '你好',
    })).toBe('请先填写模型名称。')
  })

  it('normalizes OpenAI-compatible base urls', () => {
    expect(normalizeOpenAiCompatibleBaseUrl(' https://api.example.com/v1/// ')).toBe('https://api.example.com/v1')
  })

  it('converts thread history to API request messages and filters incomplete assistant placeholders', () => {
    const thread = createThread({
      messages: [
        createMessage({ id: 'system-1', role: 'system', content: '你是小说助手。' }),
        createMessage({ id: 'user-1', role: 'user', content: '写一个开头' }),
        createMessage({ id: 'assistant-1', role: 'assistant', content: '开头内容', status: 'complete' }),
        createMessage({ id: 'assistant-2', role: 'assistant', content: '', status: 'streaming' }),
        createMessage({ id: 'assistant-3', role: 'assistant', content: '失败内容', status: 'error' }),
      ],
    })

    expect(toAssistantChatRequestMessages(thread)).toEqual([
      { role: 'system', content: '你是小说助手。' },
      { role: 'user', content: '写一个开头' },
      { role: 'assistant', content: '开头内容' },
    ])
  })
})

function createThread(input: Partial<AssistantChatThread>): AssistantChatThread {
  return {
    id: input.id ?? 'thread-1',
    workspaceId: input.workspaceId ?? 'workspace-1',
    title: input.title ?? '测试对话',
    providerId: input.providerId ?? 'provider-local',
    model: input.model ?? '',
    messages: input.messages ?? [],
    createdAt: input.createdAt ?? '2026-06-09T08:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-06-09T08:00:00.000Z',
  }
}

function createProvider(input: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    id: input.id ?? 'provider-local',
    kind: input.kind ?? 'local-terminal',
    name: input.name ?? 'Codex',
    baseUrl: input.baseUrl ?? '',
    apiKey: input.apiKey ?? '',
    model: input.model ?? 'gpt-5-codex',
    terminalCommand: input.terminalCommand ?? 'cat',
    enabled: true,
    createdAt: '2026-06-09T08:00:00.000Z',
    updatedAt: '2026-06-09T08:00:00.000Z',
  }
}

function createApiProvider(input: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return createProvider({
    id: 'provider-api',
    kind: 'openai-compatible',
    name: 'API 模型',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4.1-mini',
    terminalCommand: '',
    ...input,
  })
}

function createMessage(input: Partial<AssistantChatThread['messages'][number]>): AssistantChatThread['messages'][number] {
  return {
    id: input.id ?? 'message-1',
    role: input.role ?? 'user',
    content: input.content ?? '',
    status: input.status ?? 'complete',
    error: input.error,
    createdAt: input.createdAt ?? '2026-06-09T08:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-06-09T08:00:00.000Z',
  }
}

function createWorkspace(): Workspace {
  return {
    id: 'workspace-1',
    title: '魔兽世界',
    description: '',
    status: 'draft',
    moduleCounts: {
      outline: 0,
      characters: 0,
      maps: 0,
      content: 0,
    },
    createdAt: '2026-06-09T08:00:00.000Z',
    updatedAt: '2026-06-09T08:00:00.000Z',
  }
}
