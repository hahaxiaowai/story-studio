import type { EntityRecord, MaterialAsset, MaterialTag, PropertyDefinition, StudioDataDocument, StudioPreferences, WorkspaceContentEntry, WorkspaceWorld, WorldSettingGroup } from '@story-studio/types'
import { defaultPropertyDefinitions } from '../properties/properties'
import { seedWorkspaces } from '../workspaces/workspaces'
import { createWorkspaceWorld } from '../worlds/world'
import { createDefaultEntityRecords, createDefaultOutlines, createDefaultWorlds, isLegacyPrototypeSeedDocument } from './defaultContent'

export const STUDIO_DATA_SCHEMA_VERSION = 6

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
  }
  const outlines = sourceDocument.outlines ?? []
  const worlds = sourceDocument.worlds ?? sourceDocument.workspaces.map(workspace => createWorkspaceWorld(workspace.id, sourceDocument.updatedAt))
  const contents = normalizeContentEntries(sourceDocument.contents ?? [])
  const materials = normalizeMaterials(sourceDocument.materials ?? [])
  const materialTags = normalizeMaterialTags(sourceDocument.materialTags ?? [])
  const propertyDefinitions = mergeDefaultPropertyDefinitions(sourceDocument.propertyDefinitions ?? [])
  const entityRecords = migrateWorldSettingRecords(sourceDocument.entityRecords ?? [], worlds)

  return {
    ...sourceDocument,
    schemaVersion: STUDIO_DATA_SCHEMA_VERSION,
    workspaces: sourceDocument.workspaces.map(workspace => ({
      ...workspace,
      moduleCounts: {
        outline: workspace.moduleCounts.outline,
        characters: workspace.moduleCounts.characters,
        maps: workspace.moduleCounts.maps,
        content: contents.filter(entry => entry.workspaceId === workspace.id).length,
      },
    })),
    propertyDefinitions: propertyDefinitions.filter(property => String(property.kind) !== 'task' && String(property.kind) !== 'outline'),
    entityRecords: entityRecords.filter(record => String(record.kind) !== 'task' && String(record.kind) !== 'outline'),
    outlines,
    worlds,
    contents,
    materials,
    materialTags,
    materialRefs: sourceDocument.materialRefs ?? [],
  }
}

function normalizeContentEntries(contents: WorkspaceContentEntry[]): WorkspaceContentEntry[] {
  return contents.map((entry, index) => ({
    ...entry,
    volume: entry.volume ?? '',
    chapter: entry.chapter ?? '',
    body: entry.body ?? '',
    order: Number.isFinite(entry.order) ? entry.order : index,
  }))
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
