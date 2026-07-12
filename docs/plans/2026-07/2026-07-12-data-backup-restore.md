# 数据备份与恢复实施计划

> **执行要求：** 使用 `superpowers:executing-plans` 在当前任务中逐项实施。每个业务行为必须遵循 `superpowers:test-driven-development`，先观察目标测试按预期失败，再写最小实现。

**目标：** 为 Web 与 Tauri 共用的 Studio 前端增加完整 JSON 导出、导入预览、明确确认和失败回滚能力。

**架构：** 备份格式、身份校验、版本校验和摘要属于 `modules/storage/backup.ts` 纯逻辑；浏览器下载与文件读取由 `backupFile.ts` 隔离；`useStudioData()` 提供原子替换与持久化回滚；`DataBackupDialog.vue` 只编排用户流程，`AppHeaderActions.vue` 只挂载入口。

**技术栈：** Vue 3、TypeScript strict、Vitest、现有 Dialog/Button UI、浏览器 Blob/File API、现有 `StudioDataDocument` schema 迁移。

## 全局约束

- 不改变 `StudioDataDocument` schema，不新增共享类型字段或依赖。
- 备份是完整 `StudioDataDocument` JSON，不增加额外 envelope。
- 导入覆盖前必须展示摘要并由用户二次确认。
- 低于 schema 3 或高于当前 schema 13 的备份必须拒绝，不能静默生成默认数据。
- 导入保存失败必须恢复导入前的内存文档并重新抛出错误。
- 导出不得修改文档及其 `updatedAt`。
- 界面必须提示备份可能包含 API Key。
- 不修改或覆盖用户已有无关改动；验证后恢复 `apps/studio/tsconfig.app.tsbuildinfo` 的生成噪音。

## 来源规格

- `docs/specs/2026-07-12-data-backup-restore.md`

## 状态

- 当前状态：已完成。
- 创建时间：2026-07-12。
- 完成时间：2026-07-12。
- 执行范围：手动导出完整 JSON、导入校验与摘要、确认恢复、保存失败回滚；不做自动备份、版本历史和发布格式导出。

## 完成记录

- 新增备份编解码、结构与版本校验、摘要和稳定错误代码。
- 新增浏览器 Blob 下载、文件读取和 object URL 清理适配。
- `useStudioData()` 已支持立即持久化的整体替换，并在保存失败时回滚内存快照。
- 顶部操作区已接入双语备份对话框，选择文件只展示摘要，明确确认后才恢复。
- 已同步存储功能说明、测试锚点、规格和月度任务状态。
- 目标测试 5 个文件、25 个测试通过；全仓 Studio 48 个测试文件、262 个测试通过。
- `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` 均通过。
- 真实页面验证通过：入口和对话框可用，未选择文件前不展示确认恢复按钮，控制台无 error/warn。

---

### Task 1：备份编解码、版本校验与摘要

**Files:**

- Create: `apps/studio/src/modules/storage/backup.ts`
- Create: `apps/studio/src/modules/storage/backup.test.ts`

**Interfaces:**

- Produces: `StudioDataBackupFile { fileName: string; mimeType: 'application/json'; content: string }`
- Produces: `StudioDataBackupSummary { updatedAt: string; workspaceCount: number; contentCount: number; materialCount: number; assistantThreadCount: number }`
- Produces: `StudioDataBackupError` with code `'invalid-json' | 'invalid-document' | 'schema-too-old' | 'schema-too-new'`
- Produces: `createStudioDataBackup(document, now): StudioDataBackupFile`
- Produces: `parseStudioDataBackup(source): StudioDataDocument`
- Produces: `summarizeStudioDataBackup(document): StudioDataBackupSummary`
- Consumes: `resolveStudioDataDocument()` and `STUDIO_DATA_SCHEMA_VERSION` from `document.ts`

- [x] **Step 1：写导出与摘要失败测试**

在 `backup.test.ts` 创建固定文档，断言文件名、MIME、格式化 JSON、统计摘要和源文档不变：

```ts
it('creates a formatted backup without mutating the source document', () => {
  const document = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
  document.contents.push(createContentEntry())
  const sourceBeforeExport = structuredClone(document)

  const backup = createStudioDataBackup(document, new Date('2026-07-12T09:08:07.000Z'))

  expect(backup.fileName).toBe('story-studio-backup-2026-07-12-090807.json')
  expect(backup.mimeType).toBe('application/json')
  expect(backup.content).toBe(`${JSON.stringify(document, null, 2)}\n`)
  expect(document).toEqual(sourceBeforeExport)
  expect(summarizeStudioDataBackup(document)).toEqual({
    updatedAt: '2026-07-12T08:00:00.000Z',
    workspaceCount: document.workspaces.length,
    contentCount: 1,
    materialCount: 0,
    assistantThreadCount: 0,
  })
})
```

- [x] **Step 2：运行测试并确认 RED**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/storage/backup.test.ts
```

Expected: FAIL，原因是 `./backup` 模块或导出函数不存在。

- [x] **Step 3：实现最小导出与摘要逻辑**

在 `backup.ts` 定义公开类型，并实现：

```ts
export function createStudioDataBackup(document: StudioDataDocument, now = new Date()): StudioDataBackupFile {
  return {
    fileName: `story-studio-backup-${formatBackupTimestamp(now)}.json`,
    mimeType: 'application/json',
    content: `${JSON.stringify(document, null, 2)}\n`,
  }
}

export function summarizeStudioDataBackup(document: StudioDataDocument): StudioDataBackupSummary {
  return {
    updatedAt: document.updatedAt,
    workspaceCount: document.workspaces.length,
    contentCount: document.contents.length,
    materialCount: document.materials.length,
    assistantThreadCount: document.assistantChatThreads.length,
  }
}
```

时间格式使用本地日期字段和两位补零，不依赖 locale 字符串。

- [x] **Step 4：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/backup.test.ts`

Expected: PASS。

- [x] **Step 5：写导入成功和迁移失败测试**

增加独立测试，覆盖：

```ts
it('parses and migrates a supported Story Studio backup', () => {
  const source = createDefaultStudioDataDocument()
  const legacy = { ...source, schemaVersion: 12, contents: undefined }

  const restored = parseStudioDataBackup(JSON.stringify(legacy))

  expect(restored.schemaVersion).toBe(STUDIO_DATA_SCHEMA_VERSION)
  expect(restored.contents).toEqual([])
})

it.each([
  ['invalid-json', '{'],
  ['invalid-document', JSON.stringify([])],
  ['invalid-document', JSON.stringify({ schemaVersion: 13, workspaces: [] })],
  ['schema-too-old', JSON.stringify({ schemaVersion: 2, workspaces: [], activeWorkspaceId: '' })],
  ['schema-too-new', JSON.stringify({ schemaVersion: 14, workspaces: [], activeWorkspaceId: '' })],
])('rejects %s backups without creating default data', (code, source) => {
  expect(() => parseStudioDataBackup(source)).toThrowError(expect.objectContaining({ code }))
})
```

- [x] **Step 6：运行测试并确认 RED**

Expected: FAIL，原因是 `parseStudioDataBackup` 或错误类型不存在。

- [x] **Step 7：实现身份、版本校验和迁移**

实现顺序必须是：`JSON.parse` → 根对象检查 → 必填字段类型检查 → schema 下限/上限检查 → `resolveStudioDataDocument(candidate)`。错误类保存稳定 code，UI 不依赖英文错误消息判断分支。

```ts
export class StudioDataBackupError extends Error {
  constructor(public readonly code: StudioDataBackupErrorCode) {
    super(code)
    this.name = 'StudioDataBackupError'
  }
}

export function parseStudioDataBackup(source: string): StudioDataDocument {
  let candidate: unknown
  try {
    candidate = JSON.parse(source)
  }
  catch {
    throw new StudioDataBackupError('invalid-json')
  }

  assertStudioDataBackupCandidate(candidate)
  if (candidate.schemaVersion < 3)
    throw new StudioDataBackupError('schema-too-old')
  if (candidate.schemaVersion > STUDIO_DATA_SCHEMA_VERSION)
    throw new StudioDataBackupError('schema-too-new')

  return resolveStudioDataDocument(candidate as StudioDataDocument)
}
```

- [x] **Step 8：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/backup.test.ts`

Expected: PASS，且各错误用例命中预期 code。

---

### Task 2：原子替换和保存失败回滚

**Files:**

- Modify: `apps/studio/src/modules/storage/useStudioData.ts`
- Modify: `apps/studio/src/modules/storage/useStudioData.test.ts`

**Interfaces:**

- Produces: `replaceDocument(nextDocument: StudioDataDocument): Promise<void>` in `useStudioData()` return value
- Consumes: Task 1 返回的已校验、已迁移 `StudioDataDocument`

- [x] **Step 1：写替换成功失败测试**

```ts
it('replaces and immediately persists an imported document', async () => {
  const current = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
  const imported = { ...createDefaultStudioDataDocument('2026-07-11T08:00:00.000Z'), activeWorkspaceId: 'imported' }
  const driver = createDriver(current)
  const studioData = useStudioData(driver)
  await studioData.ready

  await studioData.replaceDocument(imported)

  expect(studioData.document.value).toEqual(imported)
  expect(driver.save).toHaveBeenLastCalledWith(imported)
})

it('restores the current document when imported persistence fails', async () => {
  const current = createDefaultStudioDataDocument('2026-07-12T08:00:00.000Z')
  const imported = { ...current, activeWorkspaceId: 'imported' }
  const driver = createDriver(current)
  const studioData = useStudioData(driver)
  await studioData.ready
  driver.save.mockRejectedValueOnce(new Error('disk full'))

  await expect(studioData.replaceDocument(imported)).rejects.toThrow('disk full')
  expect(studioData.document.value).toEqual(current)
  expect(studioData.loadError.value?.message).toBe('disk full')
})
```

- [x] **Step 2：运行测试并确认 RED**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/useStudioData.test.ts`

Expected: FAIL，原因是 `replaceDocument` 不存在。

- [x] **Step 3：实现原子替换**

复用 `createPersistableDocument()` 创建旧快照和保存载荷，不改变导入文档时间戳：

```ts
async function replaceDocument(nextDocument: StudioDataDocument): Promise<void> {
  const previousDocument = createPersistableDocument(document.value)
  const persistableNextDocument = createPersistableDocument(nextDocument)
  document.value = persistableNextDocument

  try {
    await storageDriver?.save(persistableNextDocument)
    loadError.value = undefined
  }
  catch (error) {
    document.value = previousDocument
    loadError.value = toError(error)
    throw loadError.value
  }
}
```

将函数加入 `useStudioData()` 的显式返回类型和返回对象。

- [x] **Step 4：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/useStudioData.test.ts`

Expected: PASS，既有保存 proxy 测试继续通过。

---

### Task 3：浏览器文件下载和读取适配

**Files:**

- Create: `apps/studio/src/modules/storage/backupFile.ts`
- Create: `apps/studio/src/modules/storage/backupFile.test.ts`

**Interfaces:**

- Produces: `downloadStudioDataBackup(backup: StudioDataBackupFile): void`
- Produces: `readStudioDataBackupFile(file: File): Promise<string>`
- Consumes: Task 1 `StudioDataBackupFile`

- [x] **Step 1：写 object URL 生命周期失败测试**

用真实 `Blob` 和最小 DOM spy 验证创建链接、设置 `download`、触发点击、移除链接并释放 URL；另测 `readStudioDataBackupFile(new File(...))` 返回 UTF-8 文本。

```ts
it('downloads a backup and releases its object URL', () => {
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup')
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

  downloadStudioDataBackup({
    fileName: 'story-studio-backup.json',
    mimeType: 'application/json',
    content: '{"schemaVersion":13}',
  })

  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
})
```

- [x] **Step 2：运行测试并确认 RED**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/backupFile.test.ts`

Expected: FAIL，原因是模块不存在。

- [x] **Step 3：实现浏览器适配**

```ts
export function downloadStudioDataBackup(backup: StudioDataBackupFile): void {
  const blob = new Blob([backup.content], { type: backup.mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = backup.fileName
    link.hidden = true
    document.body.append(link)
    link.click()
  }
  finally {
    link.remove()
    URL.revokeObjectURL(url)
  }
}

export async function readStudioDataBackupFile(file: File): Promise<string> {
  return file.text()
}
```

- [x] **Step 4：运行测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/backupFile.test.ts`

Expected: PASS。

---

### Task 4：备份对话框、顶部入口和双语文案

**Files:**

- Create: `apps/studio/src/components/DataBackupDialog.vue`
- Create: `apps/studio/src/components/DataBackupDialog.test.ts`
- Modify: `apps/studio/src/components/AppHeaderActions.vue`
- Modify: `apps/studio/src/composables/useLocale.ts`
- Modify: `apps/studio/src/composables/useLocale.test.ts`

**Interfaces:**

- Consumes: Task 1 backup creation/parsing/summary/error code
- Consumes: Task 2 `replaceDocument()`
- Consumes: Task 3 download/read helpers
- Produces: top-bar button that controls `DataBackupDialog` through `v-model:open`

- [x] **Step 1：写页面接线与文案失败测试**

沿用当前组件源码静态测试风格，断言：

```ts
expect(componentSource).toContain('createStudioDataBackup(document.value)')
expect(componentSource).toContain('parseStudioDataBackup(source)')
expect(componentSource).toContain('pendingDocument.value = parsedDocument')
expect(componentSource).toContain('await replaceDocument(pendingDocument.value)')
expect(componentSource).toContain('backup.sensitiveWarning')
expect(headerSource).toContain('<DataBackupDialog v-model:open="backupDialogOpen" />')
expect(headerSource).toContain("t('backup.open')")
```

在 locale 测试中增加中英文 key 一致性断言，至少覆盖 `backup.open`、`backup.export`、`backup.chooseFile`、`backup.confirmRestore`、四类导入错误和敏感信息提示。

- [x] **Step 2：运行测试并确认 RED**

Run:

```bash
pnpm --filter @story-studio/studio test src/components/DataBackupDialog.test.ts src/composables/useLocale.test.ts
```

Expected: FAIL，原因是组件、接线或文案 key 不存在。

- [x] **Step 3：实现对话框状态与流程**

`DataBackupDialog.vue` 使用以下独立状态：

```ts
const pendingDocument = ref<StudioDataDocument>()
const pendingSummary = computed(() => pendingDocument.value ? summarizeStudioDataBackup(pendingDocument.value) : undefined)
const importErrorCode = ref<StudioDataBackupErrorCode>()
const isRestoring = ref(false)
const restoreSucceeded = ref(false)
```

流程函数保持单一职责：

- `exportBackup()`：创建并下载，不写文档。
- `selectBackupFile(event)`：清理旧状态、读取第一个文件、解析后只写入 `pendingDocument`。
- `confirmRestore()`：等待 `replaceDocument()`；成功才清除 pending 并显示成功。
- `resetImportState()`：对话框关闭时清理选择、错误和成功状态。

文件 input 必须包含：

```html
<input type="file" accept="application/json,.json" @change="selectBackupFile">
```

确认按钮只在 `pendingDocument` 存在时展示，并在 `isRestoring` 时禁用。错误 code 通过显式映射转换成 locale key，不直接展示内部英文错误消息。

- [x] **Step 4：挂载顶部入口**

在 `AppHeaderActions.vue` 增加 `DatabaseBackupIcon`、`backupDialogOpen`、按钮和对话框；保持主题和语言按钮原有行为不变：

```vue
<Button variant="ghost" size="icon-sm" type="button" :aria-label="t('backup.open')" @click="backupDialogOpen = true">
  <DatabaseBackupIcon />
  <span class="sr-only">{{ t('backup.open') }}</span>
</Button>
<DataBackupDialog v-model:open="backupDialogOpen" />
```

- [x] **Step 5：补齐中英文文案**

文案覆盖标题、说明、当前数据摘要、待恢复摘要、导出、选择文件、确认恢复、取消、恢复中、成功、覆盖警告、API Key 敏感提示和四类错误。不要在模板中硬编码中文业务提示。

- [x] **Step 6：运行目标测试并确认 GREEN**

Run:

```bash
pnpm --filter @story-studio/studio test src/components/DataBackupDialog.test.ts src/composables/useLocale.test.ts src/modules/storage/backup.test.ts src/modules/storage/backupFile.test.ts src/modules/storage/useStudioData.test.ts
```

Expected: PASS。

---

### Task 5：功能文档、测试索引和完成记录

**Files:**

- Modify: `docs/features/storage.md`
- Modify: `docs/ai/test-map.md`
- Modify: `docs/specs/2026-07-12-data-backup-restore.md`
- Modify: `docs/plans/2026-07/2026-07-12-data-backup-restore.md`
- Modify: `docs/plans/2026-07/TODO.md`

**Interfaces:**

- Consumes: Tasks 1-4 的实际文件、行为和验证结果
- Produces: 当前功能事实、测试锚点和 SDD 完成证据

- [x] **Step 1：同步存储功能说明**

在 `docs/features/storage.md` 增加：顶部数据备份入口、导出流程、导入预览与确认流程、`backup.ts`/`backupFile.ts`/`DataBackupDialog.vue` 关键文件、版本拒绝边界、敏感数据风险和新测试入口。

- [x] **Step 2：同步测试索引**

在 `docs/ai/test-map.md` 的“存储和 schema”加入：

```md
- `apps/studio/src/modules/storage/backup.test.ts`
- `apps/studio/src/modules/storage/backupFile.test.ts`
- `apps/studio/src/components/DataBackupDialog.test.ts`
```

- [x] **Step 3：执行完整验证**

依次运行：

```bash
pnpm --filter @story-studio/studio test src/modules/storage/backup.test.ts src/modules/storage/backupFile.test.ts src/modules/storage/useStudioData.test.ts src/components/DataBackupDialog.test.ts src/composables/useLocale.test.ts
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

Expected: 所有命令退出码为 0。Turbo cache rename warning、既有 Rollup pure annotation、Tauri dynamic import 或 chunk size warning 只在命令成功时记录为非阻塞 warning。

- [x] **Step 4：检查并恢复生成文件噪音**

运行 `git status --short`。如果只有验证导致的 `apps/studio/tsconfig.app.tsbuildinfo` 改动，使用：

```bash
git restore apps/studio/tsconfig.app.tsbuildinfo
```

不得恢复任何用户或本功能的源码改动。

- [x] **Step 5：回填完成记录**

- 规格的完成记录写入实际完成时间、实现范围、逐条验证结果、commit 或“未提交”状态和剩余风险。
- 本计划状态改为“已完成”，勾选实际完成步骤并记录验证结果。
- `docs/plans/2026-07/TODO.md` 将本任务移动到“已完成记录”，下一步写“后续可设计自动备份和版本历史”。

## 风险与回滚

- 风险：完整 JSON 包含 Provider API Key；通过导出前明确提示降低误传风险，本期不承诺文件加密。
- 风险：浏览器 WebView 下载行为在不同 Tauri 平台可能不同；纯逻辑和 DOM 测试通过后仍需桌面运行验证。
- 风险：整体恢复覆盖所有工作区；通过摘要和二次确认避免误操作。
- 回滚：移除备份纯逻辑、文件适配、对话框及 `replaceDocument()`，恢复顶部操作区和 locale 文案；不需要 schema 回滚。

## 验证记录

- 2026-07-12：目标测试通过，5 个测试文件、25 个测试通过。
- 2026-07-12：`pnpm run lint`、`pnpm run typecheck` 通过。
- 2026-07-12：`pnpm run test` 通过，Studio 48 个测试文件、262 个测试通过；共享包测试同时通过。
- 2026-07-12：`pnpm run build` 通过；保留既有 Rollup pure annotation、Tauri dynamic import 和 chunk size warning。
- 2026-07-12：浏览器页面检查通过，对话框摘要、敏感提示、恢复确认门禁和关闭流程符合规格，控制台无 error/warn。
