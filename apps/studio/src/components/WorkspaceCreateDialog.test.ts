/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./WorkspaceCreateDialog.vue', import.meta.url)), 'utf8')

describe('workspace create dialog persistence wiring', () => {
  it('submits trimmed title and description through the workspace composable', () => {
    expect(componentSource).toContain('const { addWorkspace } = useWorkspaces()')
    expect(componentSource).toContain('@submit.prevent="createWorkspace"')
    expect(componentSource).toContain('title: trimmedTitle.value')
    expect(componentSource).toContain('description: description.value.trim()')
  })
})
