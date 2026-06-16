import type { Workspace, WorkspaceContentEntry } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import {
  assignOutlineBeatToContentEntry,
  createContentEntry,
  getContentEntriesByWorkspace,
  moveContentEntry,
  removeContentEntry,
  updateContentEntry,
} from './content'

export type UpdateContentInput = Omit<Parameters<typeof updateContentEntry>[1], 'now'>
export type MoveContentDirection = Parameters<typeof moveContentEntry>[1]['direction']

export function useContent(): {
  entries: ComputedRef<WorkspaceContentEntry[]>
  addEntry: () => WorkspaceContentEntry
  updateEntry: (entryId: string, input: UpdateContentInput) => void
  linkEntryToBeat: (entryId: string, outlineBeatId: string) => void
  moveEntry: (entryId: string, direction: MoveContentDirection) => void
  removeEntry: (entryId: string) => void
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()
  const entries = computed<WorkspaceContentEntry[]>(() => getContentEntriesByWorkspace(
    studioData.document.value.contents,
    activeWorkspace.value.id,
  ))

  function addEntry(): WorkspaceContentEntry {
    const now = new Date().toISOString()
    const nextContentCount = entries.value.length + 1
    const entry = createContentEntry({
      workspaceId: activeWorkspace.value.id,
      order: entries.value.length,
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
    entries,
    addEntry,
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
