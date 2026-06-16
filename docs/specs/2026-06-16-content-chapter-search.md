# 正文章节搜索

## 背景

正文模块已经支持章节创建、编辑、删除和上下移动。随着章节数量增加，左侧章节列表只按顺序展示，用户需要滚动查找某一章或某段正文，定位效率会下降。

## 目标

- 在正文工作台左侧章节列表增加轻量关键词搜索。
- 搜索范围覆盖卷名、章节名和正文内容。
- 搜索大小写不敏感，并忽略关键词首尾空白。
- 搜索结果仍保持章节 `order` 排序。
- 搜索只影响当前工作区的列表展示，不改变 `StudioDataDocument`。

## 非目标

- 不实现高亮、分词、模糊匹配或正则搜索。
- 不实现跨工作区搜索、全文索引或远程搜索。
- 不改变章节创建、排序、AI 动作和助手回填逻辑。

## 用户流程

1. 用户进入“正文”模块。
2. 用户在左侧章节列表上方输入关键词。
3. 系统按卷名、章节名和正文内容过滤章节。
4. 用户点击搜索结果后，右侧编辑区展示对应章节。
5. 清空搜索后恢复完整章节列表。

## 数据模型

不新增数据结构。搜索使用现有 `WorkspaceContentEntry` 字段：

- `volume`
- `chapter`
- `body`
- `order`

## UI 结构

- `apps/studio/src/modules/content/ContentWorkspace.vue`
  - 左侧章节列表顶部增加搜索输入框。
  - 输入框绑定 `useContent().searchQuery`。
  - 无搜索结果时复用空状态区域，但文案提示“没有匹配章节”。

## 技术方案

- 在 `apps/studio/src/modules/content/content.ts` 新增 `getFilteredContentEntries(entries, query)` 纯函数。
- 在 `apps/studio/src/modules/content/useContent.ts` 增加页面局部 `searchQuery`，`entries` 返回当前工作区过滤后的章节列表。
- 在 `ContentWorkspace.vue` 接入搜索输入和无结果文案。
- 在 `useLocale.ts` 增加中英文搜索文案。

## 验收标准

- [x] 可以按卷名搜索章节。
- [x] 可以按章节名搜索章节。
- [x] 可以按正文内容搜索章节。
- [x] 搜索大小写不敏感，空搜索保持原列表。
- [x] 搜索结果仍按 `order` 排序。
- [x] 搜索不会修改文档中的 `contents`。
- [x] 正文页显示章节搜索输入框。

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
