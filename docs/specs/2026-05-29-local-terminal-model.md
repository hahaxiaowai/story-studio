# 本地 Terminal 模型调用

## 背景

当前 AI 助手已经提供 Provider 配置、默认模型和功能覆盖设置，但配置中心只保存 Provider 信息，尚未形成可验证的模型调用闭环。为了先验证本地模型可用性，需要在助手页提供一个只读测试面板，通过 Tauri 桌面能力启动本地命令，将用户输入的 prompt 写入 stdin，并把 stdout/stderr/退出码/耗时展示给用户。

本功能首版只面向 `local-terminal` Provider，避免提前接入 API Provider、业务写入和调用历史。

## 目标

- 用户可以在助手页选择当前默认或指定的 `local-terminal` Provider。
- 用户可以输入 prompt，并在 Tauri 桌面应用中通过本地命令执行模型调用。
- 系统可以把 prompt 写入命令 stdin，并读取 stdout 作为模型回复展示。
- 系统可以展示 stderr、退出码和耗时，便于调试本地 CLI。
- 系统可以在 Web 浏览器环境给出“本地 Terminal 仅 Tauri 可用”的明确错误状态。

## 非目标

- 本次不执行 `openai-compatible` API Provider。
- 本次不保存调用历史。
- 本次不把结果自动写入大纲、人物、世界、正文或素材模块。
- 本次不做流式输出。
- 本次不做 `{{prompt}}` 命令模板。
- 本次不引入命令白名单、密钥加密或 API 请求能力。
- 本次不升级 `AssistantSettings` schema，继续使用现有 `terminalCommand` 字段。

## 用户流程

1. 用户打开助手页。
2. 用户新增或选择一个本地 Terminal Provider。
3. 用户填写 Terminal 命令，例如 `ollama run llama3.1`。
4. 用户在测试面板输入 prompt。
5. 用户点击运行。
6. Tauri 应用启动本地命令，把 prompt 写入 stdin。
7. 系统展示 stdout、stderr、退出码和耗时。
8. 如果命令失败、超时或在 Web 环境运行，系统展示明确错误，不修改任何作品数据。

## 数据模型

首版不修改 `packages/types`：

- `AiProviderConfig.kind` 继续使用 `local-terminal`。
- `AiProviderConfig.terminalCommand` 继续保存本地命令。
- `AiProviderConfig.model` 继续作为 Provider 的模型名配置传入后端 command，但不要求后端解释该字段。
- 运行结果只保存在前端运行态，不进入 `StudioDataDocument`。

Tauri command 入参：

```ts
interface RunLocalTerminalModelInput {
  providerId: string
  command: string
  model: string
  prompt: string
}
```

Tauri command 返回：

```ts
interface LocalTerminalModelResult {
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
}
```

错误约定：

- 空命令返回稳定错误。
- 空 prompt 返回稳定错误。
- 进程启动失败返回错误。
- 超时默认 60 秒，返回错误，并尽量保留可读 stderr。
- 非 UTF-8 stdout/stderr 返回稳定错误。
- 非零退出码作为失败结果展示：结果中保留 stdout、stderr、exitCode、durationMs，前端同时展示失败状态。

## UI 结构

- `apps/studio/src/modules/assistant/AssistantWorkspace.vue` 在现有配置区下方新增测试面板。
- 测试面板复用现有 `Button`、`Input`、`Textarea` 风格。
- 面板包含 Provider 选择、prompt 输入、运行按钮、状态提示、stdout/stderr/exitCode/durationMs 展示。
- 当 Provider 不是 `local-terminal`、命令为空、prompt 为空或正在运行时，运行按钮禁用并给出明确状态。
- 测试面板只展示结果，不触发其他模块数据变更。

## 技术方案

- Tauri 后端在 `apps/studio/src-tauri/src/lib.rs` 增加 `run_local_terminal_model` command。
- 后端使用 Rust 标准库启动进程、写入 stdin、读取 stdout/stderr，并以 60 秒超时保护首版调用。
- 前端在 `apps/studio/src/modules/assistant` 增加 runner 类型、纯函数和 composable：
  - 解析当前选择的 Provider，优先使用测试面板选择，其次使用全局默认。
  - Web 环境不执行本地命令，直接返回不可用错误。
  - Tauri 环境通过 `@tauri-apps/api/core` 的 `invoke` 调用 `run_local_terminal_model`。
  - 维护 `loading`、`error`、`result` 和禁用原因。
- 单元测试覆盖 Provider 解析、禁用状态、成功结果和失败状态。
- Rust 测试覆盖空命令、命令成功、非零退出码和超时。

## 验收标准

- [x] 助手页可以新增或选择本地 Terminal Provider。
- [x] 命令为空、prompt 为空、非本地 Terminal Provider 或运行中时按钮禁用，并显示原因。
- [x] Tauri 应用内运行成功时展示 stdout、stderr、退出码和耗时。
- [x] 命令非零退出码时展示 stderr 和 exitCode，不静默吞掉错误信息。
- [x] Web dev server 中运行时提示本地 Terminal 仅 Tauri 可用。
- [x] 测试面板结果不写入大纲、人物、世界、正文或素材模块。
- [x] 类型检查通过。
- [x] 必要测试通过。
- [x] 构建通过。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```
