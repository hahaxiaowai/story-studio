import type { MaterialAsset, MaterialTag } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import type { MaterialKindFilter } from './materials'
import { computed, ref } from 'vue'
import { useStudioData } from '../storage/useStudioData'
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

export type UpdateMaterialInput = Omit<Parameters<typeof updateMaterial>[1], 'now'>
export type UpdateMaterialTagInput = Omit<Parameters<typeof updateMaterialTag>[1], 'now'>

export function useMaterials(): {
  materials: ComputedRef<MaterialAsset[]>
  tags: ComputedRef<MaterialTag[]>
  selectedTagId: Ref<string | undefined>
  selectedKind: Ref<MaterialKindFilter>
  searchQuery: Ref<string>
  filteredMaterials: ComputedRef<MaterialAsset[]>
  addMaterial: () => MaterialAsset
  updateMaterialById: (materialId: string, input: UpdateMaterialInput) => void
  removeMaterialById: (materialId: string) => void
  addTag: (name: string) => MaterialTag
  updateTagById: (tagId: string, input: UpdateMaterialTagInput) => void
  removeTagById: (tagId: string) => void
} {
  const studioData = useStudioData()
  const selectedTagId = ref<string>()
  const selectedKind = ref<MaterialKindFilter>('all')
  const searchQuery = ref('')
  const materials = computed<MaterialAsset[]>(() => getMaterialsByTag(studioData.document.value.materials, undefined))
  const tags = computed<MaterialTag[]>(() => sortMaterialTags(studioData.document.value.materialTags))
  const filteredMaterials = computed<MaterialAsset[]>(() => getFilteredMaterials(materials.value, {
    kind: selectedKind.value,
    query: searchQuery.value,
    tagId: selectedTagId.value,
  }))

  function addMaterial(): MaterialAsset {
    const material = createMaterial({ now: new Date().toISOString() })

    studioData.updateDocument((document) => {
      document.materials = [material, ...document.materials]
    })

    return material
  }

  function updateMaterialById(materialId: string, input: UpdateMaterialInput): void {
    studioData.updateDocument((document) => {
      document.materials = document.materials.map(material => material.id === materialId
        ? updateMaterial(material, {
            ...input,
            now: new Date().toISOString(),
          })
        : material)
    })
  }

  function removeMaterialById(materialId: string): void {
    studioData.updateDocument((document) => {
      document.materials = removeMaterial(document.materials, materialId)
    })
  }

  function addTag(name: string): MaterialTag {
    const tag = createMaterialTag({
      name,
      order: tags.value.length,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      document.materialTags = [...document.materialTags, tag]
    })

    return tag
  }

  function updateTagById(tagId: string, input: UpdateMaterialTagInput): void {
    studioData.updateDocument((document) => {
      document.materialTags = document.materialTags.map(tag => tag.id === tagId
        ? updateMaterialTag(tag, {
            ...input,
            now: new Date().toISOString(),
          })
        : tag)
    })
  }

  function removeTagById(tagId: string): void {
    studioData.updateDocument((document) => {
      const result = removeMaterialTag(document.materialTags, document.materials, tagId)

      document.materialTags = result.tags
      document.materials = result.materials
    })

    if (selectedTagId.value === tagId)
      selectedTagId.value = undefined
  }

  return {
    materials,
    tags,
    selectedTagId,
    selectedKind,
    searchQuery,
    filteredMaterials,
    addMaterial,
    updateMaterialById,
    removeMaterialById,
    addTag,
    updateTagById,
    removeTagById,
  }
}
