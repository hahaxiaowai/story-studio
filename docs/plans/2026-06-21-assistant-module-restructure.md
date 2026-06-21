# AI 助手模块重组实施计划

## 步骤

1. 更新共享类型和助手纯函数。
   - 为 `AssistantSettings` 增加 `defaultStoryStyleId`。
   - 新增全局风格更新/解析逻辑。
   - 删除页面对作品级风格写入的依赖。

2. 更新存储迁移。
   - schema 升级到 `12`。
   - 归一化旧 `assistantSettings` 时补齐全局风格。
   - 从旧 `workspace.storyStyleId` 推导全局风格，并清理 workspace 风格字段。

3. 拆分助手页面。
   - 新增 AI 对话页组件。
   - 将设置页拆成 Provider、Runner、Style 三个页面私有面板。
   - 原设置页只负责组合和页头。

4. 更新导航和文案。
   - 新增 `#assistant-chat`。
   - `#assistant` 指向 AI 设置。
   - 补齐中英文文案。

5. 更新测试并验证。
   - 覆盖助手设置、聊天上下文、存储迁移、导航和组件静态 wiring。
   - 运行 lint、typecheck、test 和 build。

## 涉及文件

- `packages/types/src/types/story.ts`
- `apps/studio/src/modules/assistant/*`
- `apps/studio/src/modules/storage/document.ts`
- `apps/studio/src/modules/workspaces/*`
- `apps/studio/src/pages/index.vue`
- `apps/studio/src/components/AppSidebar.vue`
- `apps/studio/src/composables/useLocale.ts`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```
