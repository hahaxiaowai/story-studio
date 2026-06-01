import type { AiProviderConfig, AssistantSettings } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import {
  createAssistantRunner,
  getAssistantRunDisabledReason,
  resolveAssistantRunnerProvider,
} from './assistantRunner'

export function useAssistantRunner(settings: ComputedRef<AssistantSettings>): {
  selectedProviderId: Ref<string>
  prompt: Ref<string>
  provider: ComputedRef<AiProviderConfig | undefined>
  disabledReason: ComputedRef<string>
  loading: ReturnType<typeof createAssistantRunner>['loading']
  error: ReturnType<typeof createAssistantRunner>['error']
  result: ReturnType<typeof createAssistantRunner>['result']
  run: () => Promise<void>
} {
  const selectedProviderId = ref('')
  const prompt = ref('')
  const runner = createAssistantRunner()
  const provider = computed(() => resolveAssistantRunnerProvider(settings.value, selectedProviderId.value))
  const disabledReason = computed(() => getAssistantRunDisabledReason({
    provider: provider.value,
    prompt: prompt.value,
    loading: runner.loading.value,
  }))

  async function run(): Promise<void> {
    await runner.run(provider.value, prompt.value)
  }

  return {
    selectedProviderId,
    prompt,
    provider,
    disabledReason,
    loading: runner.loading,
    error: runner.error,
    result: runner.result,
    run,
  }
}
