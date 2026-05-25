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

export const workspaceModules = ['outline', 'characters', 'maps', 'content'] as const satisfies readonly WorkspaceModule[]

const workspaceIdSegments: Record<string, string> = {
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
}

export const seedWorkspaces: Workspace[] = [
  createWorkspace({
    title: '长夜手稿',
    now: '2026-05-24T00:00:00.000Z',
    moduleCounts: {
      outline: 3,
      characters: 2,
      maps: 1,
      content: 4,
    },
  }),
  createWorkspace({
    title: '雾港来信',
    now: '2026-05-24T00:00:00.000Z',
    moduleCounts: {
      outline: 1,
      characters: 1,
      maps: 2,
      content: 2,
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

export function getWorkspaceModuleLabelKey(module: WorkspaceModule): MessageKey {
  const keys = {
    characters: 'nav.characters',
    content: 'nav.content',
    maps: 'nav.maps',
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
    '#maps': 'nav.maps',
    '#materials': 'nav.materials',
    '#manuscript': 'nav.content',
    '#outline': 'nav.outline',
  }

  return keys[normalizedHash] ?? 'nav.content'
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
