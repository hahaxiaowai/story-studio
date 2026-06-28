# 实体必填字段校验提示实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给实体编辑器补齐可见必填字段的缺失提示。

**Architecture:** `entities.ts` 提供纯函数判断缺失字段；`EntityWorkspace.vue` 只负责计算结果和展示提示。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript strict、Vitest、现有 UI 组件。

---

### Task 1: 必填校验纯函数

**Files:**
- Modify: `apps/studio/src/modules/entities/entities.ts`
- Modify: `apps/studio/src/modules/entities/entities.test.ts`

- [x] **Step 1: 写失败测试**

覆盖文本空白、select 空值、multi-select 空数组、number null、boolean false 有效。

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @story-studio/studio test src/modules/entities/entities.test.ts`

Expected: FAIL，提示 `getMissingRequiredProperties` 或 `isMissingRequiredPropertyValue` 不存在。

- [x] **Step 3: 实现纯函数**

新增缺失字段判断，并仅根据传入属性集合判断，方便调用侧传入可见字段。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @story-studio/studio test src/modules/entities/entities.test.ts`

Expected: PASS。

### Task 2: 编辑器提示接线

**Files:**
- Modify: `apps/studio/src/modules/entities/EntityWorkspace.vue`

- [x] **Step 1: 接入缺失字段计算**

基于 `selectedRecord` 和 `visibleProperties` 计算 `missingRequiredProperties` 和 `missingRequiredPropertyIds`。

- [x] **Step 2: 渲染提示**

在标题区域展示汇总提示，在字段下方展示单字段错误文案。

### Task 3: 验证

**Files:**
- No code changes.

- [x] **Step 1: 运行目标测试**

Run: `pnpm --filter @story-studio/studio test src/modules/entities/entities.test.ts`

- [x] **Step 2: 运行项目检查**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
