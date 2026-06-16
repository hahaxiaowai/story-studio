import { readonly, ref } from 'vue'

const pendingAssistantDraftPrompt = ref('')

export const assistantDraftPrompt = readonly(pendingAssistantDraftPrompt)

export function queueAssistantDraftPrompt(prompt: string): void {
  const nextPrompt = prompt.trim()

  if (!nextPrompt)
    return

  pendingAssistantDraftPrompt.value = nextPrompt
}

export function consumeAssistantDraftPrompt(): string {
  const prompt = pendingAssistantDraftPrompt.value

  pendingAssistantDraftPrompt.value = ''

  return prompt
}
