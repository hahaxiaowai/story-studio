# 世界模块实施计划

## 1. 数据与迁移

- 修改 `packages/types/src/types/story.ts`，新增世界设定和地图绘制类型。
- 修改 `packages/types/src/index.ts`，导出新增类型。
- 修改 `apps/studio/src/modules/storage/document.ts` 和 `defaultContent.ts`，将 schema 升级到 v4 并补默认世界数据。
- 更新存储测试覆盖默认文档和 v3 迁移。

## 2. 世界模块业务逻辑

- 新增 `apps/studio/src/modules/worlds/world.ts`，提供创建世界、新增设定组、新增条目、新增/清空笔画等纯函数。
- 新增 `useWorld.ts`，按当前工作区读取和写入世界数据。
- 添加 `world.test.ts` 覆盖核心数据操作。

## 3. 世界模块 UI

- 新增 `WorldWorkspace.vue` 作为世界模块入口。
- 新增 `WorldSettingsPanel.vue` 处理设定分组和条目新增。
- 新增 `WorldMapCanvas.vue` 处理 SVG 自由绘制和清空。
- 修改 `pages/index.vue`，将 `#maps` 入口切换为世界模块视图。

## 4. 导航与文案

- 修改 `AppSidebar.vue`，顶层“地图”改为“世界”，子项改为“设定”和“地图”。
- 修改 `useLocale.ts`，补齐世界模块中英文文案。
- 修改 `workspaces.ts` 的导航 hash 映射。

## 5. 验证

- 运行 `pnpm run lint`。
- 运行 `pnpm run typecheck`。
- 运行 `pnpm run test`。
- 运行 `pnpm run build`。
