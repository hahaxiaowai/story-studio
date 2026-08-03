---
sdd: true
id: YYYY-MM-DD-feature
status: 待确认
risk: M
spec: docs/specs/YYYY-MM-DD-feature.md
updated: YYYY-MM-DD
feature: pending
architecture: pending
test-map: pending
adr: pending
evidence: pending
---

# 功能名称实施计划

## 结果契约

- 用户最终可以观察到什么结果。
- 必须保持哪些行为、数据或运行时边界。
- 明确不在本次范围内的内容。

## Task 1：可独立验收的用户行为

- 验收：具体、可观察、可验证的条件。
- 验证：目标测试、命令或明确人工步骤。
- 风险：失败影响与回滚边界。
- 预计影响：模块或目录提示，不作为固定文件清单。
- 依赖：无，或填写 Task 编号。
- 规模：XS / S / M；L 应继续拆分或说明无法拆分原因。
- 状态：待确认。

## Task 2：可独立验收的用户行为

- 验收：
- 验证：
- 风险：
- 预计影响：
- 依赖：Task 1。
- 规模：S。
- 状态：待确认。

Task 按用户行为垂直切分。函数签名、代码片段和逐行步骤只用于固定协议、安全边界或数据迁移，不把 Plan 写成容易随源码漂移的实现脚本。

## Bug 反馈循环（仅 Bug 适用）

- 实际行为：
- 预期行为：
- 环境与最小复现：
- 修复前证据：
- 修复后证据：
- 自动化限制与未覆盖风险：

## 验证

```bash
pnpm run sdd:check
```

根据 `docs/ai/verification.md` 补充目标测试、lint、typecheck、test、build 或真实运行命令。

## 风险与回滚

- 主要风险：
- 回滚边界：

## 完成记录

- 完成时间：
- 实际交付：
- 验证证据：命令、退出码、测试数量、警告和人工路径。
- 评审结论：
- commit 或本地范围：
- 未覆盖风险：
- 后续事项：
