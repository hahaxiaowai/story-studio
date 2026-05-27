import type { WorkspaceWorld, WorldMap, WorldMapPoint, WorldSettingGroup } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import {
  addWorldMapStroke,
  addWorldSettingGroup,
  addWorldSettingItem,
  clearWorldMap,
  createWorkspaceWorld,
} from './world'

export function useWorld(): {
  world: ComputedRef<WorkspaceWorld>
  settingGroups: ComputedRef<WorldSettingGroup[]>
  activeMap: ComputedRef<WorldMap>
  addSettingGroup: (input: { title: string, description?: string }) => void
  addSettingItem: (input: { groupId: string, title: string, body?: string }) => void
  addMapStroke: (input: { color: string, width: number, points: WorldMapPoint[] }) => void
  clearMap: () => void
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()

  const world = computed<WorkspaceWorld>(() => {
    return findWorkspaceWorld(activeWorkspace.value.id)
      ?? createWorkspaceWorld(activeWorkspace.value.id, new Date().toISOString())
  })
  const settingGroups = computed<WorldSettingGroup[]>(() => {
    return [...world.value.settingGroups].sort((left, right) => left.order - right.order)
  })
  const activeMap = computed<WorldMap>(() => {
    return world.value.maps.find(map => map.id === world.value.activeMapId)
      ?? world.value.maps[0]!
  })

  watch(
    () => activeWorkspace.value.id,
    () => {
      ensureWorkspaceWorld()
    },
    { immediate: true },
  )

  function addSettingGroup(input: { title: string, description?: string }): void {
    replaceActiveWorld(addWorldSettingGroup(ensureWorkspaceWorld(), {
      ...input,
      now: new Date().toISOString(),
    }))
  }

  function addSettingItem(input: { groupId: string, title: string, body?: string }): void {
    replaceActiveWorld(addWorldSettingItem(ensureWorkspaceWorld(), {
      ...input,
      now: new Date().toISOString(),
    }))
  }

  function addMapStroke(input: { color: string, width: number, points: WorldMapPoint[] }): void {
    replaceActiveWorld(addWorldMapStroke(ensureWorkspaceWorld(), {
      ...input,
      mapId: activeMap.value.id,
      now: new Date().toISOString(),
    }))
  }

  function clearMap(): void {
    replaceActiveWorld(clearWorldMap(ensureWorkspaceWorld(), activeMap.value.id, new Date().toISOString()))
  }

  function ensureWorkspaceWorld(): WorkspaceWorld {
    const existingWorld = findWorkspaceWorld(activeWorkspace.value.id)

    if (existingWorld)
      return existingWorld

    const nextWorld = createWorkspaceWorld(activeWorkspace.value.id, new Date().toISOString())

    studioData.updateDocument((document) => {
      document.worlds = [...document.worlds, nextWorld]
    })

    return nextWorld
  }

  function replaceActiveWorld(nextWorld: WorkspaceWorld): void {
    studioData.updateDocument((document) => {
      const hasWorld = document.worlds.some(item => item.workspaceId === activeWorkspace.value.id)

      document.worlds = hasWorld
        ? document.worlds.map(item => item.workspaceId === activeWorkspace.value.id ? nextWorld : item)
        : [...document.worlds, nextWorld]
    })
  }

  function findWorkspaceWorld(workspaceId: string): WorkspaceWorld | undefined {
    return studioData.document.value.worlds.find(item => item.workspaceId === workspaceId)
  }

  return {
    world,
    settingGroups,
    activeMap,
    addSettingGroup,
    addSettingItem,
    addMapStroke,
    clearMap,
  }
}
