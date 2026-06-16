# 正文章节上下移动实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在正文工作台支持当前章节上移和下移，保留现有正文、情节点关联和自动保存模式。

**Architecture:** `content.ts` 新增纯函数负责交换相邻章节并规范化 order；`useContent.ts` 只负责把当前工作区条目写回 `StudioDataDocument`；`ContentWorkspace.vue` 负责按钮状态和事件接线。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 shadcn-vue 风格按钮、lucide-vue 图标。

---

### Task 1: 排序纯函数

**Files:**
- Modify: `apps/studio/src/modules/content/content.ts`
- Modify: `apps/studio/src/modules/content/content.test.ts`

- [x] **Step 1: 写失败测试**

新增测试覆盖：

```ts
expect(moveContentEntry(entries, {
  entryId: 'content-2',
  direction: 'up',
  now: '2026-05-28T12:00:00.000Z',
}).map(entry => ({ id: entry.id, order: entry.order }))).toEqual([
  { id: 'content-2', order: 0 },
  { id: 'content-1', order: 1 },
  { id: 'content-3', order: 2 },
])
```

并覆盖下移、边界不变、只更新参与交换章节的 `updatedAt`。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: FAIL，提示 `moveContentEntry` 不存在。

- [x] **Step 3: 实现纯函数**

新增 `MoveContentEntryInput` 和 `moveContentEntry()`，先按当前 order 排序，找到目标章节和相邻章节，边界直接返回规范化结果。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: PASS。

### Task 2: useContent 接入

**Files:**
- Modify: `apps/studio/src/modules/content/useContent.ts`
- Modify: `apps/studio/src/modules/content/useContent.test.ts`

- [x] **Step 1: 写失败测试**

新增测试：创建三个当前工作区章节，调用 `content.moveEntry(secondEntry.id, 'up')` 后，`content.entries.value` 顺序为第二章、第一章、第三章，并确认保存内容只包含当前工作区顺序变更。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts`

Expected: FAIL，提示 `moveEntry` 不存在。

- [x] **Step 3: 实现 composable 方法**

导入 `moveContentEntry`，在 `useContent()` 返回值中增加 `moveEntry(entryId, direction)`，只筛选当前工作区条目参与排序，再与其他工作区条目合并写回。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts`

Expected: PASS。

### Task 3: 正文页按钮接线

**Files:**
- Modify: `apps/studio/src/modules/content/ContentWorkspace.vue`
- Add: `apps/studio/src/modules/content/ContentWorkspace.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 写失败测试**

静态测试确认页面包含 `moveEntry`、`canMoveSelectedEntryUp`、`canMoveSelectedEntryDown`、`content.moveUp` 和 `content.moveDown`。

- [x] **Step 2: 实现 UI 接线**

在当前章节标题右侧增加上移、下移、删除按钮组；上移/下移根据当前位置禁用，点击后保持当前 `selectedEntryId`。

- [x] **Step 3: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/ContentWorkspace.test.ts`

Expected: PASS。

### Task 4: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/content/content.test.ts
pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts
pnpm --filter @story-studio/studio test src/modules/content/ContentWorkspace.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
