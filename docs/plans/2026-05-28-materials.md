# 素材库实施计划

## 目标

实现一个不绑定具体工作区的全局素材库，素材支持链接、文字、图片地址和多标签分类，并提供标签管理界面。

## 涉及文件

- `packages/types/src/types/story.ts`：升级素材和标签类型。
- `apps/studio/src/modules/storage/document.ts`：升级 schema，补默认字段和迁移。
- `apps/studio/src/modules/storage/document.test.ts`：覆盖默认文档和 v5 迁移。
- `apps/studio/src/modules/materials/materials.ts`：新增素材和标签纯数据函数。
- `apps/studio/src/modules/materials/materials.test.ts`：覆盖 CRUD、过滤和标签删除清理。
- `apps/studio/src/modules/materials/useMaterials.ts`：封装全局素材状态更新。
- `apps/studio/src/modules/materials/MaterialWorkspace.vue`：新增素材库界面。
- `apps/studio/src/pages/index.vue`：接入 `#materials` 路由。
- `apps/studio/src/composables/useLocale.ts`：补素材界面中英文文案。

## 步骤

1. 扩展类型：新增 `MaterialTag`，把 `MaterialAsset` 改为全局素材字段，`StudioDataSchemaVersion` 升到 `6`，`StudioDataDocument` 增加 `materialTags`。
2. 扩展文档迁移：默认文档新增 `materialTags: []`，迁移旧文档时规范化 `materials` 和 `materialTags`。
3. 编写纯数据函数和测试：创建素材、更新素材、删除素材、创建/更新/删除标签、按标签筛选素材。
4. 编写组合式逻辑：通过 `useStudioData` 暴露素材、标签、筛选和更新方法。
5. 编写 `MaterialWorkspace.vue`：实现三栏素材库和标签管理面板。
6. 接入路由和文案：`#materials` 渲染素材库，侧边栏公共功能沿用现有入口。
7. 运行验证：至少执行 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build`；如遇沙箱 EPERM，按权限流程重跑。
