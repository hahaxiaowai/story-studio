# AI 终端对话框实施计划

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
