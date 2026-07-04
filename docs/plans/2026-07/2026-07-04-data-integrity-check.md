# 数据完整性检查实施计划

## 来源规格

- `docs/specs/2026-07-04-data-integrity-check.md`

## 状态

- 当前状态：已完成。
- 创建时间：2026-07-04 00:00 CST。
- 完成时间：2026-07-04 00:00 CST。
- 执行范围：新增当前工作区的数据完整性检查入口，不修改持久化 schema，不自动修复数据。

## 完成记录

- 已新增 `apps/studio/src/modules/integrity/integrity.ts`，覆盖正文关联情节点缺失、素材引用缺失、章节排序重复三类检查。
- 已新增 `apps/studio/src/modules/integrity/useWorkspaceIntegrity.ts`，从当前文档和当前工作区生成检查报告。
- 已新增 `apps/studio/src/pages/integrity/IntegrityPage.vue`，展示通过状态、问题数量、错误数量、提醒数量和问题列表。
- 已通过 `#integrity` 接入项目页分发、侧边栏导航、面包屑映射和中英文文案。
- 本期未修改 `StudioDataDocument` schema，未增加自动修复入口。

## 实施步骤

1. [x] 新增 `apps/studio/src/modules/integrity/integrity.ts` 和测试，提供 `getWorkspaceIntegrityReport()`。
2. [x] 新增 `useWorkspaceIntegrity()`，从当前文档和当前工作区生成 computed report。
3. [x] 新增 `IntegrityPage.vue`，展示汇总和问题列表。
4. [x] 接入 `#integrity` 页面分发、侧边栏入口、面包屑文案和中英文文案。
5. [x] 运行目标测试、类型检查和 lint。
6. [x] 更新本计划和 `TODO.md` 的完成记录。

## 影响文件

- `docs/specs/2026-07-04-data-integrity-check.md`
- `docs/plans/2026-07/TODO.md`
- `docs/plans/2026-07/2026-07-04-data-integrity-check.md`
- `apps/studio/src/modules/integrity/integrity.ts`
- `apps/studio/src/modules/integrity/integrity.test.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.test.ts`
- `apps/studio/src/pages/integrity/IntegrityPage.vue`
- `apps/studio/src/pages/integrity/IntegrityPage.test.ts`
- `apps/studio/src/pages/project/index.vue`
- `apps/studio/src/pages/project/index.test.ts`
- `apps/studio/src/components/AppSidebar.vue`
- `apps/studio/src/components/AppSidebar.test.ts`
- `apps/studio/src/modules/workspaces/workspaces.ts`
- `apps/studio/src/modules/workspaces/workspaces.test.ts`
- `apps/studio/src/composables/useLocale.ts`

## 验证

```bash
pnpm --filter @story-studio/studio test src/modules/integrity/integrity.test.ts src/modules/integrity/useWorkspaceIntegrity.test.ts src/pages/integrity/IntegrityPage.test.ts src/pages/project/index.test.ts src/components/AppSidebar.test.ts src/modules/workspaces/workspaces.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
```

## 验证记录

- 2026-07-04: 目标测试通过，6 个测试文件、25 个测试通过。
- 2026-07-04: `pnpm run typecheck` 通过。
- 2026-07-04: `pnpm run lint` 通过。
- 2026-07-04: `pnpm run build` 通过；保留既有 Rollup pure annotation、Tauri dynamic import 和 chunk size warning。

## 风险与回滚

- 风险：检查项过多会让页面噪音过大。本期只做三类确定性检查。
- 风险：自动修复可能误改用户数据。本期只读展示，不提供修复按钮。
- 回滚：移除新增 `integrity` 模块、页面、导航接线和本规格/计划文件。
