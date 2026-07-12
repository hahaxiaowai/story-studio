import type { StudioDataDocument } from '@story-studio/types'
import {
  resolveStudioDataDocument,
  STUDIO_DATA_SCHEMA_VERSION,
} from './document'

export type StudioDataBackupErrorCode
  = | 'invalid-json'
    | 'invalid-document'
    | 'schema-too-old'
    | 'schema-too-new'

export interface StudioDataBackupFile {
  fileName: string
  mimeType: 'application/json'
  content: string
}

export interface StudioDataBackupSummary {
  updatedAt: string
  workspaceCount: number
  contentCount: number
  materialCount: number
  assistantThreadCount: number
}

export class StudioDataBackupError extends Error {
  constructor(public readonly code: StudioDataBackupErrorCode) {
    super(code)
    this.name = 'StudioDataBackupError'
  }
}

export function createStudioDataBackup(
  document: StudioDataDocument,
  now = new Date(),
): StudioDataBackupFile {
  return {
    fileName: `story-studio-backup-${formatBackupTimestamp(now)}.json`,
    mimeType: 'application/json',
    content: `${JSON.stringify(document, null, 2)}\n`,
  }
}

export function parseStudioDataBackup(source: string): StudioDataDocument {
  let candidate: unknown

  try {
    candidate = JSON.parse(source)
  }
  catch {
    throw new StudioDataBackupError('invalid-json')
  }

  assertStudioDataBackupCandidate(candidate)

  if (candidate.schemaVersion < 3)
    throw new StudioDataBackupError('schema-too-old')

  if (candidate.schemaVersion > STUDIO_DATA_SCHEMA_VERSION)
    throw new StudioDataBackupError('schema-too-new')

  let resolvedDocument: StudioDataDocument

  try {
    resolvedDocument = resolveStudioDataDocument(candidate as StudioDataDocument)
  }
  catch {
    throw new StudioDataBackupError('invalid-document')
  }

  assertResolvedStudioDataDocument(resolvedDocument)

  return resolvedDocument
}

export function summarizeStudioDataBackup(document: StudioDataDocument): StudioDataBackupSummary {
  return {
    updatedAt: document.updatedAt,
    workspaceCount: document.workspaces.length,
    contentCount: document.contents.length,
    materialCount: document.materials.length,
    assistantThreadCount: document.assistantChatThreads.length,
  }
}

function assertStudioDataBackupCandidate(candidate: unknown): asserts candidate is {
  schemaVersion: number
  workspaces: unknown[]
  activeWorkspaceId: string
} {
  if (
    !candidate
    || typeof candidate !== 'object'
    || Array.isArray(candidate)
    || typeof Reflect.get(candidate, 'schemaVersion') !== 'number'
    || !Array.isArray(Reflect.get(candidate, 'workspaces'))
    || typeof Reflect.get(candidate, 'activeWorkspaceId') !== 'string'
  ) {
    throw new StudioDataBackupError('invalid-document')
  }
}

function assertResolvedStudioDataDocument(document: StudioDataDocument): void {
  const arrayKeys = [
    'workspaces',
    'propertyDefinitions',
    'entityRecords',
    'outlines',
    'worlds',
    'contents',
    'materials',
    'materialTags',
    'materialRefs',
    'assistantChatThreads',
  ] as const
  const hasRequiredArrays = arrayKeys.every(key => Array.isArray(document[key]))
  const hasRequiredObjects = document.preferences
    && typeof document.preferences === 'object'
    && document.assistantSettings
    && typeof document.assistantSettings === 'object'
  const hasRequiredMetadata = document.schemaVersion === STUDIO_DATA_SCHEMA_VERSION
    && typeof document.activeWorkspaceId === 'string'
    && document.workspaces.some(workspace => workspace.id === document.activeWorkspaceId)
    && typeof document.createdAt === 'string'
    && typeof document.updatedAt === 'string'

  if (!hasRequiredArrays || !hasRequiredObjects || !hasRequiredMetadata)
    throw new StudioDataBackupError('invalid-document')
}

function formatBackupTimestamp(date: Date): string {
  const datePart = [
    date.getUTCFullYear(),
    padTimestampPart(date.getUTCMonth() + 1),
    padTimestampPart(date.getUTCDate()),
  ].join('-')
  const timePart = [
    padTimestampPart(date.getUTCHours()),
    padTimestampPart(date.getUTCMinutes()),
    padTimestampPart(date.getUTCSeconds()),
  ].join('')

  return `${datePart}-${timePart}`
}

function padTimestampPart(value: number): string {
  return String(value).padStart(2, '0')
}
