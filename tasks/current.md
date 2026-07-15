# 当前主要任务

## 状态

- 当前状态：执行中
- 当前规格：[`docs/specs/2026-07-13-automatic-backup.md`](../docs/specs/2026-07-13-automatic-backup.md)
- 当前计划：[`docs/plans/2026-07/2026-07-13-automatic-backup.md`](../docs/plans/2026-07/2026-07-13-automatic-backup.md)
- 当前 Task：Task 4：用户可以在现有对话框查看并保护性恢复自动备份
- 最后更新：2026-07-15

本文件只指向当前主要任务，不复制 Spec、Plan 或月度 `TODO.md` 的状态。候选任务和并行计划仍以 `docs/plans/YYYY-MM/TODO.md` 为索引，自动化仍从月度索引选择任务。

状态取值：空闲、待确认、已确认、执行中、待评审、暂缓。任务完成后不在此保留“已完成”状态，而是完成 SHIP 并恢复空闲模板。

## 当前工作树范围

- `apps/studio/src-tauri/src/automatic_backup.rs`
- `apps/studio/src-tauri/src/lib.rs`
- `apps/studio/src-tauri/Cargo.toml`
- `apps/studio/src-tauri/Cargo.lock`
- `apps/studio/src/modules/storage/automaticBackup.ts`
- `apps/studio/src/modules/storage/tauriAutomaticBackup.ts`
- `apps/studio/src/modules/storage/useAutomaticBackup.ts`
- `apps/studio/src/App.vue`
- `docs/plans/2026-07/2026-07-13-automatic-backup.md`
- `docs/plans/2026-07/TODO.md`
- `tasks/current.md`

## 最近验证

Task 3：目标前端测试 12/12 通过；Studio 全量测试 52 文件、284 测试通过；Studio 类型检查及新增 TypeScript 文件 ESLint 通过。

## 下一步唯一动作

按 TDD 完成 Task 4 自动备份面板、损坏项禁用和恢复前保护备份。
