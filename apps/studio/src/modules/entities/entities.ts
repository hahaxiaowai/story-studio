import type { EntityKind, EntityRecord, PropertyDefinition, PropertyValue } from '@story-studio/types'
import { getDefaultValue, getPropertiesByKind, normalizePropertyValue } from '../properties/properties'

export interface CreateEntityRecordInput {
  workspaceId: string
  kind: EntityKind
  properties: PropertyDefinition[]
  now: string
}

export interface UpdateEntityRecordInput {
  values: Record<string, unknown>
  now: string
}

export function createEntityRecord(input: CreateEntityRecordInput): EntityRecord {
  const properties = getPropertiesByKind(input.properties, input.kind)
  const values = Object.fromEntries(properties.map(property => [property.id, getDefaultValue(property)])) as Record<string, PropertyValue>
  const titleProperty = getTitleProperty(properties, input.kind)
  const title = getDefaultTitle(input.kind)

  if (titleProperty)
    values[titleProperty.id] = title

  return {
    id: createEntityId(input.kind, input.now),
    workspaceId: input.workspaceId,
    kind: input.kind,
    title,
    values,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function getRecordsByWorkspaceAndKind(
  records: EntityRecord[],
  workspaceId: string,
  kind: EntityKind,
): EntityRecord[] {
  return records.filter(record => record.workspaceId === workspaceId && record.kind === kind)
}

export function updateEntityRecord(
  record: EntityRecord,
  properties: PropertyDefinition[],
  input: UpdateEntityRecordInput,
): EntityRecord {
  const propertyById = new Map(getPropertiesByKind(properties, record.kind).map(property => [property.id, property]))
  const values = { ...record.values }

  for (const [propertyId, value] of Object.entries(input.values)) {
    const property = propertyById.get(propertyId)

    if (property)
      values[propertyId] = normalizePropertyValue(property, value)
  }

  return {
    ...record,
    title: getEntityTitle({ ...record, values }, properties),
    values,
    updatedAt: input.now,
  }
}

export function getEntityTitle(record: EntityRecord, properties: PropertyDefinition[]): string {
  const property = getTitleProperty(getPropertiesByKind(properties, record.kind), record.kind)
  const titleValue = property ? record.values[property.id] : undefined

  return typeof titleValue === 'string' && titleValue.trim() ? titleValue.trim() : record.title
}

export function getTitleProperty(properties: PropertyDefinition[], kind: EntityKind): PropertyDefinition | undefined {
  const titlePropertyId = kind === 'character' ? 'character-name' : 'outline-title'

  return properties.find(property => property.id === titlePropertyId)
}

function getDefaultTitle(kind: EntityKind): string {
  if (kind === 'character')
    return '新人物'

  return '新大纲'
}

function createEntityId(kind: EntityKind, now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `${kind}-${stamp}-${randomSegment}`
}
