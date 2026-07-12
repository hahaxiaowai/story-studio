# 正文 AI 修改历史

## 背景

正文工作台已经支持选中文本或整章 AI 改写、应用前对比和当前会话内单次撤销。现有撤销快照保存在 `ContentPage.vue` 的页面状态中，切换章节或重启应用后即丢失；用户也无法回看多次 AI 修改的批注要求和前后正文。长篇创作需要可追溯、可恢复且有明确容量边界的 AI 修改历史。

## 目标

- 用户每次应用 AI 改写后，都能在当前章节查看持久化的修改记录。
- 用户可以查看每条记录的批注要求、修改目标、创建时间和修改前后正文。
- 用户可以把当前章节恢复到某条记录的修改前正文。
- 恢复操作本身也记录历史，使用户可以找回恢复前的正文。
- 每章最多保留最近 20 条记录，避免统一文档无限增长。
- 现有即时单次撤销继续保留，与持久历史承担不同用途。

## 范围

- 为 `WorkspaceContentEntry` 新增章节内 AI 修改历史。
- schema 从 13 升到 14，并为旧章节补空历史数组。
- 新增纯逻辑函数处理记录创建、容量裁剪、恢复留痕和单条删除。
- 正文页新增当前章节的“AI 修改历史”入口和邻近私有组件。
- 每条记录展示要求、目标、时间以及前后整章正文对比。
- 增加中英文文案、模块测试、迁移测试、页面接线测试和文档同步。

## 非目标

- 本次不记录普通手动编辑、章节重排、AI 整章草稿回填或助手对话回填。
- 本次不提供工作区级全局历史、跨章节搜索或统计。
- 本次不实现差异高亮算法；首期并排展示修改前后整章正文。
- 本次不做历史记录导出、加密或云同步。
- 本次不允许直接把某条记录的“修改后正文”再次应用；恢复入口固定恢复该记录的修改前正文。
- 本次不移除现有会话内单次撤销。

## 用户流程

### 记录 AI 改写

1. 用户选中文本或以整章为目标，输入批注要求并生成建议。
2. 页面继续展示现有修改前后对比。
3. 用户点击“应用改写”。
4. 系统更新正文，同时在当前章节追加一条历史记录。
5. 新记录包含批注要求、目标类型、修改前整章正文、修改后整章正文和时间。
6. 如果新增后超过 20 条，系统删除最旧记录，只保留最近 20 条。

### 查看和恢复

1. 用户在当前章节打开“AI 修改历史”。
2. 历史按创建时间从新到旧展示，不跨章节混合。
3. 用户展开一条记录，查看要求和前后正文。
4. 用户点击“恢复修改前版本”。
5. 系统把当前正文替换为该记录的 `previousBody`。
6. 系统新增一条目标为整章的“从 AI 修改历史恢复”记录，其 `previousBody` 是恢复前正文，`nextBody` 是恢复后正文。
7. 恢复成功后现有即时撤销快照清空，避免旧快照覆盖新正文。

### 删除记录

1. 用户在某条历史记录上点击“删除记录”。
2. 组件在记录内展示确认与取消操作。
3. 用户确认后只删除该条历史，不修改正文。

## 数据模型

新增共享类型：

```ts
export type ContentAiRevisionTargetKind = 'selection' | 'chapter'

export interface ContentAiRevision {
  id: string
  instruction: string
  targetKind: ContentAiRevisionTargetKind
  previousBody: string
  nextBody: string
  createdAt: string
}
```

扩展章节类型：

```ts
export interface WorkspaceContentEntry {
  // existing fields
  aiRevisionHistory: ContentAiRevision[]
}
```

- `StudioDataSchemaVersion` 和 `STUDIO_DATA_SCHEMA_VERSION` 从 13 更新为 14。
- 新章节默认 `aiRevisionHistory: []`。
- schema 13 及更早章节迁移时补空数组。
- 迁移时规范化历史：过滤缺少 ID、前后正文或创建时间的记录；`instruction` 去首尾空白；无效 `targetKind` 回退为 `chapter`；每章只保留数组尾部最近 20 条。
- 不持久化 selection 的字符偏移。记录保存的是应用前后完整正文，避免后续正文变化后偏移失效。

## UI 结构

- `ContentPage.vue` 继续负责选中章节、应用 AI 建议和持久化接线。
- 新建 `pages/content/ContentAiRevisionHistory.vue`，作为正文页私有展示组件，不上提到全局 `components/`。
- 历史入口位于正文编辑区域的章节操作区，显示当前章节记录数量。
- 历史组件接收当前章节标题和记录数组，通过 `restore`、`delete` 事件交给页面写入。
- 空历史展示明确空状态。
- 删除确认在单条记录内部完成，不使用浏览器原生 confirm。

## 技术方案

### 历史纯逻辑

在 `modules/content/content.ts` 增加：

- `CONTENT_AI_REVISION_HISTORY_LIMIT = 20`。
- `appendContentAiRevision(entry, input)`：创建记录、更新正文、裁剪历史并刷新 `updatedAt`。
- `restoreContentAiRevision(entry, input)`：找到目标记录，把当前正文恢复为其 `previousBody`，并追加一条恢复记录。
- `removeContentAiRevision(entry, revisionId, now)`：删除单条记录并刷新章节时间，不修改正文。

记录 ID 使用独立前缀和时间戳随机段，避免与章节 ID 混用。应用结果和恢复结果如果正文没有变化，则不新增记录。

### 页面接线

- `applyInlineAssistantSuggestion()` 不再分别调用普通 `updateSelectedEntry({ body })` 后再补历史；改为通过 `useContent()` 暴露的原子动作同时更新正文和历史。
- 原子动作接收当前 `inlineAssistantInstruction`、目标 kind、previous/next body 和当前时间。
- `restore` 和 `delete` 同样通过 `useContent()` 写回统一文档。
- 章节切换时保留历史数据，只清理现有会话态批注和即时撤销快照。
- 恢复成功后清空 `inlineAssistantUndoSnapshot`。

## 错误与边界处理

- AI 输出应用后正文与原正文相同：不写历史、不改变正文。
- 目标记录不存在：恢复和删除均返回原章节，不产生新记录。
- 历史为空：不显示恢复或删除操作。
- 恢复目标正文与当前正文相同：不新增恢复记录。
- 删除历史不影响正文，也不改变其他章节历史。
- 章节删除时历史随章节一起删除，不产生孤儿数据。
- 备份导出自动包含历史；旧备份导入时通过 schema 14 迁移补齐字段。

## TDD 测试点

- [x] 先写失败测试：新建章节默认空历史。
- [x] 先写失败测试：应用 AI 改写原子更新正文并追加完整记录。
- [x] 先写失败测试：相同正文不新增记录。
- [x] 先写失败测试：第 21 条记录淘汰最旧记录。
- [x] 先写失败测试：恢复修改前正文并新增可反向恢复的记录。
- [x] 先写失败测试：目标记录不存在或正文相同不产生变化。
- [x] 先写失败测试：删除单条记录不修改正文或其他记录。
- [x] 迁移测试覆盖 schema 13 补空数组、无效记录过滤和 20 条裁剪。
- [x] `useContent` 测试覆盖原子应用、恢复和删除写回统一文档。
- [x] 页面测试覆盖历史入口、记录数量、恢复/删除接线和即时撤销清理。

## 验收标准

- [x] 每次实际应用 AI 改写后，当前章节新增一条持久历史。
- [x] 历史包含要求、目标类型、修改前后整章正文和创建时间。
- [x] 每章独立保留最近 20 条记录。
- [x] 用户可以恢复任意记录的修改前正文，且恢复动作再次留痕。
- [x] 用户确认后可删除单条记录，正文保持不变。
- [x] 旧文档和旧备份迁移到 schema 14 后历史字段有效。
- [x] 现有即时单次撤销继续可用，恢复历史后不会错误应用旧快照。
- [x] 中英文文案、功能文档、月度计划和测试索引已同步。
- [x] 目标测试、lint、typecheck、全量测试和 build 通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/content/content.test.ts src/modules/content/useContent.test.ts src/modules/storage/document.test.ts src/pages/content/ContentPage.test.ts src/pages/content/ContentAiRevisionHistory.test.ts src/composables/useLocale.test.ts
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

必要时在 `http://127.0.0.1:4433/#content` 验证历史入口、空状态、记录展开、恢复和删除确认。

## 文档同步

- [x] 更新 `docs/features/content.md`。
- [x] 更新 `docs/features/storage.md` 的 schema 和备份兼容边界。
- [x] 新建 `docs/plans/2026-07/2026-07-12-content-ai-revision-history.md`。
- [x] 更新 `docs/plans/2026-07/TODO.md` 和 `docs/ai/test-map.md`。
- [x] 本次不需要 ADR：没有改变单文档存储架构或 AI Provider 边界。

## 完成记录

- 完成时间：2026-07-12。
- 实际完成内容：已落地章节级正文 AI 修改历史、20 条容量裁剪、恢复留痕、单条确认删除、schema 14 迁移、正文页入口和中英文文案；保留现有会话内即时撤销。
- 验证结果：目标测试 6 个文件共 58 项通过；Studio 全量测试 49 个文件共 272 项通过；`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` 均通过；真实页面已确认历史入口、空状态及控制台无错误或警告。
- commit：待本地提交后回填。
- 未覆盖风险：普通手动编辑历史、跨章节版本管理、差异高亮和历史导出不在本期范围内。
