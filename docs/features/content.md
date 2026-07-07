# 正文创作

## 功能目的

正文模块按卷、章管理实际稿件内容，并可与大纲情节点绑定。`fineOutline` 字段用于保存章节级细纲，让正文写作可以承接更细粒度的规划。

## 用户入口

- 导航 hash：`#content` / `#manuscript`
- 页面：`apps/studio/src/pages/content/ContentPage.vue`

## 主流程

1. 按当前工作区读取 `WorkspaceContentEntry`。
2. 用户新增章节，默认生成卷名、章名和空正文。
3. 用户编辑卷、章、细纲、正文和大纲情节点绑定。
4. 章节可上移、下移或删除，排序后重新写入 `order`。
5. 搜索按卷名、章名和正文内容过滤。

## 关键文件

- `apps/studio/src/modules/content/content.ts`
- `apps/studio/src/modules/content/useContent.ts`
- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/content/useContentInlineAssistant.ts`
- `apps/studio/src/pages/content/ContentPage.vue`
- `packages/types/src/types/story.ts`

## 数据结构

- `WorkspaceContentEntry`
- `WorkspaceContentEntry.outlineBeatId`
- `WorkspaceContentEntry.fineOutline`
- `StudioDataDocument.contents`

## 状态流和副作用

- 每次编辑通过 `updateDocument()` 写回统一文档。
- `assignOutlineBeatToContentEntry()` 保证同一个情节点最多绑定一个正文条目。
- schema 迁移会为旧内容补齐 `fineOutline`。

## 边界情况

- 空 `outlineBeatId` 会规范化为 `undefined`。
- 删除章节后需要重排剩余章节顺序。
- 搜索当前不包含 `fineOutline`，只匹配卷、章和正文。

## 验证入口

- `apps/studio/src/modules/content/content.test.ts`
- `apps/studio/src/modules/content/useContent.test.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/useContentInlineAssistant.test.ts`
- `apps/studio/src/pages/content/ContentPage.test.ts`
