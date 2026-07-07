# 统一本地数据文档

## 功能目的

Story Studio 使用单一 `StudioDataDocument` 保存工作区、故事内容、偏好、素材、AI 设置和对话历史。这样可以让 Web 和 Tauri 环境共享同一份 schema，并通过迁移逻辑兼容旧数据。

## 用户入口

该功能没有单独页面，所有页面通过 `useStudioData()` 间接读写。

## 主流程

1. `createStudioStorageDriver()` 根据运行时选择 IndexedDB 或 Tauri 存储。
2. `loadStudioData()` 读取旧文档。
3. `resolveStudioDataDocument()` 创建默认文档或迁移旧文档。
4. 页面通过 `updateDocument()` 修改当前文档。
5. `saveNow()` 序列化 Vue ref 中的文档并持久化。

## 关键文件

- `apps/studio/src/modules/storage/useStudioData.ts`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/storage/runtime.ts`
- `apps/studio/src/modules/storage/indexedDb.ts`
- `apps/studio/src/modules/storage/tauri.ts`
- `apps/studio/src-tauri/src/lib.rs`
- `packages/types/src/types/story.ts`

## 数据结构

- `StudioDataDocument`
- `StudioPreferences`
- `StudioStorageDriver`
- `STUDIO_DATA_SCHEMA_VERSION`

## 状态流和副作用

- 首次没有存储文档时会创建默认文档并立即保存。
- `updateDocument()` 会刷新根文档 `updatedAt`，并异步触发保存。
- 保存失败会写入 `loadError`。
- 迁移逻辑会补齐缺失字段并规范化历史数据。

## 边界情况

- schema 小于早期可迁移版本时回退默认文档。
- 旧 prototype seed 文档会被替换为当前默认文档。
- 写入前必须序列化，避免保存 Vue proxy。
- 新增持久字段时必须同步默认值、迁移和测试。

## 验证入口

- `apps/studio/src/modules/storage/useStudioData.test.ts`
- `apps/studio/src/modules/storage/document.test.ts`
- `apps/studio/src/modules/storage/indexedDb.test.ts`
- `apps/studio/src/modules/storage/tauri.test.ts`
