# 正文章节上下移动

## 背景

正文模块已经支持章节创建、编辑、删除和按 `order` 排序展示，但用户无法在界面中调整章节顺序。写作过程中章节顺序常会变化，如果只能删除重建，会破坏正文、关联情节点和更新时间记录。

## 目标

- 用户可以在正文工作台中把当前章节上移或下移。
- 调整顺序后章节列表立即按新顺序展示。
- 被移动章节保持选中，不丢失正文和关联情节点。
- 排序仅影响当前工作区的正文条目，不影响其他工作区。
- 使用现有 `WorkspaceContentEntry.order` 字段，不升级存储 schema。

## 非目标

- 不实现拖拽排序。
- 不实现跨卷自动分组、章节编号自动改名或批量重排。
- 不改正文编辑器、AI 动作和助手回填行为。

## 用户流程

1. 用户进入“正文”模块。
2. 用户选中一个章节。
3. 用户点击上移或下移按钮。
4. 系统交换该章节与相邻章节的位置，并重新规范化当前工作区章节 `order`。
5. 当前章节仍保持选中，左侧章节列表按新顺序展示。
6. 第一章的上移按钮禁用，最后一章的下移按钮禁用。

## 数据模型

复用现有 `WorkspaceContentEntry.order`：

- 当前工作区内章节排序后统一规范化为 `0...n-1`。
- 章节的 `id`、`volume`、`chapter`、`body`、`outlineBeatId` 保持不变。
- 参与交换的章节更新 `updatedAt`，便于用户知道最近调整过章节结构。

## UI 结构

- `apps/studio/src/modules/content/ContentWorkspace.vue`
  - 当前章节标题右侧增加上移、下移和删除三个图标按钮。
  - 上移/下移按钮使用现有 `Button` icon 尺寸和 lucide 箭头图标。
  - 按钮 aria-label 使用 locale 文案。

## 技术方案

- 在 `apps/studio/src/modules/content/content.ts` 新增 `moveContentEntry(entries, entryId, direction, now)` 纯函数。
- 在 `apps/studio/src/modules/content/useContent.ts` 暴露 `moveEntry(entryId, direction)`。
- 在 `ContentWorkspace.vue` 增加当前章节位置、是否可上移/下移的 computed，并调用 `moveEntry`。
- 在 `useLocale.ts` 增加中英文 `content.moveUp`、`content.moveDown`。

## 验收标准

- [x] 纯函数可以把中间章节上移并规范化顺序。
- [x] 纯函数可以把中间章节下移并规范化顺序。
- [x] 第一章上移、最后一章下移时不改变列表。
- [x] `useContent().moveEntry()` 只调整当前工作区正文顺序。
- [x] 正文页显示上移和下移按钮。
- [x] 边界章节对应按钮禁用。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/content/content.test.ts
pnpm --filter @story-studio/studio test src/modules/content/useContent.test.ts
pnpm --filter @story-studio/studio test src/modules/content/ContentWorkspace.test.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
