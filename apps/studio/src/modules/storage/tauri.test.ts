import { describe, expect, it, vi } from 'vitest'
import { createDefaultStudioDataDocument } from './document'
import { createTauriStudioStorageDriver } from './tauri'

describe('tauri studio storage driver', () => {
  it('loads undefined when the Tauri command returns null', async () => {
    const invoke = vi.fn().mockResolvedValue(null)
    const driver = createTauriStudioStorageDriver(invoke)

    await expect(driver.load()).resolves.toBeUndefined()
    expect(invoke).toHaveBeenCalledWith('load_studio_data')
  })

  it('saves the document through the Tauri command', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)
    const document = createDefaultStudioDataDocument()
    const driver = createTauriStudioStorageDriver(invoke)

    await driver.save(document)

    expect(invoke).toHaveBeenCalledWith('save_studio_data', { document })
  })
})
