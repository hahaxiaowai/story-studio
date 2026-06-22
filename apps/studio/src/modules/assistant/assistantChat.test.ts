import type { AiProviderConfig, AssistantChatThread, AssistantStoryStyle, Workspace } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  appendAssistantChunk,
  buildAssistantContextUsageSummary,
  completeAssistantMessage,
  createAssistantThread,
  createAssistantTransportContextUsage,
  createUserAssistantTurn,
  failAssistantMessage,
  filterAssistantThreadsByWorkspace,
  formatAssistantMessageSourceLabel,
  formatAssistantModelSummary,
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

  it('stores source content entry id on the assistant reply placeholder', () => {
    const thread = createThread({ messages: [] })
    const nextThread = createUserAssistantTurn(thread, {
      userContent: '润色第二章',
      assistantMessageId: 'assistant-1',
      userMessageId: 'user-1',
      sourceContentEntryId: 'content-2',
      now: '2026-06-09T08:00:00.000Z',
    })

    expect(nextThread.messages[1]).toMatchObject({
      id: 'assistant-1',
      role: 'assistant',
      sourceContentEntryId: 'content-2',
    })
  })

  it('formats source content labels for assistant messages', () => {
    expect(formatAssistantMessageSourceLabel(
      createMessage({ role: 'assistant', sourceContentEntryId: 'content-2' }),
      [
        { id: 'content-1', volume: '第一卷', chapter: '第一章' },
        { id: 'content-2', volume: '第二卷', chapter: '第三章' },
      ],
    )).toBe('第二卷 / 第三章')
  })

  it('omits source label when message has no source content entry', () => {
    expect(formatAssistantMessageSourceLabel(
      createMessage({ role: 'assistant' }),
      [{ id: 'content-1', volume: '第一卷', chapter: '第一章' }],
    )).toBe('')
  })

  it('marks source label as missing when source content entry was deleted', () => {
    expect(formatAssistantMessageSourceLabel(
      createMessage({ role: 'assistant', sourceContentEntryId: 'missing-content' }),
      [{ id: 'content-1', volume: '第一卷', chapter: '第一章' }],
    )).toBe('missing')
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
      storyStyle: createStoryStyle(),
      moduleName: '助手',
      userMessage: '写一个开头',
    })

    expect(prompt).toContain('当前作品：魔兽世界')
    expect(prompt).toContain('当前模块：助手')
    expect(prompt).toContain('当前 Provider：Codex')
    expect(prompt).toContain('故事风格：史诗奇幻')
    expect(prompt).toContain('风格约束：强调宏大冲突、历史纵深、阵营/世界规则一致性。')
    expect(prompt).toContain('用户输入：\n写一个开头')
  })

  it('omits empty story style constraints from local terminal prompts', () => {
    const prompt = prepareLocalTerminalPrompt({
      workspace: createWorkspace(),
      provider: createProvider(),
      storyStyle: createStoryStyle({ constraints: '   ' }),
      moduleName: '助手',
      userMessage: '写一个开头',
    })

    expect(prompt).toContain('故事风格：史诗奇幻')
    expect(prompt).not.toContain('风格约束：')
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

  it('prepends story style context to API request messages', () => {
    const thread = createThread({
      messages: [
        createMessage({ id: 'user-1', role: 'user', content: '写一个开头' }),
        createMessage({ id: 'assistant-1', role: 'assistant', content: '开头内容', status: 'complete' }),
        createMessage({ id: 'assistant-2', role: 'assistant', content: '', status: 'streaming' }),
      ],
    })

    expect(toAssistantChatRequestMessages(thread, {
      workspace: createWorkspace(),
      moduleName: '助手',
      storyStyle: createStoryStyle(),
    })).toEqual([
      {
        role: 'system',
        content: [
          'Story Studio AI 对话上下文',
          '当前作品：魔兽世界',
          '当前模块：助手',
          '故事风格：史诗奇幻',
          '风格说明：高魔世界的大型战争叙事。',
          '风格约束：强调宏大冲突、历史纵深、阵营/世界规则一致性。',
        ].join('\n'),
      },
      { role: 'user', content: '写一个开头' },
      { role: 'assistant', content: '开头内容' },
    ])
  })

  it('estimates context usage from injected context and request history', () => {
    const thread = createThread({
      messages: [
        createMessage({ id: 'user-1', role: 'user', content: '写一个开头' }),
        createMessage({ id: 'assistant-1', role: 'assistant', content: '开头内容', status: 'complete' }),
      ],
    })

    const usage = createAssistantTransportContextUsage({
      provider: createApiProvider(),
      thread,
      workspace: createWorkspace(),
      moduleName: '助手',
      storyStyle: createStoryStyle({ description: '', constraints: '' }),
      userMessage: '继续写',
    })

    expect(usage).toMatchObject({
      source: 'estimate',
      messageCount: 4,
      characterCount: 55,
      estimatedTokens: 14,
    })
  })

  it('formats estimated and actual context usage summaries', () => {
    expect(buildAssistantContextUsageSummary({
      source: 'estimate',
      messageCount: 3,
      characterCount: 40,
      estimatedTokens: 10,
    })).toEqual({
      source: 'estimate',
      label: '3 条消息 · 40 字符 · 约 10 tokens',
    })

    expect(buildAssistantContextUsageSummary({
      source: 'actual',
      promptTokens: 120,
      completionTokens: 30,
      totalTokens: 150,
    })).toEqual({
      source: 'actual',
      label: 'Prompt 120 · Completion 30 · Total 150 tokens',
    })
  })

  it('formats current model summaries for provider types and missing providers', () => {
    expect(formatAssistantModelSummary(createApiProvider())).toEqual({
      providerName: 'API 模型',
      providerKind: 'API 模型',
      modelName: 'gpt-4.1-mini',
      label: 'API 模型 · API 模型 · gpt-4.1-mini',
    })
    expect(formatAssistantModelSummary(createProvider({ model: '   ' }))).toEqual({
      providerName: 'Codex',
      providerKind: '本地 Terminal',
      modelName: '未设置模型',
      label: 'Codex · 本地 Terminal · 未设置模型',
    })
    expect(formatAssistantModelSummary(undefined)).toEqual({
      providerName: '未选择 Provider',
      providerKind: '',
      modelName: '未设置模型',
      label: '未选择 Provider',
    })
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
    sourceContentEntryId: input.sourceContentEntryId,
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

function createStoryStyle(input: Partial<AssistantStoryStyle> = {}): AssistantStoryStyle {
  return {
    id: input.id ?? 'story-style-epic-fantasy',
    name: input.name ?? '史诗奇幻',
    description: input.description ?? '高魔世界的大型战争叙事。',
    constraints: input.constraints ?? '强调宏大冲突、历史纵深、阵营/世界规则一致性。',
    system: input.system ?? true,
    createdAt: input.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}
