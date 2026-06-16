import { describe, expect, it } from 'vitest'
import {
  appendWorkspace,
  getNavigationLabelKey,
  getWorkspaceById,
  getWorkspaceModuleLabelKey,
  isPublicNavigationHash,
  updateWorkspaceDetails,
  updateWorkspaceStoryStyle,
} from './workspaces'

describe('workspaces', () => {
  it('adds a workspace and makes it active', () => {
    const result = appendWorkspace([], {
      title: '魔兽世界',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(result.activeWorkspaceId).toBe('workspace-mo-shou-shi-jie')
    expect(result.workspaces).toMatchObject([
      {
        id: 'workspace-mo-shou-shi-jie',
        title: '魔兽世界',
        moduleCounts: {
          characters: 0,
          content: 0,
          maps: 0,
          outline: 0,
        },
      },
    ])
  })

  it('creates readable ids for unnamed Chinese workspaces', () => {
    const result = appendWorkspace([], {
      title: '未命名作品 3',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(result.activeWorkspaceId).toBe('workspace-wei-ming-ming-zuo-pin-3')
  })

  it('stores workspace descriptions', () => {
    const result = appendWorkspace([], {
      title: '海上群星',
      description: '一部关于远航与失忆城市的作品',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(result.workspaces[0]).toMatchObject({
      title: '海上群星',
      description: '一部关于远航与失忆城市的作品',
    })
  })

  it('keeps new workspace story style unset by default', () => {
    const result = appendWorkspace([], {
      title: '海上群星',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(result.workspaces[0]?.storyStyleId).toBeUndefined()
  })

  it('updates story style for only the selected workspace', () => {
    const firstResult = appendWorkspace([], {
      title: '海上群星',
      now: '2026-05-24T00:00:00.000Z',
    })
    const secondResult = appendWorkspace(firstResult.workspaces, {
      title: '雾港来信',
      now: '2026-05-24T00:00:00.000Z',
    })

    const workspaces = updateWorkspaceStoryStyle(secondResult.workspaces, firstResult.activeWorkspaceId, 'story-style-epic-fantasy')

    expect(workspaces.find(workspace => workspace.id === firstResult.activeWorkspaceId)?.storyStyleId).toBe('story-style-epic-fantasy')
    expect(workspaces.find(workspace => workspace.id === secondResult.activeWorkspaceId)?.storyStyleId).toBeUndefined()
  })

  it('updates workspace details while keeping workspace ids stable', () => {
    const firstResult = appendWorkspace([], {
      title: 'Star Harbor',
      description: '旧简介',
      now: '2026-05-24T00:00:00.000Z',
    })
    const secondResult = appendWorkspace(firstResult.workspaces, {
      title: '雾港来信',
      now: '2026-05-24T00:00:00.000Z',
    })

    const workspaces = updateWorkspaceDetails(secondResult.workspaces, firstResult.activeWorkspaceId, {
      title: '  Star Harbor Revised  ',
      description: '  新简介  ',
      now: '2026-05-24T13:00:00.000Z',
    })

    expect(workspaces.find(workspace => workspace.id === firstResult.activeWorkspaceId)).toMatchObject({
      id: 'workspace-star-harbor',
      title: 'Star Harbor Revised',
      description: '新简介',
      updatedAt: '2026-05-24T13:00:00.000Z',
    })
    expect(workspaces.find(workspace => workspace.id === secondResult.activeWorkspaceId)?.title).toBe('雾港来信')
  })

  it('clears workspace descriptions when saving blank descriptions', () => {
    const result = appendWorkspace([], {
      title: 'Star Harbor',
      description: '旧简介',
      now: '2026-05-24T00:00:00.000Z',
    })

    const workspaces = updateWorkspaceDetails(result.workspaces, result.activeWorkspaceId, {
      title: 'Star Harbor',
      description: '   ',
      now: '2026-05-24T13:00:00.000Z',
    })

    expect(workspaces[0]?.description).toBeUndefined()
  })

  it('rejects empty workspace titles when updating details', () => {
    const result = appendWorkspace([], {
      title: 'Star Harbor',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(() => updateWorkspaceDetails(result.workspaces, result.activeWorkspaceId, {
      title: '   ',
      now: '2026-05-24T13:00:00.000Z',
    })).toThrow('Workspace title is required.')
  })

  it('rejects empty workspace titles', () => {
    expect(() => appendWorkspace([], {
      title: '   ',
      now: '2026-05-24T00:00:00.000Z',
    })).toThrow('Workspace title is required.')
  })

  it('creates unique ids for duplicate workspace titles', () => {
    const firstResult = appendWorkspace([], {
      title: 'Story Studio',
      now: '2026-05-24T00:00:00.000Z',
    })
    const secondResult = appendWorkspace(firstResult.workspaces, {
      title: 'Story Studio',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(secondResult.activeWorkspaceId).toBe('workspace-story-studio-2')
    expect(secondResult.workspaces[1]).toMatchObject({
      id: 'workspace-story-studio-2',
      title: 'Story Studio',
    })
  })

  it('finds a workspace by id', () => {
    const result = appendWorkspace([], {
      title: 'Story Studio',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(getWorkspaceById(result.workspaces, result.activeWorkspaceId)?.title).toBe('Story Studio')
  })

  it('maps workspace modules to locale labels', () => {
    expect(getWorkspaceModuleLabelKey('outline')).toBe('nav.outline')
    expect(getWorkspaceModuleLabelKey('characters')).toBe('nav.characters')
    expect(getWorkspaceModuleLabelKey('maps')).toBe('nav.world')
    expect(getWorkspaceModuleLabelKey('content')).toBe('nav.content')
  })

  it('maps navigation hashes to locale labels', () => {
    expect(getNavigationLabelKey('#outline')).toBe('nav.outline')
    expect(getNavigationLabelKey('#cast')).toBe('nav.characters')
    expect(getNavigationLabelKey('#maps')).toBe('nav.world')
    expect(getNavigationLabelKey('#world-settings')).toBe('nav.worldSettings')
    expect(getNavigationLabelKey('#world-map')).toBe('nav.worldMap')
    expect(getNavigationLabelKey('#manuscript')).toBe('nav.content')
    expect(getNavigationLabelKey('#materials')).toBe('nav.materials')
    expect(getNavigationLabelKey('#assistant')).toBe('nav.assistant')
    expect(getNavigationLabelKey('#unknown')).toBe('nav.content')
  })

  it('detects public navigation hashes', () => {
    expect(isPublicNavigationHash('#materials')).toBe(true)
    expect(isPublicNavigationHash('#assistant')).toBe(true)
    expect(isPublicNavigationHash('#outline')).toBe(false)
    expect(isPublicNavigationHash('#manuscript')).toBe(false)
  })
})
