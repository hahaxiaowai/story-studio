# API AI 对话模式实施计划

## 状态

- 当前状态：已完成。
- 状态更新时间：2026-06-29 20:18 CST。
- 对齐说明：本次仅补充计划状态和完成记录，不修改业务代码。

## 完成记录

- Tauri command 已存在：`apps/studio/src-tauri/src/lib.rs` 注册 `run_openai_compatible_chat_stream` 和 `cancel_openai_compatible_chat_stream`。
- OpenAI-compatible 请求已存在：`apps/studio/src-tauri/src/lib.rs` 构造 `/chat/completions` 流式请求，并设置 `stream_options.include_usage`。
- 前端调用已存在：`apps/studio/src/modules/assistant/useAssistantChat.ts` 按 Provider 类型选择 API stream command 和 cancel command。
- 正文内联 AI 也复用 API 流：`apps/studio/src/modules/content/useContentInlineAssistant.ts` 调用 `run_openai_compatible_chat_stream` 并监听 `assistant-chat-stream`。
- 回归测试已存在：`apps/studio/src/modules/assistant/assistantChat.test.ts`、`apps/studio/src/modules/assistant/useAssistantChat.test.ts`、`apps/studio/src/modules/content/useContentInlineAssistant.test.ts` 和 `apps/studio/src-tauri/src/lib.rs` 内 Rust 测试覆盖流式请求与错误处理。
- 历史提交证据：`5c090a3 feat: ✨ 新增 API AI 对话模式`、`72d6bf7 docs: 📚️ 同步 API 对话验收状态`、`c8d2db3 test: 🚨 补充 API 流式对话验证`。

## 来源规格

- `docs/specs/api-ai-chat.md`

## 实施步骤

1. 文档。
   - 新增 API AI 对话模式规格。
   - 新增本实施计划。

2. 前端纯函数。
   - 在 `assistantChat.ts` 增加 `AssistantChatRequestMessage`、Provider 禁用原因、Base URL 规范化和线程消息转换。
   - 测试覆盖 API Provider 缺字段、Web 环境禁用、消息过滤和本地 Terminal 回归。

3. 前端 composable。
   - 把当前 `LocalTerminalChatStreamEvent` 调整为通用 `AssistantChatStreamEvent`。
   - `send` 时按 Provider 类型调用本地 Terminal 或 API stream command。
   - `stop` 时按当前运行 Provider 类型调用对应 cancel command。

4. Tauri 后端。
   - 新增 OpenAI-compatible stream command 和 cancel command。
   - 规范化 Base URL，固定请求 `/chat/completions`。
   - 解析 SSE `data:` 行，跳过 `[DONE]`，读取 `choices[0].delta.content`。
   - 把非 2xx、服务端 error、网络失败和协议错误转成中文错误事件。

5. UI 微调。
   - Provider 信息增加类型展示。
   - 保持当前聊天面板布局和交互，不引入外部 Chat UI 依赖。

6. 验证。
   - 先跑聚焦 Vitest 和 Rust 测试。
   - 再跑 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build`。
   - 最后跑 `pnpm --filter @story-studio/studio tauri:build`。

## 风险与边界

- API Key 本期仍保存在现有 Provider 配置，后续可单独做加密存储。
- 本期只支持 OpenAI-compatible Chat Completions 文本流。
- Web 环境不直连模型服务，避免暴露 API Key 和处理 CORS。
- 本地 Terminal 流式对话保持现有 command 与事件协议兼容。
