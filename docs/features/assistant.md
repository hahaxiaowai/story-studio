# AI 助手

## 功能目的

AI 助手提供模型 provider 配置、功能模型绑定、故事风格约束、对话生成和正文内联辅助能力。它服务大纲、角色、世界、正文和素材等创作流程。

## 用户入口

- AI 对话 hash：`#assistant-chat`
- AI 设置 hash：`#assistant`
- 对话页面：`apps/studio/src/pages/assistant/AssistantChatPage.vue`
- 设置页面：`apps/studio/src/pages/assistant/AssistantSettingsPage.vue`

## 主流程

1. `assistantSettings` 保存 provider、默认模型、功能绑定和 story styles。
2. 对话页选择当前工作区和可用 provider，创建或追加 `AssistantChatThread`。
3. Web/OpenAI-compatible 或 Tauri/local-terminal transport 发送请求。
4. 流式结果更新消息状态、内容、错误和 usage/timing 信息。
5. 正文模块可把 AI 草稿写入目标章节或内联注解流程。

## 关键文件

- `apps/studio/src/modules/assistant/assistant.ts`
- `apps/studio/src/modules/assistant/assistantChat.ts`
- `apps/studio/src/modules/assistant/useAssistantChat.ts`
- `apps/studio/src/modules/assistant/assistantRunner.ts`
- `apps/studio/src/modules/assistant/useAssistantRunner.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.ts`
- `apps/studio/src/pages/assistant/*`
- `apps/studio/src-tauri/src/lib.rs`
- `packages/types/src/types/story.ts`

## 数据结构

- `AiProviderConfig`
- `AssistantSettings`
- `AssistantFeatureBinding`
- `AssistantStoryStyle`
- `AssistantChatThread`
- `AssistantChatMessage`

## 边界情况

- local-terminal 默认 provider 使用 `codex exec`，可通过 `STORY_STUDIO_MODEL` 覆盖模型。
- OpenAI-compatible provider 需要 base URL、API key 和 model。
- 旧 streaming 消息会在迁移中标记为 error，避免恢复后继续显示未完成状态。
- 页面应复用模块级 runner 和 chat 逻辑，不直接在组件中实现 transport。

## 验证入口

- `apps/studio/src/modules/assistant/assistant.test.ts`
- `apps/studio/src/modules/assistant/assistantChat.test.ts`
- `apps/studio/src/modules/assistant/useAssistantChat.test.ts`
- `apps/studio/src/modules/assistant/assistantRunner.test.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.test.ts`
- `apps/studio/src/pages/assistant/AssistantSettingsPage.test.ts`
