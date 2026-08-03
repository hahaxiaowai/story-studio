# AI 技能和文档参考

## 默认参考链

处理 Story Studio 任务时，先读：

1. `AGENTS.md`
2. `docs/ai/task-routing.md`
3. 存在主要任务时读取 `tasks/current.md`
4. 涉及模块边界时读取 `docs/architecture.md`
5. 涉及已有功能时读取相关 `docs/features/*.md`
6. 读取当前 Spec/Plan；跨会话时再读取 `tasks/handoff.md`
7. 按验证风险读取 `docs/ai/verification.md` 和 `docs/ai/test-map.md`

不要为了固定顺序加载与任务无关的全部架构、功能或历史计划。

## 常见任务入口

- 工作区、导航、侧边栏：`docs/features/workspaces.md`
- 持久化、迁移、schema：`docs/features/storage.md`
- 大纲、线路、时间轴：`docs/features/outline.md`
- 正文、章节、细纲：`docs/features/content.md`
- 角色、属性：`docs/features/entities.md`
- 世界设定、地图：`docs/features/world.md`
- 素材库：`docs/features/materials.md`
- AI 对话、模型设置、生成链路：`docs/features/assistant.md`
- 完整性检查：`docs/features/integrity.md`
- SDD 样例：`docs/ai/examples/data-integrity-check.md`

## 何时使用计划和 Spec

- 用户明确要“计划”或“先不改代码”时，只产出计划或 Spec，不实现。
- 用户确认执行后，按 Spec/Plan 范围连续实现、验证、评审和收口；范围或产品决策实质变化时再停下。
- 用户要求“根据某会话在当前项目实现”时，先读取会话内容，只迁移与当前项目结构匹配的要求。
- 新建 Spec 时优先复制 `docs/specs/_template.md`。
- 选择验证命令时参考 `docs/ai/verification.md`。
- 定位目标测试时参考 `docs/ai/test-map.md`。
- 执行完整 SDD 任务时参考 `docs/ai/sdd-checklist.md`。
- 新式 Plan 在 SHIP 前运行 `pnpm run sdd:check`。
- 外部通用 SDD 技能只能作为参考；Story Studio 以本仓库 `docs/specs/`、`docs/plans/YYYY-MM/` 和月度 `TODO.md` 体系为准。

## 收尾要求

- 代码变更后同步检查 feature doc、Spec、Plan、ADR 是否需要更新。
- docs-only 变更不跑业务 build/test，除非文档生成或链接检查依赖项目脚本。
- 最终回复要说明验证结果，以及哪些检查因 docs-only 范围没有执行。
