import type { WorkspaceContentEntry } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  assignOutlineBeatToContentEntry,
  createContentEntry,
  getContentEntriesByWorkspace,
  moveContentEntry,
  removeContentEntry,
  updateContentEntry,
} from './content'

describe('content entries', () => {
  it('creates markdown content entries with default volume and chapter', () => {
    const entry = createContentEntry({
      workspaceId: 'workspace-story',
      order: 0,
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(entry).toMatchObject({
      workspaceId: 'workspace-story',
      volume: '第一卷',
      chapter: '第1章',
      body: '',
      order: 0,
      createdAt: '2026-05-28T10:00:00.000Z',
      updatedAt: '2026-05-28T10:00:00.000Z',
    })
    expect(entry.outlineBeatId).toBeUndefined()
    expect(entry.id).toMatch(/^content-20260528100000-/)
  })

  it('updates volume, chapter, body, and updatedAt', () => {
    const entry = createEntry({
      id: 'content-1',
      volume: '第一卷',
      chapter: '第一章',
      body: '',
      order: 0,
    })

    expect(updateContentEntry(entry, {
      volume: '第二卷',
      chapter: '第二章',
      body: '# 标题',
      now: '2026-05-28T11:00:00.000Z',
    })).toMatchObject({
      volume: '第二卷',
      chapter: '第二章',
      body: '# 标题',
      updatedAt: '2026-05-28T11:00:00.000Z',
    })
  })

  it('removes entries and normalizes order', () => {
    const entries = [
      createEntry({ id: 'content-1', order: 0 }),
      createEntry({ id: 'content-2', order: 1 }),
      createEntry({ id: 'content-3', order: 2 }),
    ]

    expect(removeContentEntry(entries, 'content-2').map(entry => ({
      id: entry.id,
      order: entry.order,
    }))).toEqual([
      { id: 'content-1', order: 0 },
      { id: 'content-3', order: 1 },
    ])
  })

  it('moves an entry up and normalizes order', () => {
    const entries = [
      createEntry({ id: 'content-1', order: 0 }),
      createEntry({ id: 'content-2', order: 1 }),
      createEntry({ id: 'content-3', order: 2 }),
    ]

    expect(moveContentEntry(entries, {
      entryId: 'content-2',
      direction: 'up',
      now: '2026-05-28T12:00:00.000Z',
    }).map(entry => ({
      id: entry.id,
      order: entry.order,
      updatedAt: entry.updatedAt,
    }))).toEqual([
      { id: 'content-2', order: 0, updatedAt: '2026-05-28T12:00:00.000Z' },
      { id: 'content-1', order: 1, updatedAt: '2026-05-28T12:00:00.000Z' },
      { id: 'content-3', order: 2, updatedAt: '2026-05-28T10:00:00.000Z' },
    ])
  })

  it('moves an entry down and normalizes order', () => {
    const entries = [
      createEntry({ id: 'content-1', order: 0 }),
      createEntry({ id: 'content-2', order: 1 }),
      createEntry({ id: 'content-3', order: 2 }),
    ]

    expect(moveContentEntry(entries, {
      entryId: 'content-2',
      direction: 'down',
      now: '2026-05-28T12:00:00.000Z',
    }).map(entry => ({
      id: entry.id,
      order: entry.order,
    }))).toEqual([
      { id: 'content-1', order: 0 },
      { id: 'content-3', order: 1 },
      { id: 'content-2', order: 2 },
    ])
  })

  it('keeps boundary moves unchanged', () => {
    const entries = [
      createEntry({ id: 'content-1', order: 0 }),
      createEntry({ id: 'content-2', order: 1 }),
    ]

    expect(moveContentEntry(entries, {
      entryId: 'content-1',
      direction: 'up',
      now: '2026-05-28T12:00:00.000Z',
    }).map(entry => ({
      id: entry.id,
      order: entry.order,
      updatedAt: entry.updatedAt,
    }))).toEqual([
      { id: 'content-1', order: 0, updatedAt: '2026-05-28T10:00:00.000Z' },
      { id: 'content-2', order: 1, updatedAt: '2026-05-28T10:00:00.000Z' },
    ])
  })

  it('filters and sorts entries by workspace', () => {
    const entries = [
      createEntry({ id: 'content-3', workspaceId: 'workspace-story', order: 2 }),
      createEntry({ id: 'content-other', workspaceId: 'workspace-other', order: 0 }),
      createEntry({ id: 'content-1', workspaceId: 'workspace-story', order: 0 }),
    ]

    expect(getContentEntriesByWorkspace(entries, 'workspace-story').map(entry => entry.id)).toEqual([
      'content-1',
      'content-3',
    ])
  })

  it('assigns one outline beat to one content entry', () => {
    const entries = [
      createEntry({ id: 'content-1', outlineBeatId: 'beat-old' }),
      createEntry({ id: 'content-2', outlineBeatId: 'beat-target' }),
      createEntry({ id: 'content-3' }),
    ]

    const nextEntries = assignOutlineBeatToContentEntry(entries, {
      entryId: 'content-1',
      outlineBeatId: 'beat-target',
      now: '2026-05-28T11:00:00.000Z',
    })

    expect(nextEntries.map(entry => ({
      id: entry.id,
      outlineBeatId: entry.outlineBeatId,
      updatedAt: entry.updatedAt,
    }))).toEqual([
      { id: 'content-1', outlineBeatId: 'beat-target', updatedAt: '2026-05-28T11:00:00.000Z' },
      { id: 'content-2', outlineBeatId: undefined, updatedAt: '2026-05-28T10:00:00.000Z' },
      { id: 'content-3', outlineBeatId: undefined, updatedAt: '2026-05-28T10:00:00.000Z' },
    ])
  })

  it('clears an outline beat assignment from a content entry', () => {
    const entries = [
      createEntry({ id: 'content-1', outlineBeatId: 'beat-old' }),
      createEntry({ id: 'content-2', outlineBeatId: 'beat-target' }),
    ]

    const nextEntries = assignOutlineBeatToContentEntry(entries, {
      entryId: 'content-1',
      outlineBeatId: '',
      now: '2026-05-28T11:00:00.000Z',
    })

    expect(nextEntries.map(entry => ({
      id: entry.id,
      outlineBeatId: entry.outlineBeatId,
      updatedAt: entry.updatedAt,
    }))).toEqual([
      { id: 'content-1', outlineBeatId: undefined, updatedAt: '2026-05-28T11:00:00.000Z' },
      { id: 'content-2', outlineBeatId: 'beat-target', updatedAt: '2026-05-28T10:00:00.000Z' },
    ])
  })
})

function createEntry(input: Partial<WorkspaceContentEntry>): WorkspaceContentEntry {
  return {
    id: input.id ?? 'content-1',
    workspaceId: input.workspaceId ?? 'workspace-story',
    outlineBeatId: input.outlineBeatId,
    volume: input.volume ?? '第一卷',
    chapter: input.chapter ?? '第一章',
    body: input.body ?? '',
    order: input.order ?? 0,
    createdAt: input.createdAt ?? '2026-05-28T10:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-05-28T10:00:00.000Z',
  }
}
