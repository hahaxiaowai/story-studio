# Web 与 Tauri 持久化存储实施计划

## 来源规格

- `docs/specs/2026-05-24-persistent-storage.md`

## 当前状态

- 已实现 Web IndexedDB driver、Tauri command driver、运行时 driver 选择和应用级 `useStudioData()`。
- 已实现 Tauri 端 `load_studio_data`、`save_studio_data`，保存到 app data dir 下的 `story-studio-data.json`。
- 文档 schema 已从 v1 升级到 v2，新增属性定义和实体记录。
- 已有 v1 文档加载时会补齐 `propertyDefinitions`、`entityRecords`，并过滤历史 `task` 类型数据。

## 实施步骤

- [x] 更新共享类型。
   - 在 `packages/types/src/types/story.ts` 增加 `StudioDataDocument`、`StudioPreferences`、`StudioDataSchemaVersion`。
   - `StudioDataSchemaVersion` 当前为 `11`。
   - `Workspace` 支持可选 `description`，随单一 JSON 文档持久化。
   - `StudioDataDocument` 包含 `propertyDefinitions` 和 `entityRecords`。
   - 从 `packages/types/src/index.ts` 导出新增类型。

- [x] 先补前端存储测试。
   - 覆盖默认文档生成。
   - 覆盖 legacy `localStorage` 偏好迁移。
   - 覆盖 Tauri driver command 调用。
   - 覆盖 `useStudioData` 加载和保存。
   - 覆盖 `useWorkspaces` 新建和切换后保存。

- [x] 实现前端存储模块。
   - 新增 `apps/studio/src/modules/storage`。
   - 实现 JSON 文档创建、IndexedDB driver、Tauri driver、运行时 driver 选择和 `useStudioData`。
   - 默认文档使用 `defaultPropertyDefinitions` 初始化属性配置。
   - 迁移已有文档时补齐当前 schema 字段，并过滤历史 `task` 类型。

- [x] 接入现有状态。
   - `useWorkspaces()` 改为读写 `useStudioData()`。
   - `useLocale()` 和 `useThemeMode()` 改为读写 `document.preferences`。
   - `useProperties()` 和 `useEntities()` 改为读写 `document.propertyDefinitions` 和 `document.entityRecords`。
   - 布局或页面等待数据加载后再渲染主要内容。

- [x] 实现 Tauri 端读写命令。
   - Rust 端新增 `load_studio_data` 和 `save_studio_data`。
   - 使用 app data dir 下的 `story-studio-data.json`。
   - 增加 Rust 单元测试覆盖文件不存在、写入读取、损坏 JSON。

- [x] 接入新建工作区表单数据。
   - 表单提交后通过 `useWorkspaces.addWorkspace({ title, description })` 更新统一文档。
   - 新工作区名称、简介和 active workspace 一起保存。

- [x] 运行验证命令。
   - `pnpm run lint`
   - `pnpm run typecheck`
   - `pnpm run test`
   - `pnpm run build`
   - `pnpm --filter @story-studio/studio tauri:build` 或 Rust 检查命令。

## 影响文件

- `packages/types/src/types/story.ts`
- `packages/types/src/index.ts`
- `apps/studio/src/modules/entities/*`
- `apps/studio/src/modules/properties/*`
- `apps/studio/src/modules/storage/*`
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/composables/useThemeMode.ts`
- `apps/studio/src/layouts/SidebarLayout.vue`
- `apps/studio/src-tauri/Cargo.toml`
- `apps/studio/src-tauri/src/lib.rs`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm --filter @story-studio/studio tauri:build
```

## 风险与回滚

- 风险：Tauri command 与 Web IndexedDB 两套底层实现出现行为差异。
  - 应对：前端业务只依赖统一 `StudioStorageDriver`，driver 用测试覆盖固定契约。
- 风险：损坏存档恢复策略不足。
  - 应对：首版不静默覆盖损坏文件，后续补恢复/备份规格。
- 风险：当前文档是单 JSON，未来正文体量增大后可能不适合全量保存。
  - 应对：首版只覆盖当前模型；正文、素材大文件和版本历史后续单独设计。
