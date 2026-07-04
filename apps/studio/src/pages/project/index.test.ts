/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const projectPageSource = readFileSync(fileURLToPath(new URL('./index.vue', import.meta.url)), 'utf8')

describe('project page layout', () => {
  it('provides a full-height root for view-level internal scrolling', () => {
    expect(projectPageSource).toContain('const projectLayoutClass = computed<string>')
    expect(projectPageSource).toContain('activeView.value === \'assistant-chat\'')
    expect(projectPageSource).toContain('flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 pt-0')
    expect(projectPageSource).toContain('flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 pt-0')
    expect(projectPageSource).toContain('<main id="project" :class="projectLayoutClass"')
  })

  it('routes the integrity hash to the integrity page', () => {
    expect(projectPageSource).toContain('IntegrityPage')
    expect(projectPageSource).toContain('currentHash.value === \'#integrity\'')
    expect(projectPageSource).toContain('activeView === \'integrity\'')
  })
})
