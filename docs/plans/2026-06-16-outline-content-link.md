# 大纲情节点关联章节实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让正文章节和大纲情节点形成一对一轻量关联，并在正文页与大纲输入模式中可见可编辑。

**Architecture:** 关联字段保存在 `WorkspaceContentEntry.outlineBeatId`。纯函数负责一对一赋值和清理；`useContent()` 暴露关联方法；正文页和大纲编辑器通过现有 composable 操作同一个 `StudioDataDocument`。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 shadcn-vue 风格组件。

---

### Task 1: 数据类型和纯函数

**Files:**
- Modify: `packages/types/src/types/story.ts`
- Modify: `apps/studio/src/modules/content/content.ts`
- Modify: `apps/studio/src/modules/content/content.test.ts`

- [x] **Step 1: 写失败测试**

在 `content.test.ts` 增加测试：新建章节不带 `outlineBeatId`；`assignOutlineBeatToContentEntry()` 能把章节关联到情节点，并解除同一情节点上的旧章节。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: FAIL，提示 `assignOutlineBeatToContentEntry` 不存在。

- [x] **Step 3: 实现类型和纯函数**

给 `WorkspaceContentEntry` 增加 `outlineBeatId?: string`，并实现 `assignOutlineBeatToContentEntry()`。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`

Expected: PASS。

### Task 2: 存储迁移和 useContent 接口

**Files:**
- Modify: `apps/studio/src/modules/storage/document.ts`
- Modify: `apps/studio/src/modules/storage/document.test.ts`
- Modify: `apps/studio/src/modules/content/useContent.ts`
- Modify: `apps/studio/src/modules/content/useContent.test.ts`

- [x] **Step 1: 写失败测试**

覆盖旧内容缺少字段时迁移正常；无效 `outlineBeatId` 会被清理；`useContent().linkEntryToBeat()` 会保存一对一关联。

- [x] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/storage/document.test.ts
pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts
```

- [x] **Step 3: 实现迁移和 composable 方法**

`normalizeContentEntries()` 接受当前文档大纲并清理无效关联；`useContent()` 暴露 `linkEntryToBeat(entryId, beatId)`。

- [x] **Step 4: 运行测试确认通过**

Run 同 Step 2，Expected: PASS。

### Task 3: 正文页 UI

**Files:**
- Modify: `apps/studio/src/modules/content/ContentWorkspace.vue`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 接入大纲选项**

正文页读取当前 workspace 的 `beats`，为选中章节展示“关联情节点”下拉框和摘要。

- [x] **Step 2: 补全文案**

新增 `content.linkedBeat`、`content.noLinkedBeat`、`content.linkedBeatSummary` 等中英文文案。

### Task 4: 大纲输入模式 UI

**Files:**
- Modify: `apps/studio/src/modules/outlines/OutlineInputMode.vue`
- Modify: `apps/studio/src/modules/outlines/OutlineBeatEditor.vue`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 情节点卡片显示关联章节**

输入模式左侧卡片如果已有章节关联，显示章节名。

- [x] **Step 2: 编辑器绑定章节**

给 `OutlineBeatEditor` 增加章节选项和当前关联章节，选择后调用父组件更新 `WorkspaceContentEntry.outlineBeatId`。

### Task 5: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/content/content.test.ts
pnpm --filter @story-studio/studio test src/modules/storage/document.test.ts
pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```
