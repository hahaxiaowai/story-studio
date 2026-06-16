# 助手输出回填正文

## 背景

正文工作台可以把章节和情节点上下文发送到助手，助手页可以生成回复。但当前回复只能复制，不能回到正文工作台形成写作闭环。

## 目标

- 用户可以从一条已完成的助手回复发起“回填正文”。
- 应用跳转到正文工作台，并显示待插入的 AI 草稿。
- 用户必须手动选择追加或替换，不自动覆盖正文。
- 插入后清空待插入草稿，避免重复写入。

## 非目标

- 不自动识别章节。
- 不做差异对比、版本历史或撤销栈。
- 不解析模型输出中的标题、章节元数据。

## 用户流程

1. 用户在助手页获得一条完整回复。
2. 用户点击该回复的“回填正文”。
3. 应用跳转到正文工作台。
4. 正文工作台显示 AI 草稿预览和操作按钮。
5. 用户选择“追加到正文”或“替换正文”。
6. 当前选中章节正文被更新，待插入草稿清空。

## 数据模型

不新增持久化字段。使用内存队列暂存助手输出，和现有 `useContent().updateEntry` 更新当前章节。

## UI 结构

- 助手消息操作区：在已完成且有内容的 assistant 消息上显示“回填正文”按钮。
- 正文工作台：在 AI 动作区上方显示待插入草稿面板，包含预览、追加、替换和取消。

## 技术方案

- 新增 `assistantContentDraft.ts`，提供 queue / consume / clear 的内存 handoff。
- 新增纯函数处理正文合并，覆盖两种模式：
  - `append`：正文为空时直接写入；非空时用空行分隔追加。
  - `replace`：直接替换为草稿。
- `AssistantChatPanel.vue` 负责把助手消息内容放入 handoff 并跳转 `#content`。
- `ContentWorkspace.vue` 在挂载时消费 handoff，并由用户确认写入当前章节。

## 验收标准

- streaming 或 error 消息不会显示回填入口。
- 已完成助手消息可以排队到正文工作台。
- 追加正文时保留原正文并使用空行分隔。
- 替换正文时只写入草稿内容。
- 插入或取消后不会重复回填。

## 验证命令

- `pnpm --filter @story-studio/studio test src/modules/assistant/assistantContentDraft.test.ts`
- `pnpm --filter @story-studio/studio test src/modules/content/contentAssistant.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
