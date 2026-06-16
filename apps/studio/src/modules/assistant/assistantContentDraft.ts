import { computed, readonly, ref } from 'vue'

export interface AssistantContentDraftPayload {
  content: string
  suggestedEntryId?: string
}

const pendingAssistantContentDraft = ref<AssistantContentDraftPayload>({
  content: '',
})

export const assistantContentDraft = readonly(computed(() => pendingAssistantContentDraft.value.content))

export function queueAssistantContentDraft(
  content: string,
  options: Pick<AssistantContentDraftPayload, 'suggestedEntryId'> = {},
): void {
  const nextContent = content.trim()

  if (!nextContent)
    return

  pendingAssistantContentDraft.value = {
    content: nextContent,
    ...(options.suggestedEntryId ? { suggestedEntryId: options.suggestedEntryId } : {}),
  }
}

export function consumeAssistantContentDraft(): string {
  return consumeAssistantContentDraftPayload().content
}

export function consumeAssistantContentDraftPayload(): AssistantContentDraftPayload {
  const payload = pendingAssistantContentDraft.value

  pendingAssistantContentDraft.value = {
    content: '',
  }

  return payload
}

export function clearAssistantContentDraft(): void {
  pendingAssistantContentDraft.value = {
    content: '',
  }
}
