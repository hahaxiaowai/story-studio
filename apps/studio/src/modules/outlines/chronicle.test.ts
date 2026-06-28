import type { EntityRecord, TimelineBeat, WorkspaceOutline } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { createChronicleCanvasModel, createChronicleMobileCards, createChronicleModel } from './chronicle'
import { createWorkspaceOutline } from './outline'

describe('chronicle model', () => {
  it('orders timeline columns and groups beats by plot line lanes', () => {
    const outline = createOutline([
      createBeat('beat-b', 1, ['plot-main'], ['change-lin']),
      createBeat('beat-a', 0, ['plot-main', 'plot-branch'], []),
    ])

    const model = createChronicleModel({
      outline,
      characters: [createCharacter('character-lin', '林澈')],
      getCharacterTitle: record => String(record.values['character-name']),
    })

    expect(model.columns.map(column => column.id)).toEqual(['beat-a', 'beat-b'])
    expect(model.plotLineLanes).toEqual([
      {
        id: 'plot-main',
        title: '主线',
        color: '#2563eb',
        beats: [outline.beats[1], outline.beats[0]],
      },
      {
        id: 'plot-branch',
        title: '感情线',
        color: '#db2777',
        beats: [outline.beats[1]],
      },
    ])
  })

  it('groups character changes by character lane and keeps beat order', () => {
    const outline = createOutline([
      createBeat('beat-a', 0, ['plot-main'], ['change-lin-a']),
      createBeat('beat-b', 1, ['plot-main'], ['change-lin-b', 'change-qiao']),
    ])

    const model = createChronicleModel({
      outline,
      characters: [
        createCharacter('character-lin', '林澈'),
        createCharacter('character-qiao', '乔安'),
      ],
      getCharacterTitle: record => String(record.values['character-name']),
    })

    expect(model.characterLanes).toEqual([
      {
        id: 'character-lin',
        title: '林澈',
        changesByBeatId: {
          'beat-a': [outline.beats[0]!.characterChanges[0]],
          'beat-b': [outline.beats[1]!.characterChanges[0]],
        },
      },
      {
        id: 'character-qiao',
        title: '乔安',
        changesByBeatId: {
          'beat-b': [outline.beats[1]!.characterChanges[1]],
        },
      },
    ])
  })

  it('derives mobile cards with plot lines, event count, and character change count', () => {
    const outline = createOutline([
      {
        ...createBeat('beat-a', 0, ['plot-main', 'plot-branch'], ['change-lin-a']),
        events: [
          { id: 'event-a', title: '事件 A', description: '', tagIds: [] },
          { id: 'event-b', title: '事件 B', description: '', tagIds: [] },
        ],
      },
      createBeat('beat-b', 1, ['plot-main'], ['change-lin-b', 'change-qiao']),
    ])
    const model = createChronicleModel({
      outline,
      characters: [
        createCharacter('character-lin', '林澈'),
        createCharacter('character-qiao', '乔安'),
      ],
      getCharacterTitle: record => String(record.values['character-name']),
    })

    expect(createChronicleMobileCards(model)).toEqual([
      {
        beat: outline.beats[0],
        plotLines: [
          { id: 'plot-main', title: '主线', color: '#2563eb' },
          { id: 'plot-branch', title: '感情线', color: '#db2777' },
        ],
        eventCount: 2,
        characterChangeCount: 1,
      },
      {
        beat: outline.beats[1],
        plotLines: [
          { id: 'plot-main', title: '主线', color: '#2563eb' },
        ],
        eventCount: 0,
        characterChangeCount: 2,
      },
    ])
  })

  it('derives a canvas model with ordered columns and plot line lanes', () => {
    const outline = createOutline([
      createBeat('beat-b', 1, ['plot-main'], ['change-lin']),
      createBeat('beat-a', 0, ['plot-main', 'plot-branch'], []),
    ])
    const model = createChronicleModel({
      outline,
      characters: [createCharacter('character-lin', '林澈')],
      getCharacterTitle: record => String(record.values['character-name']),
    })

    const canvasModel = createChronicleCanvasModel(model)

    expect(canvasModel.columns.map(column => column.id)).toEqual(['beat-a', 'beat-b'])
    expect(canvasModel.lanes.filter(lane => lane.kind === 'plot').map(lane => ({
      id: lane.id,
      title: lane.title,
      color: lane.color,
      beatIds: lane.items.map(item => item.beatId),
    }))).toEqual([
      {
        id: 'plot-main',
        title: '主线',
        color: '#2563eb',
        beatIds: ['beat-a', 'beat-b'],
      },
      {
        id: 'plot-branch',
        title: '感情线',
        color: '#db2777',
        beatIds: ['beat-a'],
      },
    ])
  })

  it('derives canvas character lanes and keeps an empty character section stable', () => {
    const outline = createOutline([
      createBeat('beat-a', 0, ['plot-main'], []),
      createBeat('beat-b', 1, ['plot-main'], ['change-lin-b', 'change-qiao']),
    ])
    const model = createChronicleModel({
      outline,
      characters: [
        createCharacter('character-lin', '林澈'),
        createCharacter('character-qiao', '乔安'),
      ],
      getCharacterTitle: record => String(record.values['character-name']),
    })

    const canvasModel = createChronicleCanvasModel(model)

    expect(canvasModel.lanes.filter(lane => lane.kind === 'character').map(lane => ({
      id: lane.id,
      title: lane.title,
      items: lane.items,
    }))).toEqual([
      {
        id: 'character-lin',
        title: '林澈',
        items: [
          {
            beatId: 'beat-b',
            title: '人物变化',
            summary: 'change-lin-b',
            color: '#64748b',
          },
        ],
      },
      {
        id: 'character-qiao',
        title: '乔安',
        items: [
          {
            beatId: 'beat-b',
            title: '人物变化',
            summary: 'change-qiao',
            color: '#64748b',
          },
        ],
      },
    ])
  })

  it('keeps canvas model dimensions stable when character lanes are empty', () => {
    const outline = createOutline([
      createBeat('beat-a', 0, ['plot-main'], []),
    ])
    const model = createChronicleModel({
      outline,
      characters: [],
      getCharacterTitle: record => record.title,
    })

    const canvasModel = createChronicleCanvasModel(model)

    expect(canvasModel.columns.map(column => column.id)).toEqual(['beat-a'])
    expect(canvasModel.lanes.map(lane => lane.kind)).toEqual(['plot', 'plot', 'section'])
    expect(canvasModel.lanes.at(-1)).toMatchObject({
      id: 'character-section-empty',
      kind: 'section',
      title: '人物发展',
      items: [],
    })
  })
})

function createOutline(beats: TimelineBeat[]): WorkspaceOutline {
  return {
    ...createWorkspaceOutline('workspace-a', '2026-05-25T10:00:00.000Z'),
    plotLines: [
      {
        id: 'plot-main',
        title: '主线',
        kind: 'main',
        color: '#2563eb',
        order: 0,
      },
      {
        id: 'plot-branch',
        title: '感情线',
        kind: 'branch',
        color: '#db2777',
        order: 1,
      },
    ],
    beats,
  }
}

function createBeat(id: string, order: number, plotLineIds: string[], changeIds: string[]): TimelineBeat {
  return {
    id,
    title: id,
    order,
    timeLabel: `T${order}`,
    summary: '',
    plotLineIds,
    events: [],
    characterChanges: changeIds.map(changeId => ({
      id: changeId,
      characterId: changeId.includes('qiao') ? 'character-qiao' : 'character-lin',
      category: 'relationship',
      summary: changeId,
    })),
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
  }
}

function createCharacter(id: string, name: string): EntityRecord {
  return {
    id,
    workspaceId: 'workspace-a',
    kind: 'character',
    title: name,
    values: {
      'character-name': name,
    },
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
  }
}
