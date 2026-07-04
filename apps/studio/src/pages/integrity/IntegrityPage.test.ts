/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./IntegrityPage.vue', import.meta.url)), 'utf8')

describe('integrity page wiring', () => {
  it('renders the workspace integrity report from the integrity composable', () => {
    expect(componentSource).toContain('useWorkspaceIntegrity')
    expect(componentSource).toContain('integrity.title')
    expect(componentSource).toContain('report.errorCount')
    expect(componentSource).toContain('report.warningCount')
    expect(componentSource).toContain('report.issues')
    expect(componentSource).toContain('integrity.empty')
  })
})
