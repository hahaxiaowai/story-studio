# 工作区详情编辑实施计划

## 状态

- 当前状态：已完成。
- 状态更新时间：2026-07-04 00:00 CST。
- 对齐说明：本次仅补充计划状态和完成记录，不修改业务代码。

## 完成记录

- 工作区详情纯函数已存在：`apps/studio/src/modules/workspaces/workspaces.ts` 定义 `updateWorkspaceDetails()`，支持标题和简介更新、清空简介、保留工作区 id，并校验空标题。
- 组合式保存入口已存在：`apps/studio/src/modules/workspaces/useWorkspaces.ts` 暴露 `saveActiveWorkspaceDetails()`，通过 `studioData.updateDocument()` 写回当前工作区。
- 弹窗 UI 已存在：`apps/studio/src/components/WorkspaceDetailsDialog.vue` 读取当前工作区标题和简介，并在提交时调用 `saveActiveWorkspaceDetails()`。
- 侧边栏入口已存在：`apps/studio/src/components/TeamSwitcher.vue` 引入 `WorkspaceDetailsDialog`，并通过 `menu.editWorkspace` 打开编辑工作区弹窗。
- 中英文文案已存在：`apps/studio/src/composables/useLocale.ts` 包含 `workspace.details.*` 和 `menu.editWorkspace`。
- 回归测试已存在：`apps/studio/src/modules/workspaces/workspaces.test.ts`、`apps/studio/src/modules/workspaces/useWorkspaces.test.ts`、`apps/studio/src/components/WorkspaceDetailsDialog.test.ts` 和 `apps/studio/src/components/TeamSwitcher.test.ts` 覆盖纯函数、保存入口和 UI 接线。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户可以从工作区切换器编辑当前工作区名称和简介，并写回统一本地文档。

**Architecture:** 纯函数负责不可变更新 `Workspace`；`useWorkspaces()` 暴露当前工作区详情保存入口；侧边栏只负责打开弹窗，弹窗复用现有表单和校验约定。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 shadcn-vue 风格组件。

---

### Task 1: 工作区详情纯函数

**Files:**
- Modify: `apps/studio/src/modules/workspaces/workspaces.ts`
- Modify: `apps/studio/src/modules/workspaces/workspaces.test.ts`

- [x] **Step 1: 写失败测试**

覆盖更新指定工作区标题和简介、清空简介、空标题报错、保持工作区 id 不变。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts`

Expected: FAIL，提示 `updateWorkspaceDetails` 不存在。

- [x] **Step 3: 实现纯函数**

新增 `updateWorkspaceDetails()`，只更新命中的工作区。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts`

Expected: PASS。

### Task 2: 组合式保存入口

**Files:**
- Modify: `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- Modify: `apps/studio/src/modules/workspaces/useWorkspaces.test.ts`

- [x] **Step 1: 写失败测试**

覆盖 `saveActiveWorkspaceDetails()` 写入当前工作区并触发持久化。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts`

Expected: FAIL，提示保存方法不存在。

- [x] **Step 3: 实现 composable 方法**

通过 `studioData.updateDocument()` 更新当前工作区详情。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts`

Expected: PASS。

### Task 3: 弹窗和侧边栏入口

**Files:**
- Add: `apps/studio/src/components/WorkspaceDetailsDialog.vue`
- Add: `apps/studio/src/components/WorkspaceDetailsDialog.test.ts`
- Add: `apps/studio/src/components/TeamSwitcher.test.ts`
- Modify: `apps/studio/src/components/TeamSwitcher.vue`
- Modify: `apps/studio/src/composables/useLocale.ts`

- [x] **Step 1: 写失败测试**

用静态接线测试确认详情弹窗调用 `saveActiveWorkspaceDetails()`，侧边栏渲染编辑入口并挂载弹窗。

- [x] **Step 2: 实现 UI 接线**

新增详情弹窗，侧边栏工作区菜单底部增加“编辑工作区”入口。

### Task 4: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run:

```bash
pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts
pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts
pnpm --filter @story-studio/studio test src/components/WorkspaceDetailsDialog.test.ts
pnpm --filter @story-studio/studio test src/components/TeamSwitcher.test.ts
```

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```
