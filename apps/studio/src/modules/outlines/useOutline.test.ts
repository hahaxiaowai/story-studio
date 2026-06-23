import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useOutline } from './useOutline'

describe('useOutline', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-25T10:00:00.000Z'))
  })

  it('exposes the active workspace outline', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready

    const outline = useOutline()

    expect(outline.workspaceOutline.value.workspaceId).toBe('workspace-mo-shou-shi-jie')
    expect(outline.beats.value.map(beat => beat.title)).toEqual([
      '黑暗之门开启',
      '萨尔建立新部落',
      '海加尔山并肩作战',
      '天谴之门灾变',
      '燃烧军团再临',
      '第四次大战爆发',
    ])
    expect(outline.plotLines.value.map(line => line.title)).toEqual([
      '艾泽拉斯主线',
      '联盟与部落',
      '燃烧军团',
      '天灾与暗影',
    ])
    expect(outline.eventTags.value.map(tag => tag.label)).toEqual(['冲突', '高潮', '转折', '日常', '战争', '背叛', '牺牲'])
  })

  it('creates a missing active workspace outline and saves it', async () => {
    const document = {
      ...createDefaultStudioDataDocument(),
      outlines: [],
    }
    const driver = createDriver(document)
    const studioData = useStudioData(driver)
    await studioData.ready

    const outline = useOutline()
    await nextTick()

    expect(outline.workspaceOutline.value.workspaceId).toBe('workspace-mo-shou-shi-jie')
    expect(studioData.document.value.outlines).toHaveLength(1)
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      outlines: expect.arrayContaining([
        expect.objectContaining({ workspaceId: 'workspace-mo-shou-shi-jie' }),
      ]),
    }))
  })

  it('adds and edits beats inside the active workspace outline', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready
    const outline = useOutline()

    const beat = outline.addBeat()
    outline.updateBeat(beat.id, {
      title: '雨夜相遇',
      timeLabel: '第七天',
      summary: '主角和搭档第一次互相托底。',
      events: [
        {
          id: 'event-a',
          title: '码头冲突',
          description: '追捕者出现。',
          tagIds: ['conflict'],
        },
      ],
      characterChanges: [
        {
          id: 'change-a',
          characterId: 'character-lin-che',
          category: 'relationship',
          summary: '从怀疑转向信任。',
        },
      ],
    })
    await nextTick()

    expect(outline.beats.value).toHaveLength(7)
    expect(outline.beats.value.at(-1)).toMatchObject({
      title: '雨夜相遇',
      timeLabel: '第七天',
      events: [{ tagIds: ['conflict'] }],
      characterChanges: [{ characterId: 'character-lin-che' }],
    })
    expect(studioData.document.value.outlines[0]?.beats.at(-1)?.title).toBe('雨夜相遇')
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      outlines: expect.arrayContaining([
        expect.objectContaining({
          beats: expect.arrayContaining([
            expect.objectContaining({ title: '雨夜相遇' }),
          ]),
        }),
      ]),
    }))
  })

  it('saves plot line drafts inside the active workspace outline', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    const studioData = useStudioData(driver)
    await studioData.ready
    const outline = useOutline()

    outline.savePlotLines([
      { id: 'plot-alliance-horde', title: '阵营战争线', kind: 'branch', color: '#dc2626', order: 1 },
      { id: 'plot-main', title: '艾泽拉斯核心线', kind: 'main', color: '#2563eb', order: 0 },
    ])
    await nextTick()

    expect(outline.plotLines.value.slice(0, 2).map(line => ({
      id: line.id,
      title: line.title,
      order: line.order,
    }))).toEqual([
      { id: 'plot-alliance-horde', title: '阵营战争线', order: 0 },
      { id: 'plot-main', title: '艾泽拉斯核心线', order: 1 },
    ])
    expect(studioData.document.value.outlines[0]?.plotLines[0]?.title).toBe('阵营战争线')
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      outlines: expect.arrayContaining([
        expect.objectContaining({
          plotLines: expect.arrayContaining([
            expect.objectContaining({ id: 'plot-main', title: '艾泽拉斯核心线', order: 1 }),
          ]),
        }),
      ]),
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
