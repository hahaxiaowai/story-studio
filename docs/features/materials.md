# 素材库

## 功能目的

素材库用于保存跨工作区复用的文本、链接和图片素材，并通过标签组织检索。素材可以通过 `WorkspaceMaterialRef` 关联到具体工作区或模块。

## 用户入口

- 导航 hash：`#materials`
- 页面：`apps/studio/src/pages/materials/MaterialPage.vue`

## 主流程

1. 读取全局 `materials` 和 `materialTags`。
2. 用户新增、编辑或删除素材。
3. 用户通过类型、关键词和标签过滤素材。
4. 用户维护素材标签，删除标签时同步清理素材上的 tag 引用。

## 关键文件

- `apps/studio/src/modules/materials/materials.ts`
- `apps/studio/src/modules/materials/useMaterials.ts`
- `apps/studio/src/pages/materials/MaterialPage.vue`
- `packages/types/src/types/story.ts`

## 数据结构

- `MaterialAsset`
- `MaterialTag`
- `WorkspaceMaterialRef`
- `MaterialKindFilter`
- `StudioDataDocument.materials`
- `StudioDataDocument.materialTags`
- `StudioDataDocument.materialRefs`

## 边界情况

- 素材类型是从 `text`、`url`、`imageUrl` 是否为空派生，不是持久字段。
- 素材排序按 `updatedAt` 倒序，其次按 `createdAt`。
- 标签删除必须同步移除素材中的对应 tag id。

## 验证入口

- `apps/studio/src/modules/materials/materials.test.ts`
- `apps/studio/src/modules/materials/useMaterials.test.ts`
- `apps/studio/src/pages/materials/MaterialPage.test.ts`
