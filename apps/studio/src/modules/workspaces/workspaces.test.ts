import { describe, expect, it } from 'vitest'
import {
  appendWorkspace,
  getNavigationLabelKey,
  getWorkspaceById,
  getWorkspaceModuleLabelKey,
} from './workspaces'

describe('workspaces', () => {
  it('adds a workspace and makes it active', () => {
    const result = appendWorkspace([], {
      title: '长夜手稿',
      now: '2026-05-24T00:00:00.000Z',
    })

    expect(result.activeWorkspaceId).toBe('workspace-long-ye-shou-gao')
    expect(result.workspaces).toMatchObject([
      {
        id: 'workspace-long-ye-shou-gao',
        title: '长夜手稿',
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
    expect(getWorkspaceModuleLabelKey('maps')).toBe('nav.maps')
    expect(getWorkspaceModuleLabelKey('content')).toBe('nav.content')
  })

  it('maps navigation hashes to locale labels', () => {
    expect(getNavigationLabelKey('#outline')).toBe('nav.outline')
    expect(getNavigationLabelKey('#cast')).toBe('nav.characters')
    expect(getNavigationLabelKey('#manuscript')).toBe('nav.content')
    expect(getNavigationLabelKey('#materials')).toBe('nav.materials')
    expect(getNavigationLabelKey('#unknown')).toBe('nav.content')
  })
})
