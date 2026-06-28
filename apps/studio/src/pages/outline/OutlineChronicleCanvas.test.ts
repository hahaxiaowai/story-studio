/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./OutlineChronicleCanvas.vue', import.meta.url)), 'utf8')

describe('outline chronicle canvas wiring', () => {
  it('binds text scale controls to the canvas renderer', () => {
    expect(componentSource).toContain('const textScale = ref(1)')
    expect(componentSource).toContain('textScale: textScale.value')
    expect(componentSource).toContain('renderer.value?.setTextScale(nextScale)')
    expect(componentSource).toContain('outline.canvasTextScale')
    expect(componentSource).toContain('type="range"')
  })
})
