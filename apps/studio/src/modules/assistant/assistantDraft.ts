import { computed, readonly, ref } from 'vue'

export interface AssistantDraftPromptPayload {
  prompt: string
  sourceContentEntryId?: string
}

const pendingAssistantDraftPrompt = ref<AssistantDraftPromptPayload>({
  prompt: '',
})

export const assistantDraftPrompt = readonly(computed(() => pendingAssistantDraftPrompt.value.prompt))

export function queueAssistantDraftPrompt(
  prompt: string,
  options: Pick<AssistantDraftPromptPayload, 'sourceContentEntryId'> = {},
): void {
  const nextPrompt = prompt.trim()

  if (!nextPrompt)
    return

  pendingAssistantDraftPrompt.value = {
    prompt: nextPrompt,
    ...(options.sourceContentEntryId ? { sourceContentEntryId: options.sourceContentEntryId } : {}),
  }
}

export function consumeAssistantDraftPrompt(): string {
  return consumeAssistantDraftPromptPayload().prompt
}

export function consumeAssistantDraftPromptPayload(): AssistantDraftPromptPayload {
  const payload = pendingAssistantDraftPrompt.value

  pendingAssistantDraftPrompt.value = {
    prompt: '',
  }

  return payload
}
