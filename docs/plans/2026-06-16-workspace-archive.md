# 工作区归档与恢复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户可以归档当前工作区，并从工作区菜单恢复已归档工作区。

**Architecture:** 纯函数处理 workspace status 和 activeWorkspaceId 选择；`useWorkspaces()` 负责持久化写入；`TeamSwitcher` 只负责展示草稿列表、归档操作和恢复入口。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 shadcn-vue 风格组件。

---

### Task 1: 归档纯函数

**Files:**
- Modify: `apps/studio/src/modules/workspaces/workspaces.ts`
- Modify: `apps/studio/src/modules/workspaces/workspaces.test.ts`

- [x] **Step 1: 写失败测试**

覆盖草稿/归档过滤、归档当前工作区后切换 activeWorkspaceId、最后一个草稿不可归档、恢复归档工作区并激活。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts`

Expected: FAIL，提示归档相关函数不存在。

- [x] **Step 3: 实现纯函数**

新增 `getDraftWorkspaces()`、`getArchivedWorkspaces()`、`archiveWorkspace()` 和 `restoreWorkspace()`。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts`

Expected: PASS。

### Task 2: 组合式持久化入口

**Files:**
- Modify: `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- Modify: `apps/studio/src/modules/workspaces/useWorkspaces.test.ts`

- [x] **Step 1: 写失败测试**

覆盖 `archiveActiveWorkspace()` 和 `restoreArchivedWorkspace()` 会写入统一文档并更新 activeWorkspaceId。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts`

Expected: FAIL，提示 composable 方法不存在。

- [x] **Step 3: 实现 composable 方法**

通过 `studioData.updateDocument()` 写入归档/恢复结果，并导出草稿与归档列表。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts`

Expected: PASS。

### Task 3: 侧边栏菜单入口

**Files:**
- Modify: `apps/studio/src/components/TeamSwitcher.vue`
- Modify: `apps/studio/src/components/TeamSwitcher.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 写失败测试**

用静态接线测试确认菜单使用草稿列表、提供归档当前工作区入口、展示归档恢复分组。

- [x] **Step 2: 实现 UI 接线**

普通列表只渲染草稿工作区，菜单操作区增加归档入口，存在归档工作区时显示恢复列表。

### Task 4: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts
pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts
pnpm --filter @story-studio/studio test src/components/TeamSwitcher.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```
