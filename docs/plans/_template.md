# 功能名称实施计划

## 来源规格

- `docs/specs/<date>-<feature>.md`

## 实施步骤

1. 更新类型和共享模型。
2. 实现页面或组件结构。
3. 接入状态、常量或工具函数。
4. 补充测试。
5. 运行验证命令。

## 影响文件

- `packages/types/...`
- `packages/utils/...`
- `apps/studio/src/...`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 风险与回滚

- 记录潜在风险。
- 说明如果实现不符合规格，应回滚哪些文件或调整哪些边界。
