# AI 终端对话框实施计划

## 状态

- 当前状态：已完成。
- 状态更新时间：2026-06-29 20:18 CST。
- 对齐说明：本次仅补充计划状态和完成记录，不修改业务代码。

## 完成记录

- 关键实现已存在：`packages/types/src/types/story.ts` 定义 `AssistantChatThread`，`StudioDataDocument` 已包含 `assistantChatThreads`。
- 存储与迁移已存在：`apps/studio/src/modules/storage/document.ts` 初始化和规范化 `assistantChatThreads`。
- 前端对话流程已存在：`apps/studio/src/modules/assistant/useAssistantChat.ts` 管理线程、消息发送、停止、事件监听和运行态。
- Tauri 流式事件已存在：`apps/studio/src-tauri/src/lib.rs` 使用 `assistant-chat-stream` 事件。
- 回归测试已存在：`apps/studio/src/modules/storage/document.test.ts`、`apps/studio/src/modules/assistant/useAssistantChat.test.ts`、`apps/studio/src/modules/assistant/assistantChat.test.ts` 覆盖对话数据和流程。
- 历史提交证据：`22d24d3 feat: ✨ 优化本地终端 AI 对话`、`209b0aa docs: 📚️ 同步终端对话验收状态`。

## 来源规格

- `docs/specs/terminal-ai-chat.md`

## 实施步骤

1. 文档和 schema 测试。
   - 新增规格与计划文档。
   - 更新文档测试期望：schema v8、新文档和 v7 迁移补 `assistantChatThreads: []`。

2. 类型与迁移。
   - 在共享类型中新增 `AssistantChatThread`、`AssistantChatMessage` 和相关 union 类型。
   - `StudioDataDocument` 增加 `assistantChatThreads`，schema version 升到 8。
   - 存储迁移补空数组，并把重新加载时的 streaming 消息转为 error。

3. 聊天状态模块。
   - 新增 `assistantChat.ts` 和测试。
   - 覆盖工作区筛选、新建线程标题、追加用户和 assistant 消息、stdout chunk 合并、done/error 状态、基础上下文 prompt。

4. Tauri 流式执行。
   - 保留现有一次性 `run_local_terminal_model`。
   - 新增 `run_local_terminal_chat_stream` 和 `cancel_local_terminal_chat_stream`。
   - 用事件 `assistant-chat-stream` 推送 chunk/done/error。
   - Rust 测试覆盖 chunk、非零退出、取消、超时。

5. 前端 runner/composable。
   - 新增 `useAssistantChat.ts`，管理当前工作区线程、运行态、发送、停止、重试、清空、复制。
   - 在 Vue unmount 时释放 Tauri event listener。
   - Web 环境保留历史浏览并禁用发送。

6. 助手页 UI。
   - `AssistantWorkspace.vue` 保留配置区，把测试面板替换为聊天区。
   - 新增私有 Vue 组件承载线程列表、消息流和输入框。
   - 补充中英文 locale key。

7. 验证。
   - 先跑聚焦 Vitest 和 Rust 测试。
   - 再跑 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build`。
   - 最后跑 `pnpm --filter @story-studio/studio tauri:build`。

## 风险与边界

- 本期不引入新 UI 依赖，不做 API Provider 对话。
- 本地命令仍由用户配置，应用只负责 stdin/stdout/stderr 通道。
- 只保存当前工作区的对话历史，不跨工作区共享。
- 现有未提交的 `apps/studio/package.json`、`apps/studio/src-tauri/tauri.conf.json`、`apps/studio/vite.config.ts` 不属于本计划，不回滚。
