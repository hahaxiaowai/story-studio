import type { MaterialAsset, MaterialTag } from '@story-studio/types'

export interface CreateMaterialInput {
  now: string
}

export interface UpdateMaterialInput {
  title?: string
  url?: string
  text?: string
  imageUrl?: string
  tagIds?: string[]
  now: string
}

export interface MaterialFilterOptions {
  kind?: MaterialKindFilter
  query?: string
  tagId?: string
}

export type MaterialKindFilter = 'all' | 'text' | 'link' | 'image'

export interface CreateMaterialTagInput {
  name: string
  order: number
  now: string
}

export interface UpdateMaterialTagInput {
  name?: string
  color?: string
  now: string
}

const TAG_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0f766e', '#be123c']

export function createMaterial(input: CreateMaterialInput): MaterialAsset {
  return {
    id: createId('material', input.now),
    title: '未命名素材',
    url: '',
    text: '',
    imageUrl: '',
    tagIds: [],
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateMaterial(material: MaterialAsset, input: UpdateMaterialInput): MaterialAsset {
  return {
    ...material,
    ...(input.title !== undefined ? { title: normalizeTitle(input.title) } : {}),
    ...(input.url !== undefined ? { url: input.url.trim() } : {}),
    ...(input.text !== undefined ? { text: input.text } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() } : {}),
    ...(input.tagIds !== undefined ? { tagIds: uniqueIds(input.tagIds) } : {}),
    updatedAt: input.now,
  }
}

export function removeMaterial(materials: MaterialAsset[], materialId: string): MaterialAsset[] {
  return materials.filter(material => material.id !== materialId)
}

export function getMaterialsByTag(materials: MaterialAsset[], tagId: string | undefined): MaterialAsset[] {
  return getFilteredMaterials(materials, { tagId })
}

export function getFilteredMaterials(materials: MaterialAsset[], options: MaterialFilterOptions): MaterialAsset[] {
  const query = normalizeSearchQuery(options.query)
  let nextMaterials = sortMaterials(materials)

  if (options.tagId)
    nextMaterials = nextMaterials.filter(material => material.tagIds.includes(options.tagId!))

  const kind = options.kind

  if (kind && kind !== 'all')
    nextMaterials = nextMaterials.filter(material => materialMatchesKind(material, kind))

  if (!query)
    return nextMaterials

  return nextMaterials.filter(material => materialMatchesQuery(material, query))
}

export function createMaterialTag(input: CreateMaterialTagInput): MaterialTag {
  return {
    id: createId('material-tag', input.now),
    name: normalizeTagName(input.name),
    color: TAG_COLORS[input.order % TAG_COLORS.length] ?? TAG_COLORS[0],
    order: input.order,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function updateMaterialTag(tag: MaterialTag, input: UpdateMaterialTagInput): MaterialTag {
  return {
    ...tag,
    ...(input.name !== undefined ? { name: normalizeTagName(input.name) } : {}),
    ...(input.color !== undefined ? { color: input.color.trim() || tag.color } : {}),
    updatedAt: input.now,
  }
}

export function removeMaterialTag(
  tags: MaterialTag[],
  materials: MaterialAsset[],
  tagId: string,
): { tags: MaterialTag[], materials: MaterialAsset[] } {
  return {
    tags: normalizeTagOrder(tags.filter(tag => tag.id !== tagId)),
    materials: materials.map(material => ({
      ...material,
      tagIds: material.tagIds.filter(id => id !== tagId),
    })),
  }
}

export function sortMaterialTags(tags: MaterialTag[]): MaterialTag[] {
  return [...tags].sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt))
}

export function sortMaterials(materials: MaterialAsset[]): MaterialAsset[] {
  return [...materials].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.createdAt.localeCompare(right.createdAt))
}

function normalizeTitle(title: string): string {
  return title.trim() || '未命名素材'
}

function normalizeSearchQuery(query: string | undefined): string {
  return query?.trim().toLowerCase() ?? ''
}

function materialMatchesQuery(material: MaterialAsset, query: string): boolean {
  return [
    material.title,
    material.text,
    material.url,
    material.imageUrl,
  ].some(value => value.toLowerCase().includes(query))
}

function materialMatchesKind(material: MaterialAsset, kind: Exclude<MaterialKindFilter, 'all'>): boolean {
  if (kind === 'text')
    return material.text.trim().length > 0

  if (kind === 'link')
    return material.url.trim().length > 0

  return material.imageUrl.trim().length > 0
}

function normalizeTagName(name: string): string {
  return name.trim() || '未命名标签'
}

function normalizeTagOrder(tags: MaterialTag[]): MaterialTag[] {
  return sortMaterialTags(tags).map((tag, order) => ({ ...tag, order }))
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))]
}

function createId(prefix: string, now: string): string {
  const stamp = now.replace(/\D/g, '').slice(0, 14)
  const randomSegment = Math.random().toString(36).slice(2, 8)

  return `${prefix}-${stamp}-${randomSegment}`
}
