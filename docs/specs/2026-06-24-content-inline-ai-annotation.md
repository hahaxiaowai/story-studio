# 正文内 AI 批注改写规格

## 背景

正文页当前可以把章节上下文发送到 AI 对话页，再由用户在对话页生成内容并回填正文。这个流程适合长对话，但写作者在正文输入框里打磨段落时，会被迫离开正文上下文。用户希望 AI 像批注一样介入正文：围绕当前选中文本或整章给出改写建议，用户确认后直接更新正文。

## 目标

- 在正文输入区内提供 AI 批注入口，不跳转到 AI 对话页。
- 用户可以选中正文片段并写下批注式修改要求。
- AI 在正文页内生成改写建议，生成过程中展示状态和输出。
- 用户确认后只替换目标片段；未选中文本时按整章改写并替换整章正文。
- 用户应用改写后可以撤销最近一次 AI 改写，恢复应用前正文。
- 复用现有 AI Provider、故事风格、Tauri 流式命令和正文保存逻辑。

## 非目标

- 不引入富文本编辑器或持久化批注模型。
- 不实现多条批注线程、评论解决状态或版本历史。
- 不自动覆盖正文；必须用户点击应用后才写入。
- 不移除现有“发送到 AI 对话页”和“AI 草稿回填正文”流程。

## 用户流程

1. 用户进入正文页并选择章节。
2. 用户在正文输入框内选中一段文字，或不选中文本直接针对整章。
3. 用户在“AI 批注”输入框写下修改要求，例如“让这段更有压迫感”。
4. 用户点击生成，系统在正文页内调用当前内容功能的 AI Provider。
5. AI 流式返回改写建议，页面展示建议文本。
6. 用户点击“应用改写”，应用把建议替换选中的正文范围；如果没有选中文本，则替换整章正文。
7. 应用改写后，用户可以点击“撤销改写”恢复上一版正文。
8. 用户也可以取消建议，正文保持不变。

## 数据模型

不新增持久化字段。批注状态只保存在 `ContentPage.vue` 当前会话中：

- 当前选区起止位置。
- 选区原文快照。
- 用户批注要求。
- AI 改写建议。
- 最近一次已应用改写的正文快照：章节 id、应用前正文、应用后正文。该快照只用于当前页面会话撤销，不写入文档存储。

正文仍通过 `useContent().updateEntry()` 写回 `WorkspaceContentEntry.body`。

## UI 结构

- 正文 `Textarea` 继续作为主要编辑器。
- 正文输入框下方新增“AI 批注”面板：
  - 当前目标：选中文字摘要，或“整章正文”。
  - 批注输入框：填写改写要求。
  - 生成/停止按钮：调用或取消 AI 流式生成。
  - 建议预览：显示 AI 输出。
  - 应用/取消按钮：确认写回或放弃。
- 现有 AI 动作区保留，用于需要多轮讨论的助手对话流程。

## 技术方案

- 在 `contentAssistant.ts` 新增纯函数：
  - 构造正文内批注改写 prompt。
  - 根据选区或整章目标应用 AI 建议。
- 新增 `useContentInlineAssistant.ts`：
  - 解析内容功能 Provider 和故事风格。
  - 复用现有 `assistant-chat-stream` Tauri 事件。
  - 对 API Provider 调用 `run_openai_compatible_chat_stream`。
  - 对本地 Terminal 调用 `run_local_terminal_chat_stream`。
  - 暴露 `output`、`loading`、`error`、`disabledReason`、`run`、`stop`、`reset`。
- 在 `ContentPage.vue` 中：
  - 监听正文输入框选择范围。
  - 生成批注 prompt 并在本页运行 AI。
  - 用户确认后调用 `updateEntry()` 替换目标范围。

## 验收标准

- [x] 页面源码包含正文内 AI 批注面板，不再要求该流程跳转 `#assistant-chat`。
- [x] prompt 包含作品、章节、目标范围、批注要求、目标原文、章节细纲和关联情节点。
- [x] 选中文本时应用改写只替换选区。
- [x] 未选中文本时应用改写替换整章正文。
- [x] 应用改写后可以撤销最近一次 AI 改写。
- [x] 空批注要求不会发起生成。
- [x] 生成失败或取消不会修改正文。
- [x] 原有发送到 AI 对话页动作仍保留。

## 验证命令

- `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`
- `pnpm --filter @story-studio/studio test src/modules/content/useContentInlineAssistant.test.ts`
- `pnpm --filter @story-studio/studio test src/pages/content/ContentPage.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`

## 验证结果

- 2026-06-28: 目标测试、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` 均通过。
- 2026-06-28: 补充最近一次 AI 改写撤销，目标测试 `pnpm --filter @story-studio/studio test src/pages/content/ContentPage.test.ts src/composables/useLocale.test.ts` 通过。
