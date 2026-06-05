# 大纲页布局优化实施计划

## 步骤

1. 为移动端卡片派生数据补充单元测试，覆盖线路、事件数量和人物变化数量。
2. 在编年史模型中实现移动卡片派生函数。
3. 调整大纲页页头文案和布局，移除英文 `timeline`。
4. 重构编年史模式布局：
   - 桌面端保留二维故事板，并让右侧轻量编辑器 sticky、独立滚动。
   - 移动端显示纵向情节点卡片，点击卡片打开底部 Sheet。
5. 补充中英文文案。
6. 为输入模式补充情节点列表派生数据测试，覆盖线路、事件数量和人物变化数量。
7. 重构输入模式布局：
   - 桌面端保留左侧列表和右侧详情表单，并让两栏独立滚动。
   - 移动端默认显示情节点卡片列表，点击卡片打开底部 Sheet 深度编辑。
   - 抽出详情表单子组件，避免桌面右栏和移动 Sheet 复制模板。
8. 运行 lint、typecheck、test、build，并在浏览器验证桌面和移动布局。

## 涉及文件

- `apps/studio/src/modules/outlines/chronicle.ts`
- `apps/studio/src/modules/outlines/chronicle.test.ts`
- `apps/studio/src/modules/outlines/OutlineWorkspace.vue`
- `apps/studio/src/modules/outlines/OutlineChronicleMode.vue`
- `apps/studio/src/modules/outlines/OutlineInputMode.vue`
- `apps/studio/src/composables/useLocale.ts`

## 验证场景

- 默认 seed 数据下，桌面端故事板可横向滚动，右侧轻量编辑器保持可见。
- 388px 宽度下，编年史模式显示纵向卡片流，无横向二维网格。
- 移动端点击卡片后，底部 Sheet 显示该情节点轻量编辑内容。
- 输入模式桌面端左侧情节点列表和右侧表单可独立滚动，右侧标题和操作保持可见。
- 输入模式移动端默认不直接展示完整长表单，点击情节点卡片后显示底部详情 Sheet。
- 新建情节点、模式切换、空状态入口仍可用。
