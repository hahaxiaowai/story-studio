# 实体必填字段校验提示

## 背景

实体属性模型已经支持 `required` 标记，但实体编辑器目前只显示星号，不会提示哪些必填字段仍为空。用户在自定义字段或清空系统标题字段后，无法快速判断当前记录是否满足基础信息完整性。

## 目标

- 在实体编辑器中识别当前可见必填字段是否为空。
- 在记录标题区域显示缺失必填字段提示。
- 在具体字段下方显示简短错误文案。
- 保持当前自动保存体验，不阻止输入保存。
- 用纯函数覆盖不同属性类型的空值判断。

## 非目标

- 不实现提交式表单、保存按钮或强制拦截保存。
- 不校验隐藏字段，隐藏字段不阻塞当前编辑器提示。
- 不实现跨记录唯一性、关系完整性或复杂表达式校验。
- 不引入第三方表单库或全局状态管理。

## 用户流程

1. 用户进入角色或世界设定实体工作区。
2. 用户选中一条记录。
3. 如果当前记录存在可见必填字段为空，标题区域显示“缺少必填字段”提示，并列出字段名称。
4. 对应字段下方显示“请填写必填字段”。
5. 用户补全字段后，提示自动消失。

## 数据模型

复用现有类型：

- `PropertyDefinition.required`: 字段是否必填。
- `PropertyDefinition.visible`: 字段是否在当前编辑器中展示。
- `EntityRecord.values`: 字段值表。

空值规则：

- `text` / `longText` / `date` / `select`: 去除首尾空白后为空字符串时缺失。
- `number`: `null` 或非有限数字时缺失。
- `multiSelect`: 空数组时缺失。
- `boolean`: `true` 和 `false` 都是明确值，不视为缺失。

## UI 结构

- `apps/studio/src/modules/entities/EntityWorkspace.vue`
  - 基于 `visibleProperties` 和 `selectedRecord` 计算缺失必填字段。
  - 标题区域展示汇总提示。
  - 单个字段根据属性 id 判断是否展示错误文案。

## 技术方案

- 在 `apps/studio/src/modules/entities/entities.ts` 新增纯函数：
  - `getMissingRequiredProperties(record, properties)`: 返回缺失的必填属性。
  - `isMissingRequiredPropertyValue(property, value)`: 判断单个字段值是否缺失。
- 在 `apps/studio/src/modules/entities/entities.test.ts` 先补失败测试，再实现纯函数。
- `EntityWorkspace.vue` 只负责读取纯函数结果和渲染提示。

## 验收标准

- [x] 必填文本字段为空或只有空白时会提示。
- [x] 必填 select 为空字符串时会提示。
- [x] 必填 multi-select 空数组时会提示。
- [x] 必填 number 为 `null` 时会提示。
- [x] 必填 boolean 为 `false` 时不会提示。
- [x] 实体编辑器标题区域能列出缺失字段名称。
- [x] 单个缺失字段下方显示错误文案。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/entities/entities.test.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
