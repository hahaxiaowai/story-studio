---
sdd: true
id: 2026-08-03-gpt56-sdd-optimization
status: 已完成
risk: M
spec: docs/specs/2026-08-03-gpt56-sdd-optimization.md
updated: 2026-08-03
feature: not-needed
architecture: not-needed
test-map: not-needed
adr: not-needed
evidence: recorded
---

# GPT-5.6 自适应 SDD 流程优化计划

## 结果契约

- 将 Plan 机器可读元数据作为状态权威，TODO 和 current 作为可校验投影。
- 新 SDD 检查器在不引入依赖的情况下捕获状态、SHIP 证据和链接漂移。
- 文档流程根据 XS / S / M / L 调整重量，并允许确认后连续执行。
- 自动备份剩余真实验收作为明确暂缓项保留。

## Task 1：建立 SDD 状态和 SHIP 自动门禁

- 验收：`sdd:check` 校验 frontmatter、Plan/TODO/current 一致性、完成证据和链接。
- 验证：`pnpm run sdd:test` 和 `pnpm run sdd:check`。
- 预计影响：`scripts/`、`package.json`。
- 依赖：无。
- 规模：S。
- 状态：已完成。

## Task 2：精简并分级 SDD 流程

- 验收：路由、工作流、检查单和模板统一使用 XS / S / M / L，Plan 改为结果契约。
- 验证：文档结构、链接、占位词和 `sdd:check`。
- 预计影响：`AGENTS.md`、`docs/ai/`、`docs/specs/_template.md`、`docs/plans/_template.md`。
- 依赖：Task 1。
- 规模：M。
- 状态：已完成。

## Task 3：迁移当前状态并完成收口

- 验收：自动备份证据与未覆盖边界如实回填；本计划通过全部验证并恢复 current 空闲。
- 验证：Spec 逐项 Review、全量工程命令和 `git diff --check`。
- 预计影响：2026-07/08 Spec、Plan、TODO 和 `tasks/current.md`。
- 依赖：Task 1、Task 2。
- 规模：S。
- 状态：已完成。

## 验证

```bash
pnpm run sdd:test
pnpm run sdd:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

## 风险与回滚

- 历史 Plan 形式不一：检查器只管理带 `sdd: true` 的新 Plan，历史文档按需渐进迁移。
- 过度门禁阻塞小修改：XS/S 任务允许 Micro Spec，不强制创建独立 Plan。
- 元数据与正文重复：元数据是权威，正文状态仅保留人类阅读所需的 Task 进度。

## 完成记录

- 完成时间：2026-08-03。
- 验证结果：`pnpm run sdd:test` 1 文件、5 项通过；目标 ESLint 通过；`pnpm run sdd:check` 校验 2 个机器可读计划通过；仓库 lint、typecheck、test（Studio 53 文件、286 项及共享包测试）和 build 通过；`git diff --check` 通过。
- 评审结果：Spec 六项验收均有实现和验证证据；Plan 元数据是权威状态，TODO/current 作为投影；历史 Plan 仅按需迁移；没有修改产品业务行为或引入依赖。
- commit：未提交。
- 未覆盖风险：当前检查器只管理带 `sdd: true` 的 Plan，历史计划仍依赖渐进迁移；TODO/current 仍为人工更新后的自动校验投影，尚未实现生成命令。
