# Three Canvas 大纲时间轴规格

## 背景

当前大纲页已经有输入模式和编年史模式。编年史模式的桌面端使用 DOM 二维故事板展示情节点、主线/支线和人物发展；移动端使用纵向情节点卡片流。用户希望保留现有大纲时间轴，同时新增一种基于 Canvas 的大画布视图，让复杂时间轴在画布中更清晰地浏览。

## 目标

- 保留当前 DOM 大纲时间轴，不替换、不回滚。
- 在编年史模式桌面端新增 Canvas 视图。
- 使用项目已有的 Three.js 依赖实现画布渲染、平移、缩放和点击选中。
- 复用现有 `ChronicleModel` 派生数据，不修改 `WorkspaceOutline`、`TimelineBeat` 或存储 schema。
- 保留右侧轻量编辑器，Canvas 只负责浏览和选择。

## 非目标

- 不做画布内文本编辑。
- 不做拖拽调整情节点顺序。
- 不做导出图片、小地图导航或自动布局编辑器。
- 不新增 Konva 等额外 canvas 库。
- 不改变移动端卡片流。

## 用户流程

1. 用户进入大纲页并保持编年史模式。
2. 桌面端用户可以在故事板视图和 Canvas 视图之间切换。
3. 用户在 Canvas 视图中拖拽平移、滚轮缩放、点击情节点。
4. 被点击情节点同步为当前选中情节点，右侧轻量编辑器显示对应内容。
5. 用户修改线路名称、颜色或顺序后，Canvas 视图随现有大纲模型刷新。
6. 移动端用户继续看到纵向卡片流，不显示 Canvas 视图切换。

## 数据模型

持久化数据不变。Canvas 使用从 `ChronicleModel` 派生出的只读 layout model：

- 时间列：情节点 id、标题、时间标签、摘要、事件数量。
- 线路泳道：线路 id、名称、颜色、顺序及对应情节点。
- 人物泳道：人物 id、名称及按情节点聚合的人物变化。
- 画布尺寸和命中区域：由密度、列数、泳道数和卡片位置计算得到。

## UI 结构

- 编年史桌面端顶部保留当前密度切换。
- 增加桌面端视图切换：故事板 / 画布。
- Canvas 视图内部提供重置视图按钮。
- Canvas 视图内部提供文字大小控制，并在本机持久化用户选择。
- Canvas 容器使用固定高度和 `touch-none`，避免画布交互影响页面滚动。
- 右侧轻量编辑器保持现有位置和功能。

## 技术方案

- 新增 `packages/outline-timeline-canvas`，导出 Three renderer 和 layout/命中测试工具。
- 在 `apps/studio/src/modules/outlines/chronicle.ts` 增加 `createChronicleCanvasLayout()` 纯函数。
- 新增 `apps/studio/src/pages/outline/OutlineChronicleCanvas.vue` 接入 renderer 生命周期。
- `OutlineChronicleMode.vue` 在桌面端新增故事板 / 画布切换，故事板继续渲染现有 DOM grid。
- 新增必要的中英文文案。

## 验收标准

- [x] 桌面端能在现有故事板和 Canvas 视图之间切换。
- [x] Canvas 视图可拖拽平移、滚轮缩放和重置视图。
- [x] 点击 Canvas 中的情节点会同步右侧轻量编辑器。
- [x] 当前选中情节点在 Canvas 中高亮。
- [x] 线路改名、改色、排序后 Canvas 同步刷新。
- [x] Canvas 文字大小调整后刷新页面仍保留本机偏好。
- [x] 移动端仍使用现有纵向情节点卡片流。

## 验证命令

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`

## 验证结果

- 2026-06-28: 目标测试、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` 均通过。
- 2026-06-28: 补充 Canvas 文字大小本地持久化，目标测试 `pnpm --filter @story-studio/studio test src/pages/outline/OutlineChronicleCanvas.test.ts` 通过。
