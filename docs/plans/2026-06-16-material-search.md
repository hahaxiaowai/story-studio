# 素材关键词搜索实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给素材库增加轻量关键词搜索，并与现有标签筛选组合生效。

**Architecture:** 纯函数统一处理排序、标签和关键词过滤；`useMaterials()` 管理页面局部搜索状态；`MaterialWorkspace` 只负责输入框和列表绑定。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 shadcn-vue 风格组件。

---

### Task 1: 素材过滤纯函数

**Files:**
- Modify: `apps/studio/src/modules/materials/materials.ts`
- Modify: `apps/studio/src/modules/materials/materials.test.ts`

- [x] **Step 1: 写失败测试**

覆盖按标题、正文、链接、图片地址搜索；搜索大小写不敏感；搜索与标签筛选组合；空搜索保持原行为。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/materials/materials.test.ts`

Expected: FAIL，提示 `getFilteredMaterials` 不存在。

- [x] **Step 3: 实现纯函数**

新增 `getFilteredMaterials(materials, { tagId, query })`，并让 `getMaterialsByTag()` 兼容委托。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/materials/materials.test.ts`

Expected: PASS。

### Task 2: useMaterials 搜索状态

**Files:**
- Modify: `apps/studio/src/modules/materials/useMaterials.ts`
- Add: `apps/studio/src/modules/materials/useMaterials.test.ts`

- [x] **Step 1: 写失败测试**

覆盖 `searchQuery` 会收窄 `filteredMaterials`，并与 `selectedTagId` 组合。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/materials/useMaterials.test.ts`

Expected: FAIL，提示 `searchQuery` 或组合过滤不存在。

- [x] **Step 3: 实现 composable 状态**

新增 `searchQuery` ref，并让 `filteredMaterials` 读取标签和搜索关键词。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/materials/useMaterials.test.ts`

Expected: PASS。

### Task 3: 素材页搜索输入

**Files:**
- Modify: `apps/studio/src/modules/materials/MaterialWorkspace.vue`
- Add: `apps/studio/src/modules/materials/MaterialWorkspace.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 写失败测试**

用静态接线测试确认页面绑定 `searchQuery` 并使用搜索文案。

- [x] **Step 2: 实现 UI 接线**

在素材列表标题下方新增搜索输入框，绑定 `searchQuery`。

### Task 4: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/materials/materials.test.ts
pnpm --filter @story-studio/studio test src/modules/materials/useMaterials.test.ts
pnpm --filter @story-studio/studio test src/modules/materials/MaterialWorkspace.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```
