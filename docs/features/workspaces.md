# 工作区与导航

## 功能目的

工作区用于承载一个故事项目的独立创作空间。每个工作区拥有大纲、角色、世界设定、正文等模块计数，并可在草稿和归档状态之间切换。

## 用户入口

- 主工作台：`apps/studio/src/pages/project/index.vue`
- 侧边栏导航：`apps/studio/src/components/AppSidebar.vue`
- 工作区列表：`apps/studio/src/components/NavProjects.vue`
- 工作区创建：`apps/studio/src/components/WorkspaceCreateDialog.vue`
- 工作区详情：`apps/studio/src/components/WorkspaceDetailsDialog.vue`

## 主流程

1. `useStudioData()` 加载 `StudioDataDocument`。
2. `useWorkspaces()` 读取 `activeWorkspaceId` 并派生当前工作区。
3. 用户在侧边栏切换 hash 或工作区。
4. `pages/project/index.vue` 根据 hash 渲染对应页面。
5. 创建、归档、恢复或编辑工作区时，通过 `updateDocument()` 写回统一文档。

## 关键文件

- `apps/studio/src/modules/workspaces/workspaces.ts`
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- `apps/studio/src/pages/project/index.vue`
- `apps/studio/src/pages/project/ProjectOverview.vue`
- `packages/types/src/types/story.ts`

## 数据结构

- `Workspace`
- `WorkspaceModule`
- `WorkspaceModuleCounts`
- `StudioDataDocument.workspaces`
- `StudioDataDocument.activeWorkspaceId`

## 边界情况

- 不能归档最后一个草稿工作区。
- 工作区标题为空时应拒绝创建或更新。
- 创建工作区时使用标题派生 slug，并在冲突时追加序号。
- `#materials`、`#assistant-chat`、`#assistant` 属于公开导航，不绑定单个工作区模块。

## 验证入口

- `apps/studio/src/modules/workspaces/workspaces.test.ts`
- `apps/studio/src/modules/workspaces/useWorkspaces.test.ts`
- `apps/studio/src/pages/project/index.test.ts`
- `apps/studio/src/components/AppSidebar.test.ts`
