import type { AiProviderConfig, AssistantChatThread, AssistantSettings, Workspace } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import type { AssistantActualTokenUsage, AssistantChatRequestMessage, AssistantChatTransportKind, AssistantContextUsage, AssistantContextUsageSummary, AssistantModelSummary } from './assistantChat'
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { resolveAssistantStoryStyle } from './assistant'
import {
  appendAssistantChunk,
  ASSISTANT_CHAT_TAURI_UNAVAILABLE,
  buildAssistantContextUsageSummary,
  completeAssistantMessage,
  createAssistantThread,
  createAssistantTransportContextUsage,
  createUserAssistantTurn,
  failAssistantMessage,
  filterAssistantThreadsByWorkspace,
  formatAssistantModelSummary,
  getAssistantChatDisabledReason,
  normalizeOpenAiCompatibleBaseUrl,
  prepareLocalTerminalPrompt,
  toAssistantChatRequestMessages,
} from './assistantChat'
import { resolveAssistantRunnerProvider } from './assistantRunner'

export interface AssistantChatStreamEvent {
  runId: string
  event: 'chunk' | 'done' | 'error'
  stream?: 'stdout' | 'stderr'
  chunk?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  exitCode?: number | null
  durationMs?: number
  error?: string
}

type UnlistenFn = () => void

export type AssistantGenerationPhase = 'idle' | 'waiting-first-token' | 'receiving' | 'complete' | 'error'

export interface AssistantGenerationStatus {
  phase: AssistantGenerationPhase
  elapsedMs: number
  firstChunkMs?: number
}

export interface AssistantGenerationStatusSummary {
  phase: AssistantGenerationPhase
  label: string
}

export interface SendAssistantChatInput {
  sourceContentEntryId?: string
}

export function useAssistantChat(input: {
  settings: ComputedRef<AssistantSettings>
  providers: ComputedRef<AiProviderConfig[]>
}): {
  threads: ComputedRef<AssistantChatThread[]>
  selectedThreadId: Ref<string>
  activeThread: ComputedRef<AssistantChatThread | undefined>
  selectedProviderId: Ref<string>
  provider: ComputedRef<AiProviderConfig | undefined>
  activeModelSummary: ComputedRef<AssistantModelSummary>
  activeContextUsage: ComputedRef<AssistantContextUsage>
  activeContextUsageSummary: ComputedRef<AssistantContextUsageSummary>
  lastActualUsage: Ref<AssistantActualTokenUsage | undefined>
  generationStatus: Ref<AssistantGenerationStatus>
  generationStatusSummary: ComputedRef<AssistantGenerationStatusSummary>
  inputMessage: Ref<string>
  loading: Ref<boolean>
  error: Ref<string>
  stderr: Ref<string>
  disabledReason: ComputedRef<string>
  createThread: (titleSeed?: string) => AssistantChatThread
  clearThread: () => void
  send: (input?: SendAssistantChatInput) => Promise<boolean>
  retryLast: () => Promise<void>
  stop: () => Promise<void>
  copyMessage: (content: string) => Promise<void>
} {
  const studioData = useStudioData()
  const selectedThreadId = ref('')
  const selectedProviderId = ref('')
  const inputMessage = ref('')
  const loading = ref(false)
  const error = ref('')
  const stderr = ref('')
  const activeRunId = ref('')
  const activeAssistantMessageId = ref('')
  const activeTransportKind = ref<AssistantChatTransportKind>()
  const lastSentContextUsage = ref<AssistantContextUsage>()
  const lastActualUsage = ref<AssistantActualTokenUsage>()
  const generationStatus = ref<AssistantGenerationStatus>({
    phase: 'idle',
    elapsedMs: 0,
  })
  const generationStartedAt = ref<number>()
  const generationTimer = ref<ReturnType<typeof setInterval>>()
  const unlisten = ref<UnlistenFn>()
  const currentWorkspace = computed<Workspace | undefined>(() => {
    return studioData.document.value.workspaces.find(workspace => workspace.id === studioData.document.value.activeWorkspaceId)
  })
  const currentStoryStyle = computed(() => resolveAssistantStoryStyle(input.settings.value))
  const threads = computed(() => {
    return filterAssistantThreadsByWorkspace(
      studioData.document.value.assistantChatThreads,
      studioData.document.value.activeWorkspaceId,
    )
  })
  const activeThread = computed(() => threads.value.find(thread => thread.id === selectedThreadId.value) ?? threads.value[0])
  const provider = computed(() => resolveAssistantRunnerProvider(input.settings.value, selectedProviderId.value))
  const activeModelSummary = computed(() => formatAssistantModelSummary(provider.value))
  const liveContextUsage = computed(() => createAssistantTransportContextUsage({
    provider: provider.value,
    thread: activeThread.value,
    workspace: currentWorkspace.value,
    moduleName: '助手',
    storyStyle: currentStoryStyle.value,
    userMessage: inputMessage.value,
  }))
  const activeContextUsage = computed<AssistantContextUsage>(() => {
    if (inputMessage.value.trim())
      return liveContextUsage.value

    return lastActualUsage.value ?? lastSentContextUsage.value ?? liveContextUsage.value
  })
  const activeContextUsageSummary = computed(() => buildAssistantContextUsageSummary(activeContextUsage.value))
  const generationStatusSummary = computed<AssistantGenerationStatusSummary>(() => ({
    phase: generationStatus.value.phase,
    label: formatGenerationStatusLabel(generationStatus.value),
  }))
  const disabledReason = computed(() => getAssistantChatDisabledReason({
    isTauri: getIsTauri(),
    loading: loading.value,
    provider: provider.value,
    prompt: inputMessage.value,
  }))

  watch(threads, (nextThreads) => {
    if (!nextThreads.length) {
      selectedThreadId.value = ''
      return
    }

    if (!selectedThreadId.value || !nextThreads.some(thread => thread.id === selectedThreadId.value))
      selectedThreadId.value = nextThreads[0]?.id ?? ''
  }, { immediate: true })

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      void cleanupListener()
      stopGenerationTimer()
    })
  }

  function createThread(titleSeed = ''): AssistantChatThread {
    const now = new Date().toISOString()
    const thread = createAssistantThread({
      workspaceId: studioData.document.value.activeWorkspaceId,
      providerId: provider.value?.id ?? '',
      model: provider.value?.model ?? '',
      now,
      titleSeed,
    })

    studioData.updateDocument((document) => {
      document.assistantChatThreads = [...document.assistantChatThreads, thread]
    })
    selectedThreadId.value = thread.id

    return thread
  }

  function clearThread(): void {
    if (!activeThread.value)
      return

    const now = new Date().toISOString()
    replaceThread({
      ...activeThread.value,
      messages: [],
      updatedAt: now,
    })
  }

  async function send(input: SendAssistantChatInput = {}): Promise<boolean> {
    const reason = disabledReason.value

    if (reason) {
      error.value = reason
      return false
    }

    const userMessage = inputMessage.value.trim()
    const selectedProvider = provider.value

    if (!selectedProvider)
      return false

    const thread = activeThread.value ?? createThread(userMessage)
    const now = new Date().toISOString()
    const requestContextUsage = createAssistantTransportContextUsage({
      provider: selectedProvider,
      thread,
      workspace: currentWorkspace.value,
      moduleName: '助手',
      storyStyle: currentStoryStyle.value,
      userMessage,
    })
    const runId = createId('assistant-run')
    const userMessageId = createId('assistant-message')
    const assistantMessageId = createId('assistant-message')
    const nextThread = createUserAssistantTurn({
      ...thread,
      providerId: selectedProvider.id,
      model: selectedProvider.model,
    }, {
      userContent: userMessage,
      userMessageId,
      assistantMessageId,
      sourceContentEntryId: input.sourceContentEntryId,
      now,
    })

    replaceThread(nextThread)
    inputMessage.value = ''
    loading.value = true
    error.value = ''
    stderr.value = ''
    lastSentContextUsage.value = requestContextUsage
    lastActualUsage.value = undefined
    startGenerationTiming()
    activeRunId.value = runId
    activeAssistantMessageId.value = assistantMessageId

    try {
      activeTransportKind.value = selectedProvider.kind
      await ensureListener()
      await runChatStream({
        runId,
        provider: selectedProvider,
        thread: nextThread,
        userMessage,
      })
    }
    catch (runError) {
      const message = getErrorMessage(runError)

      error.value = message
      markActiveAssistantFailed(message)
      finishActiveRun()
    }

    return true
  }

  async function retryLast(): Promise<void> {
    const messages = activeThread.value?.messages ?? []
    const lastUserMessageIndex = messages.findLastIndex(message => message.role === 'user')
    const lastUserMessage = lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : undefined

    if (!lastUserMessage)
      return

    const sourceContentEntryId = messages
      .slice(lastUserMessageIndex + 1)
      .find(message => message.role === 'assistant' && message.sourceContentEntryId)
      ?.sourceContentEntryId

    inputMessage.value = lastUserMessage.content
    await send({ sourceContentEntryId })
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

  async function copyMessage(content: string): Promise<void> {
    await navigator.clipboard?.writeText(content)
  }

  async function ensureListener(): Promise<void> {
    if (unlisten.value)
      return

    if (!getIsTauri())
      throw new Error(ASSISTANT_CHAT_TAURI_UNAVAILABLE)

    const { listen } = await import('@tauri-apps/api/event')

    unlisten.value = await listen<AssistantChatStreamEvent>('assistant-chat-stream', (event) => {
      handleStreamEvent(event.payload)
    })
  }

  async function cleanupListener(): Promise<void> {
    unlisten.value?.()
    unlisten.value = undefined
  }

  async function runChatStream(input: {
    runId: string
    provider: AiProviderConfig
    thread: AssistantChatThread
    userMessage: string
  }): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')

    if (input.provider.kind === 'openai-compatible') {
      await invoke('run_openai_compatible_chat_stream', {
        runId: input.runId,
        providerId: input.provider.id,
        baseUrl: normalizeOpenAiCompatibleBaseUrl(input.provider.baseUrl),
        apiKey: input.provider.apiKey,
        model: input.provider.model,
        messages: toAssistantChatRequestMessages(input.thread, {
          workspace: currentWorkspace.value,
          moduleName: '助手',
          storyStyle: currentStoryStyle.value,
        }) satisfies AssistantChatRequestMessage[],
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
        moduleName: '助手',
        userMessage: input.userMessage,
      }),
    })
  }

  function handleStreamEvent(event: AssistantChatStreamEvent): void {
    if (event.runId !== activeRunId.value)
      return

    if (event.event === 'chunk') {
      if (event.usage) {
        lastActualUsage.value = {
          source: 'actual',
          promptTokens: event.usage.promptTokens,
          completionTokens: event.usage.completionTokens,
          totalTokens: event.usage.totalTokens,
        }
      }

      if (event.stream === 'stdout' && event.chunk)
        markFirstChunkReceived()

      if (event.stream === 'stdout' && event.chunk)
        updateActiveThread(thread => appendAssistantChunk(thread, activeAssistantMessageId.value, event.chunk ?? ''))

      if (event.stream === 'stderr' && event.chunk)
        stderr.value = `${stderr.value}${event.chunk}`

      return
    }

    if (event.event === 'done') {
      if (event.exitCode && event.exitCode !== 0) {
        markActiveAssistantFailed(stderr.value.trim() || `本地命令退出码为 ${event.exitCode}。`)
        finishActiveRun()
        return
      }

      completeGenerationTiming('complete')
      updateActiveThread(thread => completeAssistantMessage(thread, activeAssistantMessageId.value, new Date().toISOString()))
      finishActiveRun()
      return
    }

    if (event.event === 'error') {
      markActiveAssistantFailed(event.error || '本地命令执行失败。')
      finishActiveRun()
    }
  }

  function markActiveAssistantFailed(message: string): void {
    error.value = message
    completeGenerationTiming('error')
    updateActiveThread(thread => failAssistantMessage(thread, activeAssistantMessageId.value, message, new Date().toISOString()))
  }

  function startGenerationTiming(): void {
    generationStartedAt.value = Date.now()
    generationStatus.value = {
      phase: 'waiting-first-token',
      elapsedMs: 0,
    }
    startGenerationTimer()
  }

  function markFirstChunkReceived(): void {
    if (generationStatus.value.firstChunkMs !== undefined)
      return

    const startedAt = generationStartedAt.value

    if (startedAt === undefined)
      return

    const elapsedMs = Date.now() - startedAt
    generationStatus.value = {
      phase: 'receiving',
      elapsedMs,
      firstChunkMs: elapsedMs,
    }
  }

  function completeGenerationTiming(phase: Extract<AssistantGenerationPhase, 'complete' | 'error'>): void {
    const startedAt = generationStartedAt.value

    if (startedAt === undefined)
      return

    generationStatus.value = {
      phase,
      elapsedMs: Date.now() - startedAt,
      firstChunkMs: generationStatus.value.firstChunkMs,
    }
    stopGenerationTimer()
  }

  function startGenerationTimer(): void {
    if (generationTimer.value !== undefined)
      return

    generationTimer.value = setInterval(() => {
      updateGenerationElapsed()
    }, 250)
  }

  function stopGenerationTimer(): void {
    if (generationTimer.value === undefined)
      return

    clearInterval(generationTimer.value)
    generationTimer.value = undefined
  }

  function updateGenerationElapsed(): void {
    const startedAt = generationStartedAt.value

    if (startedAt === undefined)
      return

    if (generationStatus.value.phase !== 'waiting-first-token' && generationStatus.value.phase !== 'receiving')
      return

    generationStatus.value = {
      ...generationStatus.value,
      elapsedMs: Date.now() - startedAt,
    }
  }

  function finishActiveRun(): void {
    loading.value = false
    activeRunId.value = ''
    activeAssistantMessageId.value = ''
    activeTransportKind.value = undefined
    void cleanupListener()
  }

  function updateActiveThread(updater: (thread: AssistantChatThread) => AssistantChatThread): void {
    const thread = activeThread.value

    if (!thread)
      return

    replaceThread(updater(thread))
  }

  function replaceThread(thread: AssistantChatThread): void {
    studioData.updateDocument((document) => {
      document.assistantChatThreads = document.assistantChatThreads.map(item => item.id === thread.id ? thread : item)
    })
  }

  return {
    threads,
    selectedThreadId,
    activeThread,
    selectedProviderId,
    provider,
    activeModelSummary,
    activeContextUsage,
    activeContextUsageSummary,
    lastActualUsage,
    generationStatus,
    generationStatusSummary,
    inputMessage,
    loading,
    error,
    stderr,
    disabledReason,
    createThread,
    clearThread,
    send,
    retryLast,
    stop,
    copyMessage,
  }
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

function formatGenerationStatusLabel(status: AssistantGenerationStatus): string {
  if (status.phase === 'waiting-first-token') {
    return `等待首字 ${formatSeconds(status.elapsedMs)}`
  }

  if (status.phase === 'receiving') {
    return `首字 ${formatSeconds(status.firstChunkMs ?? status.elapsedMs)} · 接收中 ${formatSeconds(status.elapsedMs)}`
  }

  if (status.phase === 'complete') {
    return status.firstChunkMs === undefined
      ? `总耗时 ${formatSeconds(status.elapsedMs)}`
      : `首字 ${formatSeconds(status.firstChunkMs)} · 总耗时 ${formatSeconds(status.elapsedMs)}`
  }

  if (status.phase === 'error') {
    return status.firstChunkMs === undefined
      ? `失败 ${formatSeconds(status.elapsedMs)}`
      : `首字 ${formatSeconds(status.firstChunkMs)} · 失败 ${formatSeconds(status.elapsedMs)}`
  }

  return ''
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}
