import type { StudioDataDocument } from '@story-studio/types'
import type { Ref } from 'vue'
import type {
  AutomaticBackupClient,
  AutomaticBackupEntry,
  AutomaticBackupSettings,
} from './automaticBackup'
import { ref } from 'vue'
import {
  AUTOMATIC_BACKUP_INTERVAL_MS,
  hasBackupForDocument,
  sortAutomaticBackups,
} from './automaticBackup'
import { isTauriRuntime } from './runtime'
import { createTauriAutomaticBackupClient } from './tauriAutomaticBackup'
import { useStudioData } from './useStudioData'

export interface AutomaticBackupControllerInput {
  isTauri: boolean
  client: AutomaticBackupClient
  document: Ref<StudioDataDocument>
  ready: Promise<void>
  now?: () => Date
}

export interface AutomaticBackupController {
  entries: Ref<AutomaticBackupEntry[]>
  settings: Ref<AutomaticBackupSettings>
  isChecking: Ref<boolean>
  lastCheckedAt: Ref<string | undefined>
  nextCheckAt: Ref<string | undefined>
  error: Ref<Error | undefined>
  cleanupWarnings: Ref<string[]>
  start: () => Promise<void>
  stop: () => void
  checkNow: () => Promise<void>
  refresh: () => Promise<void>
  setEnabled: (enabled: boolean) => Promise<void>
  read: (id: string) => Promise<string>
  createProtection: (document: StudioDataDocument) => Promise<void>
}

export function createAutomaticBackupController(
  input: AutomaticBackupControllerInput,
): AutomaticBackupController {
  const entries = ref<AutomaticBackupEntry[]>([])
  const settings = ref<AutomaticBackupSettings>({ enabled: true })
  const isChecking = ref(false)
  const lastCheckedAt = ref<string>()
  const nextCheckAt = ref<string>()
  const error = ref<Error>()
  const cleanupWarnings = ref<string[]>([])
  const now = input.now ?? (() => new Date())
  let interval: ReturnType<typeof setInterval> | undefined
  let started = false

  async function start(): Promise<void> {
    if (!input.isTauri || started)
      return

    started = true
    await input.ready

    try {
      settings.value = await input.client.getSettings()
      error.value = undefined
    }
    catch (cause) {
      error.value = toError(cause)
      return
    }

    if (!settings.value.enabled) {
      await refresh()
      return
    }

    await checkNow()
    schedule()
  }

  function stop(): void {
    started = false
    clearSchedule()
  }

  async function checkNow(): Promise<void> {
    if (!input.isTauri || !settings.value.enabled || isChecking.value)
      return

    isChecking.value = true
    try {
      entries.value = sortAutomaticBackups(await input.client.list())
      const document = createPlainDocument(input.document.value)
      if (hasBackupForDocument(entries.value, document.updatedAt)) {
        const result = await input.client.prune()
        cleanupWarnings.value = result.cleanupWarnings
      }
      else {
        const result = await input.client.create(document, 'scheduled')
        cleanupWarnings.value = result.cleanupWarnings
        entries.value = sortAutomaticBackups([result.entry, ...entries.value])
      }
      error.value = undefined
    }
    catch (cause) {
      error.value = toError(cause)
    }
    finally {
      lastCheckedAt.value = now().toISOString()
      isChecking.value = false
    }
  }

  async function refresh(): Promise<void> {
    if (!input.isTauri)
      return

    try {
      entries.value = sortAutomaticBackups(await input.client.list())
      error.value = undefined
    }
    catch (cause) {
      error.value = toError(cause)
    }
  }

  async function setEnabled(enabled: boolean): Promise<void> {
    try {
      settings.value = await input.client.setEnabled(enabled)
      error.value = undefined
    }
    catch (cause) {
      error.value = toError(cause)
      throw error.value
    }

    clearSchedule()
    if (!enabled)
      return

    await checkNow()
    schedule()
  }

  async function createProtection(document: StudioDataDocument): Promise<void> {
    try {
      const result = await input.client.create(createPlainDocument(document), 'pre-restore')
      cleanupWarnings.value = result.cleanupWarnings
      await refresh()
    }
    catch (cause) {
      error.value = toError(cause)
      throw error.value
    }
  }

  function schedule(): void {
    clearSchedule()
    if (!started || !settings.value.enabled)
      return

    nextCheckAt.value = new Date(now().getTime() + AUTOMATIC_BACKUP_INTERVAL_MS).toISOString()
    interval = setInterval(() => {
      nextCheckAt.value = new Date(now().getTime() + AUTOMATIC_BACKUP_INTERVAL_MS).toISOString()
      void checkNow()
    }, AUTOMATIC_BACKUP_INTERVAL_MS)
  }

  function clearSchedule(): void {
    if (interval !== undefined)
      clearInterval(interval)
    interval = undefined
    nextCheckAt.value = undefined
  }

  return {
    entries,
    settings,
    isChecking,
    lastCheckedAt,
    nextCheckAt,
    error,
    cleanupWarnings,
    start,
    stop,
    checkNow,
    refresh,
    setEnabled,
    read: input.client.read,
    createProtection,
  }
}

let automaticBackup: AutomaticBackupController | undefined

export function useAutomaticBackup(): AutomaticBackupController {
  if (!automaticBackup) {
    const studioData = useStudioData()
    automaticBackup = createAutomaticBackupController({
      isTauri: isTauriRuntime(),
      client: createTauriAutomaticBackupClient(),
      document: studioData.document,
      ready: studioData.ready,
    })
  }

  return automaticBackup
}

export function resetAutomaticBackupForTest(): void {
  automaticBackup?.stop()
  automaticBackup = undefined
}

function createPlainDocument(document: StudioDataDocument): StudioDataDocument {
  return JSON.parse(JSON.stringify(document)) as StudioDataDocument
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
