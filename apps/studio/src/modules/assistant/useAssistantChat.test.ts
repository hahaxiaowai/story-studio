import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
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
