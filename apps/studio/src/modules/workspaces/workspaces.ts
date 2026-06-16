import type { Workspace, WorkspaceModule } from '@story-studio/types'
import type { MessageKey } from '@/composables/useLocale'

export interface AppendWorkspaceOptions {
  title: string
  description?: string
  now: string
}

export interface AppendWorkspaceResult {
  activeWorkspaceId: string
  workspaces: Workspace[]
}

export interface WorkspaceStatusChangeResult {
  activeWorkspaceId: string
  workspaces: Workspace[]
}

export interface UpdateWorkspaceDetailsOptions {
  title: string
  description?: string
  now: string
}

export const workspaceModules = ['outline', 'characters', 'maps', 'content'] as const satisfies readonly WorkspaceModule[]

const workspaceIdSegments: Record<string, string> = {
  兽: 'shou',
  界: 'jie',
  名: 'ming',
  长: 'long',
  稿: 'gao',
  港: 'gang',
  来: 'lai',
  命: 'ming',
  品: 'pin',
  手: 'shou',
  未: 'wei',
  雾: 'wu',
  信: 'xin',
  夜: 'ye',
  作: 'zuo',
  世: 'shi',
  魔: 'mo',
}

export const seedWorkspaces: Workspace[] = [
  createWorkspace({
    title: '魔兽世界',
    description: '以艾泽拉斯的阵营冲突、远古威胁和关键人物选择为样例，展示时间轴大纲能力。',
    now: '2026-05-24T00:00:00.000Z',
    moduleCounts: {
      outline: 6,
      characters: 5,
      maps: 3,
      content: 0,
    },
  }),
]

export function appendWorkspace(workspaces: Workspace[], options: AppendWorkspaceOptions): AppendWorkspaceResult {
  const workspace = createWorkspace(options)
  const workspaceId = createUniqueWorkspaceId(workspace.id, workspaces)

  return {
    activeWorkspaceId: workspaceId,
    workspaces: [...workspaces, { ...workspace, id: workspaceId }],
  }
}

export function getWorkspaceById(workspaces: Workspace[], workspaceId: string): Workspace | undefined {
  return workspaces.find(workspace => workspace.id === workspaceId)
}

export function getDraftWorkspaces(workspaces: Workspace[]): Workspace[] {
  return workspaces.filter(workspace => workspace.status === 'draft')
}

export function getArchivedWorkspaces(workspaces: Workspace[]): Workspace[] {
  return workspaces.filter(workspace => workspace.status === 'archived')
}

export function updateWorkspaceStoryStyle(workspaces: Workspace[], workspaceId: string, storyStyleId: string): Workspace[] {
  const nextStoryStyleId = storyStyleId.trim()

  return workspaces.map(workspace => workspace.id === workspaceId
    ? {
        ...workspace,
        storyStyleId: nextStoryStyleId || undefined,
        updatedAt: new Date().toISOString(),
      }
    : workspace)
}

export function archiveWorkspace(workspaces: Workspace[], activeWorkspaceId: string, workspaceId: string, now: string): WorkspaceStatusChangeResult {
  const draftWorkspaces = getDraftWorkspaces(workspaces)
  const workspace = getWorkspaceById(workspaces, workspaceId)

  if (!workspace || workspace.status === 'archived') {
    return {
      activeWorkspaceId,
      workspaces,
    }
  }

  if (draftWorkspaces.length <= 1)
    throw new Error('Cannot archive the last draft workspace.')

  const nextDraftWorkspace = draftWorkspaces.find(draftWorkspace => draftWorkspace.id !== workspaceId)
  const nextActiveWorkspaceId = activeWorkspaceId === workspaceId
    ? nextDraftWorkspace?.id ?? activeWorkspaceId
    : activeWorkspaceId

  return {
    activeWorkspaceId: nextActiveWorkspaceId,
    workspaces: workspaces.map(currentWorkspace => currentWorkspace.id === workspaceId
      ? {
          ...currentWorkspace,
          status: 'archived',
          updatedAt: now,
        }
      : currentWorkspace),
  }
}

export function restoreWorkspace(workspaces: Workspace[], activeWorkspaceId: string, workspaceId: string, now: string): WorkspaceStatusChangeResult {
  const workspace = getWorkspaceById(workspaces, workspaceId)

  if (!workspace || workspace.status === 'draft') {
    return {
      activeWorkspaceId,
      workspaces,
    }
  }

  return {
    activeWorkspaceId: workspaceId,
    workspaces: workspaces.map(currentWorkspace => currentWorkspace.id === workspaceId
      ? {
          ...currentWorkspace,
          status: 'draft',
          updatedAt: now,
        }
      : currentWorkspace),
  }
}

export function updateWorkspaceDetails(workspaces: Workspace[], workspaceId: string, options: UpdateWorkspaceDetailsOptions): Workspace[] {
  const title = options.title.trim()
  const description = options.description?.trim()

  if (!title)
    throw new Error('Workspace title is required.')

  return workspaces.map(workspace => workspace.id === workspaceId
    ? {
        ...workspace,
        title,
        ...(description ? { description } : { description: undefined }),
        updatedAt: options.now,
      }
    : workspace)
}

export function getWorkspaceModuleLabelKey(module: WorkspaceModule): MessageKey {
  const keys = {
    characters: 'nav.characters',
    content: 'nav.content',
    maps: 'nav.world',
    outline: 'nav.outline',
  } as const satisfies Record<WorkspaceModule, MessageKey>

  return keys[module]
}

export function getNavigationLabelKey(hash: string): MessageKey {
  const normalizedHash = hash || '#manuscript'
  const keys: Record<string, MessageKey> = {
    '#assistant': 'nav.assistant',
    '#cast': 'nav.characters',
    '#characters': 'nav.characters',
    '#content': 'nav.content',
    '#maps': 'nav.world',
    '#materials': 'nav.materials',
    '#manuscript': 'nav.content',
    '#outline': 'nav.outline',
    '#world-map': 'nav.worldMap',
    '#world-settings': 'nav.worldSettings',
  }

  return keys[normalizedHash] ?? 'nav.content'
}

export function isPublicNavigationHash(hash: string): boolean {
  return ['#assistant', '#materials'].includes(hash)
}

export function createWorkspace(options: AppendWorkspaceOptions & Partial<Pick<Workspace, 'moduleCounts'>>): Workspace {
  const title = options.title.trim()
  const description = options.description?.trim()

  if (!title)
    throw new Error('Workspace title is required.')

  return {
    id: createWorkspaceId(title),
    title,
    ...(description ? { description } : {}),
    status: 'draft',
    moduleCounts: options.moduleCounts ?? {
      characters: 0,
      content: 0,
      maps: 0,
      outline: 0,
    },
    createdAt: options.now,
    updatedAt: options.now,
  }
}

function createUniqueWorkspaceId(baseId: string, workspaces: Workspace[]): string {
  const workspaceIds = new Set(workspaces.map(workspace => workspace.id))

  if (!workspaceIds.has(baseId))
    return baseId

  let index = 2
  let workspaceId = `${baseId}-${index}`

  while (workspaceIds.has(workspaceId)) {
    index += 1
    workspaceId = `${baseId}-${index}`
  }

  return workspaceId
}

function createWorkspaceId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .split('')
    .map(character => workspaceIdSegments[character] ? `-${workspaceIdSegments[character]}-` : character)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `workspace-${slug || 'untitled'}`
}
