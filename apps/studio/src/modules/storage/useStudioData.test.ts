import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from './types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isProxy, nextTick } from 'vue'
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
      activeWorkspaceId: 'workspace-star-harbor',
    }
    const driver = createDriver(persistedDocument)

    const studioData = useStudioData(driver)
    await studioData.ready

    expect(studioData.isLoaded.value).toBe(true)
    expect(studioData.document.value.activeWorkspaceId).toBe('workspace-star-harbor')
    expect(driver.save).not.toHaveBeenCalled()
  })

  it('creates and saves a default document when no persisted document exists', async () => {
    const driver = createDriver(undefined)

    const studioData = useStudioData(driver)
    await studioData.ready

    expect(studioData.document.value.activeWorkspaceId).toBe('workspace-mo-shou-shi-jie')
    expect(driver.save).toHaveBeenCalledWith(studioData.document.value)
  })

  it('saves document updates', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready

    studioData.updateDocument((document) => {
      document.activeWorkspaceId = 'workspace-star-harbor'
    })
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-star-harbor',
    }))
  })

  it('saves plain JSON documents instead of Vue proxies', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready

    studioData.updateDocument((document) => {
      document.workspaces.push({
        id: 'workspace-star-harbor',
        title: 'Star Harbor',
        description: '远航故事',
        status: 'draft',
        moduleCounts: {
          characters: 0,
          content: 0,
          maps: 0,
          outline: 0,
        },
        createdAt: '2026-05-24T12:00:00.000Z',
        updatedAt: '2026-05-24T12:00:00.000Z',
      })
    })
    await nextTick()

    const savedDocument = driver.save.mock.calls.at(-1)?.[0]

    expect(savedDocument).toBeDefined()
    expect(isProxy(savedDocument)).toBe(false)
    expect(isProxy(savedDocument?.workspaces)).toBe(false)
  })

  it('replaces and immediately persists an imported document', async () => {
    const current = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
    const imported = {
      ...createDefaultStudioDataDocument('2026-07-11T08:00:00.000Z'),
      activeWorkspaceId: 'imported',
    }
    const driver = createDriver(current)
    const studioData = useStudioData(driver)
    await studioData.ready

    await studioData.replaceDocument(imported)

    expect(studioData.document.value).toEqual(imported)
    expect(driver.save).toHaveBeenLastCalledWith(imported)
  })

  it('restores the current document when imported persistence fails', async () => {
    const current = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
    const imported = {
      ...current,
      activeWorkspaceId: 'imported',
    }
    const driver = createDriver(current)
    const studioData = useStudioData(driver)
    await studioData.ready
    driver.save.mockRejectedValueOnce(new Error('disk full'))

    await expect(studioData.replaceDocument(imported)).rejects.toThrow('disk full')

    expect(studioData.document.value).toEqual(current)
    expect(studioData.loadError.value?.message).toBe('disk full')
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
