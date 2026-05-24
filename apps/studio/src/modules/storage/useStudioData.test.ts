import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from './types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from './document'
import { resetStudioDataForTest, useStudioData } from './useStudioData'

describe('useStudioData', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'))
  })

  it('loads persisted documents from the storage driver', async () => {
    const persistedDocument: StudioDataDocument = {
      ...createDefaultStudioDataDocument(),
      activeWorkspaceId: 'workspace-wu-gang-lai-xin',
    }
    const driver = createDriver(persistedDocument)

    const studioData = useStudioData(driver)
    await studioData.ready

    expect(studioData.isLoaded.value).toBe(true)
    expect(studioData.document.value.activeWorkspaceId).toBe('workspace-wu-gang-lai-xin')
    expect(driver.save).not.toHaveBeenCalled()
  })

  it('creates and saves a default document when no persisted document exists', async () => {
    const driver = createDriver(undefined)

    const studioData = useStudioData(driver)
    await studioData.ready

    expect(studioData.document.value.activeWorkspaceId).toBe('workspace-long-ye-shou-gao')
    expect(driver.save).toHaveBeenCalledWith(studioData.document.value)
  })

  it('saves document updates', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready

    studioData.updateDocument((document) => {
      document.activeWorkspaceId = 'workspace-wu-gang-lai-xin'
    })
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-wu-gang-lai-xin',
    }))
  })
})

function createDriver(document: StudioDataDocument | undefined): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
