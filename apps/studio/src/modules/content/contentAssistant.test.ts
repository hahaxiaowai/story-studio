import type { TimelineBeat, WorkspaceContentEntry } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import {
  applyContentInlineAssistantSuggestion,
  buildContentAssistantPrompt,
  buildContentInlineAssistantPrompt,
  countContentWords,
  createContentFineOutlineDraftFromBeat,
  createContentInlineAssistantSuggestionPreview,
  createContentInlineAssistantTarget,
  insertAssistantDraftIntoContentEntries,
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

  it('builds a full chapter prompt from fine outline and linked beat context', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'draft-full-chapter',
      workspaceTitle: '雾城档案',
      entry: createEntry({
        body: '',
        fineOutline: '1. 林雾进入钟楼。\n2. 门卫说出钥匙丢失。\n3. 地下齿轮开始反转。',
        outlineBeatId: 'beat-clocktower',
      }),
      linkedBeat: createBeat(),
    })

    expect(prompt).toContain('目标：按细纲完整生成本章')
    expect(prompt).toContain('章节细纲：')
    expect(prompt).toContain('1. 林雾进入钟楼。')
    expect(prompt).toContain('关联情节点：')
    expect(prompt).toContain('标题：钟楼停摆')
  })

  it('uses existing body as reference instead of continuing when drafting a full chapter', () => {
    const prompt = buildContentAssistantPrompt({
      action: 'draft-full-chapter',
      workspaceTitle: '雾城档案',
      entry: createEntry({
        body: '雨夜里，钟楼停在十一点。',
        fineOutline: '1. 重写开场。\n2. 推进到地下室。',
      }),
    })

    expect(prompt).toContain('当前正文仅作为风格和连续性参考')
    expect(prompt).toContain('不要只续写、摘要或列提纲')
    expect(prompt).toContain('雨夜里，钟楼停在十一点。')
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

  it('inserts assistant draft into the selected target entry only', () => {
    const entries = [
      createEntry({ id: 'content-1', body: '第一章旧正文' }),
      createEntry({ id: 'content-2', body: '第二章旧正文' }),
    ]

    const nextEntries = insertAssistantDraftIntoContentEntries(entries, {
      entryId: 'content-2',
      draft: '第二章新草稿',
      mode: 'append',
      now: '2026-06-16T09:00:00.000Z',
    })

    expect(nextEntries[0]).toEqual(entries[0])
    expect(nextEntries[1]).toMatchObject({
      id: 'content-2',
      body: '第二章旧正文\n\n第二章新草稿',
      updatedAt: '2026-06-16T09:00:00.000Z',
    })
  })

  it('keeps entries unchanged when target entry is missing', () => {
    const entries = [
      createEntry({ id: 'content-1', body: '第一章旧正文' }),
    ]

    expect(insertAssistantDraftIntoContentEntries(entries, {
      entryId: 'missing-content',
      draft: '不会写入',
      mode: 'replace',
      now: '2026-06-16T09:00:00.000Z',
    })).toEqual(entries)
  })

  it('creates a selected text inline assistant target from textarea offsets', () => {
    expect(createContentInlineAssistantTarget('风声穿过钟楼，门卫低声说话。', 2, 6)).toEqual({
      kind: 'selection',
      start: 2,
      end: 6,
      text: '穿过钟楼',
    })
  })

  it('falls back to the full chapter target when no text is selected', () => {
    expect(createContentInlineAssistantTarget('风声穿过钟楼。', 3, 3)).toEqual({
      kind: 'chapter',
      start: 0,
      end: 7,
      text: '风声穿过钟楼。',
    })
  })

  it('builds an inline annotation prompt with target text, instruction, outline, and beat context', () => {
    const prompt = buildContentInlineAssistantPrompt({
      workspaceTitle: '雾城档案',
      entry: createEntry({
        body: '风声穿过钟楼，门卫低声说话。',
        fineOutline: '1. 钟楼压迫感增强。\n2. 门卫透露钥匙线索。',
        outlineBeatId: 'beat-clocktower',
      }),
      linkedBeat: createBeat(),
      target: createContentInlineAssistantTarget('风声穿过钟楼，门卫低声说话。', 0, 6),
      instruction: '让这段更有压迫感，但不要改变事件。',
    })

    expect(prompt).toContain('正文内 AI 批注改写')
    expect(prompt).toContain('作品：雾城档案')
    expect(prompt).toContain('章节：第一卷 / 第一章')
    expect(prompt).toContain('改写范围：选中文本')
    expect(prompt).toContain('批注要求：让这段更有压迫感，但不要改变事件。')
    expect(prompt).toContain('章节细纲：')
    expect(prompt).toContain('1. 钟楼压迫感增强。')
    expect(prompt).toContain('关联情节点：')
    expect(prompt).toContain('标题：钟楼停摆')
    expect(prompt).toContain('目标原文：')
    expect(prompt).toContain('风声穿过')
    expect(prompt).toContain('整章上下文：')
    expect(prompt).toContain('只输出改写后的正文片段')
  })

  it('uses an excerpt instead of the full chapter when inline editing a selection in a long body', () => {
    const body = [
      `远处铺垫：${'远'.repeat(800)}`,
      '风声穿过钟楼，门卫低声说话。',
      `后续铺垫：${'后'.repeat(800)}`,
    ].join('\n')
    const start = body.indexOf('风声穿过')
    const prompt = buildContentInlineAssistantPrompt({
      workspaceTitle: '雾城档案',
      entry: createEntry({ body }),
      target: createContentInlineAssistantTarget(body, start, start + 6),
      instruction: '让这段更有压迫感。',
    })

    expect(prompt).toContain('整章上下文节选：')
    expect(prompt).toContain('风声穿过钟楼')
    expect(prompt).toContain('...（前文已省略）')
    expect(prompt).toContain('...（后文已省略）')
    expect(prompt).not.toContain('远'.repeat(300))
    expect(prompt).not.toContain('后'.repeat(300))
  })

  it('applies an inline assistant suggestion to the selected text only', () => {
    const body = '风声穿过钟楼，门卫低声说话。'
    const target = createContentInlineAssistantTarget(body, 0, 6)

    expect(applyContentInlineAssistantSuggestion({
      body,
      target,
      suggestion: '冷风像细针一样扎进钟楼',
    })).toBe('冷风像细针一样扎进钟楼，门卫低声说话。')
  })

  it('applies an inline assistant suggestion to the full chapter when no text is selected', () => {
    const body = '风声穿过钟楼，门卫低声说话。'
    const target = createContentInlineAssistantTarget(body, 4, 4)

    expect(applyContentInlineAssistantSuggestion({
      body,
      target,
      suggestion: '冷风沿着钟楼的裂缝灌进来，门卫压低声音交代钥匙失踪。',
    })).toBe('冷风沿着钟楼的裂缝灌进来，门卫压低声音交代钥匙失踪。')
  })

  it('keeps the original body when the inline assistant suggestion is blank', () => {
    const body = '风声穿过钟楼，门卫低声说话。'

    expect(applyContentInlineAssistantSuggestion({
      body,
      target: createContentInlineAssistantTarget(body, 0, 2),
      suggestion: '   ',
    })).toBe(body)
  })

  it('creates a comparison preview before applying an inline assistant suggestion', () => {
    const body = '风声穿过钟楼，门卫低声说话。'
    const target = createContentInlineAssistantTarget(body, 0, 6)

    expect(createContentInlineAssistantSuggestionPreview({
      body,
      target,
      suggestion: '冷风像细针一样扎进钟楼',
    })).toEqual({
      before: '风声穿过钟楼',
      after: '冷风像细针一样扎进钟楼',
      unchanged: false,
    })
  })

  it('marks blank inline assistant suggestion previews as unchanged', () => {
    const body = '风声穿过钟楼。'

    expect(createContentInlineAssistantSuggestionPreview({
      body,
      target: createContentInlineAssistantTarget(body, 0, 2),
      suggestion: '   ',
    })).toEqual({
      before: '风声',
      after: '',
      unchanged: true,
    })
  })

  it('creates a fine outline draft from a linked outline beat', () => {
    expect(createContentFineOutlineDraftFromBeat(createBeat())).toBe([
      '1. 开场：雨夜十一点，围绕“钟楼停摆”展开。',
      '2. 关键推进：门卫听见地下齿轮反转，线索第一次出现。',
      '3. 人物变化：character-keeper 隐瞒自己知道钥匙去向。',
      '4. 章节落点：主角在钟楼发现时间异常。',
    ].join('\n'))
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
    fineOutline: input.fineOutline ?? '',
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
