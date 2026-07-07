# ADR 规则

`docs/adr/` 用于记录 Story Studio 的长期架构决策。ADR 不记录普通任务计划，也不替代 Spec。

## 何时写 ADR

以下情况应新增 ADR：

- 改变持久化策略或 schema 演进策略。
- 改变 Tauri/Web 边界。
- 引入新的跨模块状态管理方式。
- 改变 AI provider、transport 或安全边界。
- 采用会长期影响目录结构、包边界或构建流程的方案。

## 文件命名

建议使用：

```text
YYYY-MM-DD-short-title.md
```

## 建议结构

- 背景
- 决策
- 备选方案
- 影响
- 后续事项

## 当前状态

当前目录只建立规则。已有历史决策主要分散在 `docs/specs/` 和 `docs/plans/` 中，后续遇到长期架构变更时再补 ADR。
