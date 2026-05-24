import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from './types'
import { invoke } from '@tauri-apps/api/core'

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>

export function createTauriStudioStorageDriver(invokeCommand: TauriInvoke = invoke): StudioStorageDriver {
  return {
    async load(): Promise<StudioDataDocument | undefined> {
      const document = await invokeCommand<StudioDataDocument | null>('load_studio_data')

      return document ?? undefined
    },
    async save(document: StudioDataDocument): Promise<void> {
      await invokeCommand('save_studio_data', { document })
    },
  }
}
