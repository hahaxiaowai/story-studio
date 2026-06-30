# 旧计划状态对齐待确认计划

## 状态

- 当前状态：已完成。
- 完成时间：2026-06-29 20:18 CST。
- 执行范围：只做文档状态对齐；未修改业务代码，未新增功能。

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

## 完成记录

- 已为 `terminal-ai-chat.md` 补充 `## 状态` 和 `## 完成记录`，引用类型、存储、前端对话流程、Tauri 流式事件、测试与历史提交证据。
- 已为 `api-ai-chat.md` 补充 `## 状态` 和 `## 完成记录`，引用 OpenAI-compatible stream command、cancel command、前端调用、复用路径、测试与历史提交证据。
- 已为 `2026-06-16-material-type-filter.md` 补充 `## 状态` 和 `## 完成记录`，引用类型筛选、计数、页面接线、文案、测试与历史提交证据。
- 本次未重写计划正文，未迁移 specs、README 或架构说明，未修改业务代码。
- 2026-06-30 自动化补建月度索引 `TODO.md`，并新增 `2026-06-30-next-engineering-direction.md` 作为下一项工程推进的人工确认入口。

## 后续推进方向

1. 优先处理本地领先远端的提交：当前 `main` 本地领先 `origin/main`，后续推进前先确认是否需要推送，避免本地完成状态和远端状态继续分叉。
2. 继续清理计划状态：对仍缺少统一状态字段但已由代码事实证明完成的旧计划，按本次方式补充 `## 状态` 和 `## 完成记录`，每次只处理证据明确的一小组文档。
3. 深化正文 AI 工作流：在现有细纲、整章生成、选区改写、浮层批注和撤销基础上，优先评估改写前后对比、批注历史、章节级 AI 建议保存等能力。
4. 推进大纲与正文联动：围绕情节点跳转正文段落、正文章节反向显示关联情节点、AI 生成时自动带入线路/人物/冲突上下文拆后续规格。
5. 强化创作资料库：在素材搜索和类型过滤基础上，补充素材与章节、人物、世界观的引用关系、使用状态和批量归类能力。
6. 增加数据完整性检查：围绕 `StudioDataDocument` 增加缺失引用、孤立章节、异常排序、备份恢复可用性的检查入口和验证用例。

## 已确认事项

- 已允许执行“旧计划状态对齐”这类 docs-only 清理。
- 本次只处理当前已经有明确代码证据的三个计划：`terminal-ai-chat.md`、`api-ai-chat.md`、`2026-06-16-material-type-filter.md`。

## 验证方式

- `git diff -- docs/plans/2026-06`
- `rg -n "当前状态：已完成|完成记录|assistant-chat-stream|MaterialKindFilter" docs/plans/2026-06 apps/studio packages/types/src`
- `git diff --check`
