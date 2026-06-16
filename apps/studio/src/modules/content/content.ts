import type { WorkspaceContentEntry } from '@story-studio/types'

export interface CreateContentEntryInput {
  workspaceId: string
  order: number
  now: string
}

export interface UpdateContentEntryInput {
  outlineBeatId?: string
  volume?: string
  chapter?: string
  body?: string
  now: string
}

export interface AssignOutlineBeatToContentEntryInput {
  entryId: string
  outlineBeatId: string
  now: string
}

export interface MoveContentEntryInput {
  entryId: string
  direction: 'up' | 'down'
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
    ...(input.outlineBeatId !== undefined ? { outlineBeatId: normalizeOptionalId(input.outlineBeatId) } : {}),
    ...(input.volume !== undefined ? { volume: input.volume } : {}),
    ...(input.chapter !== undefined ? { chapter: input.chapter } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
    updatedAt: input.now,
  }
}

export function assignOutlineBeatToContentEntry(
  entries: WorkspaceContentEntry[],
  input: AssignOutlineBeatToContentEntryInput,
): WorkspaceContentEntry[] {
  const outlineBeatId = normalizeOptionalId(input.outlineBeatId)

  return entries.map((entry) => {
    if (entry.id === input.entryId) {
      return {
        ...entry,
        outlineBeatId,
        updatedAt: input.now,
      }
    }

    if (outlineBeatId && entry.outlineBeatId === outlineBeatId) {
      return {
        ...entry,
        outlineBeatId: undefined,
      }
    }

    return entry
  })
}

export function removeContentEntry(entries: WorkspaceContentEntry[], entryId: string): WorkspaceContentEntry[] {
  return sortContentEntries(entries)
    .filter(entry => entry.id !== entryId)
    .map((entry, order) => ({ ...entry, order }))
}

export function moveContentEntry(entries: WorkspaceContentEntry[], input: MoveContentEntryInput): WorkspaceContentEntry[] {
  const sortedEntries = sortContentEntries(entries)
  const currentIndex = sortedEntries.findIndex(entry => entry.id === input.entryId)
  const nextIndex = input.direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sortedEntries.length)
    return sortedEntries.map((entry, order) => ({ ...entry, order }))

  const reorderedEntries = [...sortedEntries]
  const [currentEntry] = reorderedEntries.splice(currentIndex, 1)

  reorderedEntries.splice(nextIndex, 0, currentEntry!)

  return reorderedEntries.map((entry, order) => ({
    ...entry,
    order,
    updatedAt: entry.id === input.entryId || entry.id === sortedEntries[nextIndex]?.id ? input.now : entry.updatedAt,
  }))
}

export function getContentEntriesByWorkspace(entries: WorkspaceContentEntry[], workspaceId: string): WorkspaceContentEntry[] {
  return sortContentEntries(entries.filter(entry => entry.workspaceId === workspaceId))
}

export function getFilteredContentEntries(entries: WorkspaceContentEntry[], query: string): WorkspaceContentEntry[] {
  const sortedEntries = sortContentEntries(entries)
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery)
    return sortedEntries

  return sortedEntries.filter(entry =>
    [entry.volume, entry.chapter, entry.body].some(value => value.toLowerCase().includes(normalizedQuery)),
  )
}

export function sortContentEntries(entries: WorkspaceContentEntry[]): WorkspaceContentEntry[] {
  return [...entries].sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt))
}

function createContentEntryId(now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `content-${stamp}-${randomSegment}`
}

function normalizeOptionalId(value: string): string | undefined {
  return value.trim() || undefined
}
