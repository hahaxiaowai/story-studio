import type { StudioDataDocument } from '@story-studio/types'

export type WorkspaceIntegrityIssueSeverity = 'error' | 'warning'

export type WorkspaceIntegrityIssueKind = 'missing-outline-beat' | 'missing-material' | 'duplicate-content-order'

export interface WorkspaceIntegrityIssue {
  id: string
  kind: WorkspaceIntegrityIssueKind
  severity: WorkspaceIntegrityIssueSeverity
  title: string
  description: string
  sourceLabel: string
  targetHash: string
}

export interface WorkspaceIntegrityReport {
  issues: WorkspaceIntegrityIssue[]
  issueCount: number
  errorCount: number
  warningCount: number
  passed: boolean
}

export function getWorkspaceIntegrityReport(document: StudioDataDocument, workspaceId: string): WorkspaceIntegrityReport {
  const issues = [
    ...getMissingOutlineBeatIssues(document, workspaceId),
    ...getMissingMaterialIssues(document, workspaceId),
    ...getDuplicateContentOrderIssues(document, workspaceId),
  ]
  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.filter(issue => issue.severity === 'warning').length

  return {
    issues,
    issueCount: issues.length,
    errorCount,
    warningCount,
    passed: issues.length === 0,
  }
}

function getMissingOutlineBeatIssues(document: StudioDataDocument, workspaceId: string): WorkspaceIntegrityIssue[] {
  const workspaceBeatIds = new Set(
    document.outlines
      .filter(outline => outline.workspaceId === workspaceId)
      .flatMap(outline => outline.beats.map(beat => beat.id)),
  )

  return document.contents
    .filter(entry => entry.workspaceId === workspaceId && entry.outlineBeatId && !workspaceBeatIds.has(entry.outlineBeatId))
    .map(entry => ({
      id: `content:${entry.id}:missing-outline-beat`,
      kind: 'missing-outline-beat',
      severity: 'error',
      title: '正文关联的情节点不存在',
      description: `章节关联了不存在的情节点：${entry.outlineBeatId}`,
      sourceLabel: getContentEntryLabel(entry.volume, entry.chapter),
      targetHash: '#content',
    }))
}

function getMissingMaterialIssues(document: StudioDataDocument, workspaceId: string): WorkspaceIntegrityIssue[] {
  const materialIds = new Set(document.materials.map(material => material.id))

  return document.materialRefs
    .filter(materialRef => materialRef.workspaceId === workspaceId && !materialIds.has(materialRef.materialId))
    .map(materialRef => ({
      id: `material-ref:${materialRef.id}:missing-material`,
      kind: 'missing-material',
      severity: 'warning',
      title: '素材引用缺少素材记录',
      description: `素材引用指向了不存在的素材：${materialRef.materialId}`,
      sourceLabel: materialRef.materialId,
      targetHash: '#materials',
    }))
}

function getDuplicateContentOrderIssues(document: StudioDataDocument, workspaceId: string): WorkspaceIntegrityIssue[] {
  const entriesByOrder = new Map<number, StudioDataDocument['contents']>()

  for (const entry of document.contents.filter(entry => entry.workspaceId === workspaceId)) {
    const entries = entriesByOrder.get(entry.order) ?? []
    entries.push(entry)
    entriesByOrder.set(entry.order, entries)
  }

  return Array.from(entriesByOrder.entries())
    .filter(([, entries]) => entries.length > 1)
    .map(([order, entries]) => ({
      id: `${workspaceId}:duplicate-content-order:${order}`,
      kind: 'duplicate-content-order',
      severity: 'warning',
      title: '章节排序值重复',
      description: `有 ${entries.length} 个章节使用了同一个排序值：${order}`,
      sourceLabel: entries.map(entry => getContentEntryLabel('', entry.chapter)).join('、'),
      targetHash: '#content',
    }))
}

function getContentEntryLabel(volume: string, chapter: string): string {
  const parts = [volume.trim(), chapter.trim()].filter(Boolean)

  return parts.join(' / ') || '未命名章节'
}
