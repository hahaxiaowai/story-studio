import type { WorkspaceContentEntry } from '@story-studio/types'

export interface CreateContentEntryInput {
  workspaceId: string
  order: number
  now: string
}

export interface UpdateContentEntryInput {
  volume?: string
  chapter?: string
  body?: string
  now: string
}

export function createContentEntry(input: CreateContentEntryInput): WorkspaceContentEntry {
  return {
    id: createContentEntryId(input.now),
    workspaceId: input.workspaceId,
    volume: '第一卷',
    chapter: `第${input.order + 1}章`,
    body: '',
    order: input.order,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateContentEntry(entry: WorkspaceContentEntry, input: UpdateContentEntryInput): WorkspaceContentEntry {
  return {
    ...entry,
    ...(input.volume !== undefined ? { volume: input.volume } : {}),
    ...(input.chapter !== undefined ? { chapter: input.chapter } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
    updatedAt: input.now,
  }
}

export function removeContentEntry(entries: WorkspaceContentEntry[], entryId: string): WorkspaceContentEntry[] {
  return sortContentEntries(entries)
    .filter(entry => entry.id !== entryId)
    .map((entry, order) => ({ ...entry, order }))
}

export function getContentEntriesByWorkspace(entries: WorkspaceContentEntry[], workspaceId: string): WorkspaceContentEntry[] {
  return sortContentEntries(entries.filter(entry => entry.workspaceId === workspaceId))
}

export function sortContentEntries(entries: WorkspaceContentEntry[]): WorkspaceContentEntry[] {
  return [...entries].sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt))
}

function createContentEntryId(now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `content-${stamp}-${randomSegment}`
}
