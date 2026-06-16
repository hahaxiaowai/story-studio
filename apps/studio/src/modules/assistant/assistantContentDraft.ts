import { readonly, ref } from 'vue'

const pendingAssistantContentDraft = ref('')

export const assistantContentDraft = readonly(pendingAssistantContentDraft)

export function queueAssistantContentDraft(content: string): void {
  const nextContent = content.trim()

  if (!nextContent)
    return

  pendingAssistantContentDraft.value = nextContent
}

export function consumeAssistantContentDraft(): string {
  const content = pendingAssistantContentDraft.value

  pendingAssistantContentDraft.value = ''

  return content
}

export function clearAssistantContentDraft(): void {
  pendingAssistantContentDraft.value = ''
}
