/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./MaterialWorkspace.vue', import.meta.url)), 'utf8')

describe('material workspace search wiring', () => {
  it('binds the material search input to the materials composable', () => {
    expect(componentSource).toContain('searchQuery')
    expect(componentSource).toContain('v-model="searchQuery"')
    expect(componentSource).toContain('materials.searchPlaceholder')
  })
})
