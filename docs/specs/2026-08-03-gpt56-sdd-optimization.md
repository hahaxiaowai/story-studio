# GPT-5.6 自适应 SDD 流程优化

## 状态

- 当前状态：已确认
- 日期：2026-08-03

## 背景

Story Studio 已具备 `DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP` 的文档骨架，但实际自动备份任务表明：代码可以进入主分支，Spec、Plan、月度 TODO、Feature Doc、Test Map 和活动任务仍可停留在未收口状态。当前 Plan 还包含大量可由 GPT-5.6 从源码实时推导的函数级步骤，增加了维护成本。

## 已确认事实

- Plan、月度 TODO 和 `tasks/current.md` 都保存状态，但尚无自动一致性检查。
- 根 `package.json` 尚无 SDD 验证命令。
- 自动备份实现已在 `main` 和 `origin/main`，但 Task 5 的完整真实桌面验收未全部执行。
- 用户已确认执行本轮 SDD 优化。

## 目标

- 按 XS / S / M / L 风险等级选择 SDD 重量。
- Plan 保留结果契约、验收、风险和证据，不默认编写函数级执行脚本。
- Plan 的机器可读元数据作为状态权威，TODO 和 current 是可校验投影。
- 新增 `pnpm run sdd:check`，阻止状态漂移、断链和未完整 SHIP。
- 一次确认后允许连续执行，只在产品决策、范围变更或外部副作用前再次停下。

## 范围

- 新增无第三方依赖的 SDD 检查脚本和 Node 单元测试。
- 更新根脚本、SDD 路由、工作流、检查单、验证文档和 Spec/Plan 模板。
- 为新 Plan 引入最小 frontmatter，旧 Plan 按需渐进迁移。
- 记录自动备份当前验证证据，把剩余真实桌面验收明确为暂缓项。

## 非目标

- 不批量重写历史 Spec/Plan。
- 不修改 Story Studio 业务功能。
- 不用静态或自动化测试冒充未执行的真实桌面交互。
- 不引入 YAML 解析库、数据库或第二套任务系统。

## 验收标准

- [x] `pnpm run sdd:test` 覆盖元数据解析、状态漂移和活动指针冲突。
- [x] `pnpm run sdd:check` 能校验机器可读 Plan、TODO、current、Spec 和相对链接。
- [x] 已完成 Plan 必须记录 Feature、Architecture、Test Map、ADR 同步决策和验证证据。
- [x] 任务分流明确 XS / S / M / L，并保留 schema、Tauri/Web、AI transport、安全和不可逆数据门禁。
- [x] Plan 模板以结果契约为主，不强制外部不可用技能。
- [x] 自动备份未覆盖的真实桌面验收被明确保留，不被标记为全部完成。

## 验证命令

```bash
pnpm run sdd:test
pnpm run sdd:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

## 文档同步

- [x] 更新 `AGENTS.md` 和 `docs/ai/*.md`。
- [x] 更新 Spec/Plan 模板。
- [x] 更新 2026-07 自动备份状态与证据。
- [x] 新增 2026-08 月度索引。
- [x] 不需要 Feature Doc 或 ADR：本次只改变开发流程。

## 完成记录

- 完成时间：2026-08-03。
- 实际完成内容：新增无依赖 SDD 检查器及 Vitest，接入根脚本；建立 Plan frontmatter 权威状态、TODO/current 投影校验、完成证据和链接门禁；按 XS/S/M/L 分级流程并精简 Plan 模板；同步自动备份当前证据和暂缓边界。
- 验证结果：`pnpm run sdd:test` 1 文件、5 项通过；目标 ESLint、`pnpm run sdd:check`、仓库 lint/typecheck/test/build 和 `git diff --check` 通过。
- 评审结果：未新增依赖或产品行为；历史 Plan 渐进迁移；自动备份未完成的真实桌面验收没有被冒充为已通过。
- commit：未提交。
- 未覆盖风险：检查器目前只校验带 `sdd: true` 的 Plan；TODO/current 尚未自动生成，只能检测不一致。
