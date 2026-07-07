# SDD 执行检查单

## 目标

本检查单用于一次 Story Studio 任务从理解、规格、计划、实现、验证到文档回填的快速自检。更完整的流程说明见 `docs/ai/sdd-workflow.md`。

可参考样例：`docs/ai/examples/data-integrity-check.md`。

## 1. 建立上下文

- [ ] 已阅读 `AGENTS.md`。
- [ ] 已阅读 `docs/architecture.md`，或确认本次不涉及模块边界。
- [ ] 已阅读相关 `docs/features/*.md`，或确认本次是新功能且需要新增功能说明。
- [ ] 已阅读相关 `docs/specs/*.md` 和 `docs/plans/YYYY-MM/*.md`。
- [ ] 已检查当前工作树，确认不会覆盖用户已有改动。

## 2. 判断变更类型

- [ ] docs-only：只改文档、计划或说明。
- [ ] 小修小补：局部 bug fix、文案、样式或测试补齐。
- [ ] 中等功能：新增用户可见能力或调整主流程。
- [ ] 高影响变更：涉及 schema、Tauri/Web 边界、AI transport、跨模块状态或包边界。
- [ ] 架构决策：需要 ADR。

判断结果：

- 本次类型：
- 是否需要 Spec：
- 是否需要 Plan：
- 是否需要 ADR：

## 3. Spec 和 Plan

- [ ] 需要 Spec 时，已基于 `docs/specs/_template.md` 创建或更新规格。
- [ ] Spec 已写清目标、范围、非目标、验收标准和验证命令。
- [ ] 需要 Plan 时，已在 `docs/plans/YYYY-MM/` 创建或更新计划文件。
- [ ] 月度 `TODO.md` 已记录任务状态和计划链接。
- [ ] 没有把未确认范围直接扩大为实现。

## 4. TDD 和实现

- [ ] 代码变更前已确定目标测试，参考 `docs/ai/test-map.md`。
- [ ] 真实行为变更已先写失败测试。
- [ ] 实现只覆盖 Spec / Plan 范围。
- [ ] 页面文件只做页面组合、状态接线和流程入口。
- [ ] 业务规则放在模块级纯 TS 或组合式函数中。
- [ ] 持久化写入统一走 `useStudioData().updateDocument()`。

## 5. 验证

- [ ] 已按 `docs/ai/verification.md` 选择验证命令。
- [ ] 已先跑目标测试。
- [ ] 已按风险扩展到 lint、typecheck、test 或 build。
- [ ] docs-only 改动已跑 `git diff --check`、尾随空白扫描和占位词扫描。
- [ ] docs-only 改动已抽查当前文档中的关键路径、端口和命令是否仍符合当前代码。
- [ ] 历史 Spec / Plan 中的旧路径、旧端口或旧命令已判断是否属于历史记录；非当前入口事实不强制改写。
- [ ] 如果验证受限，已记录失败命令、失败原因和未覆盖风险。

## 6. 文档回填

- [ ] 功能现状变化已更新 `docs/features/*.md`。
- [ ] SDD 变更完成后已回填 `docs/specs/*.md`。
- [ ] 计划状态变化已更新 `docs/plans/YYYY-MM/*.md`。
- [ ] 长期架构决策变化已新增或更新 `docs/adr/*.md`。
- [ ] 验证入口变化已更新 `docs/ai/test-map.md` 或 `docs/ai/verification.md`。

## 7. 提交前

- [ ] 已检查 `git status --short --branch`。
- [ ] 已确认暂存范围只包含本次任务文件。
- [ ] 已说明验证结果。
- [ ] 提交信息符合 Conventional Commit，描述部分使用中文。
- [ ] 如需推送，已确认远端和分支。
