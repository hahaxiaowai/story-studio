import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from './useWorkspaces'

describe('useWorkspaces', () => {
  beforeEach(() => {
    resetStudioDataForTest()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'))
  })

  it('persists the active workspace when switching workspaces', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    const workspace = workspaces.addWorkspace({
      title: 'Star Harbor',
    })
    workspaces.setActiveWorkspace(workspace.id)
    await nextTick()

    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-star-harbor',
    }))
  })

  it('persists newly added workspaces', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    const workspace = workspaces.addWorkspace()
    await nextTick()

    expect(workspace.title).toBe('未命名作品 2')
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-wei-ming-ming-zuo-pin-2',
      workspaces: expect.arrayContaining([
        expect.objectContaining({ id: 'workspace-wei-ming-ming-zuo-pin-2' }),
      ]),
    }))
  })

  it('persists workspace descriptions when adding workspaces', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    const workspace = workspaces.addWorkspace({
      title: 'Star Harbor',
      description: '远航故事',
    })
    await nextTick()

    expect(workspace).toMatchObject({
      id: 'workspace-star-harbor',
      title: 'Star Harbor',
      description: '远航故事',
    })
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-star-harbor',
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-star-harbor',
          description: '远航故事',
        }),
      ]),
    }))
  })

  it('persists current workspace details without changing the workspace id', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    workspaces.saveActiveWorkspaceDetails({
      title: '魔兽世界 修订版',
      description: '更新后的作品简介',
    })
    await nextTick()

    expect(workspaces.activeWorkspace.value).toMatchObject({
      id: 'workspace-mo-shou-shi-jie',
      title: '魔兽世界 修订版',
      description: '更新后的作品简介',
      updatedAt: '2026-05-24T12:00:00.000Z',
    })
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-mo-shou-shi-jie',
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          title: '魔兽世界 修订版',
          description: '更新后的作品简介',
        }),
      ]),
    }))
  })

  it('persists archiving the active workspace and switches to another draft workspace', async () => {
    const driver = createDriver(createDefaultStudioDataDocument())
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    const nextWorkspace = workspaces.addWorkspace({
      title: 'Star Harbor',
    })
    workspaces.setActiveWorkspace('workspace-mo-shou-shi-jie')
    workspaces.archiveActiveWorkspace()
    await nextTick()

    expect(workspaces.activeWorkspaceId.value).toBe(nextWorkspace.id)
    expect(workspaces.archivedWorkspaces.value.map(workspace => workspace.id)).toEqual(['workspace-mo-shou-shi-jie'])
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: nextWorkspace.id,
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-mo-shou-shi-jie',
          status: 'archived',
        }),
      ]),
    }))
  })

  it('persists restoring archived workspaces and activates them', async () => {
    const document = createDefaultStudioDataDocument()
    document.workspaces.push({
      ...document.workspaces[0]!,
      id: 'workspace-archived',
      title: '归档作品',
      status: 'archived',
    })
    const driver = createDriver(document)
    await useStudioData(driver).ready

    const workspaces = useWorkspaces()
    workspaces.restoreArchivedWorkspace('workspace-archived')
    await nextTick()

    expect(workspaces.activeWorkspaceId.value).toBe('workspace-archived')
    expect(workspaces.draftWorkspaces.value.map(workspace => workspace.id)).toContain('workspace-archived')
    expect(driver.save).toHaveBeenLastCalledWith(expect.objectContaining({
      activeWorkspaceId: 'workspace-archived',
      workspaces: expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-archived',
          status: 'draft',
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
