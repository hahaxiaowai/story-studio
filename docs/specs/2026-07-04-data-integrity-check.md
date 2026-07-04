# 数据完整性检查

## 背景

Story Studio 的正文、素材引用、大纲和工作区数据都存放在同一个 `StudioDataDocument` 中。随着章节关联情节点、素材引用和多工作区能力增加，用户需要一个轻量入口发现缺失引用、孤立数据和异常排序，避免写作过程中数据状态悄悄漂移。

## 目标

- 用户可以从工作区导航进入“数据检查”页面。
- 系统可以针对当前工作区列出数据完整性问题。
- 系统可以展示问题数量、错误数量、提醒数量，以及无问题时的通过状态。
- 本期先覆盖正文关联情节点缺失、素材引用缺失、章节排序重复三类检查。

## 非目标

- 本次不自动修复数据。
- 本次不修改 `StudioDataDocument` schema。
- 本次不检查跨工作区的所有历史数据，只检查当前工作区。
- 本次不引入后台任务、导出报告或远程同步。

## 用户流程

1. 用户打开当前作品。
2. 用户在侧边栏工作区导航点击“数据检查”。
3. 系统展示当前工作区的数据检查结果。
4. 如果没有问题，页面显示通过状态。
5. 如果存在问题，页面按列表展示问题标题、说明、来源和严重级别。

## 数据模型

不新增持久化字段。新增运行时类型放在 `apps/studio/src/modules/integrity/integrity.ts`：

- `WorkspaceIntegrityIssueSeverity = 'error' | 'warning'`
- `WorkspaceIntegrityIssueKind = 'missing-outline-beat' | 'missing-material' | 'duplicate-content-order'`
- `WorkspaceIntegrityIssue`
- `WorkspaceIntegrityReport`

检查输入直接使用 `StudioDataDocument` 和当前 `workspaceId`。

## UI 结构

- `apps/studio/src/modules/integrity/` 放纯函数和组合式逻辑。
- `apps/studio/src/pages/integrity/IntegrityPage.vue` 放页面组合和展示。
- `apps/studio/src/pages/project/index.vue` 继续负责 hash 到页面的分发。
- `apps/studio/src/components/AppSidebar.vue` 在工作区导航中增加数据检查入口。

## 技术方案

- `getWorkspaceIntegrityReport(document, workspaceId)` 只做纯数据检查，便于单元测试。
- `useWorkspaceIntegrity()` 从 `useStudioData()` 和 `useWorkspaces()` 读取当前文档与工作区，返回 computed report。
- 页面只展示报告，不负责计算业务规则。
- 导航使用 `#integrity`，并接入 `getNavigationLabelKey()` 的面包屑映射。

## 验收标准

- [x] 纯函数能发现正文关联的缺失情节点。
- [x] 纯函数能发现当前工作区缺失素材的引用。
- [x] 纯函数能发现当前工作区重复章节排序。
- [x] 无问题时报告 `passed = true`。
- [x] 侧边栏和项目页能进入“数据检查”页面。
- [x] 类型检查通过。
- [x] 必要测试通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/integrity/integrity.test.ts src/modules/integrity/useWorkspaceIntegrity.test.ts src/pages/integrity/IntegrityPage.test.ts src/pages/project/index.test.ts src/components/AppSidebar.test.ts src/modules/workspaces/workspaces.test.ts
pnpm run typecheck
pnpm run lint
```
