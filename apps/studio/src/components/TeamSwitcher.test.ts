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

  it('renders draft workspaces and exposes archive restore actions', () => {
    expect(componentSource).toContain('draftWorkspaces')
    expect(componentSource).toContain('archivedWorkspaces')
    expect(componentSource).toContain('archiveActiveWorkspace')
    expect(componentSource).toContain('restoreArchivedWorkspace')
    expect(componentSource).toContain('workspace.archiveCurrent')
    expect(componentSource).toContain(':disabled="draftWorkspaces.length <= 1"')
    expect(componentSource).toContain('workspace.archivedGroup')
    expect(componentSource).toContain('workspace.restore')
  })
})
