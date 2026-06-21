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

export type EntityKind = 'character' | 'outline' | 'world-setting'

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

export type PlotLineKind = 'main' | 'branch'

export interface PlotLine {
  id: string
  title: string
  kind: PlotLineKind
  color: string
  order: number
}

export interface OutlineEventTag {
  id: string
  label: string
  color: string
  system: boolean
  order: number
}

export interface BeatEvent {
  id: string
  title: string
  description: string
  tagIds: string[]
}

export type CharacterChangeCategory = 'relationship' | 'personality' | 'depth' | 'state'

export interface CharacterChange {
  id: string
  characterId: string
  category: CharacterChangeCategory
  summary: string
}

export interface TimelineBeat {
  id: string
  title: string
  order: number
  timeLabel: string
  summary: string
  plotLineIds: string[]
  events: BeatEvent[]
  characterChanges: CharacterChange[]
  createdAt: string
  updatedAt: string
}

export interface WorkspaceOutline {
  id: string
  workspaceId: string
  plotLines: PlotLine[]
  eventTags: OutlineEventTag[]
  beats: TimelineBeat[]
  createdAt: string
  updatedAt: string
}

export interface WorldSettingItem {
  id: string
  title: string
  body: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface WorldSettingGroup {
  id: string
  title: string
  description: string
  items: WorldSettingItem[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface WorldMapPoint {
  x: number
  y: number
}

export interface WorldMapStroke {
  id: string
  color: string
  width: number
  points: WorldMapPoint[]
  createdAt: string
}

export interface WorldMap {
  id: string
  title: string
  strokes: WorldMapStroke[]
  createdAt: string
  updatedAt: string
}

export interface WorkspaceWorld {
  id: string
  workspaceId: string
  settingGroups: WorldSettingGroup[]
  maps: WorldMap[]
  activeMapId: string
  createdAt: string
  updatedAt: string
}

export type WorkspaceModule = 'outline' | 'characters' | 'maps' | 'content'

export type PublicModule = 'materials' | 'assistant-chat' | 'assistant'

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
  url: string
  text: string
  imageUrl: string
  tagIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MaterialTag {
  id: string
  name: string
  color: string
  order: number
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

export interface WorkspaceContentEntry {
  id: string
  workspaceId: string
  outlineBeatId?: string
  volume: string
  chapter: string
  body: string
  order: number
  createdAt: string
  updatedAt: string
}

export type AiProviderKind = 'openai-compatible' | 'local-terminal'

export interface AiProviderConfig {
  id: string
  kind: AiProviderKind
  name: string
  baseUrl: string
  apiKey: string
  model: string
  terminalCommand: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type AssistantFeatureKey = 'outline' | 'characters' | 'world' | 'content' | 'materials'

export interface AssistantFeatureBinding {
  feature: AssistantFeatureKey
  providerId: string
  model: string
}

export interface AssistantStoryStyle {
  id: string
  name: string
  description: string
  constraints: string
  system: boolean
  createdAt: string
  updatedAt: string
}

export interface AssistantSettings {
  defaultProviderId: string
  defaultModel: string
  defaultStoryStyleId: string
  providers: AiProviderConfig[]
  featureBindings: AssistantFeatureBinding[]
  storyStyles: AssistantStoryStyle[]
}

export type AssistantChatMessageRole = 'user' | 'assistant' | 'system'

export type AssistantChatMessageStatus = 'complete' | 'streaming' | 'error'

export interface AssistantChatMessage {
  id: string
  role: AssistantChatMessageRole
  content: string
  status: AssistantChatMessageStatus
  sourceContentEntryId?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export interface AssistantChatThread {
  id: string
  workspaceId: string
  title: string
  providerId: string
  model: string
  messages: AssistantChatMessage[]
  createdAt: string
  updatedAt: string
}

export type StudioDataSchemaVersion = 12

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
  outlines: WorkspaceOutline[]
  worlds: WorkspaceWorld[]
  contents: WorkspaceContentEntry[]
  materials: MaterialAsset[]
  materialTags: MaterialTag[]
  materialRefs: WorkspaceMaterialRef[]
  assistantSettings: AssistantSettings
  assistantChatThreads: AssistantChatThread[]
  createdAt: string
  updatedAt: string
}
