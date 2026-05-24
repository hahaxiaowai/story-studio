import type { StudioDataDocument, StudioPreferences } from '@story-studio/types'
import { seedWorkspaces } from '../workspaces/workspaces'

export const STUDIO_DATA_SCHEMA_VERSION = 1

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
  return document ?? mergeLegacyPreferences(createDefaultStudioDataDocument())
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
