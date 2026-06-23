/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./MaterialPage.vue', import.meta.url)), 'utf8')

describe('material workspace search wiring', () => {
  it('binds the material search input to the materials composable', () => {
    expect(componentSource).toContain('searchQuery')
    expect(componentSource).toContain('v-model="searchQuery"')
    expect(componentSource).toContain('materials.searchPlaceholder')
  })

  it('clears material filters when creating a new material', () => {
    expect(componentSource).toContain('function createMaterial(): void')
    expect(componentSource).toContain('selectedTagId.value = undefined')
    expect(componentSource).toContain('selectedKind.value = \'all\'')
    expect(componentSource).toContain('searchQuery.value = \'\'')
    expect(componentSource).toContain('selectedMaterialId.value = material.id')
  })

  it('binds material kind filters to the materials composable', () => {
    expect(componentSource).toContain('selectedKind')
    expect(componentSource).toContain('kindCounts')
    expect(componentSource).toContain('kindCounts[filter.key]')
    expect(componentSource).toContain('materials.typeFilter')
    expect(componentSource).toContain('materials.kindText')
    expect(componentSource).toContain('materials.kindLink')
    expect(componentSource).toContain('materials.kindImage')
  })

  it('binds tag filter counts to the materials composable', () => {
    expect(componentSource).toContain('tagCounts')
    expect(componentSource).toContain('tagCounts.all')
    expect(componentSource).toContain('tagCounts.byTagId[tag.id]')
    expect(componentSource).not.toContain('materials.filter(material => material.tagIds.includes(tag.id)).length')
  })

  it('applies a newly created tag to the selected material', () => {
    expect(componentSource).toContain('function submitTag(): void')
    expect(componentSource).toContain('newTagName.value = \'\'')
    expect(componentSource).toContain('updateSelectedMaterial({ tagIds: [...selectedMaterial.value.tagIds, tag.id] })')
    expect(componentSource).not.toContain('selectedTagId.value = tag.id')
  })
})
