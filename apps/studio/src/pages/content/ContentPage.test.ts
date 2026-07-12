/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./ContentPage.vue', import.meta.url)), 'utf8')

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

  it('contains fine outline editing and full chapter generation entry points', () => {
    expect(componentSource).toContain('content.fineOutline')
    expect(componentSource).toContain('fineOutline')
    expect(componentSource).toContain('draft-full-chapter')
    expect(componentSource).toContain('content.aiDraftFullChapter')
    expect(componentSource).toContain('createContentFineOutlineDraftFromBeat')
    expect(componentSource).toContain('draftFineOutlineFromLinkedBeat')
    expect(componentSource).toContain('content.draftFineOutlineFromBeat')
  })

  it('contains inline AI annotation controls for revising body text in place', () => {
    expect(componentSource).toContain('useContentInlineAssistant')
    expect(componentSource).toContain('createContentInlineAssistantTarget')
    expect(componentSource).toContain('buildContentInlineAssistantPrompt')
    expect(componentSource).toContain('applyContentInlineAssistantSuggestion')
    expect(componentSource).toContain('createContentInlineAssistantSuggestionPreview')
    expect(componentSource).toContain('inlineAssistantSuggestionPreview')
    expect(componentSource).toContain('captureBodySelection')
    expect(componentSource).toContain('showInlineAssistantToolbar')
    expect(componentSource).toContain('openInlineAssistantPanel')
    expect(componentSource).toContain('inlineAssistantPanelStyle')
    expect(componentSource).toContain('runInlineAssistant')
    expect(componentSource).toContain('applyInlineAssistantSuggestion')
    expect(componentSource).toContain('content.inlineAssistant')
    expect(componentSource).toContain('content.inlineAssistantInstruction')
    expect(componentSource).toContain('content.inlineAssistantComparison')
    expect(componentSource).toContain('content.inlineAssistantConfigure')
    expect(componentSource).toContain('href="#assistant"')
    expect(componentSource).toContain('content.inlineAssistantApply')
    expect(componentSource).toContain('inlineAssistantUndoSnapshot')
    expect(componentSource).toContain('canUndoInlineAssistantSuggestion')
    expect(componentSource).toContain('undoInlineAssistantSuggestion')
    expect(componentSource).toContain('content.inlineAssistantUndo')
    expect(componentSource).toContain('v-if="showInlineAssistantToolbar"')
    expect(componentSource).toContain('v-if="inlineAssistantPanelOpen"')
  })

  it('persists and manages AI revision history for the selected chapter', () => {
    expect(componentSource).toContain('applyAiRevision(selectedEntry.value.id')
    expect(componentSource).toContain('if (nextBody === selectedEntry.value.body)')
    expect(componentSource).toContain('restoreAiRevision(selectedEntry.value.id')
    expect(componentSource).toContain('deleteAiRevision(selectedEntry.value.id')
    expect(componentSource).toContain('inlineAssistantUndoSnapshot.value = undefined')
    expect(componentSource).toContain('<ContentAiRevisionHistory')
    expect(componentSource).toContain(':revisions="selectedEntry.aiRevisionHistory"')
  })
})
