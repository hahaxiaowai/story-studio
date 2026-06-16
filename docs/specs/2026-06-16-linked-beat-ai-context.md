# 关联情节点 AI 上下文

## 背景

正文工作台已经支持章节与大纲情节点建立一对一关联，也支持把当前章节发送给助手做续写、润色和一致性检查。但当前 AI prompt 只包含作品、章节和正文，无法利用已关联的情节点信息。

## 目标

- 当章节关联了情节点时，正文工作台发送给助手的 prompt 包含该情节点的标题、时间、摘要、事件和人物变化。
- 当章节正文为空且选择“续写”时，prompt 仍使用同一个入口，但要求助手基于情节点生成章节初稿。
- 未关联情节点时保持当前 prompt 行为，不引入空白或误导性上下文。

## 非目标

- 不直接调用模型生成正文。
- 不新增草稿预览、自动写入正文或版本对比。
- 不调整助手提供商、风格模板和运行器。

## 用户流程

1. 用户在正文工作台选择一个章节。
2. 用户把章节关联到大纲情节点。
3. 用户点击“续写”“润色”或“一致性检查”。
4. 应用跳转到助手页，并把包含章节正文与情节点上下文的 prompt 放入聊天输入。

## 数据模型

不新增持久化字段。复用 `WorkspaceContentEntry.outlineBeatId` 和当前 workspace 的 `TimelineBeat` 数据。

## UI 结构

正文工作台现有 AI 动作区保持不变。prompt 构造时使用当前选中章节的 `outlineBeatId` 查找情节点，不新增额外按钮或面板。

## 技术方案

- 扩展 `buildContentAssistantPrompt` 的输入，允许传入可选 `linkedBeat`。
- 根据 action 生成目标与要求：
  - `continue` + 空正文 + 有关联情节点时，目标为基于情节点生成章节初稿。
  - 其他 action 继续使用原目标，但附加情节点上下文。
- 在 `ContentWorkspace.vue` 调用 prompt 构造函数时传入 `selectedLinkedBeat`。

## 验收标准

- 已关联情节点时，发送给助手的 prompt 包含“关联情节点”段落。
- 情节点事件和人物变化会以可读列表进入 prompt。
- 未关联情节点时，prompt 不出现“关联情节点”段落。
- 正文为空且执行续写时，prompt 明确说明生成章节初稿。

## 验证命令

- `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
