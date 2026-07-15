# SDD 活动任务流程增强实施计划

## 来源规格

- [`docs/specs/2026-07-13-sdd-workflow-hardening.md`](../../specs/2026-07-13-sdd-workflow-hardening.md)

## 状态

- 当前状态：已完成
- 优先级：P1
- 创建时间：2026-07-13
- 最后更新：2026-07-13

## 实施任务

### Task 1：任务分流与需求澄清

- 目标：为不同任务类型建立明确路径和进入 BUILD 的门禁。
- 验收：覆盖模糊功能、小改动、Bug、重构、架构探索和 docs-only。
- 验证：章节、状态值、相对链接和占位词检查。
- 依赖：无。
- 预计影响文件：`docs/ai/task-routing.md`、`docs/ai/requirements-dialogue.md`、`docs/ai/examples/bug-feedback-loop.md`。
- 规模：S。
- 状态：已完成。

### Task 2：活动任务与交接模板

- 目标：提供当前主要任务入口和按需跨会话交接，不复制 Spec/Plan 状态。
- 验收：current 明确指针职责，handoff 明确临时职责和唯一下一步。
- 验证：链接和职责分离场景演练。
- 依赖：Task 1。
- 预计影响文件：`tasks/current.md`、`tasks/handoff.md`。
- 规模：XS。
- 状态：已完成。

### Task 3：生命周期、模板和月度索引同步

- 目标：把新门禁接入仓库入口、工作流、检查单和模板。
- 验收：REVIEW/SHIP、Bug 证据、垂直 Task、验证证据和活动模板复位规则完整。
- 验证：结构、链接、占位词、whitespace 和五组场景演练。
- 依赖：Task 1、Task 2。
- 预计影响文件：`AGENTS.md`、`docs/ai/sdd-workflow.md`、`docs/ai/sdd-checklist.md`、`docs/specs/_template.md`、`docs/plans/_template.md`、`docs/plans/2026-07/TODO.md`。
- 规模：M。
- 状态：已完成。

## 风险与缓解

- 活动入口形成第二状态源：current 只保存链接和摘要，计划状态继续由 Plan 与月度 TODO 维护。
- 自动化读取受影响：明确自动化仍只从月度 TODO 选择任务。
- 流程过重：任务分流允许小改动使用简化 DEFINE。

## 完成记录

- 完成时间：2026-07-13。
- 验证结果：`git diff --check`、尾随空白、占位词、16 个变更 Markdown 相对链接和 6 项流程场景断言通过；所有命令退出码为 0。
- 评审结果：三个 Task 均满足验收；活动入口未替代 Spec/Plan/月度 TODO，Bug、REVIEW 和 SHIP 门禁已进入仓库入口、工作流、检查单与模板。
- 未覆盖风险：尚未用下一次真实产品任务验证新模板的填写成本和跨会话恢复体验。
