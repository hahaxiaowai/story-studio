# AI SDD 工作流

## 文档入口顺序

AI 在处理 Story Studio 任务时，优先按下面顺序建立上下文：

1. `AGENTS.md`：仓库级协作规则、目录约定和验证要求。
2. `docs/ai/task-routing.md`：按新功能、Bug、重构、架构探索或 docs-only 选择流程重量。
3. `tasks/current.md`：存在主要任务时定位当前 Spec、Plan、Task 和下一步。
4. `docs/architecture.md`：涉及系统边界时读取系统总览、模块边界和数据流。
5. `docs/features/*.md`：涉及已有功能时读取对应功能现状。
6. `docs/specs/*.md`、`docs/plans/YYYY-MM/*.md`：读取当前规格、计划和历史执行状态。
7. `tasks/handoff.md`：任务暂停或跨会话时读取临时交接。
8. `docs/adr/*.md`：涉及长期架构决策时读取或创建 ADR。

## 开发前

- 先确认任务属于 docs-only、代码修复、功能新增还是架构调整。
- 需求模糊时按 `docs/ai/requirements-dialogue.md` 逐轮澄清，用户确认 Spec 前不进入 Plan。
- 先按 XS / S / M / L 判断风险；XS/S 可以使用 Micro Spec，M/L 或高风险边界先写 Spec，再拆计划。
- 已有功能变更先读取对应 feature doc；没有 feature doc 时，按当前代码补一个最小文档。
- 真实代码或行为改动优先采用 TDD，先写能失败的测试，再实现。
- Bug 修复先捕获原始症状；无法自动化时记录稳定人工路径和风险。

## 变更分类

- docs-only：只改文档、计划或说明，不改变业务行为。需要做文档验证，不需要跑业务 build/test。
- 小修小补：修正文案、样式细节、局部显示问题或测试补齐。可以不写完整 Spec，但要保持测试和文档同步判断。
- 中等功能：新增用户可见能力、调整主流程、改变页面状态流。必须先写或更新 Spec，再拆计划。
- 高影响变更：涉及 `StudioDataDocument` schema、Tauri/Web 边界、AI transport、跨模块状态或包边界。必须写 Spec，并判断是否需要 ADR。
- 架构决策：影响长期演进路线或约束后续实现。必须新增或更新 ADR。

## SDD 生命周期

一次完整变更按 `DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP` 收束：

1. DEFINE：Spec 定义事实、目标、范围、非目标、异常场景、验收示例和验证方式；未确认前不进入 PLAN。
2. PLAN：从已确认 Spec 拆出垂直任务，记录结果契约、验收、验证、依赖、风险和预计影响模块；人工确认前不进入 BUILD。
3. BUILD：一次只执行一个已确认 Task；行为变更使用 Red → Green → Refactor，不扩大 Spec 范围。
4. VERIFY：先运行目标测试，再按风险扩展验证，记录命令、退出码、测试数量、警告和未覆盖风险。
5. REVIEW：核对规格符合度、异常路径、测试、安全、性能、复杂度和文档同步；发现问题返回 BUILD。
6. SHIP：回填 Spec/Plan，更新月度 TODO 和必要长期文档，恢复 current 与使用过的 handoff 空闲模板，并运行 `pnpm run sdd:check`。

Plan 状态与阶段 gate 的关系：

- 待确认：Spec 或 Plan 尚未被确认，不能直接进入实现。
- 已确认：范围和任务已确认，可以开始执行。
- 执行中：已经开始按任务修改代码或文档。
- 已完成：实现、验证和必要文档回填已完成。
- 暂缓：暂不继续推进，需要说明原因和恢复条件。

新式 Plan 还允许 `待验证` 和 `待评审`，分别表示实现已完成但验证或规格评审尚未闭合。

如果执行中发现范围变化、数据模型变化、架构边界变化或验收标准变化，先更新 Spec 和 Plan，再继续实现。

## 活动任务入口

- `tasks/current.md` 只指向当前主要 Spec、Plan 和 Task，不复制正文或替代月度索引。
- 新建或迁移后的 Plan 使用 frontmatter 保存状态权威；`tasks/current.md` 和 `docs/plans/YYYY-MM/TODO.md` 是可校验投影。
- `docs/plans/YYYY-MM/TODO.md` 继续承担多任务索引和自动化调度职责。
- 暂停或跨会话时填写 `tasks/handoff.md`；继续执行后更新或清空过期交接内容。
- SHIP 后 current 和使用过的 handoff 必须恢复空闲模板，完成证据保留在 Spec/Plan。

## Plan 元数据

新式 Plan 顶部使用最小 frontmatter：

```yaml
---
sdd: true
id: 2026-08-03-example
status: 执行中
risk: M
spec: docs/specs/2026-08-03-example.md
updated: 2026-08-03
feature: updated
architecture: not-needed
test-map: updated
adr: not-needed
evidence: pending
---
```

`status` 是权威状态；TODO/current 必须与之匹配。计划标记 `已完成` 时，四项文档同步决策只能是 `updated` 或 `not-needed`，`evidence` 必须为 `recorded`。

## Bug 门禁

- 修复前记录实际行为、预期行为、环境和最小复现。
- 优先建立修复前失败、修复后通过的自动化反馈循环。
- 无法自动化时记录原因、稳定人工步骤和未覆盖风险。
- 没有捕获原始症状时，只能报告调查结果，不能声称 Bug 已修复。

## 开发中

- 页面文件只做页面组合、状态接线和流程入口。
- 业务规则放在模块级纯 TS 或组合式函数中。
- 类型优先复用 `packages/types`。
- 持久化写入统一走 `useStudioData().updateDocument()`。
- 不扩大 Spec 未覆盖的范围。

## REVIEW 与 SHIP

VERIFY 完成后先按 Spec 逐项评审，再根据影响范围同步文档：

- 功能现状变化：更新 `docs/features/*.md`。
- Spec 执行完成：回填对应 `docs/specs/*.md`。
- 长期架构决策变化：新增或更新 `docs/adr/*.md`。
- 计划状态变化：更新对应 `docs/plans/YYYY-MM/*.md`。
- 任务状态变化：同步月度 `TODO.md`；SHIP 后恢复活动任务模板。
- 新式 Plan：运行 `pnpm run sdd:check`，不通过时不得标记完成。

代码或配置变更后按 `AGENTS.md` 的验证要求运行命令。docs-only 改动使用结构、链接、路径、占位词、whitespace 和职责场景检查。

具体命令选择参考 `docs/ai/verification.md`。
完整执行自检参考 `docs/ai/sdd-checklist.md`。
