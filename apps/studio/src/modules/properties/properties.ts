import type {
  EntityKind,
  PropertyDefinition,
  PropertyValue,
  PropertyValueType,
} from '@story-studio/types'

export const defaultPropertyDefinitions: PropertyDefinition[] = [
  createSystemProperty('character-name', 'character', '姓名', 'text', 0, true),
  createSystemProperty('character-role', 'character', '定位', 'text', 1),
  createSystemProperty('character-faction', 'character', '阵营', 'text', 2),
  createSystemProperty('character-appearance', 'character', '外貌', 'longText', 3),
  createSystemProperty('character-personality', 'character', '性格', 'longText', 4),
  createSystemProperty('character-motivation', 'character', '动机', 'longText', 5),
  createSystemProperty('character-relationship-notes', 'character', '关系备注', 'longText', 6),
  createSystemProperty('outline-title', 'outline', '标题', 'text', 0, true),
  createSystemProperty('outline-stage', 'outline', '阶段', 'select', 1, false, [
    { id: 'setup', label: '开端' },
    { id: 'development', label: '发展' },
    { id: 'turning-point', label: '转折' },
    { id: 'ending', label: '结局' },
  ]),
  createSystemProperty('outline-summary', 'outline', '摘要', 'longText', 2),
  createSystemProperty('outline-conflict', 'outline', '冲突', 'longText', 3),
  createSystemProperty('outline-result', 'outline', '结果', 'longText', 4),
]

export interface CreateCustomPropertyInput {
  kind: EntityKind
  name: string
  valueType: PropertyValueType
}

export function addPropertyOption(
  options: PropertyDefinition['options'] = [],
  label: string,
): PropertyDefinition['options'] {
  const nextLabel = label.trim()

  if (!nextLabel)
    return options

  const baseId = slugify(nextLabel) || 'option'
  const ids = new Set(options.map(option => option.id))
  const duplicateLabelCount = options.filter(option => option.label === nextLabel).length
  let id = duplicateLabelCount > 0 ? `${baseId}-${duplicateLabelCount + 1}` : baseId
  let index = duplicateLabelCount + 2

  while (ids.has(id)) {
    id = `${baseId}-${index}`
    index += 1
  }

  return [
    ...options,
    { id, label: nextLabel },
  ]
}

export function removePropertyOption(
  options: PropertyDefinition['options'] = [],
  optionId: string,
): PropertyDefinition['options'] {
  return options.filter(option => option.id !== optionId)
}

export function getPropertiesByKind(properties: PropertyDefinition[], kind: EntityKind): PropertyDefinition[] {
  return properties
    .filter(property => property.kind === kind)
    .sort((left, right) => left.order - right.order)
}

export function getVisiblePropertiesByKind(properties: PropertyDefinition[], kind: EntityKind): PropertyDefinition[] {
  return getPropertiesByKind(properties, kind).filter(property => property.visible)
}

export function createPropertyDraft(properties: PropertyDefinition[], kind: EntityKind): PropertyDefinition[] {
  return getPropertiesByKind(properties, kind).map(property => ({
    ...property,
    options: property.options?.map(option => ({ ...option })),
  }))
}

export function replacePropertiesByKind(
  properties: PropertyDefinition[],
  kind: EntityKind,
  nextProperties: PropertyDefinition[],
): PropertyDefinition[] {
  return normalizePropertyOrder([
    ...properties.filter(property => property.kind !== kind),
    ...nextProperties.map((property, order) => ({
      ...property,
      kind,
      order,
      options: property.options?.map(option => ({ ...option })),
    })),
  ])
}

export function createCustomProperty(properties: PropertyDefinition[], input: CreateCustomPropertyInput): PropertyDefinition {
  const siblingProperties = getPropertiesByKind(properties, input.kind)
  const baseId = `${input.kind}-${slugify(input.name) || 'field'}`
  const ids = new Set(properties.map(property => property.id))
  let id = baseId
  let index = 2

  while (ids.has(id)) {
    id = `${baseId}-${index}`
    index += 1
  }

  return {
    id,
    kind: input.kind,
    name: input.name.trim() || '新属性',
    valueType: input.valueType,
    required: false,
    visible: true,
    order: siblingProperties.length,
    system: false,
  }
}

export function updateProperty(
  properties: PropertyDefinition[],
  propertyId: string,
  patch: Partial<Omit<PropertyDefinition, 'id' | 'kind' | 'system'>>,
): PropertyDefinition[] {
  return properties.map(property => property.id === propertyId
    ? { ...property, ...patch, name: patch.name?.trim() || property.name }
    : property)
}

export function removeCustomProperty(properties: PropertyDefinition[], propertyId: string): PropertyDefinition[] {
  const property = properties.find(item => item.id === propertyId)

  if (!property || property.system)
    return properties

  return normalizePropertyOrder(properties.filter(item => item.id !== propertyId))
}

export function moveProperty(properties: PropertyDefinition[], propertyId: string, direction: 'up' | 'down'): PropertyDefinition[] {
  const property = properties.find(item => item.id === propertyId)

  if (!property)
    return properties

  const siblings = getPropertiesByKind(properties, property.kind)
  const currentIndex = siblings.findIndex(item => item.id === propertyId)
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (nextIndex < 0 || nextIndex >= siblings.length)
    return properties

  const reordered = [...siblings]
  const [currentProperty] = reordered.splice(currentIndex, 1)
  reordered.splice(nextIndex, 0, currentProperty!)

  const orderById = new Map(reordered.map((item, index) => [item.id, index]))

  return normalizePropertyOrder(properties.map(item => item.kind === property.kind
    ? { ...item, order: orderById.get(item.id) ?? item.order }
    : item))
}

export function reorderProperty(
  properties: PropertyDefinition[],
  propertyId: string,
  targetPropertyId: string,
): PropertyDefinition[] {
  if (propertyId === targetPropertyId)
    return properties

  const property = properties.find(item => item.id === propertyId)
  const targetProperty = properties.find(item => item.id === targetPropertyId)

  if (!property || !targetProperty || property.kind !== targetProperty.kind)
    return properties

  const siblings = getPropertiesByKind(properties, property.kind)
  const currentIndex = siblings.findIndex(item => item.id === propertyId)
  const targetIndex = siblings.findIndex(item => item.id === targetPropertyId)

  if (currentIndex < 0 || targetIndex < 0)
    return properties

  const reordered = [...siblings]
  const [currentProperty] = reordered.splice(currentIndex, 1)
  reordered.splice(targetIndex, 0, currentProperty!)

  const orderById = new Map(reordered.map((item, index) => [item.id, index]))

  return normalizePropertyOrder(properties.map(item => item.kind === property.kind
    ? { ...item, order: orderById.get(item.id) ?? item.order }
    : item))
}

export function normalizePropertyValue(property: PropertyDefinition, value: unknown): PropertyValue {
  if (property.valueType === 'boolean')
    return value === true || value === 'true' || value === 'on'

  if (property.valueType === 'number') {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
  }

  if (property.valueType === 'multiSelect')
    return Array.isArray(value) ? value.map(String) : value ? [String(value)] : []

  return value === null || value === undefined ? '' : String(value)
}

export function getDefaultValue(property: PropertyDefinition): PropertyValue {
  if (property.valueType === 'boolean')
    return false

  if (property.valueType === 'number')
    return null

  if (property.valueType === 'multiSelect')
    return []

  if (property.valueType === 'select')
    return property.options?.[0]?.id ?? ''

  return ''
}

function createSystemProperty(
  id: string,
  kind: EntityKind,
  name: string,
  valueType: PropertyValueType,
  order: number,
  required = false,
  options?: PropertyDefinition['options'],
): PropertyDefinition {
  return {
    id,
    kind,
    name,
    valueType,
    required,
    ...(options ? { options } : {}),
    visible: true,
    order,
    system: true,
  }
}

function normalizePropertyOrder(properties: PropertyDefinition[]): PropertyDefinition[] {
  const nextProperties = [...properties]

  for (const kind of ['character', 'outline'] as const) {
    getPropertiesByKind(nextProperties, kind).forEach((property, index) => {
      property.order = index
    })
  }

  return nextProperties
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
