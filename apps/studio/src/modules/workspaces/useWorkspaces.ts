import type { Workspace } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import type { AppendWorkspaceOptions, UpdateWorkspaceDetailsOptions } from './workspaces'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import {
  appendWorkspace,
  archiveWorkspace,
  getArchivedWorkspaces,
  getDraftWorkspaces,
  getWorkspaceById,
  restoreWorkspace,
  updateWorkspaceDetails,
  updateWorkspaceStoryStyle,
} from './workspaces'

export type AddWorkspaceInput = Pick<AppendWorkspaceOptions, 'title' | 'description'>
export type SaveWorkspaceDetailsInput = Pick<UpdateWorkspaceDetailsOptions, 'title' | 'description'>

export function useWorkspaces(): {
  activeWorkspace: ComputedRef<Workspace>
  activeWorkspaceId: Ref<string, string>
  addWorkspace: (input?: AddWorkspaceInput) => Workspace
  archiveActiveWorkspace: () => void
  archivedWorkspaces: ComputedRef<Workspace[]>
  draftWorkspaces: ComputedRef<Workspace[]>
  restoreArchivedWorkspace: (workspaceId: string) => void
  saveActiveWorkspaceDetails: (input: SaveWorkspaceDetailsInput) => void
  setActiveWorkspace: (workspaceId: string) => void
  setActiveWorkspaceStoryStyle: (storyStyleId: string) => void
  workspaces: Ref<Workspace[], Workspace[]>
} {
  const studioData = useStudioData()
  const workspaces = computed<Workspace[]>({
    get: () => studioData.document.value.workspaces,
    set: nextWorkspaces => studioData.updateDocument((document) => {
      document.workspaces = nextWorkspaces
    }),
  })
  const activeWorkspaceId = computed<string>({
    get: () => studioData.document.value.activeWorkspaceId,
    set: nextWorkspaceId => studioData.updateDocument((document) => {
      document.activeWorkspaceId = nextWorkspaceId
    }),
  })
  const activeWorkspace = computed<Workspace>(() => {
    const workspace = getWorkspaceById(workspaces.value, activeWorkspaceId.value)

    if (workspace)
      return workspace

    return workspaces.value[0]!
  })
  const draftWorkspaces = computed<Workspace[]>(() => getDraftWorkspaces(workspaces.value))
  const archivedWorkspaces = computed<Workspace[]>(() => getArchivedWorkspaces(workspaces.value))

  function setActiveWorkspace(workspaceId: string): void {
    if (getWorkspaceById(workspaces.value, workspaceId)) {
      studioData.updateDocument((document) => {
        document.activeWorkspaceId = workspaceId
      })
    }
  }

  function addWorkspace(input?: AddWorkspaceInput): Workspace {
    const result = appendWorkspace(workspaces.value, {
      title: input?.title ?? `未命名作品 ${workspaces.value.length + 1}`,
      description: input?.description,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      document.workspaces = result.workspaces
      document.activeWorkspaceId = result.activeWorkspaceId
    })

    return activeWorkspace.value
  }

  function setActiveWorkspaceStoryStyle(storyStyleId: string): void {
    studioData.updateDocument((document) => {
      document.workspaces = updateWorkspaceStoryStyle(document.workspaces, document.activeWorkspaceId, storyStyleId)
    })
  }

  function saveActiveWorkspaceDetails(input: SaveWorkspaceDetailsInput): void {
    studioData.updateDocument((document) => {
      document.workspaces = updateWorkspaceDetails(document.workspaces, document.activeWorkspaceId, {
        ...input,
        now: new Date().toISOString(),
      })
    })
  }

  function archiveActiveWorkspace(): void {
    studioData.updateDocument((document) => {
      const result = archiveWorkspace(document.workspaces, document.activeWorkspaceId, document.activeWorkspaceId, new Date().toISOString())

      document.workspaces = result.workspaces
      document.activeWorkspaceId = result.activeWorkspaceId
    })
  }

  function restoreArchivedWorkspace(workspaceId: string): void {
    studioData.updateDocument((document) => {
      const result = restoreWorkspace(document.workspaces, document.activeWorkspaceId, workspaceId, new Date().toISOString())

      document.workspaces = result.workspaces
      document.activeWorkspaceId = result.activeWorkspaceId
    })
  }

  return {
    activeWorkspace,
    activeWorkspaceId,
    addWorkspace,
    archiveActiveWorkspace,
    archivedWorkspaces,
    draftWorkspaces,
    restoreArchivedWorkspace,
    saveActiveWorkspaceDetails,
    setActiveWorkspace,
    setActiveWorkspaceStoryStyle,
    workspaces,
  }
}
