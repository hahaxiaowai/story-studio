# Three Canvas 大纲时间轴实施计划

## 步骤

- [x] 为 `chronicle.ts` 增加 Canvas layout 单元测试，覆盖情节点排序、线路泳道、人物泳道和空状态。
- [x] 新增 `packages/outline-timeline-canvas`，先写 renderer/layout 工具测试。
- [x] 实现 Canvas layout 纯函数和 Three renderer。
- [x] 新增 `OutlineChronicleCanvas.vue`，接入 renderer 生命周期、选中状态和重置视图。
- [x] Canvas 文字大小控制写入本机持久化，刷新后恢复用户选择。
- [x] 桌面端编年史视图和密度选择写入本机持久化，刷新后恢复用户选择。
- [x] 修改 `OutlineChronicleMode.vue`，在桌面端新增故事板 / 画布视图切换，并保留移动端卡片流。
- [x] 补充中英文文案。
- [x] 运行 lint、typecheck、test、build。

## 涉及文件

- `apps/studio/src/modules/outlines/chronicle.ts`
- `apps/studio/src/modules/outlines/chronicle.test.ts`
- `apps/studio/src/pages/outline/OutlineChronicleMode.vue`
- `apps/studio/src/pages/outline/OutlineChronicleCanvas.vue`
- `apps/studio/src/composables/useLocale.ts`
- `packages/outline-timeline-canvas/*`

## 验证场景

- 默认 seed 数据下，桌面端故事板视图仍可使用。
- 切换到 Canvas 视图后，可以平移、缩放、重置视图。
- 点击 Canvas 卡片后，右侧轻量编辑器显示对应情节点。
- 修改线路名称、颜色和排序后，Canvas 视图刷新。
- 小屏宽度下仍显示移动端卡片流，不显示桌面 Canvas。

## 验证结果

- 2026-06-28: `pnpm --filter @story-studio/outline-timeline-canvas test`
- 2026-06-28: `pnpm --filter @story-studio/outline-timeline-canvas typecheck`
- 2026-06-28: `pnpm --filter @story-studio/studio test src/modules/outlines/chronicle.test.ts src/pages/outline/OutlineLineManagerDialog.test.ts`
- 2026-06-28: `pnpm run lint`
- 2026-06-28: `pnpm run typecheck`
- 2026-06-28: `pnpm run test`
- 2026-06-28: `pnpm run build`
- 2026-06-28: `pnpm --filter @story-studio/studio test src/pages/outline/OutlineChronicleCanvas.test.ts`
- 2026-06-28: `pnpm --filter @story-studio/studio test src/pages/outline/OutlineChronicleMode.test.ts src/pages/outline/OutlineChronicleCanvas.test.ts`
