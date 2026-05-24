# 功能名称

## 背景

说明为什么需要这个功能，以及它解决什么问题。

## 目标

- 用户可以……
- 系统可以……

## 非目标

- 本次不做……
- 本次不引入……

## 用户流程

1. 用户打开……
2. 用户执行……
3. 系统展示或保存……

## 数据模型

说明涉及 `packages/types` 的类型、字段和约束。

## UI 结构

说明涉及 `apps/studio/src/pages`、`components`、`constants`、`styles` 等目录的页面和组件边界。

## 技术方案

说明会修改哪些模块、为什么这样拆，以及跨包依赖如何流动。

## 验收标准

- [ ] 用户流程可以完整走通。
- [ ] 目录结构符合 `AGENTS.md`。
- [ ] 类型检查通过。
- [ ] 必要测试通过。
- [ ] 构建通过。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```
