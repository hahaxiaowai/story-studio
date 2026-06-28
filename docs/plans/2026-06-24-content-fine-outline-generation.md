# 章节细纲与 AI 整章生成实施计划

## 步骤

- [x] 为内容模型、存储迁移、AI prompt 和正文页源码新增失败测试。
- [x] 更新 `WorkspaceContentEntry` 类型和 schema 版本。
- [x] 在内容模型中创建、更新和迁移 `fineOutline`。
- [x] 新增 `draft-full-chapter` AI 动作和细纲 prompt 段落。
- [x] 在正文页接入细纲编辑区和“按细纲生成整章”按钮。
- [x] 补充中英文文案。
- [x] 运行目标测试和完整验证链。

## 涉及文件

- `packages/types/src/types/story.ts`
- `apps/studio/src/modules/content/content.ts`
- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/pages/content/ContentPage.vue`
- `apps/studio/src/composables/useLocale.ts`

## 验证场景

- 新建章节后细纲为空但字段存在。
- 旧内容条目迁移后不会缺少细纲字段。
- 保存章节细纲不影响正文和关联情节点。
- 细纲为空时生成整章按钮禁用。
- 细纲非空时 AI prompt 包含“章节细纲”并要求完整生成本章。

## 验证结果

- 2026-06-28: `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts src/modules/content/useContentInlineAssistant.test.ts src/pages/content/ContentPage.test.ts src/modules/outlines/chronicle.test.ts src/pages/outline/OutlineLineManagerDialog.test.ts`
- 2026-06-28: `pnpm run lint`
- 2026-06-28: `pnpm run typecheck`
- 2026-06-28: `pnpm run test`
- 2026-06-28: `pnpm run build`
