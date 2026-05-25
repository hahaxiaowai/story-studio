# 工作区与功能模块结构实施计划

## 来源规格

- `docs/specs/2026-05-24-workspace-modules.md`

## 当前状态

- 已实现第一版工作区结构。
- 已完成工作区切换、新建、模块导航、公共功能导航和面包屑映射。
- 新建工作区已从直接创建默认名称升级为 Dialog 表单，支持作品名称和简介。
- 当前计划用于记录已落地的实施边界，后续持久化、归档、重命名可在新规格中继续拆分。

## 实施步骤

1. 更新共享类型。
   - 文件：`packages/types/src/types/story.ts`
   - 新增 `Workspace`、`WorkspaceModule`、`PublicModule`、`WorkspaceModuleCounts`、`MaterialAsset`、`WorkspaceMaterialRef`。
   - 文件：`packages/types/src/index.ts`
   - 统一导出新增类型。

2. 编写工作区纯函数测试。
   - 文件：`apps/studio/src/modules/workspaces/workspaces.test.ts`
   - 覆盖新建工作区后自动激活。
   - 覆盖中文默认名称生成稳定 id。
   - 覆盖按 id 查找工作区。
   - 覆盖工作区模块到 locale key 的映射。
   - 覆盖 hash 到导航 label key 的映射。

3. 实现工作区纯函数和种子数据。
   - 文件：`apps/studio/src/modules/workspaces/workspaces.ts`
   - 定义 `workspaceModules`。
   - 定义 `seedWorkspaces`。
   - 实现 `appendWorkspace`、`getWorkspaceById`、`getWorkspaceModuleLabelKey`、`getNavigationLabelKey`、`createWorkspace`。
   - 支持 `Workspace.description`。
   - 拒绝空标题，并为重复标题生成唯一 id。

4. 实现工作区组合式状态。
   - 文件：`apps/studio/src/modules/workspaces/useWorkspaces.ts`
   - 使用 module-level `ref` 保存 `workspaces` 和 `activeWorkspaceId`。
   - 暴露 `activeWorkspace`、`setActiveWorkspace`、`addWorkspace`。
   - 新建工作区时使用 `未命名作品 N`，并自动切换到新工作区。

5. 更新工作区切换器。
   - 文件：`apps/studio/src/components/TeamSwitcher.vue`
   - 用当前工作区替代旧团队/项目展示。
   - 下拉菜单列出所有工作区。
   - 当前工作区显示选中状态。
   - 增加“新建工作区”入口，点击后打开基础信息表单。

5.1. 增加新建工作区表单。
   - 文件：`apps/studio/src/components/WorkspaceCreateDialog.vue`
   - 使用 shadcn-vue `Dialog`、`Field`、`Input`、`Textarea`、`Button`。
   - 表单字段：作品名称必填，简介可选。
   - 提交后创建并切换到新工作区。

6. 更新侧边栏导航。
   - 文件：`apps/studio/src/components/AppSidebar.vue`
   - 当前工作区模块：大纲、角色、地图、内容。
   - 公共功能区：素材、助手。
   - 内容模块保留 `#manuscript` 入口。

7. 更新导航组件文案和行为。
   - 文件：`apps/studio/src/components/NavMain.vue`
   - 当前工作区分组使用 `nav.group.workspace`。
   - 文件：`apps/studio/src/components/NavProjects.vue`
   - 公共功能分组使用 `nav.group.public`。
   - 支持 `showActions` 控制是否展示更多操作。

8. 更新面包屑。
   - 文件：`apps/studio/src/layouts/SidebarLayout.vue`
   - 第一层显示当前工作区名称。
   - 第二层根据 `location.hash` 映射当前模块。
   - 监听 `hashchange` 让面包屑跟随 hash 更新。

9. 更新首页工作台。
   - 文件：`apps/studio/src/pages/index.vue`
   - 使用当前工作区标题和模块统计。
   - 展示大纲、角色、地图、内容四个模块。
   - 增加素材和助手公共功能区块。

10. 补充 locale key。
    - 文件：`apps/studio/src/composables/useLocale.ts`
    - 增加工作区、公共功能、模块导航和菜单相关中英文文案。
    - 增加新建工作区表单、占位符和校验错误中英文文案。

11. 运行验证命令。
    - `pnpm run lint`
    - `pnpm run typecheck`
    - `pnpm run test`

## 影响文件

- `packages/types/src/index.ts`
- `packages/types/src/types/story.ts`
- `apps/studio/src/components/AppSidebar.vue`
- `apps/studio/src/components/NavMain.vue`
- `apps/studio/src/components/NavProjects.vue`
- `apps/studio/src/components/TeamSwitcher.vue`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/layouts/SidebarLayout.vue`
- `apps/studio/src/modules/workspaces/workspaces.ts`
- `apps/studio/src/modules/workspaces/workspaces.test.ts`
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- `apps/studio/src/pages/index.vue`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

## 风险与回滚

- 风险：当前状态只存在内存中，刷新后新建工作区会丢失。
  - 应对：后续单独补“工作区持久化”规格，明确 localStorage、文件系统或 Tauri 存储方案。
- 风险：历史 `StoryProject` 类型仍存在，可能造成命名混用。
  - 应对：新增功能优先使用 `Workspace`；只有兼容旧基础体验时才引用 `StoryProject`。
- 风险：hash 导航在复杂页面层级下会变得脆弱。
  - 应对：后续引入正式路由前，继续把 hash 到模块的映射集中在 `workspaces.ts`。
- 回滚边界：如需回滚该结构，优先回滚 `modules/workspaces`、侧边栏和布局改动，保留 `packages/types` 的兼容性由后续迁移决定。
