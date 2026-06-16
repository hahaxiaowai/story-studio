# 素材关键词搜索

## 背景

素材库已经支持素材 CRUD、标签管理和标签筛选，但随着素材增多，只靠标签无法快速定位一条参考资料。早期素材规格把全文搜索和高级筛选列为后续能力，本次先补一个轻量关键词搜索。

## 目标

- 用户可以在素材列表上方输入关键词。
- 关键词会匹配素材标题、正文、链接和图片地址。
- 关键词搜索与现有标签筛选组合生效。
- 搜索为空时保持现有排序和标签筛选行为。

## 非目标

- 本次不实现高亮、分词、模糊拼写、正则或高级筛选面板。
- 本次不搜索标签名称以外的派生展示文本。
- 本次不引入搜索索引、后端服务或新依赖。

## 用户流程

1. 用户打开素材库。
2. 用户在素材列表上方输入关键词。
3. 系统实时收窄素材列表。
4. 用户选择某个标签后，列表只显示同时匹配标签和关键词的素材。
5. 用户清空关键词后，列表恢复为当前标签下的全部素材。

## 数据模型

不新增 `packages/types` 字段。搜索只使用现有 `MaterialAsset` 字段：

- `title`
- `text`
- `url`
- `imageUrl`

## UI 结构

- `apps/studio/src/modules/materials/MaterialWorkspace.vue`
  - 素材列表标题下方新增搜索输入框。
  - 搜索输入绑定 `useMaterials().searchQuery`。

## 技术方案

- `apps/studio/src/modules/materials/materials.ts`
  - 新增素材筛选函数，组合标签和关键词过滤，并沿用现有排序。
- `apps/studio/src/modules/materials/useMaterials.ts`
  - 新增 `searchQuery` ref。
  - `filteredMaterials` 使用标签和关键词共同过滤。
- `apps/studio/src/composables/useLocale.ts`
  - 补充搜索输入文案。

## 验收标准

- [x] 可以按标题、正文、链接和图片地址匹配素材。
- [x] 搜索大小写不敏感，并会修剪输入首尾空白。
- [x] 搜索结果保持最新更新优先排序。
- [x] 搜索和标签筛选可以组合生效。
- [x] 搜索为空时保持原有标签筛选行为。
- [x] 类型检查通过。
- [x] 必要测试通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/materials/materials.test.ts
pnpm --filter @story-studio/studio test src/modules/materials/useMaterials.test.ts
pnpm --filter @story-studio/studio test src/modules/materials/MaterialWorkspace.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
```
