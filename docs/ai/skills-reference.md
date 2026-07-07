# AI 技能和文档参考

## 默认参考链

处理 Story Studio 任务时，先读：

1. `AGENTS.md`
2. `docs/architecture.md`
3. 相关 `docs/features/*.md`
4. 相关 `docs/specs/*.md`
5. 相关 `docs/plans/YYYY-MM/*.md`
6. `docs/ai/verification.md`

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

## 何时使用计划和 Spec

- 用户明确要“计划”或“先不改代码”时，只产出计划或 Spec，不实现。
- 用户确认执行后，按 Spec/Plan 范围实现。
- 用户要求“根据某会话在当前项目实现”时，先读取会话内容，只迁移与当前项目结构匹配的要求。
- 新建 Spec 时优先复制 `docs/specs/_template.md`。
- 选择验证命令时参考 `docs/ai/verification.md`。

## 收尾要求

- 代码变更后同步检查 feature doc、Spec、Plan、ADR 是否需要更新。
- docs-only 变更不跑业务 build/test，除非文档生成或链接检查依赖项目脚本。
- 最终回复要说明验证结果，以及哪些检查因 docs-only 范围没有执行。
