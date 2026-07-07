# AI SDD 工作流

## 文档入口顺序

AI 在处理 Story Studio 任务时，优先按下面顺序建立上下文：

1. `AGENTS.md`：仓库级协作规则、目录约定和验证要求。
2. `docs/architecture.md`：系统总览、模块边界和数据流。
3. `docs/features/*.md`：涉及已有功能时读取对应功能现状。
4. `docs/specs/*.md`：涉及新增功能或较大行为调整时读取或创建 Spec。
5. `docs/plans/YYYY-MM/*.md`：读取当前拆解计划和历史执行状态。
6. `docs/adr/*.md`：涉及长期架构决策时读取或创建 ADR。

## 开发前

- 先确认任务属于 docs-only、代码修复、功能新增还是架构调整。
- 非平凡功能变更先写 Spec，再拆计划，最后实现。
- 已有功能变更先读取对应 feature doc；没有 feature doc 时，按当前代码补一个最小文档。
- 真实代码或行为改动优先采用 TDD，先写能失败的测试，再实现。

## 变更分类

- docs-only：只改文档、计划或说明，不改变业务行为。需要做文档验证，不需要跑业务 build/test。
- 小修小补：修正文案、样式细节、局部显示问题或测试补齐。可以不写完整 Spec，但要保持测试和文档同步判断。
- 中等功能：新增用户可见能力、调整主流程、改变页面状态流。必须先写或更新 Spec，再拆计划。
- 高影响变更：涉及 `StudioDataDocument` schema、Tauri/Web 边界、AI transport、跨模块状态或包边界。必须写 Spec，并判断是否需要 ADR。
- 架构决策：影响长期演进路线或约束后续实现。必须新增或更新 ADR。

## SDD 闭环

一次完整 SDD 变更按以下顺序收束：

1. Spec 定义目标、非目标、验收标准和验证方式。
2. Plan 从 Spec 拆出可执行步骤，记录涉及文件和验证命令。
3. 实现按 TDD 或 docs-only 验证推进，不扩大 Spec 范围。
4. 完成后回填 Spec 的完成记录。
5. 如果功能现状变化，同步更新 `docs/features/*.md`。
6. 如果计划状态变化，同步更新 `docs/plans/YYYY-MM/*.md`。
7. 如果长期架构决策变化，同步更新 `docs/adr/*.md`。

## 开发中

- 页面文件只做页面组合、状态接线和流程入口。
- 业务规则放在模块级纯 TS 或组合式函数中。
- 类型优先复用 `packages/types`。
- 持久化写入统一走 `useStudioData().updateDocument()`。
- 不扩大 Spec 未覆盖的范围。

## 开发后

完成后根据影响范围同步文档：

- 功能现状变化：更新 `docs/features/*.md`。
- Spec 执行完成：回填对应 `docs/specs/*.md`。
- 长期架构决策变化：新增或更新 `docs/adr/*.md`。
- 计划状态变化：更新对应 `docs/plans/YYYY-MM/*.md`。

代码或配置变更后按 `AGENTS.md` 的验证要求运行命令。docs-only 改动可使用结构清单、路径引用、占位词和 whitespace 检查。

具体命令选择参考 `docs/ai/verification.md`。
完整执行自检参考 `docs/ai/sdd-checklist.md`。
