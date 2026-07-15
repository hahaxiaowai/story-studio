import type { StudioDataDocument } from '@story-studio/types'
import type { AutomaticBackupClient, AutomaticBackupEntry } from './automaticBackup'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { AUTOMATIC_BACKUP_INTERVAL_MS } from './automaticBackup'
import { createAutomaticBackupController } from './useAutomaticBackup'

describe('useAutomaticBackup controller', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('checks immediately after data is ready and every ten minutes', async () => {
    const { input, client } = testInput()
    const controller = createAutomaticBackupController(input)

    await controller.start()
    expect(client.list).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(AUTOMATIC_BACKUP_INTERVAL_MS)
    expect(client.list).toHaveBeenCalledTimes(2)
  })

  it('does nothing in the web runtime', async () => {
    const { input, client } = testInput({ isTauri: false })

    await createAutomaticBackupController(input).start()

    expect(client.getSettings).not.toHaveBeenCalled()
    expect(client.list).not.toHaveBeenCalled()
  })

  it('prunes without creating when the current version already exists', async () => {
    const existing = entry('version-1')
    const { input, client } = testInput({ entries: [existing] })

    await createAutomaticBackupController(input).start()

    expect(client.prune).toHaveBeenCalledOnce()
    expect(client.create).not.toHaveBeenCalled()
  })

  it('creates a plain scheduled snapshot when the document changed', async () => {
    const { input, client, document } = testInput()

    await createAutomaticBackupController(input).start()

    expect(client.create).toHaveBeenCalledWith(JSON.parse(JSON.stringify(document.value)), 'scheduled')
  })

  it('prevents overlapping checks and retries after failure', async () => {
    let resolveList!: (entries: AutomaticBackupEntry[]) => void
    const pendingList = new Promise<AutomaticBackupEntry[]>(resolve => resolveList = resolve)
    const { input, client } = testInput()
    client.list.mockReturnValueOnce(pendingList)
    const controller = createAutomaticBackupController(input)

    const first = controller.checkNow()
    const second = controller.checkNow()
    expect(client.list).toHaveBeenCalledOnce()
    resolveList([])
    await Promise.all([first, second])

    client.list.mockRejectedValueOnce(new Error('disk unavailable'))
    await controller.checkNow()
    expect(controller.error.value?.message).toBe('disk unavailable')
    await controller.checkNow()
    expect(controller.error.value).toBeUndefined()
  })

  it('stops while disabled and checks immediately when re-enabled', async () => {
    const { input, client } = testInput({ enabled: false })
    const controller = createAutomaticBackupController(input)

    await controller.start()
    expect(client.list).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(AUTOMATIC_BACKUP_INTERVAL_MS)
    expect(client.list).toHaveBeenCalledOnce()

    await controller.setEnabled(true)
    expect(client.create).toHaveBeenCalledOnce()
    controller.stop()
    await vi.advanceTimersByTimeAsync(AUTOMATIC_BACKUP_INTERVAL_MS)
    expect(client.list).toHaveBeenCalledTimes(2)
  })

  it('surfaces cleanup warnings and refuses scheduling when settings fail', async () => {
    const first = testInput({ warnings: ['cleanup failed'] })
    const controller = createAutomaticBackupController(first.input)
    await controller.start()
    expect(controller.cleanupWarnings.value).toEqual(['cleanup failed'])

    const failed = testInput()
    failed.client.getSettings.mockRejectedValueOnce(new Error('invalid settings'))
    const failedController = createAutomaticBackupController(failed.input)
    await failedController.start()
    expect(failedController.error.value?.message).toBe('invalid settings')
    expect(failed.client.list).not.toHaveBeenCalled()
  })
})

function testInput(options: {
  isTauri?: boolean
  enabled?: boolean
  entries?: AutomaticBackupEntry[]
  warnings?: string[]
} = {}) {
  const document = ref({ updatedAt: 'version-1', nested: { value: true } } as unknown as StudioDataDocument)
  const created = entry('version-1')
  const client = {
    getSettings: vi.fn().mockResolvedValue({ enabled: options.enabled ?? true }),
    setEnabled: vi.fn().mockImplementation(async enabled => ({ enabled })),
    list: vi.fn().mockResolvedValue(options.entries ?? []),
    create: vi.fn().mockResolvedValue({ entry: created, cleanupWarnings: options.warnings ?? [] }),
    prune: vi.fn().mockResolvedValue({ cleanupWarnings: options.warnings ?? [] }),
    read: vi.fn().mockResolvedValue('{}'),
  }

  return {
    client,
    document,
    input: {
      isTauri: options.isTauri ?? true,
      client: client as unknown as AutomaticBackupClient,
      document,
      ready: Promise.resolve(),
      now: () => new Date('2026-07-15T04:00:00.000Z'),
    },
  }
}

function entry(documentUpdatedAt: string): AutomaticBackupEntry {
  return {
    id: `backup-${documentUpdatedAt}`,
    source: 'scheduled',
    createdAt: '2026-07-15T03:00:00.000Z',
    documentUpdatedAt,
    byteSize: 10,
    status: 'valid',
  }
}
