import type { TimelineBeat, WorkspaceContentEntry } from '@story-studio/types'

export type ContentAssistantAction = 'continue' | 'polish' | 'check-consistency'

export interface BuildContentAssistantPromptInput {
  action: ContentAssistantAction
  workspaceTitle: string
  entry: WorkspaceContentEntry
  linkedBeat?: TimelineBeat
}

const ACTION_GOALS = {
  'check-consistency': '检查一致性',
  'continue': '续写当前章节',
  'polish': '润色当前章节',
} as const satisfies Record<ContentAssistantAction, string>

const ACTION_INSTRUCTIONS = {
  'check-consistency': '请检查当前章节和既有设定可能存在的时间线、人物动机、世界规则或情绪节奏冲突，并按问题列出修改建议。',
  'continue': '请延续当前章节的叙事节奏继续写作，保持人物动机、场景氛围和前后信息一致。',
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
