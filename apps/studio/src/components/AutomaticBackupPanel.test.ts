/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const panelSource = readFileSync(fileURLToPath(new URL('./AutomaticBackupPanel.vue', import.meta.url)), 'utf8')

describe('automatic backup panel wiring', () => {
  it('controls, refreshes and safely selects managed backups', () => {
    expect(panelSource).toContain('automaticBackup.setEnabled')
    expect(panelSource).toContain('automaticBackup.refresh')
    expect(panelSource).toContain('entry.status === \'corrupted\'')
    expect(panelSource).toContain('emit(\'select\', entry.id)')
  })
})
