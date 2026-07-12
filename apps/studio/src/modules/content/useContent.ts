import type { Workspace, WorkspaceContentEntry } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import {
  appendContentAiRevision,
  assignOutlineBeatToContentEntry,
  createContentEntry,
  getContentEntriesByWorkspace,
  getFilteredContentEntries,
  moveContentEntry,
  removeContentAiRevision,
  removeContentEntry,
  restoreContentAiRevision,
  updateContentEntry,
} from './content'

export type UpdateContentInput = Omit<Parameters<typeof updateContentEntry>[1], 'now'>
export type MoveContentDirection = Parameters<typeof moveContentEntry>[1]['direction']
export type ApplyAiRevisionInput = Omit<Parameters<typeof appendContentAiRevision>[1], 'now'>

export interface ContentEntryCounts {
  total: number
  filtered: number
}

export function useContent(): {
  searchQuery: Ref<string>
  entries: ComputedRef<WorkspaceContentEntry[]>
  allEntries: ComputedRef<WorkspaceContentEntry[]>
  entryCounts: ComputedRef<ContentEntryCounts>
  addEntry: () => WorkspaceContentEntry
  applyAiRevision: (entryId: string, input: ApplyAiRevisionInput) => void
  restoreAiRevision: (entryId: string, revisionId: string, instruction: string) => void
  deleteAiRevision: (entryId: string, revisionId: string) => void
  updateEntry: (entryId: string, input: UpdateContentInput) => void
  linkEntryToBeat: (entryId: string, outlineBeatId: string) => void
  moveEntry: (entryId: string, direction: MoveContentDirection) => void
  removeEntry: (entryId: string) => void
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()
  const searchQuery = ref('')
  const workspaceEntries = computed<WorkspaceContentEntry[]>(() => getContentEntriesByWorkspace(
    studioData.document.value.contents,
    activeWorkspace.value.id,
  ))
  const filteredEntries = computed<WorkspaceContentEntry[]>(() => getFilteredContentEntries(workspaceEntries.value, searchQuery.value))
  const entryCounts = computed<ContentEntryCounts>(() => ({
    total: workspaceEntries.value.length,
    filtered: filteredEntries.value.length,
  }))

  function addEntry(): WorkspaceContentEntry {
    const now = new Date().toISOString()
    const nextContentCount = workspaceEntries.value.length + 1
    const entry = createContentEntry({
      workspaceId: activeWorkspace.value.id,
      order: workspaceEntries.value.length,
      now,
    })

    studioData.updateDocument((document) => {
      document.contents = [...document.contents, entry]
      syncWorkspaceContentCount(document.workspaces, entry.workspaceId, nextContentCount)
    })

    return entry
  }

  function updateEntry(entryId: string, input: UpdateContentInput): void {
    studioData.updateDocument((document) => {
      document.contents = document.contents.map(entry => entry.id === entryId
        ? updateContentEntry(entry, {
            ...input,
            now: new Date().toISOString(),
          })
        : entry)
    })
  }

  function applyAiRevision(entryId: string, input: ApplyAiRevisionInput): void {
    studioData.updateDocument((document) => {
      document.contents = document.contents.map(entry => entry.id === entryId
        ? appendContentAiRevision(entry, {
            ...input,
            now: new Date().toISOString(),
          })
        : entry)
    })
  }

  function restoreAiRevision(entryId: string, revisionId: string, instruction: string): void {
    studioData.updateDocument((document) => {
      document.contents = document.contents.map(entry => entry.id === entryId
        ? restoreContentAiRevision(entry, {
            revisionId,
            instruction,
            now: new Date().toISOString(),
          })
        : entry)
    })
  }

  function deleteAiRevision(entryId: string, revisionId: string): void {
    studioData.updateDocument((document) => {
      document.contents = document.contents.map(entry => entry.id === entryId
        ? removeContentAiRevision(entry, revisionId, new Date().toISOString())
        : entry)
    })
  }

  function linkEntryToBeat(entryId: string, outlineBeatId: string): void {
    const workspaceId = activeWorkspace.value.id

    studioData.updateDocument((document) => {
      const nextWorkspaceEntries = assignOutlineBeatToContentEntry(
        document.contents.filter(entry => entry.workspaceId === workspaceId),
        {
          entryId,
          outlineBeatId,
          now: new Date().toISOString(),
        },
      )

      document.contents = [
        ...document.contents.filter(entry => entry.workspaceId !== workspaceId),
        ...nextWorkspaceEntries,
      ]
    })
  }

  function moveEntry(entryId: string, direction: MoveContentDirection): void {
    const workspaceId = activeWorkspace.value.id

    studioData.updateDocument((document) => {
      const nextWorkspaceEntries = moveContentEntry(
        document.contents.filter(entry => entry.workspaceId === workspaceId),
        {
          entryId,
          direction,
          now: new Date().toISOString(),
        },
      )

      document.contents = [
        ...document.contents.filter(entry => entry.workspaceId !== workspaceId),
        ...nextWorkspaceEntries,
      ]
    })
  }

  function removeEntry(entryId: string): void {
    const workspaceId = activeWorkspace.value.id

    studioData.updateDocument((document) => {
      const nextWorkspaceEntries = removeContentEntry(
        document.contents.filter(entry => entry.workspaceId === workspaceId),
        entryId,
      )
      const nextWorkspaceEntryIds = new Set(nextWorkspaceEntries.map(entry => entry.id))

      document.contents = [
        ...document.contents.filter(entry => entry.workspaceId !== workspaceId),
        ...nextWorkspaceEntries,
      ]
      syncWorkspaceContentCount(document.workspaces, workspaceId, nextWorkspaceEntryIds.size)
    })
  }

  return {
    searchQuery,
    entries: filteredEntries,
    allEntries: workspaceEntries,
    entryCounts,
    addEntry,
    applyAiRevision,
    restoreAiRevision,
    deleteAiRevision,
    updateEntry,
    linkEntryToBeat,
    moveEntry,
    removeEntry,
  }
}

function syncWorkspaceContentCount(
  workspaces: Workspace[],
  workspaceId: string,
  count: number,
): void {
  const workspace = workspaces.find(workspace => workspace.id === workspaceId)

  if (workspace)
    workspace.moduleCounts.content = count
}
