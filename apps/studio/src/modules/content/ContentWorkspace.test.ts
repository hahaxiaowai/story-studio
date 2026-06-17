/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./ContentWorkspace.vue', import.meta.url)), 'utf8')

describe('content workspace chapter reorder wiring', () => {
  it('binds move buttons to content ordering state', () => {
    expect(componentSource).toContain('moveEntry')
    expect(componentSource).toContain('canMoveSelectedEntryUp')
    expect(componentSource).toContain('canMoveSelectedEntryDown')
    expect(componentSource).toContain('content.moveUp')
    expect(componentSource).toContain('content.moveDown')
  })

  it('binds the chapter search input to the content composable', () => {
    expect(componentSource).toContain('searchQuery')
    expect(componentSource).toContain('v-model="searchQuery"')
    expect(componentSource).toContain('content.searchPlaceholder')
    expect(componentSource).toContain('content.searchEmpty')
  })

  it('shows the filtered and total chapter counts', () => {
    expect(componentSource).toContain('entryCounts')
    expect(componentSource).toContain('entryCounts.filtered')
    expect(componentSource).toContain('entryCounts.total')
    expect(componentSource).toContain('content.chapterList')
  })
})
