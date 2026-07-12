/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./ContentAiRevisionHistory.vue', import.meta.url)), 'utf8')

describe('content AI revision history UI', () => {
  it('shows current chapter revisions newest first with before and after bodies', () => {
    expect(componentSource).toContain('props.revisions.toReversed()')
    expect(componentSource).toContain('content.aiRevisionHistoryEmpty')
    expect(componentSource).toContain('revision.previousBody')
    expect(componentSource).toContain('revision.nextBody')
    expect(componentSource).toContain('content.aiRevisionBefore')
    expect(componentSource).toContain('content.aiRevisionAfter')
  })

  it('emits restore and requires in-record confirmation before delete', () => {
    expect(componentSource).toContain('emit(\'restore\', revision.id)')
    expect(componentSource).toContain('pendingDeleteRevisionId')
    expect(componentSource).toContain('emit(\'delete\', revision.id)')
    expect(componentSource).toContain('content.aiRevisionDeleteConfirm')
    expect(componentSource).toContain('content.aiRevisionDeleteCancel')
  })
})
