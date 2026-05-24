import type { StudioStorageDriver } from './types'
import { createIndexedDbStudioStorageDriver } from './indexedDb'
import { createTauriStudioStorageDriver } from './tauri'

export function createStudioStorageDriver(): StudioStorageDriver {
  return isTauriRuntime()
    ? createTauriStudioStorageDriver()
    : createIndexedDbStudioStorageDriver()
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
