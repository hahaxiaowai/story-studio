import { describe, expect, it } from 'vitest'
import {
  assistantContentDraft,
  clearAssistantContentDraft,
  consumeAssistantContentDraft,
  queueAssistantContentDraft,
} from './assistantContentDraft'

describe('assistant content draft queue', () => {
  it('queues and consumes assistant content draft once', () => {
    queueAssistantContentDraft('第一段草稿')

    expect(assistantContentDraft.value).toBe('第一段草稿')
    expect(consumeAssistantContentDraft()).toBe('第一段草稿')
    expect(consumeAssistantContentDraft()).toBe('')
  })

  it('ignores blank draft content', () => {
    queueAssistantContentDraft('可插入草稿')
    queueAssistantContentDraft('   ')

    expect(consumeAssistantContentDraft()).toBe('可插入草稿')
  })

  it('clears queued draft content', () => {
    queueAssistantContentDraft('待取消草稿')
    clearAssistantContentDraft()

    expect(assistantContentDraft.value).toBe('')
  })
})
