# 关联情节点 AI 上下文实施计划

## 步骤

- [x] 扩展 `apps/studio/src/modules/content/contentAssistant.test.ts`，先覆盖关联情节点、无关联情节点和空正文续写场景。
- [x] 扩展 `apps/studio/src/modules/content/contentAssistant.ts`，格式化情节点上下文并调整续写目标。
- [x] 更新 `apps/studio/src/modules/content/ContentWorkspace.vue`，向 prompt 构造函数传入当前选中关联情节点。
- [x] 运行聚焦测试、类型检查、lint 和全量测试。

## 影响文件

- `apps/studio/src/modules/content/contentAssistant.ts`
- `apps/studio/src/modules/content/contentAssistant.test.ts`
- `apps/studio/src/modules/content/ContentWorkspace.vue`

## 验证方式

- 单元测试覆盖 prompt 文本。
- 类型检查确认 `TimelineBeat` 输入类型与 Vue 调用一致。
- lint 保持 Antfu 风格。
