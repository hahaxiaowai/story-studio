# 章节细纲与 AI 整章生成规格

## 背景

正文模块已经支持章节正文、关联情节点和 AI 动作。当前 AI 能基于章节正文和关联情节点续写、润色或检查一致性，但缺少章节级细纲，导致 AI 生成整章时只能依赖较粗的大纲情节点，章节内部场景、段落推进和人物行动不够明确。

## 目标

- 为每个章节保存一份细纲。
- 在正文页提供章节细纲编辑区。
- 新增 AI 动作“按细纲生成整章”。
- 生成整章时 prompt 必须包含章节细纲、关联情节点和当前正文。
- 保留现有助手草稿回填流程，不自动覆盖正文。

## 非目标

- 不新增全局细纲模块。
- 不自动从大纲情节点生成细纲。
- 不直接调用模型或自动写入正文。
- 不改变现有“续写 / 润色 / 检查一致性”的语义。

## 用户流程

1. 用户进入正文模块并选择章节。
2. 用户在章节信息下方编辑当前章节细纲。
3. 用户点击“按细纲生成整章”。
4. 应用把包含作品、章节、细纲、关联情节点和当前正文的 prompt 放入助手输入框。
5. 用户在助手页发送请求，得到回复后仍通过现有回填面板选择追加或替换正文。

## 数据模型

在 `WorkspaceContentEntry` 上新增：

```ts
fineOutline: string
```

新建章节默认 `fineOutline: ''`。旧数据迁移时补齐空字符串，并保留已有非空细纲。

## UI 结构

- 正文页当前章节表单中新增“细纲”模块。
- 使用多行文本框编辑细纲。
- AI 动作区新增“按细纲生成整章”按钮。
- 当前章节细纲为空时，生成整章按钮禁用，并显示细纲为空提示。

## 技术方案

- `packages/types` 更新章节类型和 schema 版本。
- `content.ts` 支持创建、更新和测试 `fineOutline`。
- `document.ts` schema 升级到 `13`，迁移旧内容条目时归一化 `fineOutline`。
- `contentAssistant.ts` 新增 `draft-full-chapter` 动作，并在 prompt 中格式化细纲。
- `ContentPage.vue` 增加细纲编辑区和生成整章按钮。
- `useLocale.ts` 补充中英文文案。

## 验收标准

- [x] 新建章节带空细纲字段。
- [x] 旧文档迁移后内容条目有 `fineOutline`。
- [x] 细纲编辑后随章节保存。
- [x] 细纲为空时“按细纲生成整章”禁用。
- [x] 细纲非空时点击按钮跳转助手，并生成包含细纲的 prompt。
- [x] 有关联情节点时 prompt 同时包含关联情节点。
- [x] 有当前正文时 prompt 明确正文仅作风格和连续性参考。

## 验证命令

- `pnpm --filter @story-studio/studio test src/modules/content/content.test.ts`
- `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`
- `pnpm --filter @story-studio/studio test src/modules/storage/document.test.ts`
- `pnpm --filter @story-studio/studio test src/pages/content/ContentPage.test.ts`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`

## 验证结果

- 2026-06-28: 目标测试、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` 均通过。
