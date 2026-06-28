import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useContent } from './useContent'

describe('useContent', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-28T12:00:00.000Z'))
  })

  it('adds markdown content entries for the active workspace', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const entry = content.addEntry()
    await nextTick()

    expect(entry).toMatchObject({
      workspaceId: 'workspace-mo-shou-shi-jie',
      volume: '第一卷',
      chapter: '第1章',
      body: '',
      order: 0,
    })
    expect(content.entries.value).toHaveLength(1)
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({
          id: entry.id,
          body: '',
        }),
      ]),
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          moduleCounts: expect.objectContaining({ content: 1 }),
        }),
      ]),
    }))
  })

  it('updates markdown content entries', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const entry = content.addEntry()
    content.updateEntry(entry.id, {
      volume: '第二卷',
      chapter: '第二章',
      body: '## 正文',
    })
    await nextTick()

    expect(content.entries.value[0]).toMatchObject({
      volume: '第二卷',
      chapter: '第二章',
      body: '## 正文',
      updatedAt: '2026-05-28T12:00:00.000Z',
    })
  })

  it('links content entries to outline beats with one-to-one ownership', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const firstEntry = content.addEntry()
    const secondEntry = content.addEntry()
    content.linkEntryToBeat(firstEntry.id, 'beat-dark-portal')
    content.linkEntryToBeat(secondEntry.id, 'beat-dark-portal')
    await nextTick()

    expect(content.entries.value.map(entry => ({
      id: entry.id,
      outlineBeatId: entry.outlineBeatId,
    }))).toEqual([
      { id: firstEntry.id, outlineBeatId: undefined },
      { id: secondEntry.id, outlineBeatId: 'beat-dark-portal' },
    ])
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({
          id: secondEntry.id,
          outlineBeatId: 'beat-dark-portal',
        }),
      ]),
    }))
  })

  it('moves entries inside the active workspace only', async () => {
    const sourceDocument = createDefaultStudioDataDocument()
    sourceDocument.contents = [
      {
        id: 'other-content',
        workspaceId: 'workspace-other',
        volume: '第一卷',
        chapter: '外部章节',
        fineOutline: '',
        body: '',
        order: 0,
        createdAt: '2026-05-28T10:00:00.000Z',
        updatedAt: '2026-05-28T10:00:00.000Z',
      },
    ]
    const driver = createDriver(sourceDocument)
    await useStudioData(driver).ready

    const content = useContent()
    const firstEntry = content.addEntry()
    const secondEntry = content.addEntry()
    const thirdEntry = content.addEntry()
    content.moveEntry(secondEntry.id, 'up')
    await nextTick()

    expect(content.entries.value.map(entry => entry.id)).toEqual([
      secondEntry.id,
      firstEntry.id,
      thirdEntry.id,
    ])
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({ id: 'other-content', workspaceId: 'workspace-other', order: 0 }),
        expect.objectContaining({ id: secondEntry.id, order: 0 }),
        expect.objectContaining({ id: firstEntry.id, order: 1 }),
        expect.objectContaining({ id: thirdEntry.id, order: 2 }),
      ]),
    }))
  })

  it('filters entries with local search state without saving the document', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const firstEntry = content.addEntry()
    const secondEntry = content.addEntry()
    const thirdEntry = content.addEntry()

    content.updateEntry(firstEntry.id, {
      volume: '第一卷',
      chapter: '雨夜',
      body: '钟楼停在十一点',
    })
    content.updateEntry(secondEntry.id, {
      volume: '第二卷',
      chapter: '雾城',
      body: 'Alice 进入旧街区',
    })
    content.updateEntry(thirdEntry.id, {
      volume: '第三卷',
      chapter: '归途',
      body: '黎明之后返回故乡',
    })
    await nextTick()

    const saveCallCount = driver.save.mock.calls.length

    content.searchQuery.value = 'alice'
    await nextTick()

    expect(content.entries.value.map(entry => entry.id)).toEqual([secondEntry.id])
    expect(content.allEntries.value.map(entry => entry.id)).toEqual([
      firstEntry.id,
      secondEntry.id,
      thirdEntry.id,
    ])
    expect(content.entryCounts.value).toEqual({
      total: 3,
      filtered: 1,
    })
    expect(driver.save).toHaveBeenCalledTimes(saveCallCount)
  })

  it('adds entries after the full workspace list when search is active', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const firstEntry = content.addEntry()
    const secondEntry = content.addEntry()
    content.updateEntry(firstEntry.id, { chapter: '雨夜' })
    content.updateEntry(secondEntry.id, { chapter: '雾城' })
    await nextTick()

    content.searchQuery.value = '雨夜'
    await nextTick()

    const thirdEntry = content.addEntry()
    await nextTick()

    expect(thirdEntry).toMatchObject({
      chapter: '第3章',
      order: 2,
    })
    expect(content.entryCounts.value).toEqual({
      total: 3,
      filtered: 1,
    })
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({ id: thirdEntry.id, chapter: '第3章', order: 2 }),
      ]),
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          moduleCounts: expect.objectContaining({ content: 3 }),
        }),
      ]),
    }))
  })

  it('removes entries and updates content counts', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const content = useContent()
    const firstEntry = content.addEntry()
    content.addEntry()
    content.removeEntry(firstEntry.id)
    await nextTick()

    expect(content.entries.value).toHaveLength(1)
    expect(content.entries.value[0]?.order).toBe(0)
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          moduleCounts: expect.objectContaining({ content: 1 }),
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
