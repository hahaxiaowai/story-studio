/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./WorkspaceDetailsDialog.vue', import.meta.url)), 'utf8')

describe('workspace details dialog persistence wiring', () => {
  it('loads current workspace fields and saves them through the workspace composable', () => {
    expect(componentSource).toContain('const { activeWorkspace, saveActiveWorkspaceDetails } = useWorkspaces()')
    expect(componentSource).toContain('@submit.prevent="saveWorkspaceDetails"')
    expect(componentSource).toContain('title.value = activeWorkspace.value.title')
    expect(componentSource).toContain('description.value = activeWorkspace.value.description ??')
    expect(componentSource).toContain('saveActiveWorkspaceDetails({')
  })
})
