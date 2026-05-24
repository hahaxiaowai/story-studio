import type { Workspace } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import {
  appendWorkspace,
  getWorkspaceById,
} from './workspaces'

export function useWorkspaces(): {
  activeWorkspace: ComputedRef<Workspace>
  activeWorkspaceId: Ref<string, string>
  addWorkspace: () => Workspace
  setActiveWorkspace: (workspaceId: string) => void
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

  function setActiveWorkspace(workspaceId: string): void {
    if (getWorkspaceById(workspaces.value, workspaceId)) {
      studioData.updateDocument((document) => {
        document.activeWorkspaceId = workspaceId
      })
    }
  }

  function addWorkspace(): Workspace {
    const result = appendWorkspace(workspaces.value, {
      title: `未命名作品 ${workspaces.value.length + 1}`,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      document.workspaces = result.workspaces
      document.activeWorkspaceId = result.activeWorkspaceId
    })

    return activeWorkspace.value
  }

  return {
    activeWorkspace,
    activeWorkspaceId,
    addWorkspace,
    setActiveWorkspace,
    workspaces,
  }
}
