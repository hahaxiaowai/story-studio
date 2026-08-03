# 统一本地数据文档

## 功能目的

Story Studio 使用单一 `StudioDataDocument` 保存工作区、故事内容、偏好、素材、AI 设置和对话历史。这样可以让 Web 和 Tauri 环境共享同一份 schema，并通过迁移逻辑兼容旧数据。

## 用户入口

- 所有业务页面通过 `useStudioData()` 间接读写统一文档。
- 顶部操作区的“数据备份”按钮打开导出与恢复对话框。
- 备份对话框：`apps/studio/src/components/DataBackupDialog.vue`。

## 主流程

1. `createStudioStorageDriver()` 根据运行时选择 IndexedDB 或 Tauri 存储。
2. `loadStudioData()` 读取旧文档。
3. `resolveStudioDataDocument()` 创建默认文档或迁移旧文档。
4. 页面通过 `updateDocument()` 修改当前文档。
5. `saveNow()` 序列化 Vue ref 中的文档并持久化。

## 备份与恢复流程

1. 导出时，系统把当前完整文档序列化为两空格缩进的 JSON，并下载 `story-studio-backup-YYYY-MM-DD-HHmmss.json`。
2. 导出前展示工作区、章节、素材和 AI 对话数量，并提示备份可能包含 Provider API Key。
3. 导入时先读取和解析 JSON，检查 Story Studio 文档身份及 schema 版本边界。
4. 受支持的旧文档通过 `resolveStudioDataDocument()` 迁移到当前 schema。
5. 页面只展示待恢复摘要，不会在选择文件后自动修改当前数据。
6. 用户明确确认后，`replaceDocument()` 整体替换文档并立即持久化。
7. 持久化失败时恢复导入前的内存快照并展示错误。

## Tauri 自动备份

- 仅 Tauri 桌面运行时启用；Web 端继续只提供手动导出和文件恢复。
- 文档加载完成后立即检查，之后每 10 分钟检查一次；相同 `updatedAt` 的有效版本不会重复写入。
- 设备级开关默认开启，保存在应用数据目录，不进入 `StudioDataDocument`。
- 原生层把完整 JSON 原子写入 `app_data_dir/automatic-backups/`，前端只使用不透明备份 ID。
- 最近 24 小时按自然小时保留最新一份，第 2～7 天按自然日保留最新一份；全局最新有效项和损坏文件始终保留。
- 备份对话框展示定时备份、恢复前保护备份、运行状态和损坏项；损坏项不能恢复。
- 恢复自动备份前先创建 `pre-restore` 保护备份；保护失败时不调用 `replaceDocument()`。
- 自动备份错误不阻断主数据保存、手动导出或手动文件恢复。

## 关键文件

- `apps/studio/src/modules/storage/useStudioData.ts`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/storage/runtime.ts`
- `apps/studio/src/modules/storage/backup.ts`
- `apps/studio/src/modules/storage/backupFile.ts`
- `apps/studio/src/modules/storage/indexedDb.ts`
- `apps/studio/src/modules/storage/tauri.ts`
- `apps/studio/src/modules/storage/automaticBackup.ts`
- `apps/studio/src/modules/storage/tauriAutomaticBackup.ts`
- `apps/studio/src/modules/storage/useAutomaticBackup.ts`
- `apps/studio/src/components/AutomaticBackupPanel.vue`
- `apps/studio/src/components/DataBackupDialog.vue`
- `apps/studio/src/components/AppHeaderActions.vue`
- `apps/studio/src-tauri/src/lib.rs`
- `packages/types/src/types/story.ts`

## 数据结构

- `StudioDataDocument`
- `StudioPreferences`
- `StudioStorageDriver`
- `STUDIO_DATA_SCHEMA_VERSION`

当前 schema 版本为 14。schema 14 为每个 `WorkspaceContentEntry` 增加 `aiRevisionHistory`，旧文档迁移时补空数组并把历史裁剪到每章最近 20 条。

## 状态流和副作用

- 首次没有存储文档时会创建默认文档并立即保存。
- `updateDocument()` 会刷新根文档 `updatedAt`，并异步触发保存。
- 保存失败会写入 `loadError`。
- 迁移逻辑会补齐缺失字段并规范化历史数据。
- 备份导出不会修改当前文档或刷新 `updatedAt`。
- 备份恢复保存成功后清除旧 `loadError`；保存失败时回滚内存文档。

## 边界情况

- schema 小于早期可迁移版本时回退默认文档。
- 旧 prototype seed 文档会被替换为当前默认文档。
- 写入前必须序列化，避免保存 Vue proxy。
- 新增持久字段时必须同步默认值、迁移和测试。
- schema 低于 3 或高于当前版本的备份会被拒绝，避免默认数据或新版数据覆盖当前文档。
- 迁移后的文档仍需通过完整顶层结构检查，伪造或残缺 JSON 不可进入恢复流程。
- 备份是未加密 JSON，可能包含 API Key；用户需要把文件保存在可信位置。
- 完整 JSON 备份会包含章节 AI 修改历史；schema 13 备份导入时自动迁移到 schema 14。
- Web 当前只支持手动完整备份；Tauri 额外支持受管自动备份。两端都不包含通用版本历史、局部合并或发布格式导出。
- 自动备份不在应用退出后运行，不包含 Web 快照、云同步、压缩、加密、永久保留或单条删除。

## 验证入口

- `apps/studio/src/modules/storage/useStudioData.test.ts`
- `apps/studio/src/modules/storage/document.test.ts`
- `apps/studio/src/modules/storage/backup.test.ts`
- `apps/studio/src/modules/storage/backupFile.test.ts`
- `apps/studio/src/modules/storage/indexedDb.test.ts`
- `apps/studio/src/modules/storage/tauri.test.ts`
- `apps/studio/src/modules/storage/automaticBackup.test.ts`
- `apps/studio/src/modules/storage/tauriAutomaticBackup.test.ts`
- `apps/studio/src/modules/storage/useAutomaticBackup.test.ts`
- `apps/studio/src/components/AutomaticBackupPanel.test.ts`
- `apps/studio/src/components/DataBackupDialog.test.ts`
- `apps/studio/src-tauri/src/automatic_backup.rs` 中的 Rust 单元测试
