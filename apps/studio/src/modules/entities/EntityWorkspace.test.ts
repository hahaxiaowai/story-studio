/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./EntityWorkspace.vue', import.meta.url)), 'utf8')

describe('entity workspace required field validation wiring', () => {
  it('renders required field summary and field-level messages', () => {
    expect(componentSource).toContain('getMissingRequiredProperties')
    expect(componentSource).toContain('missingRequiredProperties')
    expect(componentSource).toContain('entity.missingRequired')
    expect(componentSource).toContain('entity.requiredPrompt')
  })

  it('uses locale keys for record actions and state labels', () => {
    expect(componentSource).toContain('entity.current')
    expect(componentSource).toContain('entity.delete')
    expect(componentSource).toContain('entity.enable')
  })
})
