import type { StudioDataDocument, StudioPreferences } from '@story-studio/types'
import { defaultPropertyDefinitions } from '../properties/properties'
import { seedWorkspaces } from '../workspaces/workspaces'
import { createWorkspaceWorld } from '../worlds/world'
import { createDefaultEntityRecords, createDefaultOutlines, createDefaultWorlds, isLegacyPrototypeSeedDocument } from './defaultContent'

export const STUDIO_DATA_SCHEMA_VERSION = 4

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
    materials: [],
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
  }
  const propertyDefinitions = sourceDocument.propertyDefinitions ?? [...defaultPropertyDefinitions]
  const entityRecords = sourceDocument.entityRecords ?? []
  const outlines = sourceDocument.outlines ?? []
  const worlds = sourceDocument.worlds ?? sourceDocument.workspaces.map(workspace => createWorkspaceWorld(workspace.id, sourceDocument.updatedAt))

  return {
    ...sourceDocument,
    schemaVersion: STUDIO_DATA_SCHEMA_VERSION,
    workspaces: sourceDocument.workspaces.map(workspace => ({
      ...workspace,
      moduleCounts: {
        outline: workspace.moduleCounts.outline,
        characters: workspace.moduleCounts.characters,
        maps: workspace.moduleCounts.maps,
        content: workspace.moduleCounts.content,
      },
    })),
    propertyDefinitions: propertyDefinitions.filter(property => String(property.kind) !== 'task' && String(property.kind) !== 'outline'),
    entityRecords: entityRecords.filter(record => String(record.kind) !== 'task' && String(record.kind) !== 'outline'),
    outlines,
    worlds,
  }
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
