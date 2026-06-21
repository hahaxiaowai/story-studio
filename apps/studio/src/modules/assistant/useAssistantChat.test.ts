import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useAssistantChat } from './useAssistantChat'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}))

describe('useAssistantChat', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.clearAllMocks()
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
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
