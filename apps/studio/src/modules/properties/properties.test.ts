import type { PropertyDefinition } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  addPropertyOption,
  createCustomProperty,
  createPropertyDraft,
  defaultPropertyDefinitions,
  getPropertiesByKind,
  moveProperty,
  normalizePropertyValue,
  removePropertyOption,
  reorderProperty,
  replacePropertiesByKind,
  updateProperty,
} from './properties'

describe('properties', () => {
  it('provides stable default properties for each entity kind', () => {
    expect(getPropertiesByKind(defaultPropertyDefinitions, 'character').map(property => property.id)).toEqual([
      'character-name',
      'character-role',
      'character-faction',
      'character-appearance',
      'character-personality',
      'character-motivation',
      'character-relationship-notes',
    ])
    expect(getPropertiesByKind(defaultPropertyDefinitions, 'outline')).toEqual([])
  })

  it('creates editable custom properties after system properties', () => {
    const property = createCustomProperty(defaultPropertyDefinitions, {
      kind: 'character',
      name: 'Secret name',
      valueType: 'text',
    })

    expect(property).toMatchObject({
      id: 'character-secret-name',
      kind: 'character',
      name: 'Secret name',
      valueType: 'text',
      required: false,
      visible: true,
      order: 7,
      system: false,
    })
  })

  it('updates and reorders properties without losing the rest of the list', () => {
    const renamed = updateProperty(defaultPropertyDefinitions, 'character-motivation', {
      name: '核心动机',
      visible: false,
    })
    const moved = moveProperty(renamed, 'character-motivation', 'up')

    expect(getPropertiesByKind(moved, 'character').map(property => property.id)).toEqual([
      'character-name',
      'character-role',
      'character-faction',
      'character-appearance',
      'character-motivation',
      'character-personality',
      'character-relationship-notes',
    ])
    expect(moved.find(property => property.id === 'character-motivation')).toMatchObject({
      name: '核心动机',
      visible: false,
      order: 4,
    })
  })

  it('reorders properties by dragging one property onto another', () => {
    const reordered = reorderProperty(defaultPropertyDefinitions, 'character-motivation', 'character-role')

    expect(getPropertiesByKind(reordered, 'character').map(property => property.id)).toEqual([
      'character-name',
      'character-motivation',
      'character-role',
      'character-faction',
      'character-appearance',
      'character-personality',
      'character-relationship-notes',
    ])
    expect(reordered.find(property => property.id === 'character-motivation')).toMatchObject({
      order: 1,
    })
  })

  it('normalizes values based on property type', () => {
    const numberProperty = {
      valueType: 'number',
    } as PropertyDefinition
    const booleanProperty = {
      valueType: 'boolean',
    } as PropertyDefinition
    const multiSelectProperty = {
      valueType: 'multiSelect',
    } as PropertyDefinition

    expect(normalizePropertyValue(numberProperty, '12')).toBe(12)
    expect(normalizePropertyValue(booleanProperty, 'on')).toBe(true)
    expect(normalizePropertyValue(multiSelectProperty, 'a')).toEqual(['a'])
  })

  it('keeps property edits in a draft until saved', () => {
    const draft = createPropertyDraft(defaultPropertyDefinitions, 'character')
    draft[0]!.name = '草稿人物姓名'

    expect(getPropertiesByKind(defaultPropertyDefinitions, 'character')[0]?.name).toBe('姓名')

    const savedProperties = replacePropertiesByKind(defaultPropertyDefinitions, 'character', draft)

    expect(getPropertiesByKind(savedProperties, 'character')[0]?.name).toBe('草稿人物姓名')
    expect(getPropertiesByKind(savedProperties, 'outline')).toEqual([])
  })
  it('saves property drafts using the visible draft order', () => {
    const draft = createPropertyDraft(defaultPropertyDefinitions, 'character')
    const [nameProperty, roleProperty, ...restProperties] = draft

    const savedProperties = replacePropertiesByKind(defaultPropertyDefinitions, 'character', [
      roleProperty!,
      nameProperty!,
      ...restProperties,
    ])

    expect(getPropertiesByKind(savedProperties, 'character').map(property => property.id)).toEqual([
      'character-role',
      'character-name',
      'character-faction',
      'character-appearance',
      'character-personality',
      'character-motivation',
      'character-relationship-notes',
    ])
  })

  it('adds and removes select options with stable unique ids', () => {
    const options = addPropertyOption([
      { id: 'leading-role', label: '主角' },
    ], ' 主角 ')

    expect(options).toEqual([
      { id: 'leading-role', label: '主角' },
      { id: 'option-2', label: '主角' },
    ])
    expect(addPropertyOption(options, '   ')).toBe(options)
    expect(removePropertyOption(options, 'leading-role')).toEqual([
      { id: 'option-2', label: '主角' },
    ])
  })
})
