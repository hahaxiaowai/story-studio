/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const indexPageSource = readFileSync(fileURLToPath(new URL('./index.vue', import.meta.url)), 'utf8')

describe('project page layout', () => {
  it('provides a full-height root for view-level internal scrolling', () => {
    expect(indexPageSource).toContain('const projectLayoutClass = computed<string>')
    expect(indexPageSource).toContain('activeView.value === \'assistant-chat\'')
    expect(indexPageSource).toContain('flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 pt-0')
    expect(indexPageSource).toContain('flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 pt-0')
    expect(indexPageSource).toContain('<main id="project" :class="projectLayoutClass"')
  })
})
