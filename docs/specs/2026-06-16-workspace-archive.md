# 工作区归档与恢复

## 背景

工作区模型已经包含 `status: 'draft' | 'archived'`，但界面目前只支持创建、切换和编辑详情。写作者完成或暂停一部作品后，需要把它从日常工作区列表中收起，同时保留作品数据和后续恢复能力。

## 目标

- 用户可以归档当前工作区，让它离开普通工作区切换列表。
- 用户可以在工作区菜单中看到已归档工作区，并恢复其中任意一个。
- 归档当前工作区后，系统自动切换到下一个草稿工作区。
- 系统阻止归档最后一个草稿工作区，避免应用没有可用当前作品。

## 非目标

- 本次不实现永久删除。
- 本次不实现批量归档、归档原因、搜索或归档列表页面。
- 本次不删除或迁移任何大纲、正文、角色、世界、素材引用或助手线程数据。

## 用户流程

1. 用户打开侧边栏顶部工作区菜单。
2. 用户点击“归档当前工作区”。
3. 系统把当前工作区标记为 archived，并自动切换到另一个草稿工作区。
4. 用户再次打开菜单，在归档分组中看到已归档工作区。
5. 用户点击已归档工作区，系统恢复它并切换到该工作区。

## 数据模型

沿用 `Workspace.status`：

- `draft`: 普通工作区，可在主列表切换。
- `archived`: 已归档工作区，默认从主列表隐藏，但仍保留全部关联数据。

`activeWorkspaceId` 必须始终指向一个草稿工作区。归档当前工作区时，如果没有其它草稿，操作失败。

## UI 结构

- `apps/studio/src/components/TeamSwitcher.vue`
  - 普通列表只展示草稿工作区。
  - 操作区增加“归档当前工作区”。
  - 如果存在归档工作区，菜单底部显示“已归档”分组，点击条目恢复并切换。

## 技术方案

- `apps/studio/src/modules/workspaces/workspaces.ts`
  - 新增草稿/归档过滤函数。
  - 新增归档和恢复纯函数，返回新的 `workspaces` 和 `activeWorkspaceId`。
- `apps/studio/src/modules/workspaces/useWorkspaces.ts`
  - 暴露归档当前工作区和恢复工作区方法。
  - 所有写入继续通过 `useStudioData()` 的统一文档。
- `apps/studio/src/composables/useLocale.ts`
  - 补齐归档/恢复中英文文案。

## 验收标准

- [x] 普通工作区列表不展示 archived 工作区。
- [x] 可以归档当前工作区，并自动切换到另一个草稿工作区。
- [x] 不能归档最后一个草稿工作区。
- [x] 可以从归档分组恢复工作区，并自动切换过去。
- [x] 归档和恢复只改变工作区状态，不删除关联数据。
- [x] 类型检查通过。
- [x] 必要测试通过。

## 验证命令

```bash
pnpm --filter @story-studio/studio test src/modules/workspaces/workspaces.test.ts
pnpm --filter @story-studio/studio test src/modules/workspaces/useWorkspaces.test.ts
pnpm --filter @story-studio/studio test src/components/TeamSwitcher.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
```
