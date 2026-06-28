# AI 对话展示可观测性

## 背景

AI 对话已经支持 Provider 选择、API/本地 Terminal 流式生成、多轮线程和正文回填。但用户在生成时只能看到原始流式文本，不清楚当前使用的模型，也无法判断本轮上下文大致占用了多少。

## 目标

- Assistant 回复生成时使用前端打字机效果展示，真实消息内容仍按流式 chunk 持久化。
- 聊天界面展示当前 Provider 类型、Provider 名称和模型名。
- 聊天界面展示本轮上下文使用情况。
- API 返回真实 usage 时优先显示 prompt、completion 和 total token；不可得时显示消息数、非空白字符数和约算 token。
- 聊天界面展示生成阶段与耗时，区分等待首字、接收内容和已完成。

## 非目标

- 不拉取远端模型列表。
- 不引入 tokenizer 或新的运行时依赖。
- 不改变聊天线程持久化结构。
- 不把 usage 写入 `StudioDataDocument`。
- 不改变复制、停止、重试和回填正文的真实消息来源。

## 数据与 UI

- `useAssistantChat()` 暴露当前模型摘要、上下文用量和真实 usage。
- `useAssistantChat()` 暴露生成状态，记录发送到首个有效文本 chunk 的耗时，以及完成时的总耗时。
- 本地 Terminal 按最终 prompt 估算上下文；API 按即将发送的 request messages 估算上下文。
- 约算 token 使用 `Math.ceil(nonWhitespaceCharacterCount / 4)`。
- `assistant-chat-stream` 事件允许携带可选 `usage`，没有 usage 的 Provider 保持原有行为。

## 技术方案

- `assistantChat.ts` 提供模型摘要、上下文估算和 usage 展示文案的纯函数。
- `useAssistantChat.ts` 在发送前实时估算，发送后锁定本轮估算，收到 API usage 事件后用真实 token 覆盖展示。
- Tauri API 请求增加 `stream_options.include_usage = true`，SSE 解析同时支持 `choices[].delta.content` 和 usage-only chunk。
- `AssistantChatPanel.vue` 用页面私有状态实现打字机展示，不修改真实 `message.content`。
- `AssistantChatPanel.vue` 显示生成状态：等待首字时持续刷新等待时间，收到首个文本 chunk 后显示首字耗时，完成后显示首字耗时和总耗时。

## 验收标准

- [x] 生成中 assistant 消息以打字机效果展示，复制和回填仍使用完整真实内容。
- [x] 聊天页能看到当前模型信息。
- [x] 输入消息时能看到上下文估算，发送后输入框清空但本轮估算保留。
- [x] 长时间没有 chunk 时，界面显示“等待首字”耗时，而不是让打字机效果看起来像最后才开始生成。
- [x] API 返回 usage 时显示真实 token 用量。
- [x] 不返回 usage 的 API 与本地 Terminal 对话不回归。
- [x] 相关前端测试、Rust 测试、类型检查和构建通过。

## 当前实现

- `AssistantChatPanel.vue` 使用页面私有 `typewriterMessages` 渲染 streaming assistant 消息，复制和正文回填仍读取真实 `message.content`。
- `useAssistantChat()` 暴露 `activeModelSummary`、`activeContextUsageSummary` 和 `generationStatusSummary`，聊天页头部与输入区同步展示。
- OpenAI-compatible Tauri 请求已发送 `stream_options.include_usage = true`，并把 usage-only SSE chunk 转换为 `assistant-chat-stream` 的 usage 事件。
- 本规格已由 `assistantChat.test.ts`、`useAssistantChat.test.ts`、`AssistantSettingsPage.test.ts` 和 `src-tauri` 单测覆盖。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
cargo test --lib
```
