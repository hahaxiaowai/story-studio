# 工作区详情编辑

## 背景

当前工作区可以创建和切换，但创建后不能修正作品名称或简介。早期工作区规格将重命名、归档和删除列为后续能力；其中重命名和简介更新是最小且高频的基础维护流程。

## 目标

- 用户可以从工作区切换器打开当前工作区的详情编辑入口。
- 用户可以修改当前工作区的作品名称和简介。
- 系统保存修改后立即更新侧边栏、面包屑和当前工作区视图。

## 非目标

- 本次不实现工作区归档、恢复和删除。
- 本次不修改工作区 id，避免影响已有大纲、正文、角色、地图和助手线程关联。
- 本次不引入全局状态库或新 UI 依赖。

## 用户流程

1. 用户打开侧边栏顶部工作区切换器。
2. 用户点击“编辑工作区”入口。
3. 系统弹出当前工作区名称和简介表单。
4. 用户修改作品名称或简介并保存。
5. 系统保存到统一本地文档，并关闭弹窗。

## 数据模型

沿用 `Workspace`：

- `title`: 保存修剪后的非空作品名称。
- `description`: 保存修剪后的简介；空简介会从对象中移除。
- `updatedAt`: 保存时更新为当前时间。

工作区 `id` 不随名称变更而变化，所有通过 `workspaceId` 关联的内容保持稳定。

## UI 结构

- `apps/studio/src/components/TeamSwitcher.vue`
  - 在现有工作区切换器底部增加编辑当前工作区入口。
- `apps/studio/src/components/WorkspaceDetailsDialog.vue`
  - 页面无关、但绑定当前工作区的编辑弹窗。

## 技术方案

- `apps/studio/src/modules/workspaces/workspaces.ts`
  - 新增纯函数更新指定工作区详情。
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
  - 暴露保存当前工作区详情的方法，并写入 `useStudioData()` 的统一文档。
- `apps/studio/src/composables/useLocale.ts`
  - 补齐中英文文案。

## 验收标准

- [x] 可以从工作区切换器打开当前工作区详情编辑弹窗。
- [x] 保存非空名称后，当前工作区标题立即更新。
- [x] 保存空白名称会阻止提交并显示校验提示。
- [x] 保存空白简介会清除原简介。
- [x] 工作区 id 不因重命名变化。
- [x] 类型检查通过。
- [x] 必要测试通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts
pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts
pnpm --filter @story-studio/studio test src/components/WorkspaceDetailsDialog.test.ts
pnpm --filter @story-studio/studio test src/components/TeamSwitcher.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
```
