import type { AssistantChatMessage, AssistantChatThread, EntityRecord, MaterialAsset, MaterialTag, PropertyDefinition, StudioDataDocument, StudioPreferences, WorkspaceContentEntry, WorkspaceOutline, WorkspaceWorld, WorldSettingGroup } from '@story-studio/types'
import { createAssistantSettings, normalizeAssistantSettings, updateDefaultAssistantStoryStyle } from '../assistant/assistant'
import { defaultPropertyDefinitions } from '../properties/properties'
import { seedWorkspaces } from '../workspaces/workspaces'
import { createWorkspaceWorld } from '../worlds/world'
import { createDefaultEntityRecords, createDefaultOutlines, createDefaultWorlds, isLegacyPrototypeSeedDocument } from './defaultContent'

export const STUDIO_DATA_SCHEMA_VERSION = 13

export const LEGACY_LOCALE_STORAGE_KEY = 'story-studio:locale'
export const LEGACY_THEME_MODE_STORAGE_KEY = 'story-studio:theme-mode'

const DEFAULT_PREFERENCES: StudioPreferences = {
  locale: 'zh-CN',
  themeMode: 'light',
}

export function createDefaultStudioDataDocument(now = new Date().toISOString()): StudioDataDocument {
  return {
    schemaVersion: STUDIO_DATA_SCHEMA_VERSION,
    preferences: { ...DEFAULT_PREFERENCES },
    workspaces: [...seedWorkspaces],
    activeWorkspaceId: seedWorkspaces[0]?.id ?? '',
    propertyDefinitions: [...defaultPropertyDefinitions],
    entityRecords: createDefaultEntityRecords(now),
    outlines: createDefaultOutlines(now),
    worlds: createDefaultWorlds(now),
    contents: [],
    materials: [],
    materialTags: [],
    materialRefs: [],
    assistantSettings: createAssistantSettings(),
    assistantChatThreads: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function mergeLegacyPreferences(document: StudioDataDocument): StudioDataDocument {
  return {
    ...document,
    preferences: {
      locale: readLegacyLocale() ?? document.preferences.locale,
      themeMode: readLegacyThemeMode() ?? document.preferences.themeMode,
    },
  }
}

export function resolveStudioDataDocument(document: StudioDataDocument | undefined): StudioDataDocument {
  if (!document)
    return mergeLegacyPreferences(createDefaultStudioDataDocument())

  if (isLegacyPrototypeSeedDocument(document))
    return createDefaultStudioDataDocument()

  const schemaVersion = Number((document as StudioDataDocument & { schemaVersion?: number }).schemaVersion ?? 0)

  if (schemaVersion < 3)
    return mergeLegacyPreferences(createDefaultStudioDataDocument())

  return migrateStudioDataDocument(document)
}

function migrateStudioDataDocument(document: StudioDataDocument): StudioDataDocument {
  const sourceDocument = document as StudioDataDocument & {
    schemaVersion?: number
    propertyDefinitions?: StudioDataDocument['propertyDefinitions']
    entityRecords?: StudioDataDocument['entityRecords']
    outlines?: StudioDataDocument['outlines']
    worlds?: StudioDataDocument['worlds']
    contents?: StudioDataDocument['contents']
    materials?: StudioDataDocument['materials']
    materialTags?: StudioDataDocument['materialTags']
    materialRefs?: StudioDataDocument['materialRefs']
    assistantSettings?: StudioDataDocument['assistantSettings']
    assistantChatThreads?: StudioDataDocument['assistantChatThreads']
  }
  const outlines = sourceDocument.outlines ?? []
  const worlds = sourceDocument.worlds ?? sourceDocument.workspaces.map(workspace => createWorkspaceWorld(workspace.id, sourceDocument.updatedAt))
  const contents = normalizeContentEntries(sourceDocument.contents ?? [], outlines)
  const materials = normalizeMaterials(sourceDocument.materials ?? [])
  const materialTags = normalizeMaterialTags(sourceDocument.materialTags ?? [])
  const normalizedAssistantSettings = normalizeAssistantSettings(sourceDocument.assistantSettings)
  const storyStyleIds = new Set(normalizedAssistantSettings.storyStyles.map(style => style.id))
  const assistantSettings = resolveMigratedAssistantSettings(sourceDocument, normalizedAssistantSettings, storyStyleIds)
  const workspaceIds = new Set(sourceDocument.workspaces.map(workspace => workspace.id))
  const assistantChatThreads = normalizeAssistantChatThreads(sourceDocument.assistantChatThreads ?? [], workspaceIds, sourceDocument.updatedAt)
  const propertyDefinitions = mergeDefaultPropertyDefinitions(sourceDocument.propertyDefinitions ?? [])
  const entityRecords = migrateWorldSettingRecords(sourceDocument.entityRecords ?? [], worlds)

  return {
    ...sourceDocument,
    schemaVersion: STUDIO_DATA_SCHEMA_VERSION,
    workspaces: sourceDocument.workspaces.map(workspace => normalizeWorkspace(workspace, contents, entityRecords)),
    propertyDefinitions: propertyDefinitions.filter(property => String(property.kind) !== 'task' && String(property.kind) !== 'outline'),
    entityRecords: entityRecords.filter(record => String(record.kind) !== 'task' && String(record.kind) !== 'outline'),
    outlines,
    worlds,
    contents,
    materials,
    materialTags,
    materialRefs: sourceDocument.materialRefs ?? [],
    assistantSettings,
    assistantChatThreads,
  }
}

function normalizeWorkspace(
  workspace: StudioDataDocument['workspaces'][number],
  contents: WorkspaceContentEntry[],
  entityRecords: EntityRecord[],
): StudioDataDocument['workspaces'][number] {
  const { storyStyleId: _legacyStoryStyleId, ...workspaceWithoutStoryStyle } = workspace as StudioDataDocument['workspaces'][number] & {
    storyStyleId?: string
  }

  return {
    ...workspaceWithoutStoryStyle,
    moduleCounts: {
      outline: workspace.moduleCounts.outline,
      characters: entityRecords.filter(record => record.workspaceId === workspace.id && record.kind === 'character').length,
      maps: workspace.moduleCounts.maps,
      content: contents.filter(entry => entry.workspaceId === workspace.id).length,
    },
  }
}

function resolveMigratedAssistantSettings(
  document: StudioDataDocument,
  assistantSettings: StudioDataDocument['assistantSettings'],
  storyStyleIds: Set<string>,
): StudioDataDocument['assistantSettings'] {
  const sourceSettings = document.assistantSettings as StudioDataDocument['assistantSettings'] & {
    defaultStoryStyleId?: string
  } | undefined
  const sourceDefaultStoryStyleId = normalizeStorageText(sourceSettings?.defaultStoryStyleId)
  const sourceSchemaVersion = Number((document as StudioDataDocument & { schemaVersion?: number }).schemaVersion ?? 0)
  const workspaceStoryStyleId = findFirstWorkspaceStoryStyleId(document.workspaces, storyStyleIds)

  if (sourceSchemaVersion < STUDIO_DATA_SCHEMA_VERSION && workspaceStoryStyleId) {
    return updateDefaultAssistantStoryStyle(assistantSettings, {
      defaultStoryStyleId: workspaceStoryStyleId,
    })
  }

  if (storyStyleIds.has(sourceDefaultStoryStyleId))
    return assistantSettings

  if (!workspaceStoryStyleId)
    return assistantSettings

  return updateDefaultAssistantStoryStyle(assistantSettings, {
    defaultStoryStyleId: workspaceStoryStyleId,
  })
}

function findFirstWorkspaceStoryStyleId(
  workspaces: StudioDataDocument['workspaces'],
  storyStyleIds: Set<string>,
): string {
  for (const workspace of workspaces) {
    const legacyWorkspace = workspace as StudioDataDocument['workspaces'][number] & {
      storyStyleId?: string
    }
    const storyStyleId = normalizeStorageText(legacyWorkspace.storyStyleId)

    if (storyStyleIds.has(storyStyleId))
      return storyStyleId
  }

  return ''
}

function normalizeAssistantChatThreads(threads: AssistantChatThread[], workspaceIds: Set<string>, fallbackUpdatedAt: string): AssistantChatThread[] {
  return threads
    .filter(thread => workspaceIds.has(thread.workspaceId))
    .map(thread => ({
      id: normalizeStorageText(thread.id),
      workspaceId: thread.workspaceId,
      title: normalizeStorageText(thread.title) || '新对话',
      providerId: normalizeStorageText(thread.providerId),
      model: normalizeStorageText(thread.model),
      messages: Array.isArray(thread.messages)
        ? thread.messages.map(message => normalizeAssistantChatMessage(message, fallbackUpdatedAt))
        : [],
      createdAt: thread.createdAt || fallbackUpdatedAt,
      updatedAt: thread.updatedAt || fallbackUpdatedAt,
    }))
    .filter(thread => thread.id)
}

function normalizeAssistantChatMessage(message: AssistantChatMessage, fallbackUpdatedAt: string): AssistantChatMessage {
  const role = message.role === 'assistant' || message.role === 'system' ? message.role : 'user'
  const interrupted = message.status === 'streaming'
  const status = interrupted
    ? 'error'
    : message.status === 'error'
      ? 'error'
      : 'complete'
  const sourceContentEntryId = normalizeStorageText(message.sourceContentEntryId)

  return {
    id: normalizeStorageText(message.id),
    role,
    content: normalizeStorageText(message.content),
    status,
    ...(sourceContentEntryId ? { sourceContentEntryId } : {}),
    ...(status === 'error' ? { error: normalizeStorageText(message.error) || (interrupted ? '上次生成已中断。' : '') } : {}),
    createdAt: message.createdAt || fallbackUpdatedAt,
    updatedAt: message.updatedAt || fallbackUpdatedAt,
  }
}

function normalizeStorageText(value: string | undefined): string {
  return value?.trim() ?? ''
}

function normalizeContentEntries(contents: WorkspaceContentEntry[], outlines: WorkspaceOutline[]): WorkspaceContentEntry[] {
  const beatWorkspaceById = new Map<string, string>()

  for (const outline of outlines) {
    for (const beat of outline.beats)
      beatWorkspaceById.set(beat.id, outline.workspaceId)
  }

  return contents.map((entry, index) => ({
    ...entry,
    outlineBeatId: normalizeContentOutlineBeatId(entry, beatWorkspaceById),
    volume: entry.volume ?? '',
    chapter: entry.chapter ?? '',
    fineOutline: normalizeStorageText((entry as WorkspaceContentEntry & { fineOutline?: string }).fineOutline),
    body: entry.body ?? '',
    order: Number.isFinite(entry.order) ? entry.order : index,
  }))
}

function normalizeContentOutlineBeatId(entry: WorkspaceContentEntry, beatWorkspaceById: Map<string, string>): string | undefined {
  const outlineBeatId = normalizeStorageText(entry.outlineBeatId)

  if (!outlineBeatId)
    return undefined

  return beatWorkspaceById.get(outlineBeatId) === entry.workspaceId ? outlineBeatId : undefined
}

function normalizeMaterials(materials: MaterialAsset[]): MaterialAsset[] {
  return materials.map((material) => {
    const legacyMaterial = material as MaterialAsset & {
      kind?: string
      url?: string
      text?: string
      imageUrl?: string
      tagIds?: string[]
    }

    return {
      id: material.id,
      title: material.title,
      url: legacyMaterial.url ?? '',
      text: legacyMaterial.text ?? '',
      imageUrl: legacyMaterial.imageUrl ?? '',
      tagIds: Array.isArray(legacyMaterial.tagIds) ? legacyMaterial.tagIds : [],
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    }
  })
}

function normalizeMaterialTags(tags: MaterialTag[]): MaterialTag[] {
  return tags.map((tag, index) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color || '#64748b',
    order: Number.isFinite(tag.order) ? tag.order : index,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }))
}

function mergeDefaultPropertyDefinitions(properties: PropertyDefinition[]): PropertyDefinition[] {
  const propertyIds = new Set(properties.map(property => property.id))

  return [
    ...properties,
    ...defaultPropertyDefinitions.filter(property => !propertyIds.has(property.id)),
  ]
}

function migrateWorldSettingRecords(records: EntityRecord[], worlds: WorkspaceWorld[]): EntityRecord[] {
  const nextRecords = [...records]
  const recordIds = new Set(nextRecords.map(record => record.id))
  const workspacesWithWorldSettings = new Set(nextRecords
    .filter(record => String(record.kind) === 'world-setting')
    .map(record => record.workspaceId))

  for (const world of worlds) {
    if (workspacesWithWorldSettings.has(world.workspaceId))
      continue

    for (const group of [...world.settingGroups].sort((left, right) => left.order - right.order)) {
      const items = [...group.items].sort((left, right) => left.order - right.order)

      if (!items.length) {
        nextRecords.push(createWorldSettingRecordFromGroup(world.workspaceId, group, recordIds))
        continue
      }

      for (const item of items) {
        const record = createWorldSettingRecordFromGroup(world.workspaceId, group, recordIds, {
          id: item.id,
          title: item.title,
          body: item.body,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })

        nextRecords.push(record)
      }
    }
  }

  return nextRecords
}

function createWorldSettingRecordFromGroup(
  workspaceId: string,
  group: WorldSettingGroup,
  recordIds: Set<string>,
  item?: { id: string, title: string, body: string, createdAt: string, updatedAt: string },
): EntityRecord {
  const baseId = item ? item.id.replace(/^setting-item-/, 'world-setting-') : group.id.replace(/^setting-/, 'world-setting-')
  const id = createUniqueRecordId(baseId, recordIds)
  const title = item?.title ?? group.title
  const body = item?.body ?? group.description

  recordIds.add(id)

  return {
    id,
    workspaceId,
    kind: 'world-setting',
    title,
    values: {
      'world-setting-name': title,
      'world-setting-category': inferWorldSettingCategory(group),
      'world-setting-summary': body,
      'world-setting-detail': body,
      'world-setting-links': group.title,
    },
    createdAt: item?.createdAt ?? group.createdAt,
    updatedAt: item?.updatedAt ?? group.updatedAt,
  }
}

function inferWorldSettingCategory(group: WorldSettingGroup): string {
  const value = `${group.id} ${group.title}`

  if (value.includes('地理'))
    return 'geography'

  if (value.includes('势力') || value.includes('阵营'))
    return 'faction'

  if (value.includes('历史'))
    return 'history'

  return 'rule'
}

function createUniqueRecordId(baseId: string, recordIds: Set<string>): string {
  let id = baseId || 'world-setting'
  let index = 2

  while (recordIds.has(id)) {
    id = `${baseId}-${index}`
    index += 1
  }

  return id
}

function readLegacyLocale(): StudioPreferences['locale'] | undefined {
  if (typeof localStorage === 'undefined')
    return undefined

  const locale = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)

  return locale === 'zh-CN' || locale === 'en-US' ? locale : undefined
}

function readLegacyThemeMode(): StudioPreferences['themeMode'] | undefined {
  if (typeof localStorage === 'undefined')
    return undefined

  const themeMode = localStorage.getItem(LEGACY_THEME_MODE_STORAGE_KEY)

  return themeMode === 'light' || themeMode === 'dark' ? themeMode : undefined
}
