import type { MaterialAsset, MaterialTag } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  createMaterial,
  createMaterialTag,
  getFilteredMaterials,
  getMaterialsByTag,
  removeMaterial,
  removeMaterialTag,
  sortMaterialTags,
  updateMaterial,
  updateMaterialTag,
} from './materials'

describe('materials', () => {
  it('creates global material entries with link, text, image, and tags', () => {
    const material = createMaterial({
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(material).toMatchObject({
      title: '未命名素材',
      url: '',
      text: '',
      imageUrl: '',
      tagIds: [],
      createdAt: '2026-05-28T10:00:00.000Z',
      updatedAt: '2026-05-28T10:00:00.000Z',
    })
    expect(material.id).toMatch(/^material-20260528100000-/)
  })

  it('updates material fields and normalizes duplicate tag ids', () => {
    const material = createMaterialRecord({ id: 'material-1' })

    expect(updateMaterial(material, {
      title: '  参考图  ',
      url: ' https://example.com/ref ',
      text: '摘录文字',
      imageUrl: ' https://example.com/image.png ',
      tagIds: ['tag-1', 'tag-1', 'tag-2'],
      now: '2026-05-28T11:00:00.000Z',
    })).toMatchObject({
      title: '参考图',
      url: 'https://example.com/ref',
      text: '摘录文字',
      imageUrl: 'https://example.com/image.png',
      tagIds: ['tag-1', 'tag-2'],
      updatedAt: '2026-05-28T11:00:00.000Z',
    })
  })

  it('filters materials by tag and keeps newest updates first', () => {
    const materials = [
      createMaterialRecord({ id: 'material-old', tagIds: ['tag-a'], updatedAt: '2026-05-28T09:00:00.000Z' }),
      createMaterialRecord({ id: 'material-new', tagIds: ['tag-a', 'tag-b'], updatedAt: '2026-05-28T12:00:00.000Z' }),
      createMaterialRecord({ id: 'material-other', tagIds: ['tag-b'], updatedAt: '2026-05-28T13:00:00.000Z' }),
    ]

    expect(getMaterialsByTag(materials, 'tag-a').map(material => material.id)).toEqual([
      'material-new',
      'material-old',
    ])
    expect(getMaterialsByTag(materials, undefined).map(material => material.id)).toEqual([
      'material-other',
      'material-new',
      'material-old',
    ])
  })

  it('filters materials by keyword across title text url and image url', () => {
    const materials = [
      createMaterialRecord({ id: 'material-title', title: 'Storm Harbor', updatedAt: '2026-05-28T09:00:00.000Z' }),
      createMaterialRecord({ id: 'material-text', text: 'A note about moonlit archives', updatedAt: '2026-05-28T12:00:00.000Z' }),
      createMaterialRecord({ id: 'material-url', url: 'https://example.com/relic-map', updatedAt: '2026-05-28T13:00:00.000Z' }),
      createMaterialRecord({ id: 'material-image', imageUrl: 'https://cdn.example.com/character.png', updatedAt: '2026-05-28T14:00:00.000Z' }),
    ]

    expect(getFilteredMaterials(materials, { query: '  MOONLIT  ' }).map(material => material.id)).toEqual(['material-text'])
    expect(getFilteredMaterials(materials, { query: 'example.com' }).map(material => material.id)).toEqual(['material-image', 'material-url'])
  })

  it('combines material keyword search with tag filters', () => {
    const materials = [
      createMaterialRecord({ id: 'material-a', title: 'Storm Harbor', tagIds: ['tag-a'], updatedAt: '2026-05-28T09:00:00.000Z' }),
      createMaterialRecord({ id: 'material-b', title: 'Storm Relic', tagIds: ['tag-b'], updatedAt: '2026-05-28T12:00:00.000Z' }),
      createMaterialRecord({ id: 'material-c', title: 'Quiet Archive', tagIds: ['tag-a'], updatedAt: '2026-05-28T13:00:00.000Z' }),
    ]

    expect(getFilteredMaterials(materials, { tagId: 'tag-a', query: 'storm' }).map(material => material.id)).toEqual(['material-a'])
    expect(getFilteredMaterials(materials, { tagId: 'tag-a', query: '   ' }).map(material => material.id)).toEqual(['material-c', 'material-a'])
  })

  it('removes materials by id', () => {
    const materials = [
      createMaterialRecord({ id: 'material-1' }),
      createMaterialRecord({ id: 'material-2' }),
    ]

    expect(removeMaterial(materials, 'material-1').map(material => material.id)).toEqual(['material-2'])
  })
})

describe('material tags', () => {
  it('creates and sorts tags', () => {
    const tag = createMaterialTag({
      name: '  角色参考  ',
      order: 1,
      now: '2026-05-28T10:00:00.000Z',
    })

    expect(tag).toMatchObject({
      name: '角色参考',
      color: '#16a34a',
      order: 1,
      createdAt: '2026-05-28T10:00:00.000Z',
      updatedAt: '2026-05-28T10:00:00.000Z',
    })
    expect(tag.id).toMatch(/^material-tag-20260528100000-/)

    expect(sortMaterialTags([
      createMaterialTagRecord({ id: 'tag-2', order: 1 }),
      createMaterialTagRecord({ id: 'tag-1', order: 0 }),
    ]).map(item => item.id)).toEqual(['tag-1', 'tag-2'])
  })

  it('updates tag name and color', () => {
    const tag = createMaterialTagRecord({ id: 'tag-1', name: '旧标签', color: '#2563eb' })

    expect(updateMaterialTag(tag, {
      name: '  新标签  ',
      color: '#0f766e',
      now: '2026-05-28T11:00:00.000Z',
    })).toMatchObject({
      name: '新标签',
      color: '#0f766e',
      updatedAt: '2026-05-28T11:00:00.000Z',
    })
  })

  it('removes tags and clears material references', () => {
    const result = removeMaterialTag(
      [
        createMaterialTagRecord({ id: 'tag-a', order: 0 }),
        createMaterialTagRecord({ id: 'tag-b', order: 1 }),
      ],
      [
        createMaterialRecord({ id: 'material-1', tagIds: ['tag-a', 'tag-b'] }),
        createMaterialRecord({ id: 'material-2', tagIds: ['tag-b'] }),
      ],
      'tag-a',
    )

    expect(result.tags.map(tag => ({ id: tag.id, order: tag.order }))).toEqual([
      { id: 'tag-b', order: 0 },
    ])
    expect(result.materials.map(material => material.tagIds)).toEqual([
      ['tag-b'],
      ['tag-b'],
    ])
  })
})

function createMaterialRecord(input: Partial<MaterialAsset>): MaterialAsset {
  return {
    id: input.id ?? 'material-1',
    title: input.title ?? '素材',
    url: input.url ?? '',
    text: input.text ?? '',
    imageUrl: input.imageUrl ?? '',
    tagIds: input.tagIds ?? [],
    createdAt: input.createdAt ?? '2026-05-28T10:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-05-28T10:00:00.000Z',
  }
}

function createMaterialTagRecord(input: Partial<MaterialTag>): MaterialTag {
  return {
    id: input.id ?? 'tag-1',
    name: input.name ?? '标签',
    color: input.color ?? '#2563eb',
    order: input.order ?? 0,
    createdAt: input.createdAt ?? '2026-05-28T10:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-05-28T10:00:00.000Z',
  }
}
