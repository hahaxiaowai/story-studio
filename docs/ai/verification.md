# AI 验证清单

## 目标

根据变更类型选择足够的验证命令，避免 docs-only 改动过度跑业务测试，也避免代码改动只做表面检查。

目标测试文件可参考 `docs/ai/test-map.md`。

## docs-only

适用范围：

- `AGENTS.md`
- `docs/**/*.md`
- 不改变脚本、配置、源码或类型定义

建议验证：

```bash
git diff --check -- <changed-docs>
rg -n "[ \t]+$" <changed-docs>
rg -n "TBD|TODO|implement later|fill in details|Similar to Task" <changed-docs>
```

还需要人工抽查文档中引用的关键代码路径是否存在。命中“月度 TODO”或“检查 TODO 占位词”这类规则文本时，不视为未完成占位。

如果 docs-only 变更涉及流程或模板，还需要演练适用场景，确认任务分流、状态职责、相对链接和完成复位规则没有冲突。

## 纯逻辑改动

适用范围：

- `apps/studio/src/modules/**/*.ts`
- `packages/*/src/**/*.ts`
- 不直接改变页面布局或 Tauri 命令

建议验证：

```bash
pnpm run test
pnpm run typecheck
pnpm run lint
```

如果影响范围很小，可以先跑同目录目标测试，再按风险决定是否跑全量测试。

## 页面或交互改动

适用范围：

- `apps/studio/src/pages/**/*.vue`
- `apps/studio/src/components/**/*.vue`
- `apps/studio/src/layouts/**/*.vue`
- 样式和交互状态变化

建议验证：

```bash
pnpm run test
pnpm run typecheck
pnpm run lint
pnpm run build
```

必要时启动 dev server，在真实页面检查布局、滚动、空状态和关键操作。

## schema 或持久化改动

适用范围：

- `packages/types/src/types/story.ts`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/storage/*`
- 任何新增持久字段、迁移规则或保存流程变化

建议验证：

```bash
pnpm run test
pnpm run typecheck
pnpm run lint
pnpm run build
```

必须覆盖：

- 默认文档创建。
- 旧文档迁移。
- 缺失字段回填。
- 保存前序列化。
- 相关 integrity 规则。

## Tauri 或运行时边界改动

适用范围：

- `apps/studio/src-tauri/**`
- `apps/studio/src/modules/storage/tauri.ts`
- Tauri command、权限、文件路径或 shell 调用变化

建议验证：

```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

如果改动影响桌面运行，还需要按当前 `apps/studio/vite.config.ts` 的端口配置验证 Tauri dev 或前端 dev 页面。

## AI provider 或生成链路改动

适用范围：

- `apps/studio/src/modules/assistant/**`
- `apps/studio/src/modules/content/*Assistant*`
- `apps/studio/src-tauri/src/lib.rs` 中的 AI stream 逻辑

建议验证：

```bash
pnpm run test
pnpm run typecheck
pnpm run lint
```

必须覆盖：

- provider 规范化。
- model 选择。
- streaming 成功和失败状态。
- 生成内容写入目标。
- 中断或异常恢复。

## 验证受限时

如果 Codex 沙箱因为 `spawn EPERM` 或子进程权限导致 Vitest、Vite、esbuild 失败，应按权限流程在沙箱外重跑。若仍无法验证，最终回复必须说明失败命令、失败原因和未覆盖风险。

所有验证记录应包含实际命令、退出码、测试数量或检查范围、警告和未覆盖风险，不把未运行或失败的检查描述为通过。
