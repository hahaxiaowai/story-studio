# 数据备份与恢复

## 背景

Story Studio 当前在 Web 环境使用 IndexedDB、在 Tauri 环境使用本地 JSON 文件保存单一 `StudioDataDocument`。现有持久化能够兼容 schema 迁移，但用户没有主动导出作品数据、检查备份内容或从备份恢复的入口。存储读取失败时也缺少面向用户的恢复路径，长篇正文持续积累后存在不可接受的数据丢失风险。

## 目标

- 用户可以把当前完整 `StudioDataDocument` 导出为格式化 JSON 文件。
- 用户可以选择 Story Studio JSON 备份，先查看备份摘要，再明确确认是否覆盖当前数据。
- 系统可以在写入前解析、校验并通过现有迁移逻辑规范化备份。
- 解析、校验或持久化失败时，系统保留当前内存文档并展示可理解的错误。
- Web 与 Tauri 共用备份编解码、校验和替换逻辑，不新增两套数据协议。

## 范围

- 新增存储模块的备份序列化、文件名生成、导入解析、文档识别和摘要逻辑。
- 为 `useStudioData()` 增加经校验后整体替换并立即保存文档的能力。
- 在应用顶部操作区新增“数据备份”入口和对话框。
- Web 环境通过浏览器文件下载和文件选择完成导入导出。
- Tauri 首期复用 WebView 的下载和文件选择能力，不新增 Rust command 或文件系统插件。
- 增加中英文文案、聚焦测试、存储功能文档和 2026-07 月度计划记录。

## 非目标

- 本次不做定时自动备份、备份轮转或版本历史。
- 本次不做工作区级局部导入、文档合并或冲突解决。
- 本次不导出为 Markdown、DOCX、PDF 等发布格式。
- 本次不修改 `StudioDataDocument` schema，不新增持久字段。
- 本次不处理已经无法启动应用时的离线恢复工具。
- 本次不加密备份文件；导出的 JSON 可能包含 AI Provider 配置和 API Key，界面必须明确提示用户妥善保管。

## 用户流程

### 导出

1. 用户从顶部操作区打开“数据备份”对话框。
2. 对话框展示当前文档的工作区、章节、素材和 AI 对话数量，以及敏感信息提示。
3. 用户点击“导出备份”。
4. 系统下载 UTF-8、两空格缩进的 JSON 文件，文件名格式为 `story-studio-backup-YYYY-MM-DD-HHmmss.json`。
5. 导出不修改当前文档及其 `updatedAt`。

### 导入恢复

1. 用户点击“选择备份文件”，选择一个 `.json` 文件。
2. 系统读取文本并解析 JSON，确认它具有可识别的 Story Studio 文档结构。
3. 系统调用现有 `resolveStudioDataDocument()` 完成 schema 迁移与规范化。
4. 对话框展示待导入文档的更新时间、工作区、章节、素材和 AI 对话数量，并提示导入会整体覆盖当前数据。
5. 用户点击“确认恢复”后，系统替换当前文档并立即持久化。
6. 保存成功后显示成功状态并清空待确认备份；保存失败时恢复导入前的内存文档并显示错误。

## 数据模型

- 本次不改变 `StudioDataDocument`、`StudioDataSchemaVersion` 或共享类型。
- 备份文件直接承载完整的 `StudioDataDocument` JSON，不增加额外 envelope，避免维护第二套版本号。
- 导入的最小识别条件：根值为对象，包含数值型 `schemaVersion`、数组型 `workspaces`，且包含字符串型 `activeWorkspaceId`。
- 低于当前版本但仍处于现有迁移范围内的文档交给 `resolveStudioDataDocument()` 迁移。
- schema 低于现有最低可迁移版本时拒绝导入，不允许 `resolveStudioDataDocument()` 静默生成默认示例文档后覆盖用户数据。
- schema 高于当前 `STUDIO_DATA_SCHEMA_VERSION` 时拒绝导入，避免旧版应用破坏新版数据。

## UI 结构

- `apps/studio/src/components/AppHeaderActions.vue` 只负责挂载备份入口。
- 新建 `apps/studio/src/components/DataBackupDialog.vue`，负责文件选择、摘要、确认和状态展示。
- 对话框复用现有 `Dialog`、`Button` 和表单 UI，不引入新组件库。
- 导入确认必须是独立二次操作；选择文件后不能自动覆盖当前数据。
- 文件读取、下载和备份业务规则不直接写在 Vue 模板中。

## 技术方案

### 备份纯逻辑

新增 `apps/studio/src/modules/storage/backup.ts`：

- `createStudioDataBackup(document, now)` 返回文件名、MIME 类型和格式化 JSON。
- `parseStudioDataBackup(source)` 解析未知文本、检查文档身份和版本边界，然后返回经过迁移的 `StudioDataDocument`。
- `summarizeStudioDataBackup(document)` 返回展示所需的文档更新时间及各资源数量。
- 使用明确的错误类型或错误代码区分非法 JSON、非 Story Studio 文档、版本过旧和版本过新。

### 浏览器文件适配

新增 `apps/studio/src/modules/storage/backupFile.ts`：

- 通过 `Blob`、临时 object URL 和隐藏下载链接触发 JSON 下载，并及时释放 URL。
- 文件读取只接收单个 `.json` 文件，读取失败向上抛出错误。
- 该文件只处理浏览器 API，业务校验保留在 `backup.ts`。

### 原子恢复

扩展 `useStudioData()`，提供 `replaceDocument(nextDocument): Promise<void>`：

1. 记录当前文档快照。
2. 把已经校验和迁移的文档替换到内存 ref。
3. 立即调用当前 storage driver 保存可序列化文档。
4. 保存失败时恢复旧快照、记录 `loadError` 并重新抛出错误。

不复用 `updateDocument()`，因为导入必须保留备份自身的 `createdAt`、`updatedAt`，且需要等待持久化结果。

## 错误处理

- 非 JSON：提示“无法解析备份文件”。
- 结构不匹配：提示“这不是可识别的 Story Studio 备份”。
- 版本过旧：提示当前应用无法安全迁移该备份。
- 版本过新：提示使用更新版本的 Story Studio 打开。
- 文件读取失败：保留当前数据并允许重新选择。
- 保存失败：回滚内存文档，保留待导入摘要以便用户重试。
- 所有失败路径都不得调用成功提示或清空当前文档。

## TDD 测试点

- [ ] 先写失败测试：导出文件名和 JSON 内容稳定，且不修改源文档。
- [ ] 先写失败测试：合法当前 schema 文档可以导入并生成摘要。
- [ ] 先写失败测试：现有可迁移旧 schema 文档导入后升级到当前版本。
- [ ] 先写失败测试：非法 JSON、非 Story Studio 对象、过旧和过新 schema 分别失败。
- [ ] 先写失败测试：`replaceDocument()` 保存成功后替换当前文档。
- [ ] 先写失败测试：`replaceDocument()` 保存失败时恢复旧文档并重新抛错。
- [ ] 页面测试覆盖选择文件后只展示摘要，不自动恢复。
- [ ] 页面测试覆盖明确确认后调用恢复并展示成功状态。

## 验收标准

- [ ] 用户可以从顶部操作区导出当前完整数据。
- [ ] 导出的文件可被当前应用重新选择、预览并恢复。
- [ ] 可迁移旧文档导入后使用当前 schema。
- [ ] 无效或不兼容备份不会覆盖当前文档。
- [ ] 导入前必须展示摘要并二次确认。
- [ ] 持久化失败时内存数据回滚。
- [ ] 中英文界面文案完整，并提示备份可能含有 API Key。
- [ ] `docs/features/storage.md` 与 `docs/plans/2026-07/` 已同步。
- [ ] 聚焦测试、lint、typecheck、全量测试和 build 通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test -- apps/studio/src/modules/storage/backup.test.ts apps/studio/src/modules/storage/useStudioData.test.ts apps/studio/src/components/DataBackupDialog.test.ts
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

必要时在 `http://127.0.0.1:4433/` 手动验证：导出文件、导入摘要、取消导入、确认恢复和错误提示。

## 文档同步

- [ ] 更新 `docs/features/storage.md` 的用户入口、备份流程、错误边界和验证入口。
- [ ] 新建 `docs/plans/2026-07/2026-07-12-data-backup-restore.md`。
- [ ] 更新 `docs/plans/2026-07/TODO.md`。
- [ ] 本次不需要 ADR：未改变单文档存储架构、运行时驱动边界或长期技术选型。

## 完成记录

- 完成时间：未完成。
- 实际完成内容：已完成规格设计，等待实施。
- 验证结果：尚未执行代码验证。
- commit：尚未提交。
- 未覆盖风险：自动备份、历史版本、离线恢复和加密备份不在本期范围内。
