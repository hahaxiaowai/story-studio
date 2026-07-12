import type {
  StudioDataBackupError,
} from './backup'
import { describe, expect, it } from 'vitest'
import {
  createStudioDataBackup,
  parseStudioDataBackup,
  summarizeStudioDataBackup,
} from './backup'
import {
  createDefaultStudioDataDocument,
  STUDIO_DATA_SCHEMA_VERSION,
} from './document'

describe('studio data backup', () => {
  it('creates a formatted backup without mutating the source document', () => {
    const document = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
    document.contents.push({
      id: 'content-1',
      workspaceId: document.activeWorkspaceId,
      volume: '第一卷',
      chapter: '第一章',
      fineOutline: '',
      body: '正文',
      order: 0,
      createdAt: '2026-07-12T08:00:00.000Z',
      updatedAt: '2026-07-12T08:00:00.000Z',
    })
    const sourceBeforeExport = structuredClone(document)

    const backup = createStudioDataBackup(document, new Date('2026-07-12T09:08:07.000Z'))

    expect(backup.fileName).toBe('story-studio-backup-2026-07-12-090807.json')
    expect(backup.mimeType).toBe('application/json')
    expect(backup.content).toBe(`${JSON.stringify(document, null, 2)}\n`)
    expect(document).toEqual(sourceBeforeExport)
    expect(summarizeStudioDataBackup(document)).toEqual({
      updatedAt: '2026-07-12T08:00:00.000Z',
      workspaceCount: document.workspaces.length,
      contentCount: 1,
      materialCount: 0,
      assistantThreadCount: 0,
    })
  })

  it('parses and migrates a supported Story Studio backup', () => {
    const source = createDefaultStudioDataDocument()
    const legacy = {
      ...source,
      schemaVersion: 12,
      contents: undefined,
    }

    const restored = parseStudioDataBackup(JSON.stringify(legacy))

    expect(restored.schemaVersion).toBe(STUDIO_DATA_SCHEMA_VERSION)
    expect(restored.contents).toEqual([])
  })

  it('rejects a resolved document whose active workspace is missing', () => {
    const document = createDefaultStudioDataDocument()
    document.workspaces = []

    expect(() => parseStudioDataBackup(JSON.stringify(document))).toThrowError(
      expect.objectContaining<Partial<StudioDataBackupError>>({ code: 'invalid-document' }),
    )
  })

  it.each([
    ['invalid-json', '{'],
    ['invalid-document', JSON.stringify([])],
    ['invalid-document', JSON.stringify({ schemaVersion: 13, workspaces: [] })],
    ['invalid-document', JSON.stringify({ schemaVersion: 13, workspaces: [], activeWorkspaceId: '' })],
    ['invalid-document', JSON.stringify({ schemaVersion: 13, workspaces: [{}], activeWorkspaceId: 'missing' })],
    ['schema-too-old', JSON.stringify({ schemaVersion: 2, workspaces: [], activeWorkspaceId: '' })],
    ['schema-too-new', JSON.stringify({ schemaVersion: 14, workspaces: [], activeWorkspaceId: '' })],
  ] as const)('rejects %s backups without creating default data', (code, source) => {
    expect(() => parseStudioDataBackup(source)).toThrowError(
      expect.objectContaining<Partial<StudioDataBackupError>>({ code }),
    )
  })
})
