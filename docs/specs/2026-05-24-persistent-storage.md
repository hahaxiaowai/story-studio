# Web 与 Tauri 持久化存储

## 背景

Story Studio 当前只有偏好设置写入浏览器 `localStorage`，工作区和模块数据仍保存在前端内存里。用户新建工作区后刷新页面会丢失数据，不符合写作工具长期使用的预期。下一步需要建立同时适用于 Web 端和 Tauri 桌面端的持久化边界。

## 目标

- 用户在 Web 端新建或切换工作区后，刷新页面仍保留结果。
- 用户在 Tauri 应用中新建或切换工作区后，重启应用仍保留结果。
- 系统可以持久化当前已有模型：工作区、当前工作区、模块统计、公共素材、素材引用、语言偏好和主题偏好。
- 系统可以持久化实体记录和属性定义，让角色、大纲等结构化内容随统一文档保存。
- 前端通过统一 storage driver 读写数据，不让业务模块直接依赖 IndexedDB 或 Tauri command。
- 现有 `localStorage` 主题和语言值可以迁移到新的持久化文档。

## 非目标

- 本次不新增完整章节正文、角色档案、地图地点 schema。
- 本次不实现云同步、多窗口冲突处理、加密、导入导出或历史版本管理。
- 本次不把 IndexedDB 作为 Tauri 端主存储。
- 本次不引入第三方 IndexedDB 封装库。

## 用户流程

1. 用户打开应用。
2. 系统自动选择运行时存储：Web 使用 IndexedDB，Tauri 使用应用数据目录 JSON 文件。
3. 如果已有持久化文档，系统加载文档并渲染当前工作区。
4. 如果没有持久化文档，系统创建默认文档并立即保存。
5. 用户新建或切换工作区后，系统保存新的文档。
6. 用户切换语言或主题后，系统保存新的偏好。
7. 用户刷新 Web 页面或重启 Tauri 应用后，系统恢复上次数据。

## 数据模型

共享类型位于 `packages/types/src/types/story.ts`。本规格最初落地时目标 schema 为 v2；当前实现已随正文、世界、素材、助手和章节关联能力演进到 schema v11。

- `StudioDataSchemaVersion = 11`
- `StudioPreferences`
  - `locale: 'zh-CN' | 'en-US'`
  - `themeMode: 'light' | 'dark'`
- `StudioDataDocument`
  - `schemaVersion: 11`
  - `preferences: StudioPreferences`
  - `workspaces: Workspace[]`
    - 每个工作区包含作品名称和可选简介。
  - `activeWorkspaceId: string`
  - `propertyDefinitions: PropertyDefinition[]`
    - 当前角色和大纲的系统属性、自定义属性、选项、排序和显隐配置。
  - `entityRecords: EntityRecord[]`
    - 当前角色和大纲记录，按 `workspaceId` 与工作区关联。
  - `outlines: WorkspaceOutline[]`
  - `worlds: WorkspaceWorld[]`
  - `contents: WorkspaceContentEntry[]`
  - `materials: MaterialAsset[]`
  - `materialTags: MaterialTag[]`
  - `materialRefs: WorkspaceMaterialRef[]`
  - `assistantSettings: AssistantSettings`
  - `assistantChatThreads: AssistantChatThread[]`
  - `createdAt: string`
  - `updatedAt: string`

## UI 结构

- 页面加载期间显示轻量加载态，避免在异步读取完成前展示错误的默认数据。
- 现有侧边栏、顶部操作区、首页工作台继续通过 composable 读取状态，不直接处理存储细节。
- 损坏存档或读取失败首版通过控制台错误暴露，并保留默认数据入口，恢复和备份策略后续单独设计。

## 技术方案

- `apps/studio/src/modules/storage`
  - `document.ts`: 默认文档、schema version、legacy 偏好迁移。
  - `types.ts`: `StudioStorageDriver`。
  - `indexedDb.ts`: Web IndexedDB driver。
  - `tauri.ts`: Tauri command driver。
  - `runtime.ts`: 根据运行环境选择 driver。
  - `useStudioData.ts`: 应用级文档状态、加载和保存。
- Web IndexedDB：
  - 数据库名：`story-studio`
  - object store：`documents`
  - 固定 key：`main`
- Tauri JSON 文件：
  - command：`load_studio_data`、`save_studio_data`
  - 文件名：`story-studio-data.json`
  - 路径：Tauri app data dir
  - 保存时写临时文件后 rename。

## 验收标准

- [x] Web 端通过表单新建工作区后刷新仍存在。
- [x] Tauri 端新建工作区后重启仍存在。
- [x] 工作区简介随工作区一起持久化。
- [x] 切换工作区后刷新或重启仍保留当前工作区。
- [x] 切换语言和主题后刷新或重启仍保留。
- [x] 缺失存档时能创建默认文档。
- [x] 工作区、偏好、实体记录、属性定义、素材和素材引用属于同一份持久化文档。
- [x] 旧 schema 文档加载后会升级到当前 schema，并补齐当前字段。
- [x] lint、typecheck、test、build 通过。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```
