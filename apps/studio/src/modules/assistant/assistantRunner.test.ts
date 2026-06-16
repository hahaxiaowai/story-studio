import type { AssistantSettings } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { createAssistantSettings } from './assistant'
import {
  createAssistantRunner,
  getAssistantRunDisabledReason,
  LOCAL_TERMINAL_TAURI_UNAVAILABLE,
  resolveAssistantRunnerProvider,
} from './assistantRunner'

describe('assistant runner', () => {
  it('resolves selected provider before global default', () => {
    const settings = createSettings()

    expect(resolveAssistantRunnerProvider(settings, 'provider-local')?.id).toBe('provider-local')
    expect(resolveAssistantRunnerProvider(settings, '')?.id).toBe('provider-api')
  })

  it('disables local terminal providers when command is empty', () => {
    const settings = createSettings({
      localCommand: '   ',
    })
    const provider = resolveAssistantRunnerProvider(settings, 'provider-local')

    expect(getAssistantRunDisabledReason({
      provider,
      prompt: '写一个开头',
      loading: false,
    })).toBe('请先填写 Terminal 命令。')
  })

  it('returns a web-only unavailable error without invoking local commands', async () => {
    let invoked = false
    const settings = createSettings()
    const provider = resolveAssistantRunnerProvider(settings, 'provider-local')
    const runner = createAssistantRunner({
      isTauri: () => false,
      invoke: async () => {
        invoked = true
        return {
          stdout: '',
          stderr: '',
          exitCode: 0,
          durationMs: 0,
        }
      },
    })

    await runner.run(provider, '写一个开头')

    expect(invoked).toBe(false)
    expect(runner.loading.value).toBe(false)
    expect(runner.error.value).toBe(LOCAL_TERMINAL_TAURI_UNAVAILABLE)
    expect(runner.result.value).toBeNull()
  })

  it('stores invoke success result in runner state', async () => {
    const settings = createSettings()
    const provider = resolveAssistantRunnerProvider(settings, 'provider-local')
    const runner = createAssistantRunner({
      isTauri: () => true,
      invoke: async (command, payload) => {
        expect(command).toBe('run_local_terminal_model')
        expect(payload).toEqual({
          providerId: 'provider-local',
          command: 'cat',
          model: 'llama3.1',
          prompt: '写一个开头',
        })

        return {
          stdout: '模型回复',
          stderr: '',
          exitCode: 0,
          durationMs: 12,
        }
      },
    })

    await runner.run(provider, '写一个开头')

    expect(runner.loading.value).toBe(false)
    expect(runner.error.value).toBe('')
    expect(runner.result.value).toEqual({
      stdout: '模型回复',
      stderr: '',
      exitCode: 0,
      durationMs: 12,
    })
  })

  it('keeps failed invoke errors and clears loading', async () => {
    const settings = createSettings()
    const provider = resolveAssistantRunnerProvider(settings, 'provider-local')
    const runner = createAssistantRunner({
      isTauri: () => true,
      invoke: async () => {
        throw new Error('命令超时')
      },
    })

    await runner.run(provider, '写一个开头')

    expect(runner.loading.value).toBe(false)
    expect(runner.error.value).toBe('命令超时')
    expect(runner.result.value).toBeNull()
  })

  it('marks non-zero exit codes as failed while preserving output', async () => {
    const settings = createSettings()
    const provider = resolveAssistantRunnerProvider(settings, 'provider-local')
    const runner = createAssistantRunner({
      isTauri: () => true,
      invoke: async () => ({
        stdout: '',
        stderr: 'bad command',
        exitCode: 7,
        durationMs: 15,
      }),
    })

    await runner.run(provider, '写一个开头')

    expect(runner.error.value).toBe('本地命令退出码为 7。')
    expect(runner.result.value).toEqual({
      stdout: '',
      stderr: 'bad command',
      exitCode: 7,
      durationMs: 15,
    })
  })
})

function createSettings(input: { localCommand?: string } = {}): AssistantSettings {
  return {
    ...createAssistantSettings(),
    defaultProviderId: 'provider-api',
    defaultModel: 'gpt-4.1-mini',
    providers: [
      {
        id: 'provider-api',
        kind: 'openai-compatible',
        name: 'API',
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        model: 'gpt-4.1-mini',
        terminalCommand: '',
        enabled: true,
        createdAt: '2026-05-29T00:00:00.000Z',
        updatedAt: '2026-05-29T00:00:00.000Z',
      },
      {
        id: 'provider-local',
        kind: 'local-terminal',
        name: 'Ollama',
        baseUrl: '',
        apiKey: '',
        model: 'llama3.1',
        terminalCommand: input.localCommand ?? 'cat',
        enabled: true,
        createdAt: '2026-05-29T00:00:00.000Z',
        updatedAt: '2026-05-29T00:00:00.000Z',
      },
    ],
    featureBindings: [],
  }
}
