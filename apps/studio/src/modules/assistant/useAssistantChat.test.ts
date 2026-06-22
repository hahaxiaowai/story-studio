import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { invoke } from '@tauri-apps/api/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useAssistantChat } from './useAssistantChat'

const tauriEventListeners = vi.hoisted(() => new Map<string, (event: { payload: unknown }) => void>())

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((eventName: string, listener: (event: { payload: unknown }) => void) => {
    tauriEventListeners.set(eventName, listener)

    return Promise.resolve(vi.fn(() => tauriEventListeners.delete(eventName)))
  }),
}))

describe('useAssistantChat', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    tauriEventListeners.clear()
    vi.clearAllMocks()
    vi.useRealTimers()
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns whether a message was sent and stores its source content entry id', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '润色第二章'
    const sent = await chat.send({ sourceContentEntryId: 'content-2' })

    expect(sent).toBe(true)
    expect(studioData.document.value.assistantChatThreads[0]?.messages[1]).toMatchObject({
      role: 'assistant',
      sourceContentEntryId: 'content-2',
    })
  })

  it('returns false when send is blocked before creating messages', async () => {
    const document = createDefaultStudioDataDocument()
    document.assistantSettings.providers[0] = {
      ...document.assistantSettings.providers[0],
      terminalCommand: '   ',
    }
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '润色第二章'
    const sent = await chat.send({ sourceContentEntryId: 'content-2' })

    expect(sent).toBe(false)
    expect(studioData.document.value.assistantChatThreads).toHaveLength(0)
  })

  it('keeps the source content entry when retrying a sourced assistant turn', async () => {
    const document = createDefaultStudioDataDocument()
    document.assistantChatThreads = [
      {
        id: 'thread-1',
        workspaceId: document.activeWorkspaceId,
        title: '润色第二章',
        providerId: document.assistantSettings.defaultProviderId,
        model: '',
        messages: [
          {
            id: 'user-1',
            role: 'user',
            content: '润色第二章',
            status: 'complete',
            createdAt: '2026-06-16T08:00:00.000Z',
            updatedAt: '2026-06-16T08:00:00.000Z',
          },
          {
            id: 'assistant-1',
            role: 'assistant',
            content: '润色结果',
            status: 'complete',
            sourceContentEntryId: 'content-2',
            createdAt: '2026-06-16T08:00:00.000Z',
            updatedAt: '2026-06-16T08:00:00.000Z',
          },
        ],
        createdAt: '2026-06-16T08:00:00.000Z',
        updatedAt: '2026-06-16T08:00:00.000Z',
      },
    ]
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    await chat.retryLast()

    expect(studioData.document.value.assistantChatThreads[0]?.messages.at(-1)).toMatchObject({
      role: 'assistant',
      sourceContentEntryId: 'content-2',
    })
  })

  it('uses the global story style when sending local terminal prompts', async () => {
    const document = createDefaultStudioDataDocument()
    document.assistantSettings.defaultStoryStyleId = 'story-style-epic-fantasy'
    Object.assign(document.workspaces[0]!, {
      storyStyleId: 'story-style-dark-realism',
    })
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    await chat.send()

    expect(vi.mocked(invoke)).toHaveBeenCalledWith('run_local_terminal_chat_stream', expect.objectContaining({
      prompt: expect.stringContaining('故事风格：史诗奇幻'),
    }))
    expect(vi.mocked(invoke)).toHaveBeenCalledWith('run_local_terminal_chat_stream', expect.objectContaining({
      prompt: expect.not.stringContaining('故事风格：黑暗现实'),
    }))
  })

  it('estimates context usage before sending a message', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'

    expect(chat.activeContextUsage.value).toMatchObject({
      source: 'estimate',
      messageCount: 2,
    })
    expect(chat.activeContextUsageSummary.value.label).toContain('约')
  })

  it('keeps the sent context usage after the composer is cleared', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    const beforeSend = chat.activeContextUsage.value

    await chat.send()

    expect(chat.inputMessage.value).toBe('')
    expect(chat.activeContextUsage.value).toEqual(beforeSend)
  })

  it('returns to live context estimates when composing the next message', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    await chat.send()
    const sentUsage = chat.activeContextUsage.value

    chat.inputMessage.value = '写一个更长的新开头'

    expect(chat.activeContextUsage.value).not.toEqual(sentUsage)
    expect(chat.activeContextUsage.value).toMatchObject({
      source: 'estimate',
      messageCount: 2,
    })
  })

  it('prefers actual API token usage when a usage event arrives', async () => {
    const document = createDefaultStudioDataDocument()
    document.assistantSettings.providers[0] = {
      ...document.assistantSettings.providers[0],
      kind: 'openai-compatible',
      name: 'API 模型',
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4.1-mini',
      terminalCommand: '',
    }
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    await chat.send()
    const invokeArgs = vi.mocked(invoke).mock.calls[0]?.[1] as { runId?: string } | undefined
    const runId = invokeArgs?.runId

    tauriEventListeners.get('assistant-chat-stream')?.({
      payload: {
        runId,
        event: 'chunk',
        usage: {
          promptTokens: 120,
          completionTokens: 20,
          totalTokens: 140,
        },
      },
    })

    expect(chat.lastActualUsage.value).toEqual({
      source: 'actual',
      promptTokens: 120,
      completionTokens: 20,
      totalTokens: 140,
    })
    expect(chat.activeContextUsageSummary.value.label).toBe('Prompt 120 · Completion 20 · Total 140 tokens')
  })

  it('tracks generation timing from send to first chunk and completion', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-22T08:00:00.000Z'))
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    await chat.send()
    const invokeArgs = vi.mocked(invoke).mock.calls[0]?.[1] as { runId?: string } | undefined
    const runId = invokeArgs?.runId

    expect(chat.generationStatus.value).toMatchObject({
      phase: 'waiting-first-token',
      elapsedMs: 0,
    })
    expect(chat.generationStatusSummary.value.label).toBe('等待首字 0.0s')

    vi.setSystemTime(new Date('2026-06-22T08:00:01.250Z'))
    tauriEventListeners.get('assistant-chat-stream')?.({
      payload: {
        runId,
        event: 'chunk',
        stream: 'stdout',
        chunk: '第一段',
      },
    })

    expect(chat.generationStatus.value).toMatchObject({
      phase: 'receiving',
      firstChunkMs: 1250,
      elapsedMs: 1250,
    })
    expect(chat.generationStatusSummary.value.label).toBe('首字 1.3s · 接收中 1.3s')

    vi.setSystemTime(new Date('2026-06-22T08:00:03.000Z'))
    tauriEventListeners.get('assistant-chat-stream')?.({
      payload: {
        runId,
        event: 'done',
        exitCode: 0,
      },
    })

    expect(chat.generationStatus.value).toMatchObject({
      phase: 'complete',
      firstChunkMs: 1250,
      elapsedMs: 3000,
    })
    expect(chat.generationStatusSummary.value.label).toBe('首字 1.3s · 总耗时 3.0s')
  })

  it('updates the waiting-first-token elapsed time while the model is silent', async () => {
    vi.useFakeTimers()
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const chat = useAssistantChat({
      settings: computed(() => studioData.document.value.assistantSettings),
      providers: computed(() => studioData.document.value.assistantSettings.providers),
    })

    chat.inputMessage.value = '写一个开头'
    await chat.send()

    vi.advanceTimersByTime(750)

    expect(chat.generationStatus.value).toMatchObject({
      phase: 'waiting-first-token',
      elapsedMs: 750,
    })
    expect(chat.generationStatusSummary.value.label).toBe('等待首字 0.8s')
  })
})

function createDriver(document: StudioDataDocument | undefined): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
