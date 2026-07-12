# 正文创作

## 功能目的

正文模块按卷、章管理实际稿件内容，并可与大纲情节点绑定。`fineOutline` 字段用于保存章节级细纲，让正文写作可以承接更细粒度的规划；`aiRevisionHistory` 保存章节内最近 20 条已应用 AI 改写，提供跨会话追溯和恢复。

## 用户入口

- 导航 hash：`#content` / `#manuscript`
- 页面：`apps/studio/src/pages/content/ContentPage.vue`

## 主流程

1. 按当前工作区读取 `WorkspaceContentEntry`。
2. 用户新增章节，默认生成卷名、章名和空正文。
3. 用户编辑卷、章、细纲、正文和大纲情节点绑定。
4. 章节可上移、下移或删除，排序后重新写入 `order`。
5. 搜索按卷名、章名和正文内容过滤。
6. 用户应用正文内联 AI 改写时，正文和修改历史在同一次文档更新中写入。
7. 用户可查看当前章节的 AI 修改历史、恢复某次修改前正文，或确认删除单条历史。

## 关键文件

- `apps/studio/src/modules/content/content.ts`
- `apps/studio/src/modules/content/useContent.ts`
- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/content/useContentInlineAssistant.ts`
- `apps/studio/src/pages/content/ContentPage.vue`
- `apps/studio/src/pages/content/ContentAiRevisionHistory.vue`
- `packages/types/src/types/story.ts`

## 数据结构

- `WorkspaceContentEntry`
- `WorkspaceContentEntry.outlineBeatId`
- `WorkspaceContentEntry.fineOutline`
- `WorkspaceContentEntry.aiRevisionHistory`
- `ContentAiRevision`
- `StudioDataDocument.contents`

## 状态流和副作用

- 每次编辑通过 `updateDocument()` 写回统一文档。
- `assignOutlineBeatToContentEntry()` 保证同一个情节点最多绑定一个正文条目。
- schema 迁移会为旧内容补齐 `fineOutline`。
- schema 迁移会为旧内容补齐并规范化 `aiRevisionHistory`。
- AI 改写历史按旧到新持久化，每章最多保留最后 20 条。
- 恢复历史会新增一条整章恢复记录，因此恢复前正文仍可找回。
- 页面内即时单次撤销继续服务刚完成的改写；持久历史服务跨章节切换和跨会话追溯。

## 边界情况

- 空 `outlineBeatId` 会规范化为 `undefined`。
- 删除章节后需要重排剩余章节顺序。
- 搜索当前不包含 `fineOutline`，只匹配卷、章和正文。
- 普通手动编辑、AI 整章草稿和助手回填不会写入 AI 修改历史。
- AI 改写或恢复没有改变正文时不新增历史。
- 删除历史记录不修改当前正文；删除章节时历史随章节一起删除。

## 验证入口

- `apps/studio/src/modules/content/content.test.ts`
- `apps/studio/src/modules/content/useContent.test.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/useContentInlineAssistant.test.ts`
- `apps/studio/src/pages/content/ContentPage.test.ts`
- `apps/studio/src/pages/content/ContentAiRevisionHistory.test.ts`
