# 深浅模式与中英文多语言

## 背景

Story Studio 需要为写作者提供更舒适的长期写作环境。用户在不同光照、设备和语言偏好下使用应用时，应能快速切换浅色/深色界面，并在中文与英文之间切换主要界面文案。

## 目标

- 用户可以在顶部 header 右侧切换浅色和深色模式。
- 用户可以在顶部 header 右侧切换中文和英文。
- 系统可以把主题和语言偏好持久化到 `localStorage`。
- 系统可以同步更新 `document.documentElement.classList` 和 `<html lang>`。
- 静态 UI 文案优先通过类型化词典读取，减少组件里的硬编码文案。

## 非目标

- 本次不引入第三方 i18n 依赖。
- 本次不支持“跟随系统主题”。
- 本次不接入服务端账号偏好同步。
- 本次不要求覆盖所有未来模块文案，只迁移当前页面、侧边栏、面包屑和菜单中已有静态文案。

## 用户流程

1. 用户打开 `http://127.0.0.1:5173/` 或 `http://127.0.0.1:5173/#manuscript`。
2. 用户在顶部 header 右侧点击主题按钮。
3. 系统立即在浅色和深色模式之间切换，并把选择保存到本地。
4. 用户刷新页面后，系统继续使用上次选择的主题。
5. 用户点击语言下拉菜单，选择中文或英文。
6. 系统立即更新侧边栏、面包屑、首页卡片、菜单等已接入词典的文案。
7. 用户刷新页面后，系统继续使用上次选择的语言。

## 数据模型

当前不新增跨包业务模型，应用内新增轻量类型：

- `Locale = 'zh-CN' | 'en-US'`
- `ThemeMode = 'light' | 'dark'`
- `MessageKey`: 从中文词典 `zhMessages` 推导得到，英文词典必须覆盖同一组 key。

本地存储 key：

- `story-studio:locale`: 保存当前语言。
- `story-studio:theme-mode`: 保存当前主题。

## UI 结构

- `apps/studio/src/components/AppHeaderActions.vue`
  - 顶部 header 右侧控制区。
  - 包含主题图标按钮和语言下拉。
  - 使用 lucide 的 `SunIcon`、`MoonIcon`、`LanguagesIcon`。
- `apps/studio/src/layouts/SidebarLayout.vue`
  - 在 header 右侧挂载 `AppHeaderActions`。
  - 面包屑文案从 locale 词典读取。
- `apps/studio/src/components/AppSidebar.vue`
  - 侧边栏导航文案从 locale 词典读取。
- `apps/studio/src/components/NavMain.vue`
  - 当前工作区导航分组文案从 locale 词典读取。
- `apps/studio/src/components/NavProjects.vue`
  - 公共功能分组和菜单文案从 locale 词典读取。
- `apps/studio/src/components/NavUser.vue`
  - 用户菜单文案从 locale 词典读取。
- `apps/studio/src/pages/index.vue`
  - 首页工作台文案从 locale 词典读取。

## 技术方案

- `apps/studio/src/composables/useThemeMode.ts`
  - 暴露 `mode`、`isDark`、`toggleThemeMode`。
  - 初始化时读取 `localStorage`，无有效值时默认 `light`。
  - 监听主题变化，切换 `document.documentElement` 上的 `.dark` class。
- `apps/studio/src/composables/useLocale.ts`
  - 暴露 `locale`、`localeLabel`、`setLocale`、`t(key)`。
  - 初始化时读取 `localStorage`，无有效值时默认 `zh-CN`。
  - 监听语言变化，同步 `<html lang>`。
  - 用中文词典作为 key 来源，英文词典使用 `Record<MessageKey, string>` 保证覆盖完整。
- 主题继续复用现有 `.dark` CSS token，不新增全局样式体系。
- 多语言逻辑保持在应用层，不影响 `packages/types`、`packages/utils` 和 workspace 公共 API。

## 验收标准

- [x] 顶部 header 右侧显示主题切换按钮。
- [x] 点击主题按钮后页面立即在浅色/深色间切换。
- [x] 刷新后保留上次主题。
- [x] 顶部 header 右侧显示中文/英文语言下拉。
- [x] 切换语言后，当前已接入词典的页面文案同步更新。
- [x] 刷新后保留上次语言。
- [x] `<html lang>` 跟随当前语言更新。
- [x] 词典 key 具备 TypeScript 类型约束。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

## 注意事项

- 当前实现是轻量多语言方案，适合当前应用规模；后续如果出现复杂复数、日期格式、插值和远程语言包，再评估是否引入 i18n 库。
- 默认语言是中文，默认主题是浅色。
