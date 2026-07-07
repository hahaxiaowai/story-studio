# SDD 样例：数据完整性检查

## 样例目的

本样例说明一次 Story Studio 功能如何从 Spec 进入 Plan，再完成实现、验证和功能文档回填。后续新增中等功能或高影响功能时，可按这个链路检查是否闭环。

## 任务类型判断

- 变更类型：中等功能。
- 用户可见入口：新增 `#integrity` 数据检查页面和侧边栏入口。
- 数据模型：不修改 `StudioDataDocument` schema，只新增运行时报告类型。
- Tauri/Web 边界：不涉及。
- AI transport：不涉及。
- ADR：不需要。该功能复用既有单文档存储、hash 工作台和页面/module 分层，没有改变长期架构决策。

## 文档链路

- Spec：`docs/specs/2026-07-04-data-integrity-check.md`
- Plan：`docs/plans/2026-07/2026-07-04-data-integrity-check.md`
- 月度索引：`docs/plans/2026-07/TODO.md`
- Feature Doc：`docs/features/integrity.md`
- 测试锚点：`docs/ai/test-map.md` 的“完整性检查”小节。

## Spec 如何定义范围

Spec 明确了目标和非目标：

- 做当前工作区的数据完整性检查入口。
- 覆盖正文关联情节点缺失、素材引用缺失、章节排序重复三类检查。
- 展示问题数量、严重级别和“前往处理”跳转。
- 不自动修复数据。
- 不修改 `StudioDataDocument` schema。
- 不引入后台任务、导出报告或远程同步。

这个范围避免了“检查问题”扩大成“自动修复系统”或“全局数据审计系统”。

## Plan 如何拆执行步骤

Plan 将 Spec 拆成可验证步骤：

1. 新增 `apps/studio/src/modules/integrity/integrity.ts` 和测试，提供纯函数报告。
2. 新增 `useWorkspaceIntegrity()`，从当前文档和当前工作区生成 computed report。
3. 新增 `IntegrityPage.vue` 展示汇总和问题列表。
4. 接入 `#integrity` 页面分发、侧边栏入口、面包屑文案。
5. 运行目标测试、类型检查、lint 和 build。
6. 回填计划和月度 `TODO.md`。
7. 后续增强中补充 `targetHash` 和“前往处理”跳转。

拆分原则是先纯逻辑、再组合式状态、再页面展示、最后导航接线和文档回填。

## TDD 锚点

该功能的优先测试入口：

- `apps/studio/src/modules/integrity/integrity.test.ts`
- `apps/studio/src/modules/integrity/useWorkspaceIntegrity.test.ts`
- `apps/studio/src/pages/integrity/IntegrityPage.test.ts`

导航和工作台接线还需要覆盖：

- `apps/studio/src/pages/project/index.test.ts`
- `apps/studio/src/components/AppSidebar.test.ts`
- `apps/studio/src/modules/workspaces/workspaces.test.ts`

测试策略：

- 纯函数先覆盖缺失情节点、缺失素材、重复章节排序和无问题通过状态。
- 组合式函数覆盖从当前文档和当前工作区派生 report。
- 页面测试覆盖通过态、问题数量、严重级别和跳转链接。
- 导航测试覆盖 `#integrity` 分发和侧边栏入口。

## 验证命令

本功能对应 `docs/ai/verification.md` 中的“页面或交互改动”和“纯逻辑改动”。实际计划记录的验证命令是：

```bash
pnpm --filter @story-studio/studio test src/modules/integrity/integrity.test.ts src/modules/integrity/useWorkspaceIntegrity.test.ts src/pages/integrity/IntegrityPage.test.ts src/pages/project/index.test.ts src/components/AppSidebar.test.ts src/modules/workspaces/workspaces.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
```

执行记录中保留了目标测试通过数量，以及 `typecheck`、`lint`、`build` 的结果。构建中的既有 warning 记录在 Plan 的验证记录中，不视为本功能失败。

## Feature Doc 如何回填

实现完成后，`docs/features/integrity.md` 记录当前功能事实：

- 功能目的：只读扫描 `StudioDataDocument` 的断链、孤儿数据和计数漂移。
- 用户入口：`#integrity` 和 `IntegrityPage.vue`。
- 主流程：读取文档、生成报告、展示问题、保持只读。
- 关键文件：integrity module、composable、page、project shell 和 sidebar。
- 边界情况：schema-preserving、测试数据避免被迁移规范化擦除、新关系需要扩展检查规则。
- 验证入口：三个核心测试文件。

Feature Doc 记录的是“当前是什么”，不是“当时怎么做”。历史实现细节保留在 Spec 和 Plan。

## 月度 TODO 如何收口

`docs/plans/2026-07/TODO.md` 将任务移入已完成记录，并保留：

- 任务名。
- 状态。
- 优先级。
- 计划文件链接。
- 最后更新时间。
- 后续事项。

这样月度索引只承担状态板职责，详细执行记录仍保留在独立 Plan 文件中。

## 为什么不需要 ADR

该功能没有改变以下长期决策：

- 单一 `StudioDataDocument` 存储模式。
- Web IndexedDB / Tauri 本地文件边界。
- hash 工作台导航模式。
- `pages` + `modules` 的目录边界。
- AI provider 或 transport。

它只是按既有架构新增一个只读页面和纯逻辑模块，因此不需要 ADR。

## 可复用检查清单

后续类似功能可以照此检查：

- [ ] Spec 写清目标、范围、非目标和验证命令。
- [ ] Plan 从纯逻辑、状态接线、页面展示、导航接线、文档回填拆步骤。
- [ ] TDD 先覆盖纯函数或最小业务规则。
- [ ] 页面和导航接线有测试。
- [ ] `docs/ai/test-map.md` 有对应测试锚点。
- [ ] `docs/features/*.md` 回填当前功能事实。
- [ ] `docs/plans/YYYY-MM/TODO.md` 更新状态。
- [ ] 判断是否需要 ADR，并写明原因。
