/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./AppSidebar.vue', import.meta.url)), 'utf8')

describe('app sidebar navigation', () => {
  it('exposes the workspace integrity page in workspace navigation', () => {
    expect(componentSource).toContain('ShieldCheckIcon')
    expect(componentSource).toContain('integrity: [\'#integrity\']')
    expect(componentSource).toContain('nav.integrity')
    expect(componentSource).toContain('url: \'#integrity\'')
  })
})
