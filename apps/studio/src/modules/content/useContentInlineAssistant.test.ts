import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useContentInlineAssistant } from './useContentInlineAssistant'

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

describe('useContentInlineAssistant', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    tauriEventListeners.clear()
    vi.clearAllMocks()
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
  })

  it('blocks blank inline annotation prompts before invoking a model', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const inlineAssistant = useContentInlineAssistant({
      settings: computed(() => studioData.document.value.assistantSettings),
    })

    const sent = await inlineAssistant.run('   ')

    expect(sent).toBe(false)
    expect(inlineAssistant.error.value).toBe('请先输入批注要求。')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('uses the content feature API provider and accumulates streamed stdout', async () => {
    const document = createDefaultStudioDataDocument()
    document.assistantSettings.providers = [
      ...document.assistantSettings.providers,
      {
        id: 'provider-content-api',
        kind: 'openai-compatible',
        name: 'Content API',
        baseUrl: 'https://api.example.com/v1/',
        apiKey: 'sk-test',
        model: 'default-model',
        terminalCommand: '',
        enabled: true,
        createdAt: '2026-06-24T08:00:00.000Z',
        updatedAt: '2026-06-24T08:00:00.000Z',
      },
    ]
    document.assistantSettings.featureBindings = [
      {
        feature: 'content',
        providerId: 'provider-content-api',
        model: 'content-model',
      },
    ]
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const inlineAssistant = useContentInlineAssistant({
      settings: computed(() => studioData.document.value.assistantSettings),
    })

    const sent = await inlineAssistant.run('请把选中段落写得更压抑。')
    const invokeArgs = vi.mocked(invoke).mock.calls[0]?.[1] as {
      runId?: string
      model?: string
      baseUrl?: string
      messages?: Array<{ role: string, content: string }>
    } | undefined

    expect(sent).toBe(true)
    expect(vi.mocked(invoke)).toHaveBeenCalledWith('run_openai_compatible_chat_stream', expect.objectContaining({
      providerId: 'provider-content-api',
      baseUrl: 'https://api.example.com/v1',
      model: 'content-model',
    }))
    expect(invokeArgs?.messages).toEqual([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('当前模块：正文批注'),
      }),
      {
        role: 'user',
        content: '请把选中段落写得更压抑。',
      },
    ])

    tauriEventListeners.get('assistant-chat-stream')?.({
      payload: {
        runId: invokeArgs?.runId,
        event: 'chunk',
        stream: 'stdout',
        chunk: '冷风压低了钟声',
      },
    })
    tauriEventListeners.get('assistant-chat-stream')?.({
      payload: {
        runId: invokeArgs?.runId,
        event: 'done',
        exitCode: 0,
      },
    })

    expect(inlineAssistant.output.value).toBe('冷风压低了钟声')
    expect(inlineAssistant.loading.value).toBe(false)
    expect(inlineAssistant.error.value).toBe('')
  })

  it('runs inline annotations through the default local terminal provider', async () => {
    const document = createDefaultStudioDataDocument()
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready
    const inlineAssistant = useContentInlineAssistant({
      settings: computed(() => studioData.document.value.assistantSettings),
    })

    await inlineAssistant.run('请把整章语言压缩得更利落。')

    expect(vi.mocked(invoke)).toHaveBeenCalledWith('run_local_terminal_chat_stream', expect.objectContaining({
      providerId: 'provider-codex-terminal',
      model: '5.5',
      prompt: expect.stringContaining('当前模块：正文批注'),
    }))
    expect(vi.mocked(invoke)).toHaveBeenCalledWith('run_local_terminal_chat_stream', expect.objectContaining({
      prompt: expect.stringContaining('请把整章语言压缩得更利落。'),
    }))
  })
})

function createDriver(document: StudioDataDocument): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
