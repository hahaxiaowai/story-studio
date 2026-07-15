# 当前主要任务

## 状态

- 当前状态：执行中
- 当前规格：[`docs/specs/2026-07-13-automatic-backup.md`](../docs/specs/2026-07-13-automatic-backup.md)
- 当前计划：[`docs/plans/2026-07/2026-07-13-automatic-backup.md`](../docs/plans/2026-07/2026-07-13-automatic-backup.md)
- 当前 Task：Task 2：新备份按本机时间自动分层轮换
- 最后更新：2026-07-15

本文件只指向当前主要任务，不复制 Spec、Plan 或月度 `TODO.md` 的状态。候选任务和并行计划仍以 `docs/plans/YYYY-MM/TODO.md` 为索引，自动化仍从月度索引选择任务。

状态取值：空闲、待确认、已确认、执行中、待评审、暂缓。任务完成后不在此保留“已完成”状态，而是完成 SHIP 并恢复空闲模板。

## 当前工作树范围

- `apps/studio/src-tauri/src/automatic_backup.rs`
- `apps/studio/src-tauri/src/lib.rs`
- `apps/studio/src-tauri/Cargo.toml`
- `apps/studio/src-tauri/Cargo.lock`
- `docs/plans/2026-07/2026-07-13-automatic-backup.md`
- `docs/plans/2026-07/TODO.md`
- `tasks/current.md`

## 最近验证

Task 1：`cargo test automatic_backup -- --nocapture` 10/10 通过；`cargo test` 30/30 通过，存在一个既有 dead-code warning。

## 下一步唯一动作

按 TDD 完成 Task 2 本机时间分层轮换、清理失败隔离和独立重试命令。
