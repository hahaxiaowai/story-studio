import type { TimelineBeat, WorkspaceContentEntry } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  buildContentAssistantPrompt,
  countContentWords,
  mergeAssistantDraftIntoContent,
} from './contentAssistant'

describe('content assistant helpers', () => {
  it('counts readable Chinese characters and English words without markdown noise', () => {
    expect(countContentWords('# 第一章\n\n少年 Alice 走进 **雾城**。')).toBe(10)
  })

  it('builds a continuation prompt with workspace and chapter context', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'continue',
      workspaceTitle: '雾城档案',
      entry: createEntry({ body: '雨夜里，钟楼停在十一点。' }),
    })

    expect(prompt).toContain('作品：雾城档案')
    expect(prompt).toContain('章节：第一卷 / 第一章')
    expect(prompt).toContain('目标：续写当前章节')
    expect(prompt).toContain('雨夜里，钟楼停在十一点。')
  })

  it('builds an empty-chapter draft prompt when body is blank', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'polish',
      workspaceTitle: '雾城档案',
      entry: createEntry({ body: '   ' }),
    })

    expect(prompt).toContain('目标：润色当前章节')
    expect(prompt).toContain('当前章节暂无正文')
  })

  it('includes linked outline beat context in the prompt', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'check-consistency',
      workspaceTitle: '雾城档案',
      entry: createEntry({
        body: '钟楼地下室里，林雾发现钥匙不见了。',
        outlineBeatId: 'beat-clocktower',
      }),
      linkedBeat: createBeat(),
    })

    expect(prompt).toContain('关联情节点：')
    expect(prompt).toContain('标题：钟楼停摆')
    expect(prompt).toContain('时间：雨夜十一点')
    expect(prompt).toContain('摘要：主角在钟楼发现时间异常。')
    expect(prompt).toContain('- 门卫听见地下齿轮反转：线索第一次出现。')
    expect(prompt).toContain('- character-keeper / state：隐瞒自己知道钥匙去向。')
  })

  it('does not include linked beat section when there is no linked beat', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'continue',
      workspaceTitle: '雾城档案',
      entry: createEntry({ body: '雨夜里，钟楼停在十一点。' }),
    })

    expect(prompt).not.toContain('关联情节点：')
  })

  it('asks for a first draft when continuing an empty chapter with a linked beat', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'continue',
      workspaceTitle: '雾城档案',
      entry: createEntry({ body: '', outlineBeatId: 'beat-clocktower' }),
      linkedBeat: createBeat(),
    })

    expect(prompt).toContain('目标：基于关联情节点生成章节初稿')
    expect(prompt).toContain('请根据关联情节点生成当前章节初稿')
  })

  it('appends assistant draft after existing body with a blank line', () => {
    expect(mergeAssistantDraftIntoContent({
      body: '旧正文',
      draft: '新草稿',
      mode: 'append',
    })).toBe('旧正文\n\n新草稿')
  })

  it('uses assistant draft directly when appending to an empty body', () => {
    expect(mergeAssistantDraftIntoContent({
      body: '   ',
      draft: '新草稿',
      mode: 'append',
    })).toBe('新草稿')
  })

  it('replaces body with assistant draft', () => {
    expect(mergeAssistantDraftIntoContent({
      body: '旧正文',
      draft: '新草稿',
      mode: 'replace',
    })).toBe('新草稿')
  })
})

function createEntry(input: Partial<WorkspaceContentEntry> = {}): WorkspaceContentEntry {
  return {
    id: input.id ?? 'content-1',
    workspaceId: input.workspaceId ?? 'workspace-story',
    outlineBeatId: input.outlineBeatId,
    volume: input.volume ?? '第一卷',
    chapter: input.chapter ?? '第一章',
    body: input.body ?? '',
    order: input.order ?? 0,
    createdAt: input.createdAt ?? '2026-06-16T08:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-06-16T08:00:00.000Z',
  }
}

function createBeat(input: Partial<TimelineBeat> = {}): TimelineBeat {
  return {
    id: input.id ?? 'beat-clocktower',
    title: input.title ?? '钟楼停摆',
    order: input.order ?? 0,
    timeLabel: input.timeLabel ?? '雨夜十一点',
    summary: input.summary ?? '主角在钟楼发现时间异常。',
    plotLineIds: input.plotLineIds ?? ['plot-main'],
    events: input.events ?? [
      {
        id: 'event-gear',
        title: '门卫听见地下齿轮反转',
        description: '线索第一次出现。',
        tagIds: ['clue'],
      },
    ],
    characterChanges: input.characterChanges ?? [
      {
        id: 'change-keeper',
        characterId: 'character-keeper',
        category: 'state',
        summary: '隐瞒自己知道钥匙去向。',
      },
    ],
    createdAt: input.createdAt ?? '2026-06-16T08:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-06-16T08:00:00.000Z',
  }
}
