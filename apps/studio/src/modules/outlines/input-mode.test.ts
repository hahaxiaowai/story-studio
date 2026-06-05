import type { WorkspaceOutline } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { createInputModeBeatCards } from './input-mode'

describe('createInputModeBeatCards', () => {
  it('creates ordered beat cards for the input mode list', () => {
    const outline: WorkspaceOutline = {
      workspaceId: 'workspace-a',
      plotLines: [
        { id: 'line-a', title: '主线', kind: 'main', color: '#b91c1c', order: 0 },
        { id: 'line-b', title: '支线', kind: 'branch', color: '#2563eb', order: 1 },
      ],
      eventTags: [],
      beats: [
        {
          id: 'beat-b',
          title: '第二幕',
          timeLabel: '第二天',
          summary: '',
          order: 2,
          plotLineIds: ['line-b'],
          events: [],
          characterChanges: [],
          createdAt: '2026-06-05T00:00:00.000Z',
          updatedAt: '2026-06-05T00:00:00.000Z',
        },
        {
          id: 'beat-a',
          title: '第一幕',
          timeLabel: '第一天',
          summary: '起点',
          order: 1,
          plotLineIds: ['line-a', 'line-b'],
          events: [
            { id: 'event-a', title: '冲突', description: '', tagIds: [] },
            { id: 'event-b', title: '转折', description: '', tagIds: [] },
          ],
          characterChanges: [
            { id: 'change-a', characterId: 'character-a', category: 'state', summary: '' },
          ],
          createdAt: '2026-06-05T00:00:00.000Z',
          updatedAt: '2026-06-05T00:00:00.000Z',
        },
      ],
      id: 'outline-a',
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z',
    }

    expect(createInputModeBeatCards(outline)).toEqual([
      {
        beat: outline.beats[1],
        plotLines: [
          { id: 'line-a', title: '主线', color: '#b91c1c' },
          { id: 'line-b', title: '支线', color: '#2563eb' },
        ],
        eventCount: 2,
        characterChangeCount: 1,
      },
      {
        beat: outline.beats[0],
        plotLines: [
          { id: 'line-b', title: '支线', color: '#2563eb' },
        ],
        eventCount: 0,
        characterChangeCount: 0,
      },
    ])
  })
})
