# 正文章节搜索实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给正文工作台增加轻量章节搜索，帮助用户按卷名、章节名和正文内容定位章节。

**Architecture:** `content.ts` 提供纯函数过滤并保持排序；`useContent.ts` 管理页面局部搜索状态；`ContentWorkspace.vue` 只负责输入框和列表绑定。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 Input 组件。

---

### Task 1: 章节过滤纯函数

**Files:**
- Modify: `apps/studio/src/modules/content/content.ts`
- Modify: `apps/studio/src/modules/content/content.test.ts`

- [x] **Step 1: 写失败测试**

覆盖按卷名、章节名、正文内容搜索；大小写不敏感；空搜索保持排序后的原列表。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: FAIL，提示 `getFilteredContentEntries` 不存在。

- [x] **Step 3: 实现纯函数**

新增 `getFilteredContentEntries(entries, query)`，先 `sortContentEntries()`，再基于 `volume`、`chapter`、`body` 做小写包含匹配。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: PASS。

### Task 2: useContent 搜索状态

**Files:**
- Modify: `apps/studio/src/modules/content/useContent.ts`
- Modify: `apps/studio/src/modules/content/useContent.test.ts`

- [x] **Step 1: 写失败测试**

新增测试：创建三个章节，设置 `content.searchQuery.value = '雨夜'` 后，`content.entries.value` 只包含正文命中的章节，并确认 `driver.save` 没有因为设置搜索词而新增保存调用。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts`

Expected: FAIL，提示 `searchQuery` 不存在。

- [x] **Step 3: 实现 composable 状态**

新增 `searchQuery = ref('')`，让 `entries` 基于当前工作区条目和 `getFilteredContentEntries()` 计算。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts`

Expected: PASS。

### Task 3: 正文页搜索输入

**Files:**
- Modify: `apps/studio/src/modules/content/ContentWorkspace.vue`
- Modify: `apps/studio/src/modules/content/ContentWorkspace.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 写失败测试**

静态测试确认页面绑定 `searchQuery`、使用 `v-model="searchQuery"`，并引用 `content.searchPlaceholder` 和 `content.searchEmpty`。

- [x] **Step 2: 实现 UI 接线**

在左侧章节列表顶部增加 `Input`，绑定 `searchQuery`，无搜索结果时展示 `content.searchEmpty`。

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
