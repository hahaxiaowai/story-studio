import type { TimelineBeat, WorkspaceContentEntry } from '@story-studio/types'

export type ContentAssistantAction = 'continue' | 'polish' | 'check-consistency' | 'draft-full-chapter'
export type AssistantDraftInsertMode = 'append' | 'replace'
export type ContentInlineAssistantTargetKind = 'selection' | 'chapter'

export interface BuildContentAssistantPromptInput {
  action: ContentAssistantAction
  workspaceTitle: string
  entry: WorkspaceContentEntry
  linkedBeat?: TimelineBeat
}

export interface MergeAssistantDraftInput {
  body: string
  draft: string
  mode: AssistantDraftInsertMode
}

export interface InsertAssistantDraftIntoContentEntriesInput {
  entryId: string
  draft: string
  mode: AssistantDraftInsertMode
  now: string
}

export interface ContentInlineAssistantTarget {
  kind: ContentInlineAssistantTargetKind
  start: number
  end: number
  text: string
}

export interface BuildContentInlineAssistantPromptInput {
  workspaceTitle: string
  entry: WorkspaceContentEntry
  target: ContentInlineAssistantTarget
  instruction: string
  linkedBeat?: TimelineBeat
}

export interface ApplyContentInlineAssistantSuggestionInput {
  body: string
  target: ContentInlineAssistantTarget
  suggestion: string
}

const ACTION_GOALS = {
  'check-consistency': '检查一致性',
  'continue': '续写当前章节',
  'draft-full-chapter': '按细纲完整生成本章',
  'polish': '润色当前章节',
} as const satisfies Record<ContentAssistantAction, string>

const ACTION_INSTRUCTIONS = {
  'check-consistency': '请检查当前章节和既有设定可能存在的时间线、人物动机、世界规则或情绪节奏冲突，并按问题列出修改建议。',
  'continue': '请延续当前章节的叙事节奏继续写作，保持人物动机、场景氛围和前后信息一致。',
  'draft-full-chapter': '请以章节细纲为主完整写出本章内容，补足场景、动作、对话、心理和段落节奏；当前正文仅作为风格和连续性参考，不要只续写、摘要或列提纲。',
  'polish': '请在不改变核心情节的前提下润色当前章节，提升语言质感、段落节奏和人物表达。',
} as const satisfies Record<ContentAssistantAction, string>

const LINKED_BEAT_DRAFT_GOAL = '基于关联情节点生成章节初稿'
const LINKED_BEAT_DRAFT_INSTRUCTION = '请根据关联情节点生成当前章节初稿，补足场景推进、人物行动和段落节奏，并保持与情节点摘要一致。'

export function countContentWords(body: string): number {
  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')

  const matches = plainText.match(/[\u4E00-\u9FFF]|[a-z0-9]+/gi)

  return matches?.length ?? 0
}

export function mergeAssistantDraftIntoContent(input: MergeAssistantDraftInput): string {
  const draft = input.draft.trim()

  if (input.mode === 'replace')
    return draft

  const body = input.body.trim()

  return body ? `${body}\n\n${draft}` : draft
}

export function insertAssistantDraftIntoContentEntries(
  entries: WorkspaceContentEntry[],
  input: InsertAssistantDraftIntoContentEntriesInput,
): WorkspaceContentEntry[] {
  if (!entries.some(entry => entry.id === input.entryId))
    return entries

  return entries.map(entry => entry.id === input.entryId
    ? {
        ...entry,
        body: mergeAssistantDraftIntoContent({
          body: entry.body,
          draft: input.draft,
          mode: input.mode,
        }),
        updatedAt: input.now,
      }
    : entry)
}

export function buildContentAssistantPrompt(input: BuildContentAssistantPromptInput): string {
  const body = input.entry.body.trim()
  const goal = resolveActionGoal(input.action, body, input.linkedBeat)
  const instruction = resolveActionInstruction(input.action, body, input.linkedBeat)

  const sections = [
    '请基于 Story Studio 当前章节执行写作辅助。',
    '',
    `作品：${input.workspaceTitle || '未命名作品'}`,
    `章节：${input.entry.volume || '未命名卷'} / ${input.entry.chapter || '未命名章'}`,
    `目标：${goal}`,
    `要求：${instruction}`,
  ]

  const linkedBeatSection = input.linkedBeat ? formatLinkedBeat(input.linkedBeat) : ''
  const fineOutlineSection = formatFineOutline(input.entry.fineOutline)

  if (fineOutlineSection) {
    sections.push(
      '',
      '章节细纲：',
      fineOutlineSection,
    )
  }

  if (linkedBeatSection) {
    sections.push(
      '',
      '关联情节点：',
      linkedBeatSection,
    )
  }

  sections.push(
    '',
    '当前正文：',
    body || '当前章节暂无正文。',
  )

  return sections.join('\n')
}

export function createContentInlineAssistantTarget(
  body: string,
  selectionStart: number,
  selectionEnd: number,
): ContentInlineAssistantTarget {
  const start = clampTextOffset(selectionStart, body.length)
  const end = clampTextOffset(selectionEnd, body.length)
  const normalizedStart = Math.min(start, end)
  const normalizedEnd = Math.max(start, end)

  if (normalizedStart !== normalizedEnd) {
    return {
      kind: 'selection',
      start: normalizedStart,
      end: normalizedEnd,
      text: body.slice(normalizedStart, normalizedEnd),
    }
  }

  return {
    kind: 'chapter',
    start: 0,
    end: body.length,
    text: body,
  }
}

export function buildContentInlineAssistantPrompt(input: BuildContentInlineAssistantPromptInput): string {
  const body = input.entry.body.trim()
  const targetText = input.target.text.trim()
  const fineOutlineSection = formatFineOutline(input.entry.fineOutline)
  const linkedBeatSection = input.linkedBeat ? formatLinkedBeat(input.linkedBeat) : ''

  const sections = [
    '请执行 Story Studio 正文内 AI 批注改写。',
    '只输出改写后的正文片段，不要解释、不要加标题、不要使用 Markdown 代码块。',
    '',
    `作品：${input.workspaceTitle || '未命名作品'}`,
    `章节：${input.entry.volume || '未命名卷'} / ${input.entry.chapter || '未命名章'}`,
    `改写范围：${input.target.kind === 'selection' ? '选中文本' : '整章正文'}`,
    `批注要求：${input.instruction.trim()}`,
  ]

  if (fineOutlineSection) {
    sections.push(
      '',
      '章节细纲：',
      fineOutlineSection,
    )
  }

  if (linkedBeatSection) {
    sections.push(
      '',
      '关联情节点：',
      linkedBeatSection,
    )
  }

  sections.push(
    '',
    '目标原文：',
    targetText || '当前目标为空。',
  )

  if (input.target.kind === 'selection') {
    sections.push(
      '',
      '整章上下文：',
      body || '当前章节暂无正文。',
    )
  }

  return sections.join('\n')
}

export function applyContentInlineAssistantSuggestion(input: ApplyContentInlineAssistantSuggestionInput): string {
  const suggestion = input.suggestion.trim()

  if (!suggestion)
    return input.body

  const start = clampTextOffset(input.target.start, input.body.length)
  const end = clampTextOffset(input.target.end, input.body.length)
  const normalizedStart = Math.min(start, end)
  const normalizedEnd = Math.max(start, end)

  return `${input.body.slice(0, normalizedStart)}${suggestion}${input.body.slice(normalizedEnd)}`
}

function formatFineOutline(fineOutline: string): string {
  return fineOutline.trim()
}

function clampTextOffset(value: number, max: number): number {
  if (!Number.isFinite(value))
    return 0

  return Math.min(Math.max(Math.trunc(value), 0), max)
}

function resolveActionGoal(action: ContentAssistantAction, body: string, linkedBeat: TimelineBeat | undefined): string {
  if (action === 'continue' && !body && linkedBeat)
    return LINKED_BEAT_DRAFT_GOAL

  return ACTION_GOALS[action]
}

function resolveActionInstruction(action: ContentAssistantAction, body: string, linkedBeat: TimelineBeat | undefined): string {
  if (action === 'continue' && !body && linkedBeat)
    return LINKED_BEAT_DRAFT_INSTRUCTION

  return ACTION_INSTRUCTIONS[action]
}

function formatLinkedBeat(beat: TimelineBeat): string {
  return [
    `标题：${beat.title || '未命名情节点'}`,
    `时间：${beat.timeLabel || '未设置'}`,
    `摘要：${beat.summary || '暂无摘要。'}`,
    formatBeatEvents(beat),
    formatCharacterChanges(beat),
  ].filter(Boolean).join('\n')
}

function formatBeatEvents(beat: TimelineBeat): string {
  if (!beat.events.length)
    return ''

  return [
    '事件：',
    ...beat.events.map((event) => {
      const description = event.description.trim()

      return `- ${event.title || '未命名事件'}${description ? `：${description}` : ''}`
    }),
  ].join('\n')
}

function formatCharacterChanges(beat: TimelineBeat): string {
  if (!beat.characterChanges.length)
    return ''

  return [
    '人物变化：',
    ...beat.characterChanges.map((change) => {
      return `- ${change.characterId} / ${change.category}：${change.summary || '未填写'}`
    }),
  ].join('\n')
}
