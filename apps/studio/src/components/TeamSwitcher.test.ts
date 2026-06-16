/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./TeamSwitcher.vue', import.meta.url)), 'utf8')

describe('team switcher workspace details wiring', () => {
  it('opens the workspace details dialog from the workspace menu', () => {
    expect(componentSource).toContain('WorkspaceDetailsDialog')
    expect(componentSource).toContain('detailsDialogOpen')
    expect(componentSource).toContain('menu.editWorkspace')
  })
})
