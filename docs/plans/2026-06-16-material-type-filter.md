# 素材类型筛选实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在素材库列表中增加全部、文字、链接、图片四种类型筛选，并与现有标签和关键词搜索叠加。

**Architecture:** 类型不写入持久化数据，而是从 `MaterialAsset` 的 `text`、`url`、`imageUrl` 字段派生。纯数据过滤集中在 `materials.ts`，页面状态由 `useMaterials` 暴露，Vue 页面只负责绑定按钮和展示文案。

**Tech Stack:** Vue 3、TypeScript、Vitest、现有 Story Studio 本地文档状态。

---

## 涉及文件

- `apps/studio/src/modules/materials/materials.ts`：新增 `MaterialKindFilter` 类型并扩展过滤逻辑。
- `apps/studio/src/modules/materials/materials.test.ts`：覆盖类型筛选和组合筛选。
- `apps/studio/src/modules/materials/useMaterials.ts`：新增 `selectedKind` 响应式状态。
- `apps/studio/src/modules/materials/useMaterials.test.ts`：覆盖组合式类型筛选。
- `apps/studio/src/modules/materials/MaterialWorkspace.vue`：新增类型筛选按钮组。
- `apps/studio/src/modules/materials/MaterialWorkspace.test.ts`：覆盖页面接线。
- `apps/studio/src/composables/useLocale.ts`：补充类型筛选中英文文案。
- `apps/studio/src/modules/materials/materials.ts`：补充类型和标签计数纯函数。
- `apps/studio/src/modules/materials/useMaterials.ts`：暴露 `kindCounts` 和 `tagCounts` 给页面展示。

## 步骤

### Task 1: 纯数据类型筛选

- [x] 在 `materials.test.ts` 新增失败测试，断言 `getFilteredMaterials(materials, { kind: 'text' | 'link' | 'image' })` 只返回对应字段非空的素材。
- [x] 运行 `pnpm exec vitest run apps/studio/src/modules/materials/materials.test.ts`，确认测试因 `kind` 未生效而失败。
- [x] 在 `materials.ts` 新增 `MaterialKindFilter`、扩展 `MaterialFilterOptions`，并在标签和关键词过滤之间应用类型过滤。
- [x] 重跑同一个测试文件，确认通过。

### Task 2: 组合式状态

- [x] 在 `useMaterials.test.ts` 新增失败测试，设置 `materials.selectedKind.value = 'link'` 后只返回链接素材。
- [x] 运行 `pnpm exec vitest run apps/studio/src/modules/materials/useMaterials.test.ts`，确认测试因 `selectedKind` 缺失或未接线而失败。
- [x] 在 `useMaterials.ts` 新增 `selectedKind` ref，并传入 `getFilteredMaterials`。
- [x] 重跑同一个测试文件，确认通过。

### Task 3: 页面接线和文案

- [x] 在 `MaterialWorkspace.test.ts` 新增失败测试，断言页面源码包含 `selectedKind` 和类型筛选文案键。
- [x] 运行 `pnpm exec vitest run apps/studio/src/modules/materials/MaterialWorkspace.test.ts`，确认测试失败。
- [x] 在 `MaterialWorkspace.vue` 搜索框下方增加类型筛选按钮组。
- [x] 在 `useLocale.ts` 补充 `materials.typeFilter`、`materials.kindAll`、`materials.kindText`、`materials.kindLink`、`materials.kindImage` 中英文文案。
- [x] 重跑页面测试，确认通过。

### Task 3.5: 筛选数量展示

- [x] 在 `materials.ts` 新增 `getMaterialKindCounts` 和 `getMaterialTagCounts`，复用现有过滤规则。
- [x] 在 `useMaterials.ts` 暴露 `kindCounts` 和 `tagCounts`。
- [x] 在 `MaterialWorkspace.vue` 展示类型筛选和标签筛选数量，并移除模板内联过滤。
- [x] 在 `materials.test.ts`、`useMaterials.test.ts` 和 `MaterialWorkspace.test.ts` 覆盖计数口径和页面接线。

### Task 4: 项目验证和提交

- [x] 运行素材相关测试。
- [x] 运行 `pnpm run typecheck`、`pnpm run lint`、`pnpm run test`、`pnpm run build`。
- [x] 如 `apps/studio/tsconfig.app.tsbuildinfo` 因验证被改动，恢复为 HEAD 版本。
- [x] 使用窄范围 `git add` 暂存本次文档、测试和实现文件。
- [x] 提交：`feat: 增加素材类型筛选`。
