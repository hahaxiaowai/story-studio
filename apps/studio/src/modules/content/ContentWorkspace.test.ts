/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./ContentWorkspace.vue', import.meta.url)), 'utf8')

describe('content workspace chapter reorder wiring', () => {
  it('binds move buttons to content ordering state', () => {
    expect(componentSource).toContain('moveEntry')
    expect(componentSource).toContain('isSearchingEntries')
    expect(componentSource).toContain('!isSearchingEntries.value && selectedEntryIndex.value > 0')
    expect(componentSource).toContain('!isSearchingEntries.value && selectedEntryIndex.value >= 0')
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

  it('clears chapter search when creating a new entry', () => {
    expect(componentSource).toContain('function createEntry(): void')
    expect(componentSource).toContain('searchQuery.value = \'\'')
    expect(componentSource).toContain('selectedEntryId.value = entry.id')
  })

  it('shows the filtered and total chapter counts', () => {
    expect(componentSource).toContain('entryCounts')
    expect(componentSource).toContain('entryCounts.filtered')
    expect(componentSource).toContain('entryCounts.total')
    expect(componentSource).toContain('content.chapterList')
  })

  it('uses the full chapter list for assistant draft targets', () => {
    expect(componentSource).toContain('allEntries')
    expect(componentSource).toContain('allEntries.value.find(entry => entry.id === assistantDraftTargetEntryId.value)')
    expect(componentSource).toContain('allEntries.value.some(entry => entry.id === suggestedEntryId)')
    expect(componentSource).toContain('v-for="entry in allEntries"')
  })

  it('routes content AI actions to the assistant chat workspace', () => {
    expect(componentSource).toContain('window.location.hash = \'#assistant-chat\'')
    expect(componentSource).not.toContain('window.location.hash = \'#assistant\'')
  })
})
