# 实体记录与可配置属性模型实施计划

## 来源规格

- `docs/specs/2026-05-27-entity-property-model.md`

## 当前状态

- 已新增 `EntityKind`、`PropertyDefinition`、`PropertyOption`、`PropertyValue`、`PropertyValueType` 和 `EntityRecord` 共享类型。
- 已新增 `properties` 模块，包含系统属性、属性排序、属性选项、自定义属性和值规范化逻辑。
- 已新增 `entities` 模块，包含记录创建、按工作区和类型筛选、记录更新和标题解析逻辑。
- 已在 `pages/index.vue` 中把 `#cast`、`#characters` 接到角色实体工作区。
- 已把 `propertyDefinitions`、`entityRecords` 接入 `StudioDataDocument` schema v2。

## 实施步骤

1. 更新共享类型。
   - 文件：`packages/types/src/types/story.ts`
   - 新增 `EntityKind`，当前支持 `character` 和 `outline`。
   - 新增 `PropertyValue`、`PropertyValueType`、`PropertyOption`、`PropertyDefinition`。
   - 新增 `EntityRecord`。
   - 更新 `StudioDataSchemaVersion` 为 `2`。
   - 更新 `StudioDataDocument`，增加 `propertyDefinitions` 和 `entityRecords`。
   - 文件：`packages/types/src/index.ts`
   - 统一导出新增类型。

2. 实现属性纯函数和测试。
   - 文件：`apps/studio/src/modules/properties/properties.ts`
   - 定义 `defaultPropertyDefinitions`，包括角色和大纲系统属性。
   - 实现 `getPropertiesByKind`、`getVisiblePropertiesByKind`、`createPropertyDraft`、`replacePropertiesByKind`。
   - 实现 `createCustomProperty`、`updateProperty`、`removeCustomProperty`。
   - 实现 `moveProperty`、`reorderProperty`。
   - 实现 `addPropertyOption`、`removePropertyOption`。
   - 实现 `normalizePropertyValue` 和 `getDefaultValue`。
   - 文件：`apps/studio/src/modules/properties/properties.test.ts`
   - 覆盖系统属性排序、可见属性筛选、自定义属性创建、系统属性删除保护、属性移动、拖拽重排、选项增删和值规范化。

3. 实现属性组合式状态。
   - 文件：`apps/studio/src/modules/properties/useProperties.ts`
   - 使用 `useStudioData()` 读取 `document.propertyDefinitions`。
   - 暴露当前实体类型的 `properties`。
   - 提供保存草稿、创建属性、更新属性、删除属性、移动属性和选项维护方法。
   - 所有写入通过 `updateDocument()` 保存到统一文档。

4. 实现实体纯函数和测试。
   - 文件：`apps/studio/src/modules/entities/entities.ts`
   - 实现 `createEntityRecord`，根据当前实体类型属性生成默认值。
   - 实现 `getRecordsByWorkspaceAndKind`。
   - 实现 `updateEntityRecord`，根据属性类型规范化输入值。
   - 实现 `getEntityTitle` 和 `getTitleProperty`。
   - 文件：`apps/studio/src/modules/entities/entities.test.ts`
   - 覆盖默认记录创建、按工作区和实体类型筛选、字段更新和标题同步。

5. 实现实体组合式状态。
   - 文件：`apps/studio/src/modules/entities/useEntities.ts`
   - 使用 `useWorkspaces()` 读取当前工作区。
   - 使用 `useProperties(kind)` 读取当前实体类型属性。
   - 从 `document.entityRecords` 中筛选当前工作区和当前实体类型记录。
   - 提供 `addRecord`、`updateRecord`、`removeRecord`。
   - 所有写入通过 `useStudioData().updateDocument()` 保存。

6. 实现实体工作区 UI。
   - 文件：`apps/studio/src/modules/entities/EntityWorkspace.vue`
   - 顶部显示实体类型、标题、属性配置入口和新增记录按钮。
   - 左侧显示当前记录列表和空状态。
   - 右侧根据 `PropertyValueType` 渲染 `Input`、`Textarea`、`select`、multi-select 和 checkbox。
   - 编辑字段时调用 `updateRecord`。
   - 删除按钮删除当前选中记录。

7. 实现属性配置 UI。
   - 文件：`apps/studio/src/modules/properties/PropertyConfigDialog.vue`
   - 使用 Dialog 承载属性配置表单。
   - 支持新增属性、重命名、切换类型、显隐、上下移动、拖拽排序和删除自定义属性。
   - 对 select / multi-select 显示选项编辑器。
   - 系统属性不可删除。

8. 接入页面和文案。
   - 文件：`apps/studio/src/pages/index.vue`
   - 根据 hash 显示概览或角色实体工作区。
   - `#cast` 和 `#characters` 映射到角色工作区。
   - 概览中的角色数量优先使用当前工作区 `entityRecords` 数量。
   - 文件：`apps/studio/src/composables/useLocale.ts`
   - 增加角色、属性配置、字段类型、选项编辑等中英文文案。

9. 接入持久化文档迁移。
   - 文件：`apps/studio/src/modules/storage/document.ts`
   - 默认文档写入 `defaultPropertyDefinitions` 和空 `entityRecords`。
   - `resolveStudioDataDocument()` 迁移旧文档到 schema v2。
   - 缺少 `propertyDefinitions` 时补齐系统属性。
   - 缺少 `entityRecords` 时补为空数组。
   - 过滤历史 `task` 类型属性和记录。

10. 运行验证命令。
    - `pnpm run lint`
    - `pnpm run typecheck`
    - `pnpm run test`
    - `pnpm run build`

## 影响文件

- `packages/types/src/index.ts`
- `packages/types/src/types/story.ts`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/modules/entities/EntityWorkspace.vue`
- `apps/studio/src/modules/entities/entities.ts`
- `apps/studio/src/modules/entities/entities.test.ts`
- `apps/studio/src/modules/entities/useEntities.ts`
- `apps/studio/src/modules/properties/PropertyConfigDialog.vue`
- `apps/studio/src/modules/properties/properties.ts`
- `apps/studio/src/modules/properties/properties.test.ts`
- `apps/studio/src/modules/properties/useProperties.ts`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/storage/document.test.ts`
- `apps/studio/src/pages/index.vue`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 风险与回滚

- 风险：schema v2 扩展后，旧 IndexedDB 或 Tauri JSON 文档缺少新字段。
  - 应对：`resolveStudioDataDocument()` 统一补齐 `propertyDefinitions` 和 `entityRecords`。
- 风险：系统属性被误删后，新建记录缺少标题字段。
  - 应对：系统属性通过 `system: true` 标记，删除逻辑只允许删除非系统属性。
- 风险：属性类型切换后，既有记录值类型不匹配。
  - 应对：记录更新时通过 `normalizePropertyValue()` 按当前属性类型规范化输入。
- 风险：当前角色 UI 已落地，大纲 UI 只完成模型基础。
  - 应对：后续单独补“大纲实体工作区”规格和计划。
