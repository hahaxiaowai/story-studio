# Story Studio 架构总览

## 项目定位

Story Studio 是一个本地优先的故事创作桌面应用。当前仓库是 pnpm workspace monorepo，主应用位于 `apps/studio`，共享类型、配置和工具分别位于 `packages/types`、`packages/config`、`packages/utils`。

## 应用入口

- `apps/studio/src/main.ts`：Vue 浏览器入口。
- `apps/studio/src/App.vue`：应用根组件，挂载项目工作台。
- `apps/studio/src/pages/project/index.vue`：当前主工作台壳，基于 URL hash 分发到大纲、正文、角色、世界、素材、AI 助手和完整性检查页面。
- `apps/studio/src/layouts/SidebarLayout.vue`：侧边栏和主内容布局。
- `apps/studio/src/components/AppSidebar.vue`：主导航和工作区入口。

## 前端分层

`apps/studio/src` 保持 Vitesse 风格目录：

- `pages/`：页面级组合和页面私有组件，例如 `pages/outline/OutlinePage.vue`、`pages/content/ContentPage.vue`。
- `modules/`：模块级纯逻辑、组合式函数和持久化协调，例如 `modules/storage/useStudioData.ts`。
- `components/`：跨页面复用 UI 或应用级组件。
- `composables/`：稳定跨页面组合式逻辑，例如主题和语言设置。
- `layouts/`：页面布局壳。
- `styles/`：全局样式。
- `constants/`：应用侧静态常量。

页面文件负责状态接线和流程入口；复杂业务规则优先放在同模块的纯 TS 文件或组合式函数中，并用同目录 Vitest 覆盖。

## 数据模型

共享故事类型集中在 `packages/types/src/types/story.ts`，由 `packages/types/src/index.ts` 统一导出。核心文档类型是 `StudioDataDocument`，它承载：

- `workspaces` / `activeWorkspaceId`
- `propertyDefinitions` / `entityRecords`
- `outlines`
- `worlds`
- `contents`
- `materials` / `materialTags` / `materialRefs`
- `assistantSettings` / `assistantChatThreads`
- `preferences`

当前 schema 版本由 `apps/studio/src/modules/storage/document.ts` 中的 `STUDIO_DATA_SCHEMA_VERSION` 维护。新增持久字段时应同步更新共享类型、默认文档、迁移逻辑、测试和相关功能说明文档。

## 持久化流

- `apps/studio/src/modules/storage/useStudioData.ts` 是前端读写入口。
- `apps/studio/src/modules/storage/runtime.ts` 选择运行时存储驱动。
- Web 环境使用 IndexedDB 驱动。
- Tauri 环境通过 `apps/studio/src/modules/storage/tauri.ts` 调用 Rust 命令读写本地数据文件。
- `apps/studio/src/modules/storage/document.ts` 负责创建默认文档、迁移历史文档、合并旧偏好和规范化数据。

所有业务模块都应通过 `useStudioData().updateDocument()` 写入文档，避免绕过 schema 迁移和统一保存流程。

## 工作台导航

主工作台通过 hash 映射页面：

- `#outline`：大纲时间线。
- `#content` / `#manuscript`：正文。
- `#characters` / `#cast`：角色实体。
- `#world-settings` / `#maps`：世界设定。
- `#world-map`：地图。
- `#materials`：素材。
- `#assistant-chat`：AI 对话。
- `#assistant`：AI 设置。
- `#integrity`：数据完整性检查。

导航标签和公开导航判断在 `apps/studio/src/modules/workspaces/workspaces.ts` 中维护。新增工作台页面时需要同步页面分发、侧边栏入口、导航标签、测试和功能文档。

## AI 助手边界

AI 设置和模型绑定逻辑位于 `apps/studio/src/modules/assistant`。当前支持 OpenAI-compatible API 和 local-terminal 两类 provider，默认本地终端命令由 `assistant.ts` 中的默认 Codex provider 定义。Tauri 侧流式调用在 `apps/studio/src-tauri/src/lib.rs`。

功能模块需要 AI 能力时，应优先复用 `modules/assistant` 的 provider、model、story style 和内容草稿能力，不在页面内直接拼接 provider 配置。

## 测试与验证

- 纯业务逻辑测试与实现文件同目录，例如 `modules/content/content.test.ts`。
- 页面级行为测试与页面组件同目录，例如 `pages/content/ContentPage.test.ts`。
- 共享包各自保留 Vitest 配置。
- docs-only 改动通常只需要结构、链接、路径和 whitespace 检查。
- 代码或配置改动按影响范围运行 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build`。
