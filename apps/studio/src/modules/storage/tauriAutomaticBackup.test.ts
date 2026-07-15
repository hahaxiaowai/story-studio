import type { StudioDataDocument } from '@story-studio/types'
import { describe, expect, it, vi } from 'vitest'
import { createTauriAutomaticBackupClient } from './tauriAutomaticBackup'

describe('tauriAutomaticBackup', () => {
  it('maps every client operation to its Tauri command', async () => {
    const document = { updatedAt: 'version-1' } as StudioDataDocument
    const invoke = vi.fn().mockResolvedValue({})
    const client = createTauriAutomaticBackupClient(invoke)

    await client.getSettings()
    await client.setEnabled(false)
    await client.list()
    await client.create(document, 'scheduled')
    await client.prune()
    await client.read('managed-id.json')

    expect(invoke).toHaveBeenNthCalledWith(1, 'get_automatic_backup_settings')
    expect(invoke).toHaveBeenNthCalledWith(2, 'set_automatic_backup_enabled', { enabled: false })
    expect(invoke).toHaveBeenNthCalledWith(3, 'list_automatic_backups')
    expect(invoke).toHaveBeenNthCalledWith(4, 'create_automatic_backup', { document, source: 'scheduled' })
    expect(invoke).toHaveBeenNthCalledWith(5, 'prune_automatic_backups')
    expect(invoke).toHaveBeenNthCalledWith(6, 'read_automatic_backup', { id: 'managed-id.json' })
  })

  it('serializes the read JSON value for the shared parser', async () => {
    const invoke = vi.fn().mockResolvedValue({ schemaVersion: 14 })

    await expect(createTauriAutomaticBackupClient(invoke).read('backup.json'))
      .resolves
      .toBe('{"schemaVersion":14}')
  })
})
