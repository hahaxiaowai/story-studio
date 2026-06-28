import { describe, expect, it } from 'vitest'
import { createOutlineTimelineLayout, hitTestOutlineTimelineNode } from './layout'

describe('outline timeline canvas layout', () => {
  it('creates stable dimensions for each density', () => {
    const compact = createOutlineTimelineLayout(createModel(), 'compact')
    const expanded = createOutlineTimelineLayout(createModel(), 'expanded')

    expect(compact.width).toBeLessThan(expanded.width)
    expect(compact.height).toBeLessThan(expanded.height)
    expect(compact.nodes.some(node => node.type === 'beat-card' && node.beatId === 'beat-a')).toBe(true)
  })

  it('hit tests the topmost selectable beat node', () => {
    const layout = createOutlineTimelineLayout(createModel(), 'standard')
    const node = layout.nodes.find(item => item.type === 'beat-card' && item.beatId === 'beat-b')

    expect(node).toBeDefined()
    expect(hitTestOutlineTimelineNode(layout, {
      x: node!.x + node!.width / 2,
      y: node!.y + node!.height / 2,
    })?.beatId).toBe('beat-b')
  })
})

function createModel() {
  return {
    columns: [
      {
        id: 'beat-a',
        title: '暗门开启',
        timeLabel: '第一夜',
        summary: '主角发现暗门。',
        eventCount: 2,
      },
      {
        id: 'beat-b',
        title: '联盟破裂',
        timeLabel: '第二夜',
        summary: '盟友公开决裂。',
        eventCount: 1,
      },
    ],
    lanes: [
      {
        id: 'plot-main',
        kind: 'plot' as const,
        title: '主线',
        color: '#2563eb',
        items: [
          {
            beatId: 'beat-a',
            title: '暗门开启',
            summary: '主角发现暗门。',
            color: '#2563eb',
          },
          {
            beatId: 'beat-b',
            title: '联盟破裂',
            summary: '盟友公开决裂。',
            color: '#2563eb',
          },
        ],
      },
      {
        id: 'character-lin',
        kind: 'character' as const,
        title: '林澈',
        color: '#64748b',
        items: [
          {
            beatId: 'beat-b',
            title: '人物变化',
            summary: '信任坍塌。',
            color: '#64748b',
          },
        ],
      },
    ],
  }
}
