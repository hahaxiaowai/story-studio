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
