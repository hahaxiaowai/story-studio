# AI 终端对话框

## 背景

助手页已经能配置 `local-terminal` Provider，并通过 Tauri 一次性执行本地命令。但当前交互仍是测试面板：没有多轮消息、没有流式输出、没有线程历史，也不符合常见 AI Chat 产品的使用方式。

本规格把助手页升级为真正的本地 Terminal AI 对话框。界面借鉴 assistant-ui、shadcn AI components、Chatcn 的消息流、固定输入区、线程列表、停止、重试、复制和错误状态，但不引入 React 组件库。

## 目标

- 用户在助手页可以进行多轮本地 Terminal AI 对话。
- 每个对话线程绑定当前工作区，并持久保存到 Studio 文档。
- 本地命令 stdout/stderr 以 chunk 形式流式回传到前端。
- 用户可以停止当前生成，停止后不会继续写入该轮 assistant 消息。
- 发送给 Terminal 的 stdin 包含基础工作区上下文和用户本轮输入。
- Web 环境允许查看历史，但禁用发送并展示 Tauri-only 提示。

## 非目标

- 不支持 `openai-compatible` API Provider 对话。
- 不引入 assistant-ui、shadcn AI React registry 或 Chatcn React 组件。
- 不做工具调用、附件、引用、语音、模型参数面板。
- 不自动读取大纲、人物、世界、正文或素材内容。
- 不跨工作区共享对话线程。

## 用户流程

1. 用户打开助手页。
2. 系统显示当前工作区的 AI 对话线程列表和聊天面板。
3. 用户新建线程或选择已有线程。
4. 用户输入消息并发送。
5. 前端立即追加 user 消息和 streaming 状态的 assistant 消息。
6. Tauri 后端启动本地 Terminal 命令，向 stdin 写入基础上下文和用户消息。
7. 后端持续 emit stdout/stderr chunk，前端追加到 assistant 消息或错误信息。
8. 命令完成后 assistant 消息变为 complete；非零退出、超时或取消变为 error。
9. 用户可以复制消息、重试失败回复、清空当前线程或停止运行。

## 数据模型

升级 `StudioDataSchemaVersion` 到 `8`，在 `StudioDataDocument` 新增：

```ts
interface AssistantChatThread {
  id: string
  workspaceId: string
  title: string
  providerId: string
  model: string
  messages: AssistantChatMessage[]
  createdAt: string
  updatedAt: string
}

interface AssistantChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  status: 'complete' | 'streaming' | 'error'
  error?: string
  createdAt: string
  updatedAt: string
}
```

迁移规则：

- 新文档默认 `assistantChatThreads: []`。
- v7 或更早文档缺失该字段时补空数组。
- 归一化时只保留存在 `workspaceId` 的线程；消息内容和错误归一化为空字符串。
- 运行中消息在重新加载时归一化为 `error`，错误文案为“上次生成已中断。”。

## UI 结构

- `AssistantWorkspace.vue` 仍承载助手页整体布局。
- Provider 配置、全局默认和功能覆盖保留。
- 原“本地 Terminal 测试”替换为聊天区：
  - 左侧：当前工作区线程列表、新建线程、清空线程。
  - 右侧：消息流、运行状态、固定输入区。
  - 移动端：线程入口折叠到顶部或 Sheet，输入区固定在聊天面板底部。
- 消息支持复制；失败或最近一条 assistant 回复支持重试；运行中显示停止按钮。

## 技术方案

- 新增前端纯函数模块 `assistantChat.ts`，负责线程创建、消息追加、chunk 合并、失败/完成状态、基础上下文 prompt 构造。
- 新增 composable `useAssistantChat.ts`，负责读取当前工作区线程、选择线程、持久化变更、调用 Tauri runner、管理 listen/unlisten。
- Tauri 新增：
  - `run_local_terminal_chat_stream`
  - `cancel_local_terminal_chat_stream`
- 后端事件名统一为 `assistant-chat-stream`，payload 使用 camelCase：

```ts
interface LocalTerminalChatStreamEvent {
  runId: string
  event: 'chunk' | 'done' | 'error'
  stream?: 'stdout' | 'stderr'
  chunk?: string
  exitCode?: number | null
  durationMs?: number
  error?: string
}
```

- stdout chunk 追加到 assistant 消息内容。
- stderr chunk 暂存在运行态并在失败时写入消息 error；非零退出码时消息为 error。
- Web 环境不注册 Tauri listen，不执行 invoke。

## 验收标准

- [ ] 默认文档与 v7 迁移包含 `assistantChatThreads: []`。
- [ ] 助手页默认显示聊天区而不是测试面板。
- [ ] 发送消息会立即持久化 user 消息和 streaming assistant 消息。
- [ ] Tauri stdout chunk 会流式追加到 assistant 消息。
- [ ] 非零退出、超时、取消会把 assistant 消息标记为 error。
- [ ] 停止运行后不会继续写入该 run 的后续 chunk。
- [ ] 切换工作区只显示当前工作区线程。
- [ ] Web 环境禁用发送并显示本地 Terminal 仅 Tauri 可用。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```
