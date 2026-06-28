# 计划目录月份化整理记录

## 状态

- 当前任务：已完成。

## 背景

自动化规则要求计划统一从 `docs/plans` 读取和维护，并按 `docs/plans/YYYY-MM/` 分类。当前计划文件仍位于 `docs/plans/` 根目录，需要整理到月份目录下。

## 范围

- 将 2026-05 的计划文件移动到 `docs/plans/2026-05/`。
- 将 2026-06 的计划文件移动到 `docs/plans/2026-06/`。
- 将无日期但明确属于实施计划的文档移动到当前月份 `docs/plans/2026-06/`。
- 保留 `docs/plans/_template.md` 在根目录。

## 非目标

- 不修改规格文档。
- 不修改业务代码。
- 不重写历史计划内容。

## 验证

- `find docs/plans -maxdepth 3 -type f | sort`
- `find docs/plans -maxdepth 1 -type f | sort`
- `git status --short --branch`

## 完成记录

- 任务 commit：`78c1ea8ab61409930a58a4ce0f6b4a18525ff4d7`
- Commit message：`docs: 📚️ 整理计划目录`
- 完成时间：2026-06-28 22:41:14 CST
