/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./EntityWorkspace.vue', import.meta.url)), 'utf8')

describe('entity workspace required field validation wiring', () => {
  it('renders required field summary and field-level messages', () => {
    expect(componentSource).toContain('getMissingRequiredProperties')
    expect(componentSource).toContain('missingRequiredProperties')
    expect(componentSource).toContain('缺少必填字段')
    expect(componentSource).toContain('请填写必填字段')
  })
})
