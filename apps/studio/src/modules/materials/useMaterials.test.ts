import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useMaterials } from './useMaterials'

describe('useMaterials', () => {
  beforeEach(() => {
    resetStudioDataForTest()
  })

  it('filters materials by search query and selected tag', async () => {
    const driver = createDriver({
      ...createDefaultStudioDataDocument(),
      materials: [
        createMaterialRecord({ id: 'material-a', title: 'Storm Harbor', tagIds: ['tag-a'], updatedAt: '2026-05-28T09:00:00.000Z' }),
        createMaterialRecord({ id: 'material-b', text: 'Storm relic note', tagIds: ['tag-b'], updatedAt: '2026-05-28T12:00:00.000Z' }),
        createMaterialRecord({ id: 'material-c', title: 'Quiet Archive', tagIds: ['tag-a'], updatedAt: '2026-05-28T13:00:00.000Z' }),
      ],
      materialTags: [
        { id: 'tag-a', name: '地点', color: '#2563eb', order: 0, createdAt: '2026-05-28T10:00:00.000Z', updatedAt: '2026-05-28T10:00:00.000Z' },
        { id: 'tag-b', name: '道具', color: '#16a34a', order: 1, createdAt: '2026-05-28T10:00:00.000Z', updatedAt: '2026-05-28T10:00:00.000Z' },
      ],
    })
    await useStudioData(driver).ready

    const materials = useMaterials()
    materials.searchQuery.value = 'storm'
    materials.selectedTagId.value = 'tag-a'

    expect(materials.filteredMaterials.value.map(material => material.id)).toEqual(['material-a'])
  })

  it('filters materials by selected kind', async () => {
    const driver = createDriver({
      ...createDefaultStudioDataDocument(),
      materials: [
        createMaterialRecord({ id: 'material-text', text: 'Archive note', updatedAt: '2026-05-28T09:00:00.000Z' }),
        createMaterialRecord({ id: 'material-link', url: 'https://example.com/relic', updatedAt: '2026-05-28T12:00:00.000Z' }),
        createMaterialRecord({ id: 'material-image', imageUrl: 'https://cdn.example.com/portrait.png', updatedAt: '2026-05-28T13:00:00.000Z' }),
      ],
    })
    await useStudioData(driver).ready

    const materials = useMaterials()
    materials.selectedKind.value = 'link'

    expect(materials.filteredMaterials.value.map(material => material.id)).toEqual(['material-link'])
  })

  it('counts material kinds within the selected tag and search query', async () => {
    const driver = createDriver({
      ...createDefaultStudioDataDocument(),
      materials: [
        createMaterialRecord({ id: 'material-text', title: 'Storm note', text: 'Archive note', tagIds: ['tag-a'], updatedAt: '2026-05-28T09:00:00.000Z' }),
        createMaterialRecord({ id: 'material-link', title: 'Storm source', url: 'https://example.com/relic', tagIds: ['tag-a'], updatedAt: '2026-05-28T12:00:00.000Z' }),
        createMaterialRecord({ id: 'material-image', title: 'Storm portrait', imageUrl: 'https://cdn.example.com/portrait.png', tagIds: ['tag-b'], updatedAt: '2026-05-28T13:00:00.000Z' }),
        createMaterialRecord({ id: 'material-other', title: 'Quiet archive', text: 'Unmatched note', tagIds: ['tag-a'], updatedAt: '2026-05-28T14:00:00.000Z' }),
      ],
    })
    await useStudioData(driver).ready

    const materials = useMaterials()
    materials.searchQuery.value = 'storm'
    materials.selectedTagId.value = 'tag-a'
    materials.selectedKind.value = 'link'

    expect(materials.kindCounts.value).toEqual({
      all: 2,
      text: 1,
      link: 1,
      image: 0,
    })
  })
})

function createDriver(document: StudioDataDocument): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}

function createMaterialRecord(input: Partial<StudioDataDocument['materials'][number]>): StudioDataDocument['materials'][number] {
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
