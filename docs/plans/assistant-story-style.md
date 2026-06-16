# AI 助手故事风格约束实施计划

## 来源规格

- `docs/specs/assistant-story-style.md`

## 实施步骤

1. 更新共享类型，新增 `AssistantStoryStyle`、`AssistantSettings.storyStyles`、`Workspace.storyStyleId`，并把 schema 升到 v9。
2. 在助手设置模型中增加内置风格、风格归一化、创建、更新、删除和解析函数。
3. 在存储迁移中补齐 `storyStyles`，清理无效作品风格引用。
4. 在工作区模型中增加更新作品风格的纯函数，并通过 `useWorkspaces` 暴露给 UI。
5. 在助手页增加故事风格设置区，支持选择当前作品风格和管理自定义风格。
6. 在聊天发送链路中解析当前作品风格，并分别注入 API system message 和本地 Terminal prompt。
7. 补充单元测试并运行 lint、typecheck、test、build。

## 影响文件

- `packages/types/src/types/story.ts`
- `packages/types/src/index.ts`
- `apps/studio/src/modules/assistant/assistant.ts`
- `apps/studio/src/modules/assistant/assistantChat.ts`
- `apps/studio/src/modules/assistant/useAssistant.ts`
- `apps/studio/src/modules/assistant/useAssistantChat.ts`
- `apps/studio/src/modules/assistant/AssistantWorkspace.vue`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/workspaces/workspaces.ts`
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
- `apps/studio/src/composables/useLocale.ts`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 风险与回滚

- 风险：API 对话历史已有 system message 时会多一条当前上下文 system message；实现时固定把当前风格上下文放在最前，历史过滤逻辑不变。
- 风险：老文档中可能存在无效 `storyStyleId`；迁移时只保留能解析到现有风格的 id。
- 回滚：如需回滚，移除新增 SDD 文档、类型字段、v9 迁移、助手页风格 UI 和 prompt 注入逻辑，并把 schema 恢复到 v8。
