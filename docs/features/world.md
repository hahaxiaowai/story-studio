# 世界设定和地图

## 功能目的

世界模块用于管理世界设定条目和地图草图。设定用于承载地点、组织、规则等文本资料，地图用于在本地画布中记录视觉空间关系。

## 用户入口

- 导航 hash：`#world-settings` / `#maps`
- 地图 hash：`#world-map`
- 页面：`apps/studio/src/pages/world/WorldPage.vue`
- 设定面板：`apps/studio/src/pages/world/WorldSettingsPanel.vue`
- 地图画布：`apps/studio/src/pages/world/WorldMapCanvas.vue`

## 主流程

1. 当前工作区对应一个 `WorkspaceWorld`。
2. 用户在设定页维护 `WorldSettingGroup` 和 `WorldSettingItem`。
3. 用户在地图页维护 `WorldMap` 和 `WorldMapStroke`。
4. Tauri/Web 环境都通过统一文档持久化。

## 关键文件

- `apps/studio/src/modules/worlds/world.ts`
- `apps/studio/src/modules/worlds/useWorld.ts`
- `apps/studio/src/modules/worlds/worldMapRenderer.ts`
- `apps/studio/src/pages/world/WorldPage.vue`
- `apps/studio/src/pages/world/WorldSettingsPanel.vue`
- `apps/studio/src/pages/world/WorldMapCanvas.vue`
- `packages/fantasy-map/src/*`
- `packages/types/src/types/story.ts`

## 数据结构

- `WorkspaceWorld`
- `WorldSettingGroup`
- `WorldSettingItem`
- `WorldMap`
- `WorldMapStroke`
- `WorldMapPoint`

## 边界情况

- 旧文档缺少 `worlds` 时，会按工作区创建默认世界数据。
- 世界设定实体历史数据会在迁移中合并到当前 world 结构。
- 地图画布相关渲染逻辑在 `packages/fantasy-map`，页面不应直接复制渲染算法。

## 验证入口

- `apps/studio/src/modules/worlds/world.test.ts`
- `apps/studio/src/modules/worlds/worldMapRenderer.test.ts`
- `packages/fantasy-map/src/*.test.ts`
