# SDD 活动任务流程增强

## 状态

- 当前状态：已完成
- 日期：2026-07-13

## 背景

Story Studio 已有按日期保存的 Spec、独立 Plan、月度 `TODO.md`、Feature Doc 和项目定制验证矩阵，但缺少统一的任务分流、需求澄清、Bug 原始症状门禁、当前主要任务入口和跨会话临时交接。

## 目标

- 保留现有 Spec、Plan 和月度索引的唯一事实职责。
- 新增轻量当前任务指针和按需 Handoff，不复制完整任务状态。
- 明确 `DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP` 门禁。
- 让模糊需求、Bug、重构、架构探索和 docs-only 任务选择合适的流程重量。

## 范围

- 更新仓库协作规则、SDD 工作流、检查单及 Spec/Plan 模板。
- 新增任务分流、需求澄清、Bug 反馈循环示例和 `tasks/` 活动模板。
- 使用本次 docs-only 变更验证新的追溯链路。

## 非目标

- 不新增根目录 `SPEC.md`、`tasks/plan.md` 或 `tasks/todo.md`。
- 不迁移历史 Spec/Plan，不修改产品代码、测试、配置或依赖。
- 不改变月度 `TODO.md` 的自动化调度职责。
- 不新增 Analytics 文档层。

## 成功标准

- 新会话可以从 `tasks/current.md` 定位主要 Spec、Plan、Task 和下一步。
- 模糊功能不能绕过 Spec 确认，Bug 不能绕过原始症状反馈循环。
- REVIEW 和 SHIP 明确覆盖规格符合度、验证证据、长期文档同步和活动模板复位。
- 月度 `TODO.md` 仍是多任务索引和自动化任务来源。
- docs-only 结构、链接、占位词和 whitespace 验证通过。

## 验收示例

1. 小型明确修改可以走简化 DEFINE，不必创建完整 Spec。
2. 中大型功能在 Spec 和 Plan 未确认前不能进入 BUILD。
3. Bug 未复现且无稳定人工路径时只能报告调查结论。
4. 暂停任务可通过 current、handoff、Spec 和 Plan 恢复。
5. SHIP 后完成记录进入 Spec/Plan，current 和 handoff 恢复空闲模板。

## 文档同步

- 更新 `AGENTS.md` 和 `docs/ai/`。
- 更新 Spec/Plan 模板和 2026-07 月度索引。
- 不需要 Feature Doc 或 ADR：本次不改变产品功能或长期运行架构。

## 完成记录

- 完成时间：2026-07-13。
- 实际完成内容：新增任务分流、需求澄清、Bug 反馈循环示例、current/handoff 活动模板，并把六阶段生命周期、垂直任务、验证证据、REVIEW/SHIP 和复位规则接入仓库规则、检查单及模板。
- 验证结果：`git diff --check` 退出码 0；目标 Markdown 尾随空白扫描无命中；占位词扫描仅命中规则说明中的预期示例；16 个变更 Markdown 文件的相对链接检查通过；6 项流程场景断言通过。
- 评审结果：Spec 成功标准和五个验收示例均有对应规则；月度 TODO 保持多任务索引与自动化来源，current 只保留主要任务指针；未引入产品代码、根 SPEC 或第二套 Plan/Todo 状态。
- commit 或变更范围：本地未提交文档变更，范围为 `AGENTS.md`、`tasks/`、`docs/ai/`、本 Spec、对应 Plan、模板和 2026-07 月度索引。
- 未覆盖风险：新流程尚未经过下一次真实功能和 Bug 任务的长期使用验证；后续首次使用时应检查 current/handoff 复位是否自然。
