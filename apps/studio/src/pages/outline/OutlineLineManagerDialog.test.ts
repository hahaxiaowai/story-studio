/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./OutlineLineManagerDialog.vue', import.meta.url)), 'utf8')

describe('outline line manager dialog', () => {
  it('requires confirmation before deleting a plot line from the draft', () => {
    expect(componentSource).toContain('const pendingDeleteLineId = ref<string>()')
    expect(componentSource).toContain('function requestDeleteDraftLine(plotLineId: string): void')
    expect(componentSource).toContain('function confirmDeleteDraftLine(): void')
    expect(componentSource).toContain('function cancelDeleteDraftLine(): void')
    expect(componentSource).toContain('@click="requestDeleteDraftLine(line.id)"')
    expect(componentSource).toContain('outline.confirmDeleteLineTitle')
    expect(componentSource).toContain('outline.confirmDeleteLineDescription')
  })
})
