import type { AiProviderConfig, AssistantSettings, AssistantStoryStyle, Workspace } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import type { AssistantChatRequestMessage, AssistantChatTransportKind } from '../assistant/assistantChat'
import type { AssistantChatStreamEvent } from '../assistant/useAssistantChat'
import { computed, getCurrentInstance, onBeforeUnmount, ref } from 'vue'
import {
  getFeatureModelBinding,
  resolveAssistantStoryStyle,
} from '../assistant/assistant'
import {
  getAssistantChatDisabledReason,
  normalizeOpenAiCompatibleBaseUrl,
  prepareLocalTerminalPrompt,
} from '../assistant/assistantChat'
import { resolveAssistantRunnerProvider } from '../assistant/assistantRunner'
import { useStudioData } from '../storage/useStudioData'

type UnlistenFn = () => void

export function useContentInlineAssistant(input: {
  settings: ComputedRef<AssistantSettings>
}): {
  provider: ComputedRef<AiProviderConfig | undefined>
  output: Ref<string>
  loading: Ref<boolean>
  error: Ref<string>
  stderr: Ref<string>
  getDisabledReason: (prompt: string) => string
  run: (prompt: string) => Promise<boolean>
  stop: () => Promise<void>
  reset: () => void
} {
  const studioData = useStudioData()
  const output = ref('')
  const loading = ref(false)
  const error = ref('')
  const stderr = ref('')
  const activeRunId = ref('')
  const activeTransportKind = ref<AssistantChatTransportKind>()
  const unlisten = ref<UnlistenFn>()
  const currentWorkspace = computed<Workspace | undefined>(() => {
    return studioData.document.value.workspaces.find(workspace => workspace.id === studioData.document.value.activeWorkspaceId)
  })
  const currentStoryStyle = computed<AssistantStoryStyle | undefined>(() => resolveAssistantStoryStyle(input.settings.value))
  const provider = computed<AiProviderConfig | undefined>(() => resolveContentProvider(input.settings.value))

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      void cleanupListener()
    })
  }

  function getDisabledReason(prompt: string): string {
    if (!prompt.trim())
      return '请先输入批注要求。'

    const reason = getAssistantChatDisabledReason({
      isTauri: getIsTauri(),
      loading: loading.value,
      provider: provider.value,
      prompt,
    })

    if (reason === '正在生成回复。')
      return '正在生成改写。'

    return reason
  }

  async function run(prompt: string): Promise<boolean> {
    const reason = getDisabledReason(prompt)

    if (reason) {
      error.value = reason
      return false
    }

    const selectedProvider = provider.value

    if (!selectedProvider)
      return false

    const runId = createId('content-inline-ai-run')

    output.value = ''
    error.value = ''
    stderr.value = ''
    loading.value = true
    activeRunId.value = runId
    activeTransportKind.value = selectedProvider.kind

    try {
      await ensureListener()
      await runInlineStream({
        runId,
        provider: selectedProvider,
        prompt: prompt.trim(),
      })
    }
    catch (runError) {
      error.value = getErrorMessage(runError)
      finishActiveRun()
      return false
    }

    return true
  }

  async function stop(): Promise<void> {
    if (!activeRunId.value)
      return

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const command = activeTransportKind.value === 'openai-compatible'
        ? 'cancel_openai_compatible_chat_stream'
        : 'cancel_local_terminal_chat_stream'

      await invoke(command, { runId: activeRunId.value })
    }
    catch (stopError) {
      error.value = getErrorMessage(stopError)
    }
  }

  function reset(): void {
    output.value = ''
    error.value = ''
    stderr.value = ''
  }

  async function ensureListener(): Promise<void> {
    if (unlisten.value)
      return

    if (!getIsTauri())
      throw new Error('正文 AI 批注仅 Tauri 可用。')

    const { listen } = await import('@tauri-apps/api/event')

    unlisten.value = await listen<AssistantChatStreamEvent>('assistant-chat-stream', (event) => {
      handleStreamEvent(event.payload)
    })
  }

  async function cleanupListener(): Promise<void> {
    unlisten.value?.()
    unlisten.value = undefined
  }

  async function runInlineStream(input: {
    runId: string
    provider: AiProviderConfig
    prompt: string
  }): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')

    if (input.provider.kind === 'openai-compatible') {
      await invoke('run_openai_compatible_chat_stream', {
        runId: input.runId,
        providerId: input.provider.id,
        baseUrl: normalizeOpenAiCompatibleBaseUrl(input.provider.baseUrl),
        apiKey: input.provider.apiKey,
        model: input.provider.model,
        messages: createInlineApiMessages(input.prompt),
      })
      return
    }

    await invoke('run_local_terminal_chat_stream', {
      runId: input.runId,
      providerId: input.provider.id,
      command: input.provider.terminalCommand,
      model: input.provider.model,
      prompt: prepareLocalTerminalPrompt({
        workspace: currentWorkspace.value,
        provider: input.provider,
        storyStyle: currentStoryStyle.value,
        moduleName: '正文批注',
        userMessage: input.prompt,
      }),
    })
  }

  function handleStreamEvent(event: AssistantChatStreamEvent): void {
    if (event.runId !== activeRunId.value)
      return

    if (event.event === 'chunk') {
      if (event.stream === 'stdout' && event.chunk)
        output.value = `${output.value}${event.chunk}`

      if (event.stream === 'stderr' && event.chunk)
        stderr.value = `${stderr.value}${event.chunk}`

      return
    }

    if (event.event === 'done') {
      if (event.exitCode && event.exitCode !== 0)
        error.value = stderr.value.trim() || `本地命令退出码为 ${event.exitCode}。`

      finishActiveRun()
      return
    }

    if (event.event === 'error') {
      error.value = event.error || '正文 AI 批注生成失败。'
      finishActiveRun()
    }
  }

  function createInlineApiMessages(prompt: string): AssistantChatRequestMessage[] {
    return [
      {
        role: 'system',
        content: createInlineSystemMessage({
          workspace: currentWorkspace.value,
          storyStyle: currentStoryStyle.value,
        }),
      },
      {
        role: 'user',
        content: prompt,
      },
    ]
  }

  function finishActiveRun(): void {
    loading.value = false
    activeRunId.value = ''
    activeTransportKind.value = undefined
    void cleanupListener()
  }

  return {
    provider,
    output,
    loading,
    error,
    stderr,
    getDisabledReason,
    run,
    stop,
    reset,
  }
}

function resolveContentProvider(settings: AssistantSettings): AiProviderConfig | undefined {
  const binding = getFeatureModelBinding(settings, 'content')
  const provider = resolveAssistantRunnerProvider(settings, binding.providerId)

  if (!provider)
    return undefined

  return {
    ...provider,
    model: binding.model || provider.model,
  }
}

function createInlineSystemMessage(input: {
  workspace: Workspace | undefined
  storyStyle: AssistantStoryStyle | undefined
}): string {
  const storyStyle = input.storyStyle

  return [
    'Story Studio AI 对话上下文',
    `当前作品：${input.workspace?.title || '未选择作品'}`,
    '当前模块：正文批注',
    ...(storyStyle
      ? [
          `故事风格：${storyStyle.name}`,
          ...(storyStyle.description.trim() ? [`风格说明：${storyStyle.description.trim()}`] : []),
          ...(storyStyle.constraints.trim() ? [`风格约束：${storyStyle.constraints.trim()}`] : []),
        ]
      : []),
  ].join('\n')
}

function getIsTauri(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message

  return String(error)
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
