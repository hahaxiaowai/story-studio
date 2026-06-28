# 旧计划状态对齐待确认计划

## 状态

- 当前任务：待人工确认。

## 背景

自动化检查当前月计划时发现，部分早期计划已经在当前代码中存在对应实现，但计划文档没有统一的完成记录，容易让后续自动化误判为仍可执行任务。

## 已确认的代码事实

- `terminal-ai-chat.md` 中的 `assistantChatThreads`、`AssistantChatThread`、`assistant-chat-stream` 已能在 `packages/types/src/types/story.ts`、`apps/studio/src/modules/storage/document.ts`、`apps/studio/src/modules/assistant/useAssistantChat.ts` 和 `apps/studio/src-tauri/src/lib.rs` 中找到实现。
- `api-ai-chat.md` 中的 `run_openai_compatible_chat_stream`、`cancel_openai_compatible_chat_stream`、`stream_options.include_usage` 已能在 `apps/studio/src-tauri/src/lib.rs` 和相关前端调用中找到实现。
- `2026-06-16-material-type-filter.md` 已全部勾选完成，且 `MaterialKindFilter`、`selectedKind`、`kindCounts` 和中英文文案已存在。

## 建议范围

如果人工确认推进，本计划只做文档状态对齐：

- 为已由代码事实证明完成的旧计划补充 `## 状态` 和 `## 完成记录`。
- 仅引用当前代码路径、已有测试路径和历史提交作为证据。
- 不重写计划正文，不修改业务代码，不新增功能。

## 非目标

- 不重新实现终端对话、API 对话或素材类型筛选。
- 不迁移 specs、README 或架构说明。
- 不修改已完成计划的历史步骤内容。

## 待确认事项

- 是否允许下一次自动化执行“旧计划状态对齐”这类 docs-only 清理？
- 如果允许，是否只处理当前已经有明确代码证据的三个计划：`terminal-ai-chat.md`、`api-ai-chat.md`、`2026-06-16-material-type-filter.md`？

## 验证方式

- `git diff -- docs/plans/2026-06`
- `rg -n "当前任务：待人工确认|完成记录|assistant-chat-stream|MaterialKindFilter" docs/plans/2026-06 apps/studio packages/types/src`
