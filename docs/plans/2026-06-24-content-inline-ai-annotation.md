# 正文内 AI 批注改写实施计划

## 目标

让正文页支持在正文输入框附近用批注式指令调用 AI，并在用户确认后把改写建议写回正文，不强制跳转 AI 对话页。

## 涉及文件

- `apps/studio/src/modules/content/contentAssistant.ts`: 新增批注 prompt 和正文替换纯函数。
- `apps/studio/src/modules/content/contentAssistant.test.ts`: 覆盖 prompt 和选区替换行为。
- `apps/studio/src/modules/content/useContentInlineAssistant.ts`: 新增正文内 AI 流式运行 composable。
- `apps/studio/src/modules/content/useContentInlineAssistant.test.ts`: 覆盖 Provider 解析、禁用原因和流式输出。
- `apps/studio/src/pages/content/ContentPage.vue`: 接入选区捕获、批注输入、生成预览和应用改写。
- `apps/studio/src/pages/content/ContentPage.test.ts`: 锁定页面接线。
- `apps/studio/src/composables/useLocale.ts`: 补充中英文文案。

## 步骤

1. [x] 在 `contentAssistant.test.ts` 先写失败测试：
   - 批注 prompt 包含选区、要求、细纲和关联情节点。
   - 应用改写只替换选区。
   - 无选区时替换整章。
2. [x] 在 `contentAssistant.ts` 实现纯函数并跑对应测试。
3. [x] 新增 `useContentInlineAssistant.test.ts`：
   - 无批注要求时禁用。
   - API Provider 调用 `run_openai_compatible_chat_stream` 并累积 stdout chunk。
   - 本地 Terminal Provider 调用 `run_local_terminal_chat_stream`。
4. [x] 新增 `useContentInlineAssistant.ts`，复用现有 assistant helper 和 Tauri stream 事件。
5. [x] 更新 `ContentPage.test.ts`，锁定页面包含批注状态、生成入口、应用入口，并保留原有 `#assistant-chat` 入口。
6. [x] 更新 `ContentPage.vue`：
   - 捕获正文 textarea 的选择范围。
   - 根据选区与批注构造 prompt。
   - 展示流式建议和应用/取消按钮。
   - 应用时通过 `updateSelectedEntry({ body })` 写回。
7. [x] 补充 `useLocale.ts` 中英文文案。
8. [x] 运行目标测试、类型检查和 lint。

## 验证

- `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`
- `pnpm --filter @story-studio/studio test src/modules/content/useContentInlineAssistant.test.ts`
- `pnpm --filter @story-studio/studio test src/pages/content/ContentPage.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`

## 验证结果

- 2026-06-28: `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts src/modules/content/useContentInlineAssistant.test.ts src/pages/content/ContentPage.test.ts src/modules/outlines/chronicle.test.ts src/pages/outline/OutlineLineManagerDialog.test.ts`
- 2026-06-28: `pnpm run lint`
- 2026-06-28: `pnpm run typecheck`
- 2026-06-28: `pnpm run test`
- 2026-06-28: `pnpm run build`
