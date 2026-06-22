/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sidebarLayoutSource = readFileSync(fileURLToPath(new URL('./SidebarLayout.vue', import.meta.url)), 'utf8')

describe('sidebar layout structure', () => {
  it('keeps breadcrumbs fixed while loaded workspace content scrolls internally', () => {
    expect(sidebarLayoutSource).toContain('class="min-h-svh overflow-hidden"')
    expect(sidebarLayoutSource).toContain('<header class="')
    expect(sidebarLayoutSource).toContain('<div v-else class="min-h-0 flex-1 overflow-hidden">')
    expect(sidebarLayoutSource).toContain('<slot />')
  })
})
