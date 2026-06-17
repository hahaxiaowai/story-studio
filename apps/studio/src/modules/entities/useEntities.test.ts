import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useEntities } from './useEntities'

describe('useEntities', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-25T12:00:00.000Z'))
  })

  it('syncs character module counts when adding and removing records', async () => {
    const document = createDefaultStudioDataDocument()
    document.entityRecords = []
    document.workspaces = document.workspaces.map(workspace => ({
      ...workspace,
      moduleCounts: {
        ...workspace.moduleCounts,
        characters: 0,
      },
    }))
    const driver = createDriver(document)
    await useStudioData(driver).ready

    const characters = useEntities('character')
    const record = characters.addRecord()
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          moduleCounts: expect.objectContaining({ characters: 1 }),
        }),
      ]),
    }))

    characters.removeRecord(record.id)
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          moduleCounts: expect.objectContaining({ characters: 0 }),
        }),
      ]),
    }))
  })
})

function createDriver(document: StudioDataDocument): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
