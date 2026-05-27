import type { OutlineEventTag, PlotLine, TimelineBeat, WorkspaceOutline } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import {
  addOutlineEventTag,
  addPlotLine,
  createTimelineBeat,
  createWorkspaceOutline,
  moveTimelineBeat,
  removeTimelineBeat,
  updateTimelineBeat,
} from './outline'

export type UpdateBeatInput = Omit<Parameters<typeof updateTimelineBeat>[2], 'now'>

export function useOutline(): {
  workspaceOutline: ComputedRef<WorkspaceOutline>
  beats: ComputedRef<TimelineBeat[]>
  plotLines: ComputedRef<PlotLine[]>
  eventTags: ComputedRef<OutlineEventTag[]>
  addBeat: () => TimelineBeat
  updateBeat: (beatId: string, input: UpdateBeatInput) => void
  removeBeat: (beatId: string) => void
  moveBeat: (beatId: string, direction: 'up' | 'down') => void
  addLine: (input: Omit<Parameters<typeof addPlotLine>[1], 'now'>) => void
  addEventTag: (input: Omit<Parameters<typeof addOutlineEventTag>[1], 'now'>) => void
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()

  const workspaceOutline = computed<WorkspaceOutline>(() => {
    return findWorkspaceOutline(activeWorkspace.value.id)
      ?? createWorkspaceOutline(activeWorkspace.value.id, new Date().toISOString())
  })
  const beats = computed<TimelineBeat[]>(() => [...workspaceOutline.value.beats].sort((left, right) => left.order - right.order))
  const plotLines = computed<PlotLine[]>(() => [...workspaceOutline.value.plotLines].sort((left, right) => left.order - right.order))
  const eventTags = computed<OutlineEventTag[]>(() => [...workspaceOutline.value.eventTags].sort((left, right) => left.order - right.order))

  watch(
    () => activeWorkspace.value.id,
    () => {
      ensureWorkspaceOutline()
    },
    { immediate: true },
  )

  function addBeat(): TimelineBeat {
    const now = new Date().toISOString()
    const outline = ensureWorkspaceOutline()
    const beat = createTimelineBeat({
      order: outline.beats.length,
      now,
      plotLineIds: [outline.plotLines[0]?.id ?? 'plot-main'],
    })

    replaceActiveOutline({
      ...outline,
      beats: [...outline.beats, beat],
      updatedAt: now,
    })

    return beat
  }

  function updateBeat(beatId: string, input: UpdateBeatInput): void {
    replaceActiveOutline(updateTimelineBeat(ensureWorkspaceOutline(), beatId, {
      ...input,
      now: new Date().toISOString(),
    }))
  }

  function removeBeat(beatId: string): void {
    replaceActiveOutline(removeTimelineBeat(ensureWorkspaceOutline(), beatId, new Date().toISOString()))
  }

  function moveBeat(beatId: string, direction: 'up' | 'down'): void {
    replaceActiveOutline(moveTimelineBeat(ensureWorkspaceOutline(), beatId, direction, new Date().toISOString()))
  }

  function addLine(input: Omit<Parameters<typeof addPlotLine>[1], 'now'>): void {
    replaceActiveOutline(addPlotLine(ensureWorkspaceOutline(), {
      ...input,
      now: new Date().toISOString(),
    }))
  }

  function addEventTag(input: Omit<Parameters<typeof addOutlineEventTag>[1], 'now'>): void {
    replaceActiveOutline(addOutlineEventTag(ensureWorkspaceOutline(), {
      ...input,
      now: new Date().toISOString(),
    }))
  }

  function ensureWorkspaceOutline(): WorkspaceOutline {
    const existingOutline = findWorkspaceOutline(activeWorkspace.value.id)

    if (existingOutline)
      return existingOutline

    const outline = createWorkspaceOutline(activeWorkspace.value.id, new Date().toISOString())

    studioData.updateDocument((document) => {
      document.outlines = [...document.outlines, outline]
    })

    return outline
  }

  function replaceActiveOutline(nextOutline: WorkspaceOutline): void {
    studioData.updateDocument((document) => {
      const hasOutline = document.outlines.some(outline => outline.workspaceId === activeWorkspace.value.id)

      document.outlines = hasOutline
        ? document.outlines.map(outline => outline.workspaceId === activeWorkspace.value.id ? nextOutline : outline)
        : [...document.outlines, nextOutline]
    })
  }

  function findWorkspaceOutline(workspaceId: string): WorkspaceOutline | undefined {
    return studioData.document.value.outlines.find(outline => outline.workspaceId === workspaceId)
  }

  return {
    workspaceOutline,
    beats,
    plotLines,
    eventTags,
    addBeat,
    updateBeat,
    removeBeat,
    moveBeat,
    addLine,
    addEventTag,
  }
}
