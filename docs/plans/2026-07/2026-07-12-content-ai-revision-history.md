# 正文 AI 修改历史实施计划

> **执行要求：** 使用 `superpowers:executing-plans` 在隔离工作树中逐项实施。所有业务行为必须遵循 `superpowers:test-driven-development`，先观察目标测试按预期失败，再写最小实现。

**目标：** 为每个正文章节持久保存最近 20 条 AI 改写记录，并支持查看、恢复修改前版本和确认删除单条记录。

**架构：** 历史类型挂在 `WorkspaceContentEntry`，由 schema 14 迁移补齐；`content.ts` 承担记录、裁剪、恢复和删除的纯逻辑；`useContent.ts` 提供统一文档原子写入；`ContentAiRevisionHistory.vue` 负责当前章节展示，`ContentPage.vue` 只接线现有 AI 应用与历史操作。

**技术栈：** Vue 3、TypeScript strict、Vitest、现有 Dialog/Button UI、统一 `StudioDataDocument` schema。

## 全局约束

- 每章最多保留最近 20 条 AI 修改历史，按数组从旧到新存储。
- 记录应用前后完整正文，不持久化文本选择字符偏移。
- 只记录正文内联 AI 的实际改写和历史恢复；普通编辑及其他 AI 回填不记录。
- 正文没有变化时不新增记录，也不刷新章节时间。
- 恢复动作必须再次留痕，且清理页面即时撤销快照。
- 删除历史必须二次确认，不修改正文。
- schema 从 13 升到 14；旧章节迁移后必须有有效 `aiRevisionHistory`。
- 不新增依赖，不把页面私有组件上提到全局 `components/`。
- 验证后恢复 `apps/studio/tsconfig.app.tsbuildinfo` 和 `apps/studio/tsconfig.node.tsbuildinfo` 生成噪音。

## 来源规格

- `docs/specs/2026-07-12-content-ai-revision-history.md`

## 状态

- 当前状态：已完成。
- 创建时间：2026-07-12。
- 执行范围：章节内 AI 改写历史、恢复留痕、单条删除、schema 迁移和当前章节 UI；不做普通编辑历史或全局版本管理。

---

### Task 1：共享类型与 schema 14 迁移

**Files:**

- Modify: `packages/types/src/types/story.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `apps/studio/src/modules/storage/document.ts`
- Modify: `apps/studio/src/modules/storage/document.test.ts`

**Interfaces:**

- Produces: `ContentAiRevisionTargetKind = 'selection' | 'chapter'`
- Produces: `ContentAiRevision`
- Produces: `WorkspaceContentEntry.aiRevisionHistory: ContentAiRevision[]`
- Produces: `StudioDataSchemaVersion = 14`
- Produces: migration normalization capped at 20 records

- [x] **Step 1：写 schema 迁移失败测试**

在 `document.test.ts` 增加：

```ts
it('migrates content AI revision history to schema 14', () => {
  const document = createDefaultStudioDataDocument()
  document.schemaVersion = 13 as StudioDataDocument['schemaVersion']
  document.contents = [legacyContentEntryWithoutRevisionHistory()]

  const migrated = resolveStudioDataDocument(document)

  expect(migrated.schemaVersion).toBe(14)
  expect(migrated.contents[0]?.aiRevisionHistory).toEqual([])
})
```

另一个用例构造 22 条记录，其中包含无 ID、非字符串正文和无效 target kind，断言过滤无效记录、无效 kind 回退 `chapter`、instruction trim，并只保留最后 20 条。

- [x] **Step 2：运行测试并确认 RED**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/document.test.ts`

Expected: FAIL，原因是 schema 仍为 13 或历史字段不存在。

- [x] **Step 3：增加共享类型并导出**

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

将 `aiRevisionHistory` 加入 `WorkspaceContentEntry`，把 schema 类型改为 14，并从 `packages/types/src/index.ts` 导出两个新增类型。

- [x] **Step 4：实现迁移规范化**

把 `STUDIO_DATA_SCHEMA_VERSION` 改为 14。在 `normalizeContentEntries()` 为每章写入：

```ts
aiRevisionHistory: normalizeContentAiRevisionHistory(
  (entry as WorkspaceContentEntry & { aiRevisionHistory?: unknown }).aiRevisionHistory,
),
```

规范化函数只接收数组；过滤 `id`、`previousBody`、`nextBody`、`createdAt` 不是字符串或 ID/时间为空的项；保留空正文；最后 `.slice(-20)`。

- [x] **Step 5：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/document.test.ts`

Expected: PASS。

---

### Task 2：历史记录、容量裁剪、恢复与删除纯逻辑

**Files:**

- Modify: `apps/studio/src/modules/content/content.ts`
- Modify: `apps/studio/src/modules/content/content.test.ts`

**Interfaces:**

- Produces: `CONTENT_AI_REVISION_HISTORY_LIMIT = 20`
- Produces: `appendContentAiRevision(entry, input): WorkspaceContentEntry`
- Produces: `restoreContentAiRevision(entry, input): WorkspaceContentEntry`
- Produces: `removeContentAiRevision(entry, revisionId, now): WorkspaceContentEntry`

- [x] **Step 1：写新章节和应用改写失败测试**

断言 `createContentEntry()` 默认 `aiRevisionHistory: []`，并覆盖：

```ts
const revised = appendContentAiRevision(entry, {
  instruction: '  更紧张  ',
  targetKind: 'selection',
  nextBody: '钟声骤停。',
  now: '2026-07-12T10:00:00.000Z',
})

expect(revised.body).toBe('钟声骤停。')
expect(revised.aiRevisionHistory[0]).toMatchObject({
  instruction: '更紧张',
  targetKind: 'selection',
  previousBody: entry.body,
  nextBody: '钟声骤停。',
  createdAt: '2026-07-12T10:00:00.000Z',
})
```

- [x] **Step 2：运行测试并确认 RED**

Expected: FAIL，原因是历史字段或函数不存在。

- [x] **Step 3：实现追加与 20 条裁剪**

`appendContentAiRevision()` 在正文相同时返回原对象；否则创建 `content-ai-revision-<timestamp>-<random>` ID，追加记录并 `.slice(-CONTENT_AI_REVISION_HISTORY_LIMIT)`，原子更新 `body` 和 `updatedAt`。

- [x] **Step 4：补容量、恢复、删除失败测试**

- 21 次实际改写后历史长度为 20，首条是第二次改写。
- `restoreContentAiRevision()` 把正文改为目标记录 `previousBody`，新历史记录的 previous 是恢复前当前正文，next 是恢复后正文，instruction 为调用方传入的系统说明，target kind 为 chapter。
- 目标不存在或恢复结果与当前正文相同时返回原对象。
- `removeContentAiRevision()` 只删除目标记录并刷新 `updatedAt`；目标不存在返回原对象。

- [x] **Step 5：运行测试并确认 RED**

Expected: FAIL，原因是恢复或删除函数不存在。

- [x] **Step 6：实现恢复和删除**

恢复复用追加逻辑，避免两套容量裁剪；删除使用 filter，并以长度是否变化决定是否返回新对象。

- [x] **Step 7：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: PASS。

---

### Task 3：`useContent` 原子写入动作

**Files:**

- Modify: `apps/studio/src/modules/content/useContent.ts`
- Modify: `apps/studio/src/modules/content/useContent.test.ts`

**Interfaces:**

- Produces: `applyAiRevision(entryId, input): void`
- Produces: `restoreAiRevision(entryId, revisionId, instruction): void`
- Produces: `deleteAiRevision(entryId, revisionId): void`
- Consumes: Task 2 纯逻辑函数

- [x] **Step 1：写 composable 写回失败测试**

使用现有 mock driver 创建章节，依次调用三个新动作，断言：

- 应用动作一次保存正文和完整历史。
- 恢复动作保存恢复正文并新增恢复记录。
- 删除动作只删除目标历史，正文保持恢复后的值。
- 对其他章节不产生变化。

- [x] **Step 2：运行测试并确认 RED**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts`

Expected: FAIL，原因是新动作不存在。

- [x] **Step 3：实现三个动作**

每个动作都在一次 `studioData.updateDocument()` 中 map `document.contents`。时间由动作内部 `new Date().toISOString()` 生成；`applyAiRevision` input 不允许页面传 previousBody，纯逻辑直接从章节当前 body 读取。

- [x] **Step 4：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts src/modules/content/content.test.ts`

Expected: PASS。

---

### Task 4：历史组件、正文页接线和双语文案

**Files:**

- Create: `apps/studio/src/pages/content/ContentAiRevisionHistory.vue`
- Create: `apps/studio/src/pages/content/ContentAiRevisionHistory.test.ts`
- Modify: `apps/studio/src/pages/content/ContentPage.vue`
- Modify: `apps/studio/src/pages/content/ContentPage.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`
- Modify: `apps/studio/src/composables/useLocale.test.ts`

**Interfaces:**

- Component props: `chapterTitle: string`, `revisions: ContentAiRevision[]`
- Component emits: `restore(revisionId: string)`, `delete(revisionId: string)`
- Consumes: Task 3 `applyAiRevision`、`restoreAiRevision`、`deleteAiRevision`

- [x] **Step 1：写组件和页面接线失败测试**

沿用源码静态测试，断言组件具有：新到旧展示、空状态、前后正文、记录内删除确认、restore/delete emit。正文页测试断言：

```ts
expect(componentSource).toContain('applyAiRevision(selectedEntry.value.id')
expect(componentSource).toContain('restoreAiRevision(selectedEntry.value.id')
expect(componentSource).toContain('deleteAiRevision(selectedEntry.value.id')
expect(componentSource).toContain('inlineAssistantUndoSnapshot.value = undefined')
expect(componentSource).toContain('<ContentAiRevisionHistory')
```

locale 测试覆盖入口、空状态、selection/chapter、恢复、删除确认和恢复系统说明。

- [x] **Step 2：运行测试并确认 RED**

Run: `pnpm --filter @story-studio/studio test src/pages/content/ContentAiRevisionHistory.test.ts src/pages/content/ContentPage.test.ts src/composables/useLocale.test.ts`

Expected: FAIL，原因是组件、接线或文案不存在。

- [x] **Step 3：实现历史私有组件**

- 用 `Dialog` 展示历史，入口按钮显示 `revisions.length`。
- computed 复制并 reverse，禁止原地修改 prop。
- 每条记录展示 instruction、target kind、locale 时间和 before/after `pre`。
- 删除按钮第一次点击只设置 `pendingDeleteRevisionId`；随后显示确认/取消。
- 对话框关闭时清理 pending delete。

- [x] **Step 4：接入正文页原子动作**

- `applyInlineAssistantSuggestion()` 计算 nextBody 后调用 `applyAiRevision()`，传当前 instruction 和 target kind；保留现有即时 undo snapshot。
- 历史 restore handler 调用 `restoreAiRevision()`，instruction 使用 `t('content.aiRevisionRestoreInstruction')`，随后清空即时 undo snapshot 和批注浮层状态。
- delete handler 调用 `deleteAiRevision()`。
- 组件绑定始终使用 `selectedEntry.aiRevisionHistory`，章节切换自然隔离。

- [x] **Step 5：补齐中英文文案并运行 GREEN**

Run: `pnpm --filter @story-studio/studio test src/pages/content/ContentAiRevisionHistory.test.ts src/pages/content/ContentPage.test.ts src/composables/useLocale.test.ts src/modules/content/content.test.ts src/modules/content/useContent.test.ts`

Expected: PASS。

---

### Task 5：文档同步、全量验证与完成记录

**Files:**

- Modify: `docs/features/content.md`
- Modify: `docs/features/storage.md`
- Modify: `docs/ai/test-map.md`
- Modify: `docs/specs/2026-07-12-content-ai-revision-history.md`
- Modify: `docs/plans/2026-07/2026-07-12-content-ai-revision-history.md`
- Modify: `docs/plans/2026-07/TODO.md`

- [x] **Step 1：同步功能事实和测试索引**

- `content.md` 增加持久历史流程、20 条边界、恢复留痕、即时撤销关系和新测试入口。
- `storage.md` 更新 schema 14，并说明备份自动包含章节历史。
- `test-map.md` 增加 `ContentAiRevisionHistory.test.ts`。

- [x] **Step 2：运行目标验证**

```bash
pnpm --filter @story-studio/studio test src/modules/content/content.test.ts src/modules/content/useContent.test.ts src/modules/storage/document.test.ts src/pages/content/ContentPage.test.ts src/pages/content/ContentAiRevisionHistory.test.ts src/composables/useLocale.test.ts
```

Expected: 全部通过。

- [x] **Step 3：运行全仓验证**

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

Expected: 全部退出码为 0；既有 Rollup pure annotation、Tauri dynamic import 和 chunk warning 可记录为非阻塞 warning。

- [x] **Step 4：真实页面验证**

在 `http://127.0.0.1:4433/#content` 检查历史入口、空状态、记录数量、对话框布局和删除二次确认；不得发送真实 AI 请求。控制台不得出现新增 error/warn。

- [x] **Step 5：恢复生成文件并回填记录**

只恢复验证产生的两个 tsbuildinfo 文件。规格和计划填写实际验证计数、完成时间、commit 或未提交状态和未覆盖风险；月度 TODO 把任务移动到已完成。

## 风险与回滚

- 风险：整章前后正文会放大单文档体积；每章 20 条上限是本期硬边界。
- 风险：恢复历史可能与即时撤销冲突；恢复后必须清空旧即时快照。
- 风险：旧历史数据形状异常；迁移严格过滤无效记录但保留合法空正文。
- 回滚：移除历史组件和原子动作，回退共享字段与 schema 14 迁移；已有 schema 14 数据回退前需单独评估兼容，不直接降版本覆盖。

## 完成记录

- 完成时间：2026-07-12。
- 实际完成：5 个任务全部按 TDD 落地，schema 14、纯逻辑、统一文档原子动作、正文页历史组件、双语文案与文档同步均已完成。
- 验证结果：目标测试 6 个文件共 58 项通过；Studio 全量测试 49 个文件共 272 项通过；lint、typecheck、test、build 均通过；真实页面历史入口和空状态检查通过。
- commit：待本地提交后回填。
- 后续边界：普通编辑版本、跨章节历史、差异高亮与历史导出仍不在本期范围内。
