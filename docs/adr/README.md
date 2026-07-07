# ADR 规则

`docs/adr/` 用于记录 Story Studio 的长期架构决策。ADR 不记录普通任务计划，也不替代 Spec。

## 何时写 ADR

以下情况应新增 ADR：

- 改变持久化策略或 schema 演进策略。
- 改变 Tauri/Web 边界。
- 引入新的跨模块状态管理方式。
- 改变 AI provider、transport 或安全边界。
- 采用会长期影响目录结构、包边界或构建流程的方案。

## Story Studio 触发样例

以下情况通常需要 ADR：

- 决定是否引入 Pinia、TanStack Query 或其他跨页面状态管理方案。
- 决定是否把当前单一 `StudioDataDocument` 拆成多文档或多数据库表。
- 调整 `StudioDataDocument` schema 演进策略，例如废弃旧迁移、引入分段迁移或改变 schema version 规则。
- 改变 Web IndexedDB 与 Tauri 本地文件之间的存储边界。
- 改变 Tauri command 权限、数据文件路径或桌面端读写安全策略。
- 改变 AI provider 模型，例如从页面侧 OpenAI-compatible 调用迁移到统一 Tauri transport。
- 改变 local-terminal provider 的命令执行边界、环境变量约定或安全限制。
- 把 `apps/studio/src/pages` / `modules` 的边界改成新的目录体系。
- 新增会长期影响多个 package 的共享渲染引擎、编辑器引擎或地图/时间线引擎。
- 改变 workspace、content、outline、materials 之间的持久化关联模型。

以下情况通常不需要 ADR：

- 单个页面内的局部 UI 调整。
- 已有模块内的小型 bug fix。
- 新增一个功能切片但不改变长期架构边界。
- 只更新 Spec、Plan、Feature Doc 或测试说明。
- 在既有 schema 演进策略下新增普通字段并补迁移。

## 文件命名

建议使用：

```text
YYYY-MM-DD-short-title.md
```

新建 ADR 时优先复制 `docs/adr/_template.md`。

## 建议结构

- 背景
- 决策
- 备选方案
- 影响
- 后续事项

## 当前状态

当前目录只建立规则。已有历史决策主要分散在 `docs/specs/` 和 `docs/plans/` 中，后续遇到长期架构变更时再补 ADR。
