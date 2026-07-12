/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./DataBackupDialog.vue', import.meta.url)), 'utf8')
const headerSource = readFileSync(fileURLToPath(new URL('./AppHeaderActions.vue', import.meta.url)), 'utf8')

describe('data backup dialog wiring', () => {
  it('exports the current document and only restores a parsed document after confirmation', () => {
    expect(componentSource).toContain('createStudioDataBackup(document.value)')
    expect(componentSource).toContain('parseStudioDataBackup(source)')
    expect(componentSource).toContain('pendingDocument.value = parsedDocument')
    expect(componentSource).toContain('await replaceDocument(pendingDocument.value)')
    expect(componentSource).toContain('backup.sensitiveWarning')
    expect(componentSource).toContain('accept="application/json,.json"')
  })

  it('is opened from the application header', () => {
    expect(headerSource).toContain('<DataBackupDialog v-model:open="backupDialogOpen" />')
    expect(headerSource).toContain('t(\'backup.open\')')
  })
})
