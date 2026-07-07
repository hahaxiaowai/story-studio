# 角色和属性

## 功能目的

实体模块当前主要服务角色管理，并通过属性定义支持可配置字段。属性模型为后续扩展其他实体类型保留空间。

## 用户入口

- 导航 hash：`#characters` / `#cast`
- 页面：`apps/studio/src/pages/entities/EntityWorkspace.vue`
- 属性配置：`apps/studio/src/pages/shared/PropertyConfigDialog.vue`

## 主流程

1. 页面按当前工作区和实体类型读取 `EntityRecord`。
2. 用户创建、编辑或删除角色记录。
3. 用户可通过属性配置调整可见字段、必填规则、选项和排序。
4. 工作区角色计数从 `entityRecords` 派生，并在迁移时修正旧计数。

## 关键文件

- `apps/studio/src/modules/entities/entities.ts`
- `apps/studio/src/modules/entities/useEntities.ts`
- `apps/studio/src/modules/properties/properties.ts`
- `apps/studio/src/modules/properties/useProperties.ts`
- `apps/studio/src/pages/entities/EntityWorkspace.vue`
- `apps/studio/src/pages/shared/PropertyConfigDialog.vue`
- `packages/types/src/types/story.ts`

## 数据结构

- `EntityKind`
- `EntityRecord`
- `PropertyDefinition`
- `PropertyValue`
- `PropertyOption`

## 边界情况

- 当前 `EntityKind` 包含 `character`、`outline`、`world-setting`，但工作台实体页面主要使用 `character`。
- 迁移逻辑会过滤旧的 `task` 和 `outline` 实体残留。
- 必填属性和选项类属性需要在模块逻辑中保持一致的默认值和校验。

## 验证入口

- `apps/studio/src/modules/entities/entities.test.ts`
- `apps/studio/src/modules/entities/useEntities.test.ts`
- `apps/studio/src/modules/properties/properties.test.ts`
- `apps/studio/src/pages/entities/EntityWorkspace.test.ts`
