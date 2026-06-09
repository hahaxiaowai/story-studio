# API AI 对话模式

## 背景

助手页已经支持 Provider 配置、线程化聊天、本地 Terminal 流式对话和持久化历史。当前聊天发送仍限制为 `local-terminal` Provider，已经存在的 `openai-compatible` Provider 只能配置，不能用于 API 对话。

本规格把助手页扩展为同时支持本地 Terminal 与 OpenAI-compatible API 的 AI 对话模式。UI 继续使用当前自研 Vue 聊天面板，只借鉴 assistant-ui、AI Elements Vue、Deep Chat 的交互模式，不引入整套外部 Chat UI。

## 目标

- 用户可以使用 `openai-compatible` Provider 进行多轮流式 AI 对话。
- API Provider 与本地 Terminal Provider 共用线程、消息、停止、重试、复制、错误状态与持久化逻辑。
- Tauri 桌面环境通过 Rust command 发起 API 请求，避免在浏览器请求中直接暴露 API Key。
- OpenAI、DeepSeek、OpenRouter 和兼容网关可通过 `/chat/completions` 协议接入。
- Web 环境允许查看历史和配置，但禁用 API 发送并展示桌面端提示。

## 非目标

- 本期不支持 Responses API、Anthropic 原生 API 或 Gemini 原生 API。
- 本期不做工具调用、附件、图片、语音、模型列表拉取或模型参数面板。
- 本期不引入 `@ai-sdk/vue`、Deep Chat、assistant-ui 或 AI Elements Vue 作为运行时依赖。
- 本期不升级 `assistantChatThreads` schema。
- 本期不做 API Key 加密存储。

## 用户流程

1. 用户打开助手页。
2. 用户新增或选择一个 `openai-compatible` Provider。
3. 用户填写 Base URL、API Key 和模型名。
4. 用户在聊天输入区发送消息。
5. 前端立即追加 user 消息和 streaming assistant 消息。
6. Tauri 后端向 `${baseUrl}/chat/completions` 发起 `stream: true` 请求。
7. 后端解析 SSE chunk，并通过 `assistant-chat-stream` 事件推送给前端。
8. 前端把 chunk 追加到当前 assistant 消息。
9. 请求完成时 assistant 消息变为 complete；网络、鉴权、协议或服务端错误时变为 error。
10. 用户可以停止、重试、复制消息或切换回本地 Terminal Provider。

## 数据模型

继续使用现有 Provider 和聊天线程类型：

- `AiProviderConfig.kind: 'openai-compatible'`
- `AiProviderConfig.baseUrl`
- `AiProviderConfig.apiKey`
- `AiProviderConfig.model`
- `AssistantChatThread`
- `AssistantChatMessage`

新增前端请求消息类型：

```ts
interface AssistantChatRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
```

发送给 API 的消息来自当前线程完整历史，只保留 `system`、`user` 和非空 `assistant` 消息，过滤 `streaming` 或 `error` 的 assistant 空回复。

## UI 结构

- `AssistantChatPanel.vue` 保持当前两栏结构、消息流、固定输入区、停止、重试和复制交互。
- Provider 下拉允许选择 `openai-compatible` 和 `local-terminal`。
- 当前 Provider 信息展示名称、模型和类型。
- 禁用原因按 Provider 类型区分：
  - API Provider 缺 Base URL、API Key、模型或运行在 Web 环境时禁用。
  - Terminal Provider 缺命令或运行在 Web 环境时禁用。

## 技术方案

- `assistantChat.ts` 增加 API Provider 禁用原因、Base URL 规范化和线程消息转换纯函数。
- `useAssistantChat.ts` 抽出通用 stream event 类型，并按 Provider 类型调用不同 Tauri command。
- 本地 Terminal 继续使用 `run_local_terminal_chat_stream` 和 `cancel_local_terminal_chat_stream`。
- API Provider 新增：
  - `run_openai_compatible_chat_stream`
  - `cancel_openai_compatible_chat_stream`
- Rust 后端使用 HTTP 客户端发起流式 POST 请求，解析 `data:` SSE 行，读取 `choices[0].delta.content`。
- API 请求路径固定为 `${baseUrl}/chat/completions`，Base URL 会去掉末尾 `/`。
- 服务端 `error` JSON、非 2xx、非 SSE/JSON、网络失败和取消都转成可读中文错误。

## 验收标准

- [ ] API Provider 缺 Base URL、API Key 或模型时不能发送，并展示明确原因。
- [ ] Web 环境下 API Provider 不能发送，并提示 API 对话仅 Tauri 可用。
- [ ] Tauri 桌面环境中 API Provider 可以流式追加 assistant 回复。
- [ ] 停止 API 请求后不会继续写入该 run 后续 chunk。
- [ ] 多轮历史按当前线程消息顺序发送给 API。
- [ ] 本地 Terminal 对话能力不回归。
- [ ] 类型检查通过。
- [ ] 必要测试通过。
- [ ] 构建通过。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```
