/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const settingsWorkspaceSource = readFileSync(fileURLToPath(new URL('./AssistantWorkspace.vue', import.meta.url)), 'utf8')
const runnerPanelSource = readFileSync(fileURLToPath(new URL('./AssistantRunnerPanel.vue', import.meta.url)), 'utf8')
const chatWorkspaceSource = readFileSync(fileURLToPath(new URL('./AssistantChatWorkspace.vue', import.meta.url)), 'utf8')

describe('assistant workspace wiring', () => {
  it('keeps the settings workspace focused on settings panels', () => {
    expect(settingsWorkspaceSource).toContain('role="tablist"')
    expect(settingsWorkspaceSource).toContain('role="tabpanel"')
    expect(settingsWorkspaceSource).toContain('assistant.aiSettingsTitle')
    expect(settingsWorkspaceSource).toContain('assistant.styleSettingsTitle')
    expect(settingsWorkspaceSource).toContain('AssistantProviderSettingsPanel')
    expect(settingsWorkspaceSource).toContain('AssistantRunnerPanel')
    expect(settingsWorkspaceSource).toContain('AssistantStyleSettingsPanel')
    expect(settingsWorkspaceSource).not.toContain('AssistantChatPanel')
  })

  it('keeps the chat workspace connected to the chat panel', () => {
    expect(chatWorkspaceSource).toContain('AssistantChatPanel')
    expect(chatWorkspaceSource).toContain('assistant.chatTitle')
  })

  it('keeps the local terminal test panel connected to the assistant runner', () => {
    expect(runnerPanelSource).toContain('import { useAssistantRunner } from \'./useAssistantRunner\'')
    expect(runnerPanelSource).toContain('const runner = useAssistantRunner(settings)')
    expect(runnerPanelSource).toContain('t(\'assistant.runnerTitle\')')
    expect(runnerPanelSource).toContain('runner.run')
    expect(runnerPanelSource).toContain('runner.result.value')
  })
})
