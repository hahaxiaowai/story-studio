import { describe, expect, it, vi } from 'vitest'
import {
  addWorldMapStroke,
  addWorldSettingGroup,
  addWorldSettingItem,
  clearWorldMap,
  createWorkspaceWorld,
} from './world'

describe('world module data', () => {
  it('creates a default workspace world', () => {
    const world = createWorkspaceWorld('workspace-a', '2026-05-27T00:00:00.000Z')

    expect(world.workspaceId).toBe('workspace-a')
    expect(world.settingGroups.map(group => group.title)).toEqual(['地理与势力', '历史与规则'])
    expect(world.maps[0]?.title).toBe('世界地图')
    expect(world.activeMapId).toBe('map-workspace-a')
  })

  it('adds setting groups and items', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)

    const world = createWorkspaceWorld('workspace-a', '2026-05-27T00:00:00.000Z')
    const withGroup = addWorldSettingGroup(world, {
      title: '  信仰体系  ',
      description: '  神祇和禁忌  ',
      now: '2026-05-27T01:00:00.000Z',
    })
    const groupId = withGroup.settingGroups[2]!.id
    const withItem = addWorldSettingItem(withGroup, {
      groupId,
      title: '  月神祭  ',
      body: '  每年冬至举行。  ',
      now: '2026-05-27T02:00:00.000Z',
    })

    expect(withItem.settingGroups[2]).toMatchObject({
      title: '信仰体系',
      description: '神祇和禁忌',
      items: [
        {
          title: '月神祭',
          body: '每年冬至举行。',
        },
      ],
    })
  })

  it('adds and clears map strokes', () => {
    const world = createWorkspaceWorld('workspace-a', '2026-05-27T00:00:00.000Z')
    const withStroke = addWorldMapStroke(world, {
      mapId: world.activeMapId,
      color: '#2563eb',
      width: 3,
      points: [{ x: 10, y: 12 }, { x: 30, y: 48 }],
      now: '2026-05-27T01:00:00.000Z',
    })
    const cleared = clearWorldMap(withStroke, world.activeMapId, '2026-05-27T02:00:00.000Z')

    expect(withStroke.maps[0]?.strokes).toHaveLength(1)
    expect(cleared.maps[0]?.strokes).toEqual([])
  })
})
