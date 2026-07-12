# AI 测试锚点索引

## 目标

按 Story Studio 模块列出优先测试入口。实现或修复时先跑最相关的目标测试，再按 `docs/ai/verification.md` 决定是否扩展到全量验证。

## 工作区和导航

适用改动：

- 工作区创建、归档、恢复、详情编辑。
- 侧边栏、项目切换、hash 路由、工作台壳。

测试入口：

- `apps/studio/src/modules/workspaces/workspaces.test.ts`
- `apps/studio/src/modules/workspaces/useWorkspaces.test.ts`
- `apps/studio/src/pages/project/index.test.ts`
- `apps/studio/src/components/AppSidebar.test.ts`
- `apps/studio/src/components/TeamSwitcher.test.ts`
- `apps/studio/src/components/WorkspaceCreateDialog.test.ts`
- `apps/studio/src/components/WorkspaceDetailsDialog.test.ts`
- `apps/studio/src/layouts/SidebarLayout.test.ts`

## 存储和 schema

适用改动：

- `StudioDataDocument` 类型、schema 版本、默认文档。
- IndexedDB / Tauri 存储驱动。
- 迁移、规范化、保存流程。

测试入口：

- `apps/studio/src/modules/storage/document.test.ts`
- `apps/studio/src/modules/storage/backup.test.ts`
- `apps/studio/src/modules/storage/backupFile.test.ts`
- `apps/studio/src/modules/storage/useStudioData.test.ts`
- `apps/studio/src/modules/storage/indexedDb.test.ts`
- `apps/studio/src/modules/storage/tauri.test.ts`
- `apps/studio/src/components/DataBackupDialog.test.ts`
- `apps/studio/src/modules/integrity/integrity.test.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.test.ts`

## 大纲时间线

适用改动：

- 情节点增删改移。
- 主线/支线管理。
- Chronicle 视图、输入模式、画布布局。
- `packages/outline-timeline-canvas`。

测试入口：

- `apps/studio/src/modules/outlines/outline.test.ts`
- `apps/studio/src/modules/outlines/useOutline.test.ts`
- `apps/studio/src/modules/outlines/chronicle.test.ts`
- `apps/studio/src/modules/outlines/input-mode.test.ts`
- `apps/studio/src/pages/outline/OutlineLineManagerDialog.test.ts`
- `apps/studio/src/pages/outline/OutlineChronicleMode.test.ts`
- `apps/studio/src/pages/outline/OutlineChronicleCanvas.test.ts`
- `packages/outline-timeline-canvas/src/layout.test.ts`
- `packages/outline-timeline-canvas/src/renderer.test.ts`

## 正文创作

适用改动：

- 卷、章、细纲、正文编辑。
- 章节排序和删除。
- 正文与大纲情节点绑定。
- 正文内联 AI。

测试入口：

- `apps/studio/src/modules/content/content.test.ts`
- `apps/studio/src/modules/content/useContent.test.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/useContentInlineAssistant.test.ts`
- `apps/studio/src/pages/content/ContentPage.test.ts`

## 角色和属性

适用改动：

- 角色实体 CRUD。
- 属性定义、可见性、必填、选项。
- 实体字段值和 workspace 计数。

测试入口：

- `apps/studio/src/modules/entities/entities.test.ts`
- `apps/studio/src/modules/entities/useEntities.test.ts`
- `apps/studio/src/modules/properties/properties.test.ts`
- `apps/studio/src/pages/entities/EntityWorkspace.test.ts`

## 世界设定和地图

适用改动：

- 世界设定分组和条目。
- 地图、笔画、坐标和渲染。
- `packages/fantasy-map`。

测试入口：

- `apps/studio/src/modules/worlds/world.test.ts`
- `apps/studio/src/modules/worlds/worldMapRenderer.test.ts`
- `packages/fantasy-map/src/coordinates.test.ts`
- `packages/fantasy-map/src/dispose.test.ts`
- `packages/fantasy-map/src/strokes.test.ts`

## 素材库

适用改动：

- 素材 CRUD。
- 素材类型过滤、关键词搜索、标签过滤。
- 标签创建、重命名、删除和引用清理。

测试入口：

- `apps/studio/src/modules/materials/materials.test.ts`
- `apps/studio/src/modules/materials/useMaterials.test.ts`
- `apps/studio/src/pages/materials/MaterialPage.test.ts`

## AI 助手

适用改动：

- provider、默认模型、功能绑定。
- story style。
- 对话线程和消息状态。
- runner、草稿和正文写入。

测试入口：

- `apps/studio/src/modules/assistant/assistant.test.ts`
- `apps/studio/src/modules/assistant/assistantChat.test.ts`
- `apps/studio/src/modules/assistant/assistantDraft.test.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.test.ts`
- `apps/studio/src/modules/assistant/assistantRunner.test.ts`
- `apps/studio/src/modules/assistant/useAssistantChat.test.ts`
- `apps/studio/src/pages/assistant/AssistantSettingsPage.test.ts`

## 完整性检查

适用改动：

- 断链、孤儿数据、计数漂移规则。
- 完整性页面展示。
- 新增持久化关系。

测试入口：

- `apps/studio/src/modules/integrity/integrity.test.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.test.ts`
- `apps/studio/src/pages/integrity/IntegrityPage.test.ts`

## 偏好、语言和主题

适用改动：

- 语言偏好。
- 主题模式。
- 旧 localStorage 偏好合并。

测试入口：

- `apps/studio/src/composables/useLocale.test.ts`
- `apps/studio/src/composables/useThemeMode.test.ts`
- `apps/studio/src/modules/storage/document.test.ts`

## 共享工具

适用改动：

- `packages/utils` 工具函数。
- slug 生成规则。

测试入口：

- `packages/utils/src/slug.test.ts`

## 使用方式

1. 先根据改动模块找到目标测试。
2. 先跑最小目标测试，确认失败或通过原因明确。
3. 实现后重跑目标测试。
4. 按 `docs/ai/verification.md` 决定是否扩展到 `pnpm run test`、`pnpm run typecheck`、`pnpm run lint`、`pnpm run build`。
