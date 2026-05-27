# 实体记录与可配置属性模型

## 背景

Story Studio 已从静态工作台推进到可保存的工作区模型。下一步需要让“角色”和“大纲”不只是模块统计，而是可以创建、编辑、删除的结构化记录。为了后续支持不同作品、不同写作方法和自定义字段，记录字段不能硬编码在单个 Vue 组件中，需要先建立实体记录和属性定义边界。

## 目标

- 用户可以在当前工作区内进入角色模块并管理角色记录。
- 系统为角色和大纲提供系统属性，例如角色姓名、定位、阵营、外貌、性格、动机、关系备注，以及大纲标题、阶段、摘要、冲突、结果。
- 用户可以通过属性配置弹窗调整当前实体类型的属性显隐、排序、名称、类型和选项。
- 用户可以新增自定义属性，并删除非系统属性。
- select 和 multi-select 属性可以维护选项。
- 实体记录和属性定义保存到统一 `StudioDataDocument`，刷新 Web 页面或重启 Tauri 后可以恢复。
- 代码层面形成 `entities` 和 `properties` 两个模块边界，纯函数有单元测试覆盖。

## 非目标

- 本次不实现地图、内容正文和素材库的完整记录模型。
- 本次不实现复杂富文本、关系图谱、跨实体引用或批量导入导出。
- 本次不实现字段级校验提示，只保留属性定义中的 `required` 标记。
- 本次不引入 Pinia、路由系统或第三方表单库。
- 本次不做多用户协作、云同步或冲突合并。

## 用户流程

1. 用户打开 `http://127.0.0.1:5173/#cast` 或 `http://127.0.0.1:5173/#characters`。
2. 页面显示当前工作区的角色记录列表和右侧编辑区域。
3. 用户点击“新增角色”，系统创建一条默认角色记录，并自动选中新记录。
4. 用户编辑角色属性，系统把输入值按属性类型规范化后保存到统一文档。
5. 用户打开属性配置弹窗，调整字段显隐、排序、名称、类型和选项。
6. 用户新增自定义属性后，后续新建记录会带上对应默认值。
7. 用户删除当前记录后，列表选中下一条可用记录；没有记录时显示空状态。
8. 用户刷新页面或重启应用后，角色记录和属性配置保持上次状态。

## 数据模型

共享类型位于 `packages/types/src/types/story.ts`：

- `EntityKind = 'character' | 'outline'`
  - 当前实体类型，角色和大纲先接入结构化记录。
- `PropertyValue = string | number | boolean | string[] | null`
  - 属性值的最小通用表示。
- `PropertyValueType = 'text' | 'longText' | 'number' | 'select' | 'multiSelect' | 'boolean' | 'date'`
  - 属性输入类型。
- `PropertyOption`
  - `id`: 选项稳定标识。
  - `label`: 展示文案。
- `PropertyDefinition`
  - `id`: 属性唯一标识。
  - `kind`: 所属实体类型。
  - `name`: 属性展示名称。
  - `valueType`: 属性输入类型。
  - `required`: 是否必填。
  - `options`: select / multi-select 的可选项。
  - `visible`: 是否在编辑表单中显示。
  - `order`: 同类属性排序。
  - `system`: 是否系统属性。系统属性不可删除。
- `EntityRecord`
  - `id`: 记录唯一标识。
  - `workspaceId`: 所属工作区。
  - `kind`: 所属实体类型。
  - `title`: 记录标题兜底值。
  - `values`: 以属性 id 为 key 的属性值表。
  - `createdAt`: 创建时间。
  - `updatedAt`: 更新时间。
- `StudioDataDocument`
  - `propertyDefinitions: PropertyDefinition[]`
  - `entityRecords: EntityRecord[]`

## UI 结构

- `apps/studio/src/pages/index.vue`
  - 根据 hash 判断当前视图。
  - `#cast` 和 `#characters` 渲染角色实体工作区。
  - 概览页角色统计优先来自当前工作区的 `entityRecords`。
- `apps/studio/src/modules/entities/EntityWorkspace.vue`
  - 通用实体工作区组件。
  - 左侧显示当前工作区、当前实体类型的记录列表。
  - 右侧根据可见属性渲染输入控件。
  - 顶部提供新增记录和属性配置入口。
- `apps/studio/src/modules/properties/PropertyConfigDialog.vue`
  - 属性配置弹窗。
  - 支持新增属性、重命名、切换类型、显隐、上下移动、拖拽排序、删除自定义属性和维护选项。

## 技术方案

- 在 `packages/types` 中新增实体和属性共享类型，保持跨包模型集中管理。
- 在 `apps/studio/src/modules/properties` 中维护属性定义逻辑：
  - `properties.ts`: 系统属性、属性筛选、排序、创建、更新、删除、选项维护、值规范化和默认值。
  - `useProperties.ts`: 基于 `useStudioData()` 读写 `document.propertyDefinitions`。
  - `properties.test.ts`: 覆盖属性排序、自定义属性、系统属性保护、选项维护和值规范化。
- 在 `apps/studio/src/modules/entities` 中维护实体记录逻辑：
  - `entities.ts`: 创建记录、按工作区和类型筛选、更新记录、标题解析。
  - `useEntities.ts`: 基于 `useStudioData()` 读写 `document.entityRecords`。
  - `EntityWorkspace.vue`: 组合记录列表、属性表单和属性配置弹窗。
  - `entities.test.ts`: 覆盖默认记录创建、按工作区筛选、值更新和标题同步。
- 存储文档升级为 schema v2，默认文档包含系统属性定义和空实体记录列表。
- 迁移已有文档时补齐 `propertyDefinitions` 和 `entityRecords`，并过滤历史 `task` 类型数据。

## 验收标准

- [x] `#cast` 和 `#characters` 可以打开角色实体工作区。
- [x] 可以在当前工作区新增角色记录。
- [x] 可以编辑角色记录字段，并同步记录标题。
- [x] 可以删除当前角色记录。
- [x] 当前工作区概览中的角色数量优先反映实体记录数量。
- [x] 可以打开属性配置弹窗。
- [x] 可以新增自定义属性。
- [x] 可以删除非系统属性，系统属性不可删除。
- [x] 可以调整属性显隐和排序。
- [x] select / multi-select 属性可以维护选项。
- [x] 属性定义和实体记录保存到统一持久化文档。
- [x] schema v1 文档加载后会补齐 schema v2 字段。
- [x] 实体和属性纯函数有单元测试覆盖。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 注意事项

- 角色模块已接入实体工作区；大纲实体模型和系统属性已经存在，但完整 UI 入口可在后续规格中展开。
- 当前 `required` 只是属性定义标记，表单层还没有阻止空值保存。
- 属性选项 id 基于 label slug 生成，中文或无法 slugify 的 label 会使用 `option` 兜底并追加后缀避免冲突。
- 当前记录 id 使用时间戳和随机片段生成，后续如需要跨设备同步，应单独评估更稳定的 id 策略。
