import type {
  WorkspaceWorld,
  WorldMap,
  WorldMapPoint,
  WorldMapStroke,
  WorldSettingGroup,
  WorldSettingItem,
} from '@story-studio/types'

export interface AddWorldSettingGroupInput {
  title: string
  description?: string
  now: string
}

export interface AddWorldSettingItemInput {
  groupId: string
  title: string
  body?: string
  now: string
}

export interface AddWorldMapStrokeInput {
  mapId: string
  color: string
  width: number
  points: WorldMapPoint[]
  now: string
}

export function createWorkspaceWorld(workspaceId: string, now: string): WorkspaceWorld {
  const map = createWorldMap(workspaceId, now)

  return {
    id: `world-${workspaceId}`,
    workspaceId,
    settingGroups: [
      {
        id: 'setting-geography',
        title: '地理与势力',
        description: '记录大陆、城市、阵营和资源分布。',
        items: [
          {
            id: 'setting-item-main-continent',
            title: '主大陆',
            body: '标记核心故事发生地、边境和关键冲突区域。',
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'setting-history',
        title: '历史与规则',
        description: '沉淀世界历史、魔法/科技规则和禁忌。',
        items: [],
        order: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
    maps: [map],
    activeMapId: map.id,
    createdAt: now,
    updatedAt: now,
  }
}

export function addWorldSettingGroup(world: WorkspaceWorld, input: AddWorldSettingGroupInput): WorkspaceWorld {
  const group: WorldSettingGroup = {
    id: createWorldId('setting-group'),
    title: input.title.trim() || '新设定组',
    description: input.description?.trim() ?? '',
    items: [],
    order: world.settingGroups.length,
    createdAt: input.now,
    updatedAt: input.now,
  }

  return {
    ...world,
    settingGroups: [...world.settingGroups, group],
    updatedAt: input.now,
  }
}

export function addWorldSettingItem(world: WorkspaceWorld, input: AddWorldSettingItemInput): WorkspaceWorld {
  const group = world.settingGroups.find(item => item.id === input.groupId)

  if (!group)
    return world

  const settingItem: WorldSettingItem = {
    id: createWorldId('setting-item'),
    title: input.title.trim() || '新设定',
    body: input.body?.trim() ?? '',
    order: group.items.length,
    createdAt: input.now,
    updatedAt: input.now,
  }

  return {
    ...world,
    settingGroups: world.settingGroups.map(item => item.id === input.groupId
      ? {
          ...item,
          items: [...item.items, settingItem],
          updatedAt: input.now,
        }
      : item),
    updatedAt: input.now,
  }
}

export function addWorldMapStroke(world: WorkspaceWorld, input: AddWorldMapStrokeInput): WorkspaceWorld {
  const stroke: WorldMapStroke = {
    id: createWorldId('stroke'),
    color: input.color,
    width: input.width,
    points: input.points,
    createdAt: input.now,
  }

  return updateWorldMap(world, input.mapId, map => ({
    ...map,
    strokes: [...map.strokes, stroke],
    updatedAt: input.now,
  }), input.now)
}

export function clearWorldMap(world: WorkspaceWorld, mapId: string, now: string): WorkspaceWorld {
  return updateWorldMap(world, mapId, map => ({
    ...map,
    strokes: [],
    updatedAt: now,
  }), now)
}

function createWorldMap(workspaceId: string, now: string): WorldMap {
  return {
    id: `map-${workspaceId}`,
    title: '世界地图',
    strokes: [],
    createdAt: now,
    updatedAt: now,
  }
}

function updateWorldMap(
  world: WorkspaceWorld,
  mapId: string,
  updater: (map: WorldMap) => WorldMap,
  now: string,
): WorkspaceWorld {
  if (!world.maps.some(map => map.id === mapId))
    return world

  return {
    ...world,
    maps: world.maps.map(map => map.id === mapId ? updater(map) : map),
    updatedAt: now,
  }
}

function createWorldId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
