import type { AutomaticBackupEntry } from './automaticBackup'
import { describe, expect, it } from 'vitest'
import {
  findLastSuccessfulBackupAt,
  hasBackupForDocument,
  sortAutomaticBackups,
} from './automaticBackup'

describe('automaticBackup', () => {
  it('detects an existing valid backup for the current document version', () => {
    const entries = [entry('valid', '2026-07-15T02:04:00.000Z')]

    expect(hasBackupForDocument(entries, '2026-07-15T02:04:00.000Z')).toBe(true)
    expect(hasBackupForDocument(entries, '2026-07-15T02:05:00.000Z')).toBe(false)
    expect(hasBackupForDocument([entry('corrupted', '2026-07-15T02:04:00.000Z')], entries[0].documentUpdatedAt)).toBe(false)
    expect(hasBackupForDocument([entry('valid', '')], entries[0].documentUpdatedAt)).toBe(false)
  })

  it('sorts by actual creation time without mutating the source', () => {
    const entries = [
      entry('valid', 'v1', '2026-07-15T10:00:00+08:00'),
      entry('valid', 'v2', '2026-07-14T23:30:00-05:00'),
    ]

    expect(sortAutomaticBackups(entries).map(item => item.documentUpdatedAt)).toEqual(['v2', 'v1'])
    expect(entries.map(item => item.documentUpdatedAt)).toEqual(['v1', 'v2'])
  })

  it('finds the most recent valid backup only', () => {
    const entries = [
      entry('valid', 'v1', '2026-07-15T10:00:00+08:00'),
      entry('corrupted', '', '2026-07-15T11:00:00+08:00'),
    ]

    expect(findLastSuccessfulBackupAt(entries)).toBe('2026-07-15T10:00:00+08:00')
  })
})

function entry(
  status: AutomaticBackupEntry['status'],
  documentUpdatedAt: string,
  createdAt = '2026-07-15T10:05:00+08:00',
): AutomaticBackupEntry {
  return {
    id: `${status}-${documentUpdatedAt}`,
    source: 'scheduled',
    createdAt,
    documentUpdatedAt,
    byteSize: 10,
    status,
  }
}
