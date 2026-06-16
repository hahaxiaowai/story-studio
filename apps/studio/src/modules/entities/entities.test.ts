import type { EntityRecord, PropertyDefinition, PropertyValueType } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { defaultPropertyDefinitions } from '../properties/properties'
import {
  createEntityRecord,
  getEntityTitle,
  getMissingRequiredProperties,
  getRecordsByWorkspaceAndKind,
  isMissingRequiredPropertyValue,
  updateEntityRecord,
} from './entities'

describe('entities', () => {
  it('creates records with values initialized from visible properties', () => {
    const record = createEntityRecord({
      workspaceId: 'workspace-a',
      kind: 'character',
      properties: defaultPropertyDefinitions,
      now: '2026-05-25T10:00:00.000Z',
    })

    expect(record).toMatchObject({
      workspaceId: 'workspace-a',
      kind: 'character',
      title: '新人物',
      values: {
        'character-name': '新人物',
        'character-role': '',
        'character-faction': '',
        'character-appearance': '',
        'character-personality': '',
        'character-motivation': '',
        'character-relationship-notes': '',
      },
      createdAt: '2026-05-25T10:00:00.000Z',
      updatedAt: '2026-05-25T10:00:00.000Z',
    })
  })

  it('filters records by workspace and kind', () => {
    const records = [
      createRecord('one', 'workspace-a', 'outline'),
      createRecord('two', 'workspace-a', 'character'),
      createRecord('three', 'workspace-b', 'outline'),
    ]

    expect(getRecordsByWorkspaceAndKind(records, 'workspace-a', 'outline').map(record => record.id)).toEqual(['one'])
  })

  it('updates record values and keeps title in sync with title property', () => {
    const record = createEntityRecord({
      workspaceId: 'workspace-a',
      kind: 'character',
      properties: defaultPropertyDefinitions,
      now: '2026-05-25T10:00:00.000Z',
    })

    const updated = updateEntityRecord(record, defaultPropertyDefinitions, {
      values: {
        'character-name': '林澈',
        'character-role': '主角',
      },
      now: '2026-05-25T11:00:00.000Z',
    })

    expect(updated.title).toBe('林澈')
    expect(updated.values['character-role']).toBe('主角')
    expect(updated.updatedAt).toBe('2026-05-25T11:00:00.000Z')
    expect(getEntityTitle(updated, defaultPropertyDefinitions)).toBe('林澈')
  })

  it('finds missing required properties by value type', () => {
    const properties = [
      createProperty('name', '姓名', 'text', true),
      createProperty('role', '定位', 'select', true),
      createProperty('tags', '标签', 'multiSelect', true),
      createProperty('age', '年龄', 'number', true),
      createProperty('active', '启用', 'boolean', true),
      createProperty('notes', '备注', 'longText'),
    ]
    const record = createRecord('one', 'workspace-a', 'character')
    record.values = {
      name: '   ',
      role: '',
      tags: [],
      age: null,
      active: false,
      notes: '',
    }

    expect(getMissingRequiredProperties(record, properties).map(property => property.id)).toEqual([
      'name',
      'role',
      'tags',
      'age',
    ])
    expect(isMissingRequiredPropertyValue(properties[4]!, record.values.active)).toBe(false)
  })
})

function createRecord(id: string, workspaceId: string, kind: EntityRecord['kind']): EntityRecord {
  return {
    id,
    workspaceId,
    kind,
    title: id,
    values: {},
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
  }
}

function createProperty(
  id: string,
  name: string,
  valueType: PropertyValueType,
  required = false,
): PropertyDefinition {
  return {
    id,
    kind: 'character' as const,
    name,
    valueType,
    required,
    visible: true,
    order: 0,
    system: false,
  }
}
