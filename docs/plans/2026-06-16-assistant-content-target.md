# 助手草稿回填目标章节实施计划

## 步骤

- [x] 扩展 `contentAssistant.test.ts`，覆盖只更新目标章节和目标缺失不变。
- [x] 扩展 `contentAssistant.ts`，提供目标 entry 更新 helper。
- [x] 更新 `ContentWorkspace.vue`，给待插入面板加入目标章节选择器。
- [x] 补充中英文 locale 文案。
- [x] 运行聚焦测试、typecheck、lint、全量测试和构建。
- [x] 扩展助手 prompt / content draft handoff，携带来源章节和建议目标章节。
- [x] 更新助手页和正文页接线，默认选回来源章节。
- [x] 追加 handoff 单元测试并重新验证。
- [x] 将助手回复来源从面板级状态收敛为消息级映射。
- [x] 更新回填按钮读取当前消息的来源章节。
- [x] 重新运行验证。
- [x] 将来源章节持久化到 `AssistantChatMessage.sourceContentEntryId`。
- [x] 升级存储 schema 到 v11，并补 v10 迁移测试。

## 影响文件

- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/ContentWorkspace.vue`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/modules/assistant/assistantDraft.ts`
- `apps/studio/src/modules/assistant/assistantDraft.test.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.test.ts`
- `apps/studio/src/modules/assistant/AssistantChatPanel.vue`

## 验证方式

- 单元测试验证目标章节更新规则。
- typecheck 验证 Vue 接线。
- lint 和全量测试确认项目约束未破坏。
