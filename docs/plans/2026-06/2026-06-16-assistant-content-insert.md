# 助手输出回填正文实施计划

## 步骤

- [x] 新增 `assistantContentDraft.test.ts`，覆盖助手回复排队、消费、清空。
- [x] 扩展 `contentAssistant.test.ts`，覆盖追加和替换正文草稿。
- [x] 实现 `assistantContentDraft.ts` 和正文合并 helper。
- [x] 更新 `AssistantChatPanel.vue`，完整助手消息显示“回填正文”。
- [x] 更新 `ContentWorkspace.vue`，显示待插入草稿并支持追加、替换、取消。
- [x] 补 locale 文案并运行验证。

## 影响文件

- `apps/studio/src/modules/assistant/assistantContentDraft.ts`
- `apps/studio/src/modules/assistant/assistantContentDraft.test.ts`
- `apps/studio/src/modules/assistant/AssistantChatPanel.vue`
- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/ContentWorkspace.vue`
- `apps/studio/src/composables/useLocale.ts`

## 验证方式

- 聚焦单测覆盖 handoff 和正文合并。
- typecheck 覆盖 Vue 组件接线。
- lint 保持导入顺序和模板约束。
