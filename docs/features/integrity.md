# 数据完整性检查

## 功能目的

数据完整性检查用于只读扫描当前 `StudioDataDocument` 中的断链、孤儿数据和计数漂移，帮助发现迁移或编辑流程留下的数据问题。

## 用户入口

- 导航 hash：`#integrity`
- 页面：`apps/studio/src/pages/integrity/IntegrityPage.vue`

## 主流程

1. 页面读取当前统一文档。
2. `buildWorkspaceIntegrityReport()` 生成工作区级和全局问题报告。
3. 页面按严重程度和所属区域展示问题。
4. 当前功能只报告问题，不直接修改数据。

## 关键文件

- `apps/studio/src/modules/integrity/integrity.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.ts`
- `apps/studio/src/pages/integrity/IntegrityPage.vue`
- `apps/studio/src/pages/project/index.vue`
- `apps/studio/src/components/AppSidebar.vue`

## 数据结构

- `WorkspaceIntegrityReport`
- `WorkspaceIntegrityIssue`
- `WorkspaceIntegrityIssueSeverity`
- `StudioDataDocument`

## 边界情况

- 该功能应保持 schema-preserving，不在扫描过程中写入文档。
- 测试数据要避免被 `resolveStudioDataDocument()` 自动规范化后丢失问题状态。
- 新增持久化关系后，应同步扩展完整性检查规则。

## 验证入口

- `apps/studio/src/modules/integrity/integrity.test.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.test.ts`
- `apps/studio/src/pages/integrity/IntegrityPage.test.ts`
