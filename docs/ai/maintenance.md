# AI 文档维护规则

## 文档分层

- `AGENTS.md`：仓库级规则和协作约束。
- `docs/architecture.md`：系统总览和模块边界。
- `docs/features/*.md`：当前功能事实。
- `docs/specs/*.md`：单次变更规格和完成记录。
- `docs/plans/YYYY-MM/*.md`：计划拆解和历史状态。
- `docs/adr/*.md`：长期架构决策。
- `tasks/current.md`：当前主要任务指针，不保存完整计划状态。
- `tasks/handoff.md`：跨会话临时交接，完成后清空。

## 功能变更后的检查

如果改动触及以下任一内容，需要检查并更新对应 feature doc：

- 用户入口或导航 hash。
- 主流程。
- 持久化字段或共享类型。
- 状态流、副作用或保存时机。
- Tauri/Web 边界。
- AI provider、prompt、transport 或生成结果写入方式。
- 重要边界情况。
- 验证入口。

## Spec 回填

完成 SDD 变更后，在对应 Spec 中补充：

- 完成内容。
- 实际验证命令和结果。
- 未覆盖风险。
- 完成时间和 commit 信息；如果未提交，说明本地变更范围。
- REVIEW 结论，以及安全、性能、复杂度或异常路径中的未覆盖项。

## ADR 维护

只在长期架构决策变化时写 ADR。不要把普通任务步骤、临时排查记录或代码 diff 摘要写成 ADR。

## docs-only 验证

docs-only 改动至少检查：

- 新增文件结构是否符合预期。
- 文档中引用的关键代码路径是否存在。
- `git diff --check` 是否通过。
- 是否残留 `TBD`、`TODO`、`fill in details` 等占位词。
- 流程文档变更是否通过任务分流、状态职责、Handoff 和 SHIP 复位场景演练。

更多分类验证规则见 `docs/ai/verification.md`。
