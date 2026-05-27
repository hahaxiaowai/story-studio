import type {
  OutlineEventTag,
  PlotLine,
  PlotLineKind,
  TimelineBeat,
  WorkspaceOutline,
} from '@story-studio/types'

export interface CreateTimelineBeatInput {
  order: number
  now: string
  plotLineIds?: string[]
}

export interface UpdateTimelineBeatInput extends Partial<Pick<TimelineBeat, 'title' | 'timeLabel' | 'summary' | 'plotLineIds' | 'events' | 'characterChanges'>> {
  now: string
}

export interface AddPlotLineInput {
  title: string
  kind: PlotLineKind
  color: string
  now: string
}

export interface AddOutlineEventTagInput {
  label: string
  color: string
  now: string
}

export function createWorkspaceOutline(workspaceId: string, now: string): WorkspaceOutline {
  return {
    id: `outline-${workspaceId}`,
    workspaceId,
    plotLines: [
      {
        id: 'plot-main',
        title: '主线',
        kind: 'main',
        color: '#2563eb',
        order: 0,
      },
    ],
    eventTags: [
      { id: 'conflict', label: '冲突', color: '#dc2626', system: true, order: 0 },
      { id: 'climax', label: '高潮', color: '#9333ea', system: true, order: 1 },
      { id: 'turning-point', label: '转折', color: '#ea580c', system: true, order: 2 },
      { id: 'daily', label: '日常', color: '#16a34a', system: true, order: 3 },
    ],
    beats: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createTimelineBeat(input: CreateTimelineBeatInput): TimelineBeat {
  return {
    id: createTimelineId('beat', input.now),
    title: '新情节点',
    order: input.order,
    timeLabel: '',
    summary: '',
    plotLineIds: input.plotLineIds ?? ['plot-main'],
    events: [],
    characterChanges: [],
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateTimelineBeat(
  outline: WorkspaceOutline,
  beatId: string,
  input: UpdateTimelineBeatInput,
): WorkspaceOutline {
  if (!outline.beats.some(beat => beat.id === beatId))
    return outline

  return {
    ...outline,
    beats: outline.beats.map(beat => beat.id === beatId
      ? {
          ...beat,
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.timeLabel !== undefined ? { timeLabel: input.timeLabel } : {}),
          ...(input.summary !== undefined ? { summary: input.summary } : {}),
          ...(input.plotLineIds !== undefined ? { plotLineIds: input.plotLineIds } : {}),
          ...(input.events !== undefined ? { events: input.events } : {}),
          ...(input.characterChanges !== undefined ? { characterChanges: input.characterChanges } : {}),
          updatedAt: input.now,
        }
      : beat),
    updatedAt: input.now,
  }
}

export function removeTimelineBeat(outline: WorkspaceOutline, beatId: string, now: string): WorkspaceOutline {
  if (!outline.beats.some(beat => beat.id === beatId))
    return outline

  return {
    ...outline,
    beats: normalizeBeatOrder(outline.beats.filter(beat => beat.id !== beatId)),
    updatedAt: now,
  }
}

export function moveTimelineBeat(
  outline: WorkspaceOutline,
  beatId: string,
  direction: 'up' | 'down',
  now: string,
): WorkspaceOutline {
  const beats = [...outline.beats].sort((left, right) => left.order - right.order)
  const currentIndex = beats.findIndex(beat => beat.id === beatId)

  if (currentIndex < 0)
    return outline

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (nextIndex < 0 || nextIndex >= beats.length)
    return outline

  const [currentBeat] = beats.splice(currentIndex, 1)
  beats.splice(nextIndex, 0, currentBeat!)

  return {
    ...outline,
    beats: normalizeBeatOrder(beats),
    updatedAt: now,
  }
}

export function addPlotLine(outline: WorkspaceOutline, input: AddPlotLineInput): WorkspaceOutline {
  const plotLine: PlotLine = {
    id: createOptionId('plot'),
    title: input.title.trim() || '新线路',
    kind: input.kind,
    color: input.color,
    order: outline.plotLines.length,
  }

  return {
    ...outline,
    plotLines: [...outline.plotLines, plotLine],
    updatedAt: input.now,
  }
}

export function addOutlineEventTag(outline: WorkspaceOutline, input: AddOutlineEventTagInput): WorkspaceOutline {
  const eventTag: OutlineEventTag = {
    id: createOptionId('tag'),
    label: input.label.trim() || '新标签',
    color: input.color,
    system: false,
    order: outline.eventTags.length,
  }

  return {
    ...outline,
    eventTags: [...outline.eventTags, eventTag],
    updatedAt: input.now,
  }
}

export function normalizeBeatOrder(beats: TimelineBeat[]): TimelineBeat[] {
  return beats.map((beat, order) => ({ ...beat, order }))
}

function createTimelineId(prefix: string, now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `${prefix}-${stamp}-${randomSegment}`
}

function createOptionId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
