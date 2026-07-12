import type { StudioDataDocument } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { createDefaultStudioDataDocument } from '../storage/document'
import { getWorkspaceIntegrityReport } from './integrity'

describe('getWorkspaceIntegrityReport', () => {
  it('passes when the current workspace has no integrity issues', () => {
    const document = createDefaultStudioDataDocument()

    const report = getWorkspaceIntegrityReport(document, document.activeWorkspaceId)

    expect(report).toMatchObject({
      passed: true,
      issueCount: 0,
      errorCount: 0,
      warningCount: 0,
      issues: [],
    })
  })

  it('reports content entries linked to missing outline beats', () => {
    const document = createDefaultStudioDataDocument()
    document.contents = [
      createContentEntry({
        id: 'content-1',
        workspaceId: document.activeWorkspaceId,
        outlineBeatId: 'missing-beat',
        volume: '第一卷',
        chapter: '雨夜',
      }),
    ]

    const report = getWorkspaceIntegrityReport(document, document.activeWorkspaceId)

    expect(report.passed).toBe(false)
    expect(report.errorCount).toBe(1)
    expect(report.issues).toContainEqual(expect.objectContaining({
      id: 'content:content-1:missing-outline-beat',
      kind: 'missing-outline-beat',
      severity: 'error',
      sourceLabel: '第一卷 / 雨夜',
      targetHash: '#content',
    }))
  })

  it('reports material references whose material record is missing', () => {
    const document = createDefaultStudioDataDocument()
    document.materialRefs = [
      {
        id: 'material-ref-1',
        workspaceId: document.activeWorkspaceId,
        materialId: 'missing-material',
        module: 'content',
        createdAt: '2026-07-04T00:00:00.000Z',
      },
    ]

    const report = getWorkspaceIntegrityReport(document, document.activeWorkspaceId)

    expect(report.warningCount).toBe(1)
    expect(report.issues).toContainEqual(expect.objectContaining({
      id: 'material-ref:material-ref-1:missing-material',
      kind: 'missing-material',
      severity: 'warning',
      sourceLabel: 'missing-material',
      targetHash: '#materials',
    }))
  })

  it('reports duplicate content order values in the current workspace', () => {
    const document = createDefaultStudioDataDocument()
    document.contents = [
      createContentEntry({ id: 'content-1', workspaceId: document.activeWorkspaceId, chapter: '第一章', order: 1 }),
      createContentEntry({ id: 'content-2', workspaceId: document.activeWorkspaceId, chapter: '第二章', order: 1 }),
      createContentEntry({ id: 'content-other', workspaceId: 'workspace-other', chapter: '其他作品', order: 1 }),
    ]

    const report = getWorkspaceIntegrityReport(document, document.activeWorkspaceId)

    expect(report.warningCount).toBe(1)
    expect(report.issues).toContainEqual(expect.objectContaining({
      id: `${document.activeWorkspaceId}:duplicate-content-order:1`,
      kind: 'duplicate-content-order',
      severity: 'warning',
      sourceLabel: '第一章、第二章',
      targetHash: '#content',
    }))
  })
})

function createContentEntry(input: Partial<StudioDataDocument['contents'][number]>): StudioDataDocument['contents'][number] {
  return {
    id: input.id ?? 'content-1',
    workspaceId: input.workspaceId ?? 'workspace-1',
    outlineBeatId: input.outlineBeatId,
    volume: input.volume ?? '',
    chapter: input.chapter ?? '章节',
    fineOutline: input.fineOutline ?? '',
    body: input.body ?? '',
    aiRevisionHistory: input.aiRevisionHistory ?? [],
    order: input.order ?? 0,
    createdAt: input.createdAt ?? '2026-07-04T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-07-04T00:00:00.000Z',
  }
}
