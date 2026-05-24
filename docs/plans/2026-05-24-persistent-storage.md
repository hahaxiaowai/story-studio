# Web 与 Tauri 持久化存储实施计划

## 来源规格

- `docs/specs/2026-05-24-persistent-storage.md`

## 实施步骤

1. 更新共享类型。
   - 在 `packages/types/src/types/story.ts` 增加 `StudioDataDocument`、`StudioPreferences`、`StudioDataSchemaVersion`。
   - 从 `packages/types/src/index.ts` 导出新增类型。

2. 先补前端存储测试。
   - 覆盖默认文档生成。
   - 覆盖 legacy `localStorage` 偏好迁移。
   - 覆盖 Tauri driver command 调用。
   - 覆盖 `useStudioData` 加载和保存。
   - 覆盖 `useWorkspaces` 新建和切换后保存。

3. 实现前端存储模块。
   - 新增 `apps/studio/src/modules/storage`。
   - 实现 JSON 文档创建、IndexedDB driver、Tauri driver、运行时 driver 选择和 `useStudioData`。

4. 接入现有状态。
   - `useWorkspaces()` 改为读写 `useStudioData()`。
   - `useLocale()` 和 `useThemeMode()` 改为读写 `document.preferences`。
   - 布局或页面等待数据加载后再渲染主要内容。

5. 实现 Tauri 端读写命令。
   - Rust 端新增 `load_studio_data` 和 `save_studio_data`。
   - 使用 app data dir 下的 `story-studio-data.json`。
   - 增加 Rust 单元测试覆盖文件不存在、写入读取、损坏 JSON。

6. 运行验证命令。
   - `pnpm run lint`
   - `pnpm run typecheck`
   - `pnpm run test`
   - `pnpm run build`
   - `pnpm --filter @story-studio/studio tauri:build` 或 Rust 检查命令。

## 影响文件

- `packages/types/src/types/story.ts`
- `packages/types/src/index.ts`
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
