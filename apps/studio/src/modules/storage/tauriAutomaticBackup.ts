import type { StudioDataDocument } from '@story-studio/types'
import type {
  AutomaticBackupCleanupResult,
  AutomaticBackupClient,
  AutomaticBackupEntry,
  AutomaticBackupMutationResult,
  AutomaticBackupSettings,
  AutomaticBackupSource,
} from './automaticBackup'
import { invoke } from '@tauri-apps/api/core'

export type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>

export function createTauriAutomaticBackupClient(
  invokeCommand: TauriInvoke = invoke,
): AutomaticBackupClient {
  return {
    getSettings: () => invokeCommand<AutomaticBackupSettings>('get_automatic_backup_settings'),
    setEnabled: enabled => invokeCommand<AutomaticBackupSettings>('set_automatic_backup_enabled', { enabled }),
    list: () => invokeCommand<AutomaticBackupEntry[]>('list_automatic_backups'),
    create: (document: StudioDataDocument, source: AutomaticBackupSource) =>
      invokeCommand<AutomaticBackupMutationResult>('create_automatic_backup', { document, source }),
    prune: () => invokeCommand<AutomaticBackupCleanupResult>('prune_automatic_backups'),
    async read(id: string): Promise<string> {
      const document = await invokeCommand<unknown>('read_automatic_backup', { id })
      return JSON.stringify(document)
    },
  }
}
