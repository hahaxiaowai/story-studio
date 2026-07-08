# 大纲页布局优化实施计划

## 来源规格

- `docs/specs/outline-layout-optimization.md`

## 状态

- 当前状态：已完成。
- 优先级：P2
- 创建时间：2026-06
- 最后更新：2026-07-07

## 步骤

- [x] 为移动端卡片派生数据补充单元测试，覆盖线路、事件数量和人物变化数量。
- [x] 在编年史模型中实现移动卡片派生函数。
- [x] 调整大纲页页头文案和布局，移除英文 `timeline`。
- [x] 重构编年史模式布局：
  - 桌面端保留二维故事板，并让右侧轻量编辑器 sticky、独立滚动。
  - 移动端显示纵向情节点卡片，点击卡片打开底部 Sheet。
- [x] 补充中英文文案。
- [x] 为输入模式补充情节点列表派生数据测试，覆盖线路、事件数量和人物变化数量。
- [x] 重构输入模式布局：
  - 桌面端保留左侧列表和右侧详情表单，并让两栏独立滚动。
  - 移动端默认显示情节点卡片列表，点击卡片打开底部 Sheet 深度编辑。
  - 抽出详情表单子组件，避免桌面右栏和移动 Sheet 复制模板。
- [x] 运行 lint、typecheck、test、build，并在浏览器验证桌面和移动布局。

### Task：页头工作台导向文案补强

- 目标：移除大纲页页头的 `timeline` 导向文案，改为工作台导向标题。
- 验收标准：
  - [x] 中文页头标题为 `大纲工作台`。
  - [x] 英文页头标题为 `Outline workspace`。
  - [x] 相关 UI 和功能文档入口不再残留 `大纲时间轴` 或 `Outline timeline`。
- 验证方式：
  - [x] `pnpm --filter @story-studio/studio test src/composables/useLocale.test.ts src/modules/outlines/chronicle.test.ts src/modules/outlines/input-mode.test.ts`
  - [x] `pnpm --filter @story-studio/studio lint`
  - [x] `git diff --check`
  - [x] `rg -n "大纲时间轴|Outline timeline" apps/studio/src/composables/useLocale.ts apps/studio/src/pages/outline docs/features/outline.md`
- 预计影响文件：
  - `apps/studio/src/composables/useLocale.ts`
  - `apps/studio/src/composables/useLocale.test.ts`
  - `docs/features/outline.md`
- 依赖：历史布局优化步骤已完成。
- 状态：已完成

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

## 完成记录

- 完成时间：2026-07-07
- 实际完成内容：经当前代码核对，移动端卡片派生、编年史桌面/移动布局、输入模式桌面/移动布局和中英文文案均已落地；本次仅补充状态收口记录。
- 验证结果：`chronicle.test.ts` 覆盖编年史移动卡片派生；`input-mode.test.ts` 覆盖输入模式卡片派生；`OutlineChronicleMode.vue` 和 `OutlineInputMode.vue` 已接入桌面滚动布局与移动端 Sheet。
- commit：本地提交见 Git 记录。
- 未覆盖风险：本次未重新启动浏览器做视觉回归，仅基于当前代码、测试和文档进行状态核对。
