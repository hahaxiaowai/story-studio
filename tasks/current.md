# 当前主要任务

## 状态

- 当前状态：已确认
- 当前规格：[`docs/specs/2026-07-13-automatic-backup.md`](../docs/specs/2026-07-13-automatic-backup.md)
- 当前计划：[`docs/plans/2026-07/2026-07-13-automatic-backup.md`](../docs/plans/2026-07/2026-07-13-automatic-backup.md)
- 当前 Task：Task 1：桌面端可以安全创建、列出和读取受管备份
- 最后更新：2026-07-15

本文件只指向当前主要任务，不复制 Spec、Plan 或月度 `TODO.md` 的状态。候选任务和并行计划仍以 `docs/plans/YYYY-MM/TODO.md` 为索引，自动化仍从月度索引选择任务。

状态取值：空闲、待确认、已确认、执行中、待评审、暂缓。任务完成后不在此保留“已完成”状态，而是完成 SHIP 并恢复空闲模板。

## 当前工作树范围

- `docs/plans/2026-07/2026-07-13-automatic-backup.md`
- `docs/plans/2026-07/TODO.md`
- `tasks/current.md`

## 最近验证

文档检查：`git diff --check`、计划占位词、代码围栏和相对链接检查通过。

## 下一步唯一动作

提交已确认计划，创建隔离工作树并按 TDD 执行 Task 1。
