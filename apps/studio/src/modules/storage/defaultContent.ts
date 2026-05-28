import type { EntityRecord, StudioDataDocument, TimelineBeat, WorkspaceOutline, WorkspaceWorld } from '@story-studio/types'
import { createWorkspaceOutline } from '../outlines/outline'
import { seedWorkspaces } from '../workspaces/workspaces'
import { createWorkspaceWorld } from '../worlds/world'

const WARCRAFT_WORKSPACE_ID = 'workspace-mo-shou-shi-jie'

const WARCRAFT_CHARACTER_IDS = {
  anduin: 'character-anduin-wrynn',
  illidan: 'character-illidan-stormrage',
  jaina: 'character-jaina-proudmoore',
  sylvanas: 'character-sylvanas-windrunner',
  thrall: 'character-thrall',
} as const

export function createDefaultEntityRecords(now: string): EntityRecord[] {
  return [
    createCharacterRecord({
      id: WARCRAFT_CHARACTER_IDS.thrall,
      name: '萨尔',
      role: '部落精神领袖',
      faction: '部落',
      appearance: '兽人萨满与战士气质并存，常以简洁战甲和毁灭之锤示人。',
      personality: '克制、重视荣誉，倾向在战争和共存之间寻找可承受的秩序。',
      motivation: '为被奴役过的族人寻找新家园，也试图让部落摆脱纯粹征服的道路。',
      relationshipNotes: '与吉安娜存在合作基础；与联盟的信任经常被战争现实撕裂。',
      now,
    }),
    createCharacterRecord({
      id: WARCRAFT_CHARACTER_IDS.jaina,
      name: '吉安娜·普罗德摩尔',
      role: '肯瑞托法师 / 库尔提拉斯领袖',
      faction: '联盟',
      appearance: '人类法师，常穿蓝白色长袍，气质从理想主义逐渐转向冷峻。',
      personality: '聪慧、富有同理心，但经历背叛与战争后变得更谨慎强硬。',
      motivation: '在和平理想、家族责任和战争创伤之间寻找新的判断标准。',
      relationshipNotes: '曾与萨尔共同推动停战；与阿尔萨斯的旧情成为她对灾难的长期阴影。',
      now,
    }),
    createCharacterRecord({
      id: WARCRAFT_CHARACTER_IDS.anduin,
      name: '安度因·乌瑞恩',
      role: '暴风城国王',
      faction: '联盟',
      appearance: '年轻人类国王，常以金白色王室甲胄和圣光象征出现。',
      personality: '仁慈、重视谈判，但被战争不断迫使面对权力和责任的重量。',
      motivation: '保护联盟，同时证明仁慈不是软弱。',
      relationshipNotes: '继承瓦里安留下的王权压力；对部落内部的荣誉派仍保留沟通意愿。',
      now,
    }),
    createCharacterRecord({
      id: WARCRAFT_CHARACTER_IDS.sylvanas,
      name: '希尔瓦娜斯·风行者',
      role: '被遗忘者女王 / 部落大酋长',
      faction: '被遗忘者 / 部落',
      appearance: '亡灵游侠，冷色调甲胄与长弓强化了疏离和威慑感。',
      personality: '冷静、决绝、善于计算代价，常把生存置于道德约束之前。',
      motivation: '摆脱死亡支配，并为被遗忘者争取不受摆布的未来。',
      relationshipNotes: '与联盟仇恨深重；与部落盟友的关系更多建立在现实利益上。',
      now,
    }),
    createCharacterRecord({
      id: WARCRAFT_CHARACTER_IDS.illidan,
      name: '伊利丹·怒风',
      role: '恶魔猎手领袖',
      faction: '伊利达雷',
      appearance: '暗夜精灵恶魔猎手，蒙眼、双刃和邪能痕迹构成强烈辨识度。',
      personality: '孤傲、偏执、目标导向，愿意承担被误解和放逐的代价。',
      motivation: '以任何必要手段对抗燃烧军团，证明自己的牺牲不是徒劳。',
      relationshipNotes: '与玛法里奥和泰兰德的旧关系让他的选择长期带有私人裂痕。',
      now,
    }),
    createWorldSettingRecord({
      id: 'world-setting-eastern-kingdoms',
      name: '东部王国',
      category: 'geography',
      summary: '联盟核心区域，暴风城、铁炉堡和洛丹伦遗迹共同构成主要政治舞台。',
      detail: '适合作为联盟政治、天灾余波和王权继承线的主要发生地。',
      links: '暴风城、铁炉堡、洛丹伦、联盟',
      now,
    }),
    createWorldSettingRecord({
      id: 'world-setting-kalimdor',
      name: '卡利姆多',
      category: 'geography',
      summary: '新部落与暗夜精灵的重要舞台，迁徙、建国和自然守护冲突集中于此。',
      detail: '可承载部落建国、自然守护、资源争夺和跨阵营停战等设定。',
      links: '奥格瑞玛、暗夜精灵、新部落',
      now,
    }),
    createWorldSettingRecord({
      id: 'world-setting-faction-war',
      name: '联盟与部落',
      category: 'faction',
      summary: '世界冲突长期围绕资源、生存、复仇和荣誉展开。',
      detail: '共同敌人只能短暂压住阵营裂痕，角色选择常被阵营责任和个人信念共同牵引。',
      links: '联盟、部落、第四次大战',
      now,
    }),
  ]
}

export function createDefaultOutlines(now: string): WorkspaceOutline[] {
  return seedWorkspaces.map((workspace) => {
    if (workspace.id !== WARCRAFT_WORKSPACE_ID)
      return createWorkspaceOutline(workspace.id, now)

    return createWarcraftOutline(now)
  })
}

export function createDefaultWorlds(now: string): WorkspaceWorld[] {
  return seedWorkspaces.map((workspace) => {
    const world = createWorkspaceWorld(workspace.id, now)

    if (workspace.id !== WARCRAFT_WORKSPACE_ID)
      return world

    return {
      ...world,
      settingGroups: [
        {
          id: 'setting-geography',
          title: '地理与势力',
          description: '记录艾泽拉斯大陆、主城、阵营控制区和战略资源。',
          items: [
            {
              id: 'setting-item-eastern-kingdoms',
              title: '东部王国',
              body: '联盟核心区域，暴风城、铁炉堡和洛丹伦遗迹共同构成主要政治舞台。',
              order: 0,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'setting-item-kalimdor',
              title: '卡利姆多',
              body: '新部落与暗夜精灵的重要舞台，迁徙、建国和自然守护冲突集中于此。',
              order: 1,
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
          description: '整理阵营战争、远古威胁和魔法力量的基础规则。',
          items: [
            {
              id: 'setting-item-faction-war',
              title: '联盟与部落',
              body: '世界冲突长期围绕资源、生存、复仇和荣誉展开，共同敌人只能短暂压住阵营裂痕。',
              order: 0,
              createdAt: now,
              updatedAt: now,
            },
          ],
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      updatedAt: now,
    }
  })
}

export function isLegacyPrototypeSeedDocument(document: StudioDataDocument): boolean {
  const workspaceIds = document.workspaces.map(workspace => workspace.id)

  return workspaceIds.length === 2
    && workspaceIds.includes('workspace-long-ye-shou-gao')
    && workspaceIds.includes('workspace-wu-gang-lai-xin')
}

function createWarcraftOutline(now: string): WorkspaceOutline {
  return {
    ...createWorkspaceOutline(WARCRAFT_WORKSPACE_ID, now),
    plotLines: [
      { id: 'plot-main', title: '艾泽拉斯主线', kind: 'main', color: '#2563eb', order: 0 },
      { id: 'plot-alliance-horde', title: '联盟与部落', kind: 'branch', color: '#dc2626', order: 1 },
      { id: 'plot-burning-legion', title: '燃烧军团', kind: 'branch', color: '#7c3aed', order: 2 },
      { id: 'plot-scourge-shadow', title: '天灾与暗影', kind: 'branch', color: '#0f766e', order: 3 },
    ],
    eventTags: [
      { id: 'conflict', label: '冲突', color: '#dc2626', system: true, order: 0 },
      { id: 'climax', label: '高潮', color: '#9333ea', system: true, order: 1 },
      { id: 'turning-point', label: '转折', color: '#ea580c', system: true, order: 2 },
      { id: 'daily', label: '日常', color: '#16a34a', system: true, order: 3 },
      { id: 'war', label: '战争', color: '#b91c1c', system: false, order: 4 },
      { id: 'betrayal', label: '背叛', color: '#4c1d95', system: false, order: 5 },
      { id: 'sacrifice', label: '牺牲', color: '#0369a1', system: false, order: 6 },
    ],
    beats: createWarcraftBeats(now),
    updatedAt: now,
  }
}

function createWarcraftBeats(now: string): TimelineBeat[] {
  return [
    {
      id: 'beat-dark-portal',
      title: '黑暗之门开启',
      order: 0,
      timeLabel: '黑暗之门 0 年',
      summary: '兽人穿过黑暗之门进入艾泽拉斯，联盟与部落冲突的长期主轴由此展开。',
      plotLineIds: ['plot-main', 'plot-alliance-horde'],
      events: [
        {
          id: 'event-dark-portal-invasion',
          title: '外域军团进入东部王国',
          description: '黑暗之门把两个世界连接起来，艾泽拉斯从地区纷争进入跨世界战争。',
          tagIds: ['conflict', 'war'],
        },
      ],
      characterChanges: [
        {
          id: 'change-thrall-origin-shadow',
          characterId: WARCRAFT_CHARACTER_IDS.thrall,
          category: 'state',
          summary: '族群命运被战争定义，为他后来重塑部落埋下背景。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'beat-thrall-new-horde',
      title: '萨尔建立新部落',
      order: 1,
      timeLabel: '第三次大战前夕',
      summary: '萨尔带领兽人离开旧战争机器，试图以荣誉、氏族和新家园重新定义部落。',
      plotLineIds: ['plot-main', 'plot-alliance-horde'],
      events: [
        {
          id: 'event-new-horde-kalimdor',
          title: '远渡卡利姆多',
          description: '部落迁徙让冲突从复仇叙事转向生存与建国叙事。',
          tagIds: ['turning-point'],
        },
      ],
      characterChanges: [
        {
          id: 'change-thrall-warchief',
          characterId: WARCRAFT_CHARACTER_IDS.thrall,
          category: 'depth',
          summary: '从逃亡者成长为承担族群方向的大酋长。',
        },
        {
          id: 'change-jaina-first-trust',
          characterId: WARCRAFT_CHARACTER_IDS.jaina,
          category: 'relationship',
          summary: '开始相信部落中也存在可合作的荣誉派。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'beat-hyjal-alliance',
      title: '海加尔山并肩作战',
      order: 2,
      timeLabel: '第三次大战',
      summary: '联盟、部落与暗夜精灵在燃烧军团威胁下短暂结盟，把生存置于阵营仇恨之上。',
      plotLineIds: ['plot-main', 'plot-alliance-horde', 'plot-burning-legion'],
      events: [
        {
          id: 'event-hyjal-defense',
          title: '共同抵御阿克蒙德',
          description: '跨阵营合作证明共同敌人能压过旧仇，但和平基础仍然脆弱。',
          tagIds: ['climax', 'sacrifice'],
        },
      ],
      characterChanges: [
        {
          id: 'change-jaina-peace-cost',
          characterId: WARCRAFT_CHARACTER_IDS.jaina,
          category: 'personality',
          summary: '和平理想被验证，同时也开始承担牺牲亲近之人的代价。',
        },
        {
          id: 'change-thrall-diplomacy',
          characterId: WARCRAFT_CHARACTER_IDS.thrall,
          category: 'relationship',
          summary: '与吉安娜形成可持续谈判关系。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'beat-wrathgate',
      title: '天谴之门灾变',
      order: 3,
      timeLabel: '诺森德远征',
      summary: '对巫妖王的共同进攻被背叛和瘟疫打断，联盟与部落的互信急速坍塌。',
      plotLineIds: ['plot-main', 'plot-alliance-horde', 'plot-scourge-shadow'],
      events: [
        {
          id: 'event-wrathgate-plague',
          title: '瘟疫破坏联合作战',
          description: '战场胜利机会转化为政治裂痕，阵营关系重新滑向报复。',
          tagIds: ['betrayal', 'turning-point'],
        },
      ],
      characterChanges: [
        {
          id: 'change-sylvanas-control-cost',
          characterId: WARCRAFT_CHARACTER_IDS.sylvanas,
          category: 'state',
          summary: '被遗忘者内部失控暴露她统治秩序的高风险。',
        },
        {
          id: 'change-jaina-trust-shaken',
          characterId: WARCRAFT_CHARACTER_IDS.jaina,
          category: 'personality',
          summary: '对跨阵营和平的信念开始出现明显裂缝。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'beat-legion-return',
      title: '燃烧军团再临',
      order: 4,
      timeLabel: '破碎群岛战役',
      summary: '燃烧军团全面回归，伊利丹和各职业力量被重新放入对抗邪能的中心位置。',
      plotLineIds: ['plot-main', 'plot-burning-legion'],
      events: [
        {
          id: 'event-illidan-return',
          title: '伊利达雷重回战场',
          description: '过去被视作危险异端的力量，在灭世威胁前变成必要筹码。',
          tagIds: ['turning-point', 'sacrifice'],
        },
      ],
      characterChanges: [
        {
          id: 'change-illidan-purpose',
          characterId: WARCRAFT_CHARACTER_IDS.illidan,
          category: 'depth',
          summary: '他的极端手段获得重新审视，但孤独感并未被消除。',
        },
        {
          id: 'change-anduin-burden',
          characterId: WARCRAFT_CHARACTER_IDS.anduin,
          category: 'state',
          summary: '战争压力加速他从王子走向真正的国王。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'beat-fourth-war',
      title: '第四次大战爆发',
      order: 5,
      timeLabel: '争霸艾泽拉斯',
      summary: '希尔瓦娜斯的激进策略把阵营矛盾推向新高点，也迫使年轻领袖面对和平理想的边界。',
      plotLineIds: ['plot-main', 'plot-alliance-horde', 'plot-scourge-shadow'],
      events: [
        {
          id: 'event-fourth-war-escalation',
          title: '阵营战争全面升级',
          description: '政治、复仇和生存焦虑叠加，所有关键人物都必须重新选择立场。',
          tagIds: ['conflict', 'war', 'climax'],
        },
      ],
      characterChanges: [
        {
          id: 'change-sylvanas-breakpoint',
          characterId: WARCRAFT_CHARACTER_IDS.sylvanas,
          category: 'personality',
          summary: '从守护被遗忘者滑向更宏大的个人计划，盟友信任被消耗。',
        },
        {
          id: 'change-anduin-mercy-tested',
          characterId: WARCRAFT_CHARACTER_IDS.anduin,
          category: 'personality',
          summary: '仁慈理念被现实战争反复考验，政治判断变得更沉重。',
        },
        {
          id: 'change-jaina-return',
          characterId: WARCRAFT_CHARACTER_IDS.jaina,
          category: 'state',
          summary: '回到库尔提拉斯后，她把个人创伤转化为新的领袖责任。',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function createCharacterRecord(input: {
  id: string
  name: string
  role: string
  faction: string
  appearance: string
  personality: string
  motivation: string
  relationshipNotes: string
  now: string
}): EntityRecord {
  return {
    id: input.id,
    workspaceId: WARCRAFT_WORKSPACE_ID,
    kind: 'character',
    title: input.name,
    values: {
      'character-name': input.name,
      'character-role': input.role,
      'character-faction': input.faction,
      'character-appearance': input.appearance,
      'character-personality': input.personality,
      'character-motivation': input.motivation,
      'character-relationship-notes': input.relationshipNotes,
    },
    createdAt: input.now,
    updatedAt: input.now,
  }
}

function createWorldSettingRecord(input: {
  id: string
  name: string
  category: string
  summary: string
  detail: string
  links: string
  now: string
}): EntityRecord {
  return {
    id: input.id,
    workspaceId: WARCRAFT_WORKSPACE_ID,
    kind: 'world-setting',
    title: input.name,
    values: {
      'world-setting-name': input.name,
      'world-setting-category': input.category,
      'world-setting-summary': input.summary,
      'world-setting-detail': input.detail,
      'world-setting-links': input.links,
    },
    createdAt: input.now,
    updatedAt: input.now,
  }
}
