# 故事编辑器基础体验

## 背景

Story Studio 当前只有一个静态项目工作台，用于展示项目标题、导航、稿件区域和结构面板。下一步需要把这个展示壳推进成可迭代的故事编辑器基础体验，让后续章节、角色、结构化数据和 Tauri 本地能力有明确承载位置。

## 目标

- 用户打开应用后，可以看到一个清晰的故事项目工作区。
- 用户可以理解当前项目、稿件区域、结构面板和导航区域的关系。
- 代码层面形成稳定边界，后续能在 `pages`、`components`、`constants`、`types`、`utils` 中继续扩展。

## 非目标

- 本次不实现真实文件保存。
- 本次不接入数据库或 Tauri 命令。
- 本次不引入路由、Pinia、UnoCSS 或 Vitesse 的自动导入体系。
- 本次不实现完整富文本编辑器。

## 用户流程

1. 用户打开 `http://127.0.0.1:5173/`。
2. 应用展示 Story Studio 项目工作区。
3. 用户看到左侧导航、项目标题、稿件预览和结构摘要。
4. 后续功能可在此基础上逐步替换静态数据。

## 数据模型

当前共享类型位于 `packages/types/src/types/story.ts`：

- `StoryProject`: 项目基础信息。
- `StoryChapter`: 章节基础信息。
- `StoryCharacter`: 角色基础信息。

后续编辑器扩展应优先在 `packages/types` 中补充跨包共享类型，而不是在 Vue 组件里声明复杂内联类型。

## UI 结构

当前前端入口参考 Vitesse 风格：

- `apps/studio/src/main.ts`: Vue 浏览器入口。
- `apps/studio/src/App.vue`: 根组件。
- `apps/studio/src/pages/index.vue`: 当前首页工作台。
- `apps/studio/src/constants/project.ts`: 示例项目数据。
- `apps/studio/src/styles/main.css`: 全局样式。

后续如果页面内容继续增长，应优先拆到：

- `apps/studio/src/components/`: 通用或页面内组件。
- `apps/studio/src/composables/`: 可复用组合式逻辑。
- `apps/studio/src/stores/`: 状态管理。只有真的需要共享状态时再引入。

## 技术方案

- 继续保持 pnpm workspace 分层：应用代码在 `apps/studio`，共享类型在 `packages/types`，共享工具在 `packages/utils`。
- 保持 `App.vue` 轻量，只负责挂载页面级组件。
- 页面数据先来自 `constants`，等进入真实数据阶段再迁移到 store、service 或 Tauri 命令。
- 样式先集中在 `styles/main.css`，当组件拆分后再评估是否迁移到组件局部样式。

## 验收标准

- [x] 首页工作台能正常渲染。
- [x] `App.vue` 仍然保持轻量。
- [x] 页面级内容位于 `pages/index.vue`。
- [x] 示例项目数据位于 `constants/project.ts`。
- [x] 共享故事类型位于 `packages/types`。
- [x] `createSlug` 等共享工具位于 `packages/utils`。
- [x] lint、typecheck、test、build 通过。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 注意事项

- 当前 Codex 沙箱中，Vitest/Vite/esbuild 可能因 `spawn EPERM` 需要在沙箱外重跑。
- Turbo 的 `.turbo/cache` rename warning 通常不是功能失败，判断以退出码为准。
