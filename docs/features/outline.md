# 大纲工作台

## 功能目的

大纲工作台用于组织故事情节点、主线/支线、事件标签和人物变化。它是正文章节和 AI 内容生成的重要上下文来源。

## 用户入口

- 导航 hash：`#outline`
- 页面：`apps/studio/src/pages/outline/OutlinePage.vue`
- 线路管理：`apps/studio/src/pages/outline/OutlineLineManagerDialog.vue`
- 时间轴画布：`apps/studio/src/pages/outline/OutlineChronicleCanvas.vue`

## 主流程

1. 当前工作区对应一个 `WorkspaceOutline`。
2. 用户新增、编辑、移动或删除 `TimelineBeat`。
3. 用户可管理 `PlotLine`，并将情节点关联到一条或多条线路。
4. 编年史模式把情节点、线路、标签和人物变化渲染为桌面故事板或 Canvas；移动端改用纵向情节点卡片流。
5. 输入模式用于深度编辑情节点；桌面端为列表与详情双栏，移动端先显示卡片列表，再通过底部 Sheet 编辑详情。
6. 正文和 AI 模块可通过 `outlineBeatId` 关联到具体情节点。

## 关键文件

- `apps/studio/src/modules/outlines/outline.ts`
- `apps/studio/src/modules/outlines/useOutline.ts`
- `apps/studio/src/modules/outlines/chronicle.ts`
- `apps/studio/src/modules/outlines/input-mode.ts`
- `apps/studio/src/pages/outline/OutlinePage.vue`
- `apps/studio/src/pages/outline/OutlineBeatEditor.vue`
- `apps/studio/src/pages/outline/OutlineChronicleMode.vue`
- `apps/studio/src/pages/outline/OutlineInputMode.vue`
- `packages/outline-timeline-canvas/src/*`
- `packages/types/src/types/story.ts`

## 数据结构

- `WorkspaceOutline`
- `TimelineBeat`
- `PlotLine`
- `OutlineEventTag`
- `BeatEvent`
- `CharacterChange`

## 边界情况

- 至少保留一条 plot line。
- 已被情节点引用的 plot line 不能直接删除。
- 情节点移动后需要重新规范化 `order`。
- 画布偏好保存在组件本地 storage，而不是全局 schema。

## 验证入口

- `apps/studio/src/modules/outlines/outline.test.ts`
- `apps/studio/src/modules/outlines/useOutline.test.ts`
- `apps/studio/src/modules/outlines/chronicle.test.ts`
- `apps/studio/src/modules/outlines/input-mode.test.ts`
- `apps/studio/src/pages/outline/OutlineLineManagerDialog.test.ts`
- `packages/outline-timeline-canvas/src/*.test.ts`
