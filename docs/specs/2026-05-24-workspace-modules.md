# 工作区与功能模块结构

## 背景

Story Studio 的核心产品模型需要从“总项目/Project”转向“工作区/Workspace”。一个工作区等同于一部作品，用户可以在多个作品之间切换，并在当前作品内部管理大纲、角色、地图和正文内容。素材和助手不默认属于某个单一作品，应作为工作区外的公共能力存在。

## 目标

- 用户可以看到当前工作区，且工作区等同于单部作品。
- 用户可以新建工作区，并自动切换到新建工作区。
- 用户可以在已有工作区之间切换。
- 当前工作区内包含四个核心模块：大纲、角色、地图、内容。
- 工作区外包含两个公共功能：素材、助手。
- 面包屑显示为 `工作区名称 / 当前模块`。
- 当前 `manuscript` 入口后续归入内容模块，兼容现有 `#manuscript` hash。

## 非目标

- 本次不实现工作区重命名、归档和删除的完整交互。
- 本次不实现真实文件保存、数据库保存或 Tauri 命令。
- 本次不引入 Pinia 或路由系统。
- 本次不为大纲、角色、地图、内容建立完整业务数据表。
- 本次不迁移或删除历史 `StoryProject` 类型，只停止围绕它扩展核心产品模型。

## 用户流程

1. 用户打开 `http://127.0.0.1:5173/#cast`。
2. 左侧顶部显示当前工作区切换器，例如 `长夜手稿 / 工作区`。
3. 用户打开工作区切换器，看到已有工作区和“新建工作区”入口。
4. 用户选择另一个工作区，页面标题、面包屑和模块统计跟随当前工作区变化。
5. 用户点击“新建工作区”，系统创建 `未命名作品 N` 并切换到该工作区。
6. 用户在当前工作区内访问大纲、角色、地图、内容。
7. 用户在公共功能区访问素材和助手。

## 数据模型

共享类型位于 `packages/types/src/types/story.ts`：

- `Workspace`
  - `id`: 工作区唯一标识。
  - `title`: 作品名称。
  - `status`: 当前支持 `draft` 和 `archived`。
  - `moduleCounts`: 当前工作区各模块统计。
  - `createdAt`: 创建时间。
  - `updatedAt`: 更新时间。
- `WorkspaceModule = 'outline' | 'characters' | 'maps' | 'content'`
- `PublicModule = 'materials' | 'assistant'`
- `WorkspaceModuleCounts`
  - `outline`: 大纲数量。
  - `characters`: 角色数量。
  - `maps`: 地图数量。
  - `content`: 内容数量。
- `MaterialAsset`
  - 公共素材库中的素材，不默认归属于单一工作区。
- `WorkspaceMaterialRef`
  - 工作区对公共素材的引用关系。

当前 `StoryProject`、`StoryChapter`、`StoryCharacter` 继续保留，用于兼容早期基础体验和后续迁移。

## UI 结构

- `apps/studio/src/components/TeamSwitcher.vue`
  - 作为工作区切换器。
  - 显示当前工作区和新建工作区入口。
- `apps/studio/src/components/AppSidebar.vue`
  - 当前工作区模块导航：大纲、角色、地图、内容。
  - 公共功能区导航：素材、助手。
- `apps/studio/src/components/NavMain.vue`
  - 渲染当前工作区模块分组。
- `apps/studio/src/components/NavProjects.vue`
  - 复用为公共功能分组，并支持隐藏更多操作菜单。
- `apps/studio/src/layouts/SidebarLayout.vue`
  - 面包屑显示 `当前工作区名称 / 当前 hash 对应模块`。
- `apps/studio/src/pages/index.vue`
  - 展示当前工作区概览、模块统计和公共功能区块。

## 技术方案

- 在 `packages/types` 中新增工作区和公共模块类型，保持跨包共享模型集中管理。
- 在 `apps/studio/src/modules/workspaces` 中新增工作区模块：
  - `workspaces.ts`: 纯函数、种子数据、hash 到导航 label 的映射。
  - `useWorkspaces.ts`: Vue 组合式状态，提供当前工作区、新建和切换能力。
  - `workspaces.test.ts`: 覆盖工作区创建、切换结果、模块 label 映射和 hash 映射。
- 现阶段使用 module-level `ref` 保存工作区状态，不引入全局 store。
- 导航仍使用 hash 入口，避免在当前阶段引入路由系统。
- `#manuscript` 与 `#content` 都映射到内容模块，保持旧入口可用。

## 验收标准

- [x] 可以在侧边栏顶部看到当前工作区。
- [x] 可以切换已有工作区。
- [x] 可以新建工作区，且新建后自动激活。
- [x] 当前工作区导航包含大纲、角色、地图、内容。
- [x] 公共功能区包含素材、助手。
- [x] 面包屑显示为 `工作区名称 / 当前模块`。
- [x] `#cast` 映射为角色模块。
- [x] `#manuscript` 映射为内容模块。
- [x] 工作区相关类型从 `packages/types` 导出。
- [x] 工作区纯函数有单元测试覆盖。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

## 注意事项

- 当前工作区数据是前端内存状态，刷新后恢复到种子数据。
- 工作区重命名、归档和持久化应在后续规格中单独展开。
- 当前“项目/Project”结构可以忽略，不再作为核心产品模型继续扩展。
