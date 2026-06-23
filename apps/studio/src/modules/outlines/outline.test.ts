import type { TimelineBeat, WorkspaceOutline } from '@story-studio/types'
import { describe, expect, it, vi } from 'vitest'
import {
  addOutlineEventTag,
  addPlotLine,
  createTimelineBeat,
  createWorkspaceOutline,
  moveTimelineBeat,
  removePlotLine,
  removeTimelineBeat,
  replacePlotLines,
  updatePlotLine,
  updateTimelineBeat,
} from './outline'

describe('outline model', () => {
  it('creates a default workspace outline', () => {
    const outline = createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z')

    expect(outline).toMatchObject({
      id: 'outline-workspace-a',
      workspaceId: 'workspace-a',
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
      createdAt: '2026-05-25T10:00:00.000Z',
      updatedAt: '2026-05-25T10:00:00.000Z',
    })
  })

  it('creates timeline beats with stable defaults', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)

    const beat = createTimelineBeat({
      order: 2,
      now: '2026-05-25T10:00:00.000Z',
      plotLineIds: ['plot-main'],
    })

    expect(beat).toMatchObject({
      id: 'beat-20260525100000-4fzyo8',
      title: '新情节点',
      order: 2,
      timeLabel: '',
      summary: '',
      plotLineIds: ['plot-main'],
      events: [],
      characterChanges: [],
      createdAt: '2026-05-25T10:00:00.000Z',
      updatedAt: '2026-05-25T10:00:00.000Z',
    })
  })

  it('updates, removes, and reorders beats without leaving order gaps', () => {
    const outline = createOutlineWithBeats([
      createBeat('beat-a', 0),
      createBeat('beat-b', 1),
      createBeat('beat-c', 2),
    ])

    const updated = updateTimelineBeat(outline, 'beat-b', {
      title: '雨夜相遇',
      timeLabel: '第七天',
      events: [
        {
          id: 'event-a',
          title: '码头冲突',
          description: '主角第一次直面追捕者。',
          tagIds: ['conflict'],
        },
      ],
      characterChanges: [
        {
          id: 'change-a',
          characterId: 'character-lin-che',
          category: 'relationship',
          summary: '开始信任搭档。',
        },
      ],
      now: '2026-05-25T11:00:00.000Z',
    })
    const moved = moveTimelineBeat(updated, 'beat-b', 'up', '2026-05-25T12:00:00.000Z')
    const removed = removeTimelineBeat(moved, 'beat-a', '2026-05-25T13:00:00.000Z')

    expect(updated.beats[1]).toMatchObject({
      title: '雨夜相遇',
      timeLabel: '第七天',
      events: [{ tagIds: ['conflict'] }],
      characterChanges: [{ characterId: 'character-lin-che' }],
      updatedAt: '2026-05-25T11:00:00.000Z',
    })
    expect(moved.beats.map(beat => beat.id)).toEqual(['beat-b', 'beat-a', 'beat-c'])
    expect(removed.beats.map(beat => ({ id: beat.id, order: beat.order }))).toEqual([
      { id: 'beat-b', order: 0 },
      { id: 'beat-c', order: 1 },
    ])
  })

  it('ignores unknown beat ids when editing or moving', () => {
    const outline = createOutlineWithBeats([createBeat('beat-a', 0)])

    expect(updateTimelineBeat(outline, 'missing', {
      title: '不会写入',
      now: '2026-05-25T11:00:00.000Z',
    })).toEqual(outline)
    expect(moveTimelineBeat(outline, 'missing', 'down', '2026-05-25T11:00:00.000Z')).toEqual(outline)
    expect(removeTimelineBeat(outline, 'missing', '2026-05-25T11:00:00.000Z')).toEqual(outline)
  })

  it('adds plot lines and event tags after existing items', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const outline = createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z')

    const withLine = addPlotLine(outline, {
      title: '感情线',
      kind: 'branch',
      color: '#db2777',
      now: '2026-05-25T11:00:00.000Z',
    })
    const withTag = addOutlineEventTag(withLine, {
      label: '伏笔',
      color: '#0891b2',
      now: '2026-05-25T12:00:00.000Z',
    })

    expect(withLine.plotLines.at(-1)).toMatchObject({
      id: 'plot-i',
      title: '感情线',
      kind: 'branch',
      order: 1,
    })
    expect(withTag.eventTags.at(-1)).toMatchObject({
      id: 'tag-i',
      label: '伏笔',
      color: '#0891b2',
      system: false,
      order: 4,
    })
  })

  it('updates plot line title, color, and kind without changing references', () => {
    const outline = {
      ...createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'),
      beats: [createBeat('beat-a', 0)],
    }

    const updated = updatePlotLine(outline, 'plot-main', {
      title: '核心主线',
      color: '#0f766e',
      kind: 'branch',
      now: '2026-05-25T11:00:00.000Z',
    })

    expect(updated.plotLines[0]).toMatchObject({
      id: 'plot-main',
      title: '核心主线',
      color: '#0f766e',
      kind: 'branch',
      order: 0,
    })
    expect(updated.beats[0]?.plotLineIds).toEqual(['plot-main'])
    expect(updated.updatedAt).toBe('2026-05-25T11:00:00.000Z')
  })

  it('keeps the previous plot line title when an update title is blank', () => {
    const outline = createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z')

    const updated = updatePlotLine(outline, 'plot-main', {
      title: '   ',
      now: '2026-05-25T11:00:00.000Z',
    })

    expect(updated.plotLines[0]?.title).toBe('主线')
  })

  it('replaces plot lines with normalized draft order', () => {
    const outline = {
      ...createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'),
      plotLines: [
        { id: 'plot-main', title: '主线', kind: 'main' as const, color: '#2563eb', order: 0 },
        { id: 'plot-branch', title: '支线', kind: 'branch' as const, color: '#db2777', order: 1 },
      ],
    }

    const updated = replacePlotLines(outline, [
      { id: 'plot-branch', title: '情感线', kind: 'branch', color: '#be185d', order: 9 },
      { id: 'plot-main', title: '核心线', kind: 'main', color: '#2563eb', order: 4 },
    ], '2026-05-25T11:00:00.000Z')

    expect(updated.plotLines).toEqual([
      { id: 'plot-branch', title: '情感线', kind: 'branch', color: '#be185d', order: 0 },
      { id: 'plot-main', title: '核心线', kind: 'main', color: '#2563eb', order: 1 },
    ])
  })

  it('does not replace plot lines with an empty draft', () => {
    const outline = createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z')

    expect(replacePlotLines(outline, [], '2026-05-25T11:00:00.000Z')).toEqual(outline)
  })

  it('removes only unreferenced plot lines and keeps at least one line', () => {
    const outline = {
      ...createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'),
      plotLines: [
        { id: 'plot-main', title: '主线', kind: 'main' as const, color: '#2563eb', order: 0 },
        { id: 'plot-branch', title: '支线', kind: 'branch' as const, color: '#db2777', order: 1 },
        { id: 'plot-unused', title: '废弃线', kind: 'branch' as const, color: '#64748b', order: 2 },
      ],
      beats: [
        createBeat('beat-a', 0),
        { ...createBeat('beat-b', 1), plotLineIds: ['plot-branch'] },
      ],
    }

    expect(removePlotLine(outline, 'plot-main', '2026-05-25T11:00:00.000Z')).toEqual(outline)
    expect(removePlotLine(createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'), 'plot-main', '2026-05-25T11:00:00.000Z')).toEqual(createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'))

    const updated = removePlotLine(outline, 'plot-unused', '2026-05-25T11:00:00.000Z')

    expect(updated.plotLines.map(line => ({ id: line.id, order: line.order }))).toEqual([
      { id: 'plot-main', order: 0 },
      { id: 'plot-branch', order: 1 },
    ])
    expect(updated.updatedAt).toBe('2026-05-25T11:00:00.000Z')
  })
})

function createOutlineWithBeats(beats: TimelineBeat[]): WorkspaceOutline {
  return {
    ...createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'),
    beats,
  }
}

function createBeat(id: string, order: number): TimelineBeat {
  return {
    id,
    title: id,
    order,
    timeLabel: '',
    summary: '',
    plotLineIds: ['plot-main'],
    events: [],
    characterChanges: [],
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
  }
}
