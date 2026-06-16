import { describe, expect, it } from 'vitest'
import {
  assistantDraftPrompt,
  consumeAssistantDraftPrompt,
  consumeAssistantDraftPromptPayload,
  queueAssistantDraftPrompt,
} from './assistantDraft'

describe('assistant draft prompt queue', () => {
  it('queues and consumes a draft prompt once', () => {
    queueAssistantDraftPrompt('请续写第一章')

    expect(assistantDraftPrompt.value).toBe('请续写第一章')
    expect(consumeAssistantDraftPrompt()).toBe('请续写第一章')
    expect(consumeAssistantDraftPrompt()).toBe('')
  })

  it('does not replace an existing draft with blank text', () => {
    queueAssistantDraftPrompt('检查一致性')
    queueAssistantDraftPrompt('   ')

    expect(consumeAssistantDraftPrompt()).toBe('检查一致性')
  })

  it('queues source content entry metadata with the draft prompt', () => {
    queueAssistantDraftPrompt('请续写第二章', { sourceContentEntryId: 'content-2' })

    expect(consumeAssistantDraftPromptPayload()).toEqual({
      prompt: '请续写第二章',
      sourceContentEntryId: 'content-2',
    })
  })
})
