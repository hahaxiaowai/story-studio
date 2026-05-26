export interface StoryProject {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface StoryChapter {
  id: string
  projectId: string
  title: string
  order: number
}

export interface StoryCharacter {
  id: string
  projectId: string
  name: string
  role?: string
}

export type EntityKind = 'character' | 'outline'

export type PropertyValue = string | number | boolean | string[] | null

export type PropertyValueType = 'text' | 'longText' | 'number' | 'select' | 'multiSelect' | 'boolean' | 'date'

export interface PropertyOption {
  id: string
  label: string
}

export interface PropertyDefinition {
  id: string
  kind: EntityKind
  name: string
  valueType: PropertyValueType
  required: boolean
  options?: PropertyOption[]
  visible: boolean
  order: number
  system: boolean
}

export interface EntityRecord {
  id: string
  workspaceId: string
  kind: EntityKind
  title: string
  values: Record<string, PropertyValue>
  createdAt: string
  updatedAt: string
}

export type WorkspaceModule = 'outline' | 'characters' | 'maps' | 'content'

export type PublicModule = 'materials' | 'assistant'

export interface WorkspaceModuleCounts {
  outline: number
  characters: number
  maps: number
  content: number
}

export interface Workspace {
  id: string
  title: string
  description?: string
  status: 'draft' | 'archived'
  moduleCounts: WorkspaceModuleCounts
  createdAt: string
  updatedAt: string
}

export interface MaterialAsset {
  id: string
  title: string
  kind: 'image' | 'document' | 'note' | 'reference'
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMaterialRef {
  id: string
  workspaceId: string
  materialId: string
  module?: WorkspaceModule
  createdAt: string
}

export type StudioDataSchemaVersion = 2

export interface StudioPreferences {
  locale: 'zh-CN' | 'en-US'
  themeMode: 'light' | 'dark'
}

export interface StudioDataDocument {
  schemaVersion: StudioDataSchemaVersion
  preferences: StudioPreferences
  workspaces: Workspace[]
  activeWorkspaceId: string
  propertyDefinitions: PropertyDefinition[]
  entityRecords: EntityRecord[]
  materials: MaterialAsset[]
  materialRefs: WorkspaceMaterialRef[]
  createdAt: string
  updatedAt: string
}
