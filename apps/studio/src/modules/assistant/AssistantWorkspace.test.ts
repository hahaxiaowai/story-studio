/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./AssistantWorkspace.vue', import.meta.url)), 'utf8')

describe('assistant workspace local terminal runner panel wiring', () => {
  it('keeps the local terminal test panel connected to the assistant runner', () => {
    expect(componentSource).toContain('import { useAssistantRunner } from \'./useAssistantRunner\'')
    expect(componentSource).toContain('const runner = useAssistantRunner(settings)')
    expect(componentSource).toContain('t(\'assistant.runnerTitle\')')
    expect(componentSource).toContain('runner.run')
    expect(componentSource).toContain('runner.result.value')
  })
})
