# 章节正文工作台与 AI 动作入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强正文工作台，让写作者能查看章节状态，并把当前章节上下文一键带入 AI 助手输入框。

**Architecture:** 章节统计和提示词构造放在正文模块纯函数中；跨模块传递提示词使用 assistant 模块的内存草稿队列；UI 只负责调用这些边界并沿用现有 `useContent()`、`useAssistantChat()` 和 hash 导航。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Vitest、现有 shadcn-vue 风格组件、lucide 图标。

---

### Task 1: 章节 AI 提示词纯逻辑

**Files:**
- Create: `apps/studio/src/modules/content/contentAssistant.ts`
- Create: `apps/studio/src/modules/content/contentAssistant.test.ts`

- [x] **Step 1: 写失败测试**

新增测试覆盖：

```ts
import type { WorkspaceContentEntry } from '@story-studio/types'
import { describe, expect, it } from 'vitest'
import { buildContentAssistantPrompt, countContentWords } from './contentAssistant'

describe('content assistant helpers', () => {
  it('counts readable Chinese and English content without markdown noise', () => {
    expect(countContentWords('# 第一章\n\n少年 Alice 走进 **雾城**。')).toBe(13)
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
})

function createEntry(input: Partial<WorkspaceContentEntry> = {}): WorkspaceContentEntry {
  return {
    id: input.id ?? 'content-1',
    workspaceId: input.workspaceId ?? 'workspace-story',
    volume: input.volume ?? '第一卷',
    chapter: input.chapter ?? '第一章',
    body: input.body ?? '',
    order: input.order ?? 0,
    createdAt: input.createdAt ?? '2026-06-16T08:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-06-16T08:00:00.000Z',
  }
}
```

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`

Expected: FAIL，提示 `contentAssistant` 模块不存在。

- [x] **Step 3: 实现最小逻辑**

实现 `ContentAssistantAction`、`countContentWords()` 和 `buildContentAssistantPrompt()`。提示词需包含作品、章节、目标和当前正文；正文为空时写入“当前章节暂无正文”。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`

Expected: PASS。

### Task 2: 助手输入草稿队列

**Files:**
- Create: `apps/studio/src/modules/assistant/assistantDraft.ts`
- Create: `apps/studio/src/modules/assistant/assistantDraft.test.ts`

- [x] **Step 1: 写失败测试**

测试 `queueAssistantDraftPrompt()` 会保存非空提示词，`consumeAssistantDraftPrompt()` 只消费一次，空字符串不会覆盖现有草稿。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/assistant/assistantDraft.test.ts`

Expected: FAIL，提示模块不存在。

- [x] **Step 3: 实现内存队列**

使用模块级 `ref('')` 存储草稿，导出 `queueAssistantDraftPrompt()`、`consumeAssistantDraftPrompt()` 和只读 ref。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/assistant/assistantDraft.test.ts`

Expected: PASS。

### Task 3: 正文工作台 UI 接入

**Files:**
- Modify: `apps/studio/src/modules/content/ContentWorkspace.vue`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 在正文页引入统计和 AI 动作**

新增 computed：当前章节字数、更新时间、三个动作按钮。点击按钮时构造提示词、写入 assistant draft，并把 `window.location.hash` 设置为 `#assistant`。

- [x] **Step 2: 补齐中英文文案**

新增 `content.wordCount`、`content.updatedAt`、`content.aiActions`、`content.aiContinue`、`content.aiPolish`、`content.aiCheckConsistency`、`content.emptyBody` 等消息键。

### Task 4: 助手面板消费草稿

**Files:**
- Modify: `apps/studio/src/modules/assistant/AssistantChatPanel.vue`

- [x] **Step 1: 挂载时消费草稿**

引入 `consumeAssistantDraftPrompt()`，在 `onMounted()` 中读取草稿。若有内容，则写入 `chat.inputMessage.value`。

- [x] **Step 2: 避免覆盖用户输入**

只有当消费到非空草稿时写入。草稿只消费一次。

### Task 5: 全量验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts
pnpm --filter @story-studio/studio test src/modules/assistant/assistantDraft.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
```

若 Vitest/Vite/esbuild 在沙箱中出现 `spawn EPERM`，按权限流程在沙箱外重跑同一命令。
