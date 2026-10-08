# 当前主要任务

## 状态

- 当前状态：执行中
- 最后更新：2026-08-31

本文件只指向当前主要 Spec、Plan 和 Task，不复制正文或替代月度索引。新式 Plan 的 frontmatter 是状态权威，月度 `TODO.md` 和本文件是可校验投影。

状态取值：空闲、待确认、已确认、执行中、待验证、待评审、暂缓。任务完成后不在此保留“已完成”，而是在 SHIP 后恢复本模板。

## 当前规格

[`docs/specs/2026-07-13-automatic-backup.md`](../docs/specs/2026-07-13-automatic-backup.md)

## 当前计划

[`docs/plans/2026-07/2026-07-13-automatic-backup.md`](../docs/plans/2026-07/2026-07-13-automatic-backup.md)

## 当前 Task

完成开关持久化、损坏项、保护恢复和分层轮换的隔离 Tauri 真实桌面验收。

## 当前工作树范围

仅限自动备份真实验收证据及对应 Spec、Plan、月度 TODO、Feature/Test Map 和任务指针回填；发现产品缺陷时先记录原始症状再决定修复范围。

## 最近验证

自动化验证已通过；真实桌面已验证首次创建和相同 `updatedAt` 不重复写入，剩余场景正在隔离应用数据目录执行。

## 下一步唯一动作

使用独立 Tauri identifier 启动隔离验收环境，先验证默认开启、开关持久化和修改后新增备份。
