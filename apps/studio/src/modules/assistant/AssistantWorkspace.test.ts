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

  it('lets the chat workspace fill the scroll viewport', () => {
    expect(chatWorkspaceSource).toContain('class="border-border/70 bg-background flex h-full min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm"')
    expect(chatWorkspaceSource).toContain('class="flex min-h-0 flex-1 overflow-hidden p-5"')
  })

  it('keeps the chat panel connected to model, context usage, and typewriter display state', () => {
    const chatPanelSource = readFileSync(fileURLToPath(new URL('./AssistantChatPanel.vue', import.meta.url)), 'utf8')

    expect(chatPanelSource).toContain('chat.activeModelSummary.value')
    expect(chatPanelSource).toContain('chat.activeContextUsageSummary.value')
    expect(chatPanelSource).toContain('chat.generationStatusSummary.value')
    expect(chatPanelSource).toContain('typewriterMessages')
    expect(chatPanelSource).toContain('getDisplayMessageContent(message)')
  })

  it('keeps the chat composer pinned while only thread lists and messages scroll', () => {
    const chatPanelSource = readFileSync(fileURLToPath(new URL('./AssistantChatPanel.vue', import.meta.url)), 'utf8')

    expect(chatPanelSource).toContain('class="grid h-full min-h-0 overflow-hidden rounded-lg border lg:grid-cols-[17rem_minmax(0,1fr)]"')
    expect(chatPanelSource).toContain('class="border-border/70 bg-muted/20 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-b lg:border-r lg:border-b-0"')
    expect(chatPanelSource).toContain('class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]"')
    expect(chatPanelSource).toContain('class="bg-background min-h-0 overflow-y-auto p-4"')
    expect(chatPanelSource).toContain('<footer class="border-border/70 bg-background shrink-0 border-t p-4">')
  })

  it('keeps the local terminal test panel connected to the assistant runner', () => {
    expect(runnerPanelSource).toContain('import { useAssistantRunner } from \'./useAssistantRunner\'')
    expect(runnerPanelSource).toContain('const runner = useAssistantRunner(settings)')
    expect(runnerPanelSource).toContain('t(\'assistant.runnerTitle\')')
    expect(runnerPanelSource).toContain('runner.run')
    expect(runnerPanelSource).toContain('runner.result.value')
  })
})
