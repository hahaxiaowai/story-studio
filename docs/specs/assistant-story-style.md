# AI 助手故事风格约束

## 背景

AI 助手已经支持多轮对话、API 模型和本地 Terminal 模型，但发送给模型的上下文只包含当前作品、模块、Provider 和用户输入，无法针对不同故事类型稳定约束输出风格。用户在多个作品间切换时，需要让 AI 自动理解当前作品的叙事风格，而不是每次手动重复提示。

## 目标

- 用户可以为每个作品选择一个故事风格。
- 用户可以使用内置故事风格，也可以新增、编辑、删除自定义风格。
- 系统可以在 API 模型和本地 Terminal 模型请求中注入当前作品的故事风格约束。
- 老文档迁移后自动拥有内置故事风格，已有作品在未选择风格时回落到默认风格。

## 非目标

- 本次不做每条消息临时切换风格。
- 本次不做按大纲、人物、世界、内容等功能模块分别配置风格。
- 本次不改 Tauri 后端命令协议。
- 本次不把故事风格选择放进新建作品弹窗。

## 用户流程

1. 用户打开 AI 助手页。
2. 用户在故事风格设置区查看当前作品和当前风格。
3. 用户选择内置风格，或新增自定义风格并填写名称、简介和约束。
4. 用户发送 AI 对话。
5. 系统把当前作品的风格约束注入模型上下文，模型按该风格生成回复。

## 数据模型

- `AssistantStoryStyle` 表示故事风格，包含 `id`、`name`、`description`、`constraints`、`system`、`createdAt`、`updatedAt`。
- `AssistantSettings.storyStyles` 保存内置风格和自定义风格。
- `Workspace.storyStyleId` 保存每个作品选择的风格；为空或无效时使用默认风格。
- `StudioDataSchemaVersion` 从 8 升到 9。

## UI 结构

- 在 `apps/studio/src/modules/assistant/AssistantWorkspace.vue` 的设置区域增加故事风格面板。
- 面板包含当前作品风格选择、当前风格约束预览、自定义风格表单和自定义风格列表。
- 不新增全局共享 UI 组件；复用现有 `Button`、`Input`、`Textarea`。

## 技术方案

- `packages/types/src/types/story.ts` 增加故事风格类型和字段。
- `apps/studio/src/modules/assistant/assistant.ts` 负责内置风格、风格归一化、创建、更新、删除和解析。
- `apps/studio/src/modules/storage/document.ts` 负责 v9 迁移和无效 `storyStyleId` 清理。
- `apps/studio/src/modules/workspaces/workspaces.ts` 增加更新作品风格的纯函数。
- `apps/studio/src/modules/assistant/assistantChat.ts` 负责构造统一风格上下文，并分别接入本地 Terminal prompt 和 API request messages。

## 验收标准

- [x] 新文档默认包含内置故事风格。
- [x] 每个作品可以独立选择故事风格。
- [x] 用户可以新增、编辑、删除自定义风格。
- [x] 内置风格不可删除。
- [x] API 模型请求会前置故事风格 system message。
- [x] 本地 Terminal prompt 会包含故事风格约束。
- [x] v8 文档迁移后升级到当前 schema，并补齐风格数据。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```
