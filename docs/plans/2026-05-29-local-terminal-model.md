# 本地 Terminal 模型调用实施计划

## 来源规格

- `docs/specs/2026-05-29-local-terminal-model.md`

## 实施步骤

1. 新增 Tauri command 测试。
   - 文件：`apps/studio/src-tauri/src/lib.rs`
   - 覆盖空命令、成功 stdout、非零退出码、超时。
   - 验证方式：`cargo test` 或 `pnpm --filter @story-studio/studio tauri:build` 间接编译。

2. 实现 Tauri 执行层。
   - 文件：`apps/studio/src-tauri/src/lib.rs`
   - 增加 `run_local_terminal_model` command 和纯函数。
   - 使用 stdin 文本协议，返回 stdout/stderr/exitCode/durationMs。
   - 默认 60 秒超时；空命令、空 prompt、启动失败、非 UTF-8 输出返回稳定错误。

3. 新增前端 runner 测试。
   - 文件：`apps/studio/src/modules/assistant/assistantRunner.test.ts`
   - 覆盖 Provider 解析、禁用状态、Web 不可用、Tauri invoke 成功、Tauri invoke 失败、非零退出码失败状态。

4. 实现前端 runner。
   - 文件：`apps/studio/src/modules/assistant/assistantRunner.ts`
   - 文件：`apps/studio/src/modules/assistant/useAssistantRunner.ts`
   - 通过 `@tauri-apps/api/core` 的 `invoke` 调用 Tauri command。
   - 在 Web 环境返回“本地 Terminal 仅 Tauri 可用”。
   - 运行态只保存在 composable 内，不修改 Studio 文档。

5. 更新助手测试面板 UI。
   - 文件：`apps/studio/src/modules/assistant/AssistantWorkspace.vue`
   - 复用现有按钮、输入框和文本域风格。
   - 展示 provider 选择、prompt、运行状态、stdout、stderr、exitCode、durationMs。
   - 保持现有 Provider 管理、默认模型和功能覆盖逻辑不变。

6. 更新多语言文案。
   - 文件：`apps/studio/src/composables/useLocale.ts`
   - 新增测试面板和错误状态中英文文案。

7. 运行验证。
   - 先运行聚焦测试。
   - 再运行 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build`。
   - 最后运行 `pnpm --filter @story-studio/studio tauri:build`。

## 影响文件

- `docs/specs/2026-05-29-local-terminal-model.md`
- `docs/plans/2026-05-29-local-terminal-model.md`
- `apps/studio/src-tauri/src/lib.rs`
- `apps/studio/src/modules/assistant/assistantRunner.ts`
- `apps/studio/src/modules/assistant/assistantRunner.test.ts`
- `apps/studio/src/modules/assistant/useAssistantRunner.ts`
- `apps/studio/src/modules/assistant/AssistantWorkspace.vue`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/env.d.ts`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```

## 风险与回滚

- 本地命令执行是用户主动配置的桌面能力，首版只在 Tauri 环境开放，并在 Web 环境明确禁用。
- 命令超时需要杀掉子进程；如果某些 CLI 产生子进程树，首版只保证直接子进程边界。
- 如果实现不符合规格，应回滚新增 runner 文件、`AssistantWorkspace.vue` 测试面板变更、`useLocale.ts` 文案和 `lib.rs` command。
