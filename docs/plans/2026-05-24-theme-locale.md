# 深浅模式与中英文多语言实施计划

## 来源规格

- `docs/specs/2026-05-24-theme-locale.md`

## 当前状态

- 已实现。
- 主题和语言偏好已在浏览器本地持久化。
- 当前计划用于记录已落地的实施边界，便于后续继续按 SDD 迭代。

## 实施步骤

1. 新增主题组合式逻辑。
   - 文件：`apps/studio/src/composables/useThemeMode.ts`
   - 定义 `ThemeMode = 'light' | 'dark'`。
   - 提供 `isThemeMode`、`getNextThemeMode`、`applyThemeMode`、`useThemeMode`。
   - 使用 `story-studio:theme-mode` 持久化用户选择。

2. 新增轻量多语言组合式逻辑。
   - 文件：`apps/studio/src/composables/useLocale.ts`
   - 定义 `Locale = 'zh-CN' | 'en-US'`。
   - 维护 `zhMessages`、`enMessages` 和 `MessageKey`。
   - 提供 `isLocale`、`translate`、`useLocale`。
   - 使用 `story-studio:locale` 持久化用户选择。

3. 新增顶部 header 操作区。
   - 文件：`apps/studio/src/components/AppHeaderActions.vue`
   - 放置主题图标按钮和语言下拉。
   - 主题按钮使用 `SunIcon` / `MoonIcon`。
   - 语言下拉使用 `DropdownMenuRadioGroup`。

4. 接入布局和现有组件文案。
   - 文件：`apps/studio/src/layouts/SidebarLayout.vue`
   - 文件：`apps/studio/src/components/AppSidebar.vue`
   - 文件：`apps/studio/src/components/NavMain.vue`
   - 文件：`apps/studio/src/components/NavProjects.vue`
   - 文件：`apps/studio/src/components/NavUser.vue`
   - 文件：`apps/studio/src/pages/index.vue`
   - 将当前静态文案迁移到 `t(key)`。

5. 补充测试。
   - 文件：`apps/studio/src/composables/useThemeMode.test.ts`
   - 文件：`apps/studio/src/composables/useLocale.test.ts`
   - 验证主题值识别、主题切换、语言值识别和翻译读取。

6. 运行验证命令。
   - `pnpm run lint`
   - `pnpm run typecheck`
   - `pnpm run test`

## 影响文件

- `apps/studio/src/components/AppHeaderActions.vue`
- `apps/studio/src/components/AppSidebar.vue`
- `apps/studio/src/components/NavMain.vue`
- `apps/studio/src/components/NavProjects.vue`
- `apps/studio/src/components/NavUser.vue`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/composables/useLocale.test.ts`
- `apps/studio/src/composables/useThemeMode.ts`
- `apps/studio/src/composables/useThemeMode.test.ts`
- `apps/studio/src/layouts/SidebarLayout.vue`
- `apps/studio/src/pages/index.vue`

## 验证

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

## 风险与回滚

- 风险：词典 key 增长后，组件模板可能出现难以发现的缺失文案。
  - 应对：继续以中文词典推导 `MessageKey`，英文词典使用 `Record<MessageKey, string>`。
- 风险：主题默认值与浏览器历史缓存不一致。
  - 应对：以 `localStorage` 中有效值为准，无效值回落到 `light`。
- 回滚边界：如需回滚该功能，优先回滚 `AppHeaderActions.vue`、`useThemeMode.ts`、`useLocale.ts` 及相关测试，再恢复组件内静态文案。
