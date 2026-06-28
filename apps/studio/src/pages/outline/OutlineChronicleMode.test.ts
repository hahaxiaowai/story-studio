/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./OutlineChronicleMode.vue', import.meta.url)), 'utf8')

describe('outline chronicle mode wiring', () => {
  it('persists desktop chronicle view preferences locally', () => {
    expect(componentSource).toContain('const density = ref<ChronicleDensity>(readStoredChronicleDensity())')
    expect(componentSource).toContain('const chronicleView = ref<ChronicleView>(readStoredChronicleView())')
    expect(componentSource).toContain('const CHRONICLE_DENSITY_STORAGE_KEY')
    expect(componentSource).toContain('const CHRONICLE_VIEW_STORAGE_KEY')
    expect(componentSource).toContain('updateChronicleView(option.value)')
    expect(componentSource).toContain('updateDensity(option.value)')
    expect(componentSource).toContain('writeStoredChronicleView(view)')
    expect(componentSource).toContain('writeStoredChronicleDensity(value)')
  })
})
