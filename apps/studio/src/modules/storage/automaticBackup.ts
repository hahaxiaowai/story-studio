import type { StudioDataDocument } from '@story-studio/types'
import type { StudioDataBackupSummary } from './backup'

export const AUTOMATIC_BACKUP_INTERVAL_MS = 10 * 60 * 1000

export type AutomaticBackupSource = 'scheduled' | 'pre-restore'
export type AutomaticBackupStatus = 'valid' | 'corrupted'

export interface AutomaticBackupSettings {
  enabled: boolean
}

export interface AutomaticBackupEntry {
  id: string
  source: AutomaticBackupSource
  createdAt: string
  documentUpdatedAt: string
  byteSize: number
  status: AutomaticBackupStatus
  summary?: StudioDataBackupSummary
}

export interface AutomaticBackupMutationResult {
  entry: AutomaticBackupEntry
  cleanupWarnings: string[]
}

export interface AutomaticBackupCleanupResult {
  cleanupWarnings: string[]
}

export interface AutomaticBackupClient {
  getSettings: () => Promise<AutomaticBackupSettings>
  setEnabled: (enabled: boolean) => Promise<AutomaticBackupSettings>
  list: () => Promise<AutomaticBackupEntry[]>
  create: (document: StudioDataDocument, source: AutomaticBackupSource) => Promise<AutomaticBackupMutationResult>
  prune: () => Promise<AutomaticBackupCleanupResult>
  read: (id: string) => Promise<string>
}

export function hasBackupForDocument(entries: AutomaticBackupEntry[], updatedAt: string): boolean {
  return entries.some(entry => entry.status === 'valid'
    && entry.documentUpdatedAt !== ''
    && entry.documentUpdatedAt === updatedAt)
}

export function sortAutomaticBackups(entries: AutomaticBackupEntry[]): AutomaticBackupEntry[] {
  return [...entries].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
}

export function findLastSuccessfulBackupAt(entries: AutomaticBackupEntry[]): string | undefined {
  return sortAutomaticBackups(entries).find(entry => entry.status === 'valid')?.createdAt
}
