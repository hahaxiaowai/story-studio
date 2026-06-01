import type { AiProviderConfig, AssistantSettings } from '@story-studio/types'
import type { Ref } from 'vue'
import { ref } from 'vue'

export const LOCAL_TERMINAL_TAURI_UNAVAILABLE = '本地 Terminal 仅 Tauri 可用。'

export interface LocalTerminalModelResult {
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
}

export interface RunLocalTerminalModelPayload extends Record<string, unknown> {
  providerId: string
  command: string
  model: string
  prompt: string
}

export interface AssistantRunnerState {
  loading: Ref<boolean>
  error: Ref<string>
  result: Ref<LocalTerminalModelResult | null>
  run: (provider: AiProviderConfig | undefined, prompt: string) => Promise<void>
  reset: () => void
}

export interface AssistantRunnerDependencies {
  isTauri?: () => boolean
  invoke?: (command: string, payload: RunLocalTerminalModelPayload) => Promise<LocalTerminalModelResult>
}

export function resolveAssistantRunnerProvider(settings: AssistantSettings, providerId: string | undefined): AiProviderConfig | undefined {
  return settings.providers.find(provider => provider.id === providerId)
    ?? settings.providers.find(provider => provider.id === settings.defaultProviderId)
}

export function getAssistantRunDisabledReason(input: {
  provider: AiProviderConfig | undefined
  prompt: string
  loading: boolean
}): string {
  if (input.loading)
    return '正在运行本地命令。'

  if (!input.provider)
    return '请先选择 Provider。'

  if (input.provider.kind !== 'local-terminal')
    return '请选择本地 Terminal Provider。'

  if (!input.provider.terminalCommand.trim())
    return '请先填写 Terminal 命令。'

  if (!input.prompt.trim())
    return '请先输入 Prompt。'

  return ''
}

export function createAssistantRunner(dependencies: AssistantRunnerDependencies = {}): AssistantRunnerState {
  const loading = ref(false)
  const error = ref('')
  const result = ref<LocalTerminalModelResult | null>(null)

  async function run(provider: AiProviderConfig | undefined, prompt: string): Promise<void> {
    const disabledReason = getAssistantRunDisabledReason({
      provider,
      prompt,
      loading: loading.value,
    })

    if (disabledReason) {
      error.value = disabledReason
      return
    }

    if (!provider)
      return

    if (!getIsTauri(dependencies)) {
      error.value = LOCAL_TERMINAL_TAURI_UNAVAILABLE
      result.value = null
      return
    }

    loading.value = true
    error.value = ''
    result.value = null

    try {
      const nextResult = await getInvoke(dependencies)('run_local_terminal_model', {
        providerId: provider.id,
        command: provider.terminalCommand,
        model: provider.model,
        prompt,
      })

      result.value = nextResult
      error.value = nextResult.exitCode && nextResult.exitCode !== 0
        ? `本地命令退出码为 ${nextResult.exitCode}。`
        : ''
    }
    catch (runError) {
      error.value = getErrorMessage(runError)
      result.value = null
    }
    finally {
      loading.value = false
    }
  }

  function reset(): void {
    loading.value = false
    error.value = ''
    result.value = null
  }

  return {
    loading,
    error,
    result,
    run,
    reset,
  }
}

function getIsTauri(dependencies: AssistantRunnerDependencies): boolean {
  if (dependencies.isTauri)
    return dependencies.isTauri()

  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
}

function getInvoke(dependencies: AssistantRunnerDependencies): NonNullable<AssistantRunnerDependencies['invoke']> {
  if (dependencies.invoke)
    return dependencies.invoke

  return async (command, payload) => {
    const { invoke } = await import('@tauri-apps/api/core')

    return invoke<LocalTerminalModelResult>(command, payload)
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message

  return String(error)
}
