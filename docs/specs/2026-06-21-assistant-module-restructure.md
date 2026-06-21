# AI 助手模块重组

## 背景

现有 AI 助手页同时承载 Provider 配置、默认模型、功能模型覆盖、本地 Terminal 测试、故事风格管理和多轮 AI 对话。页面职责过多，用户无法直接区分“设置”与“正式对话”，后续扩展 AI 能力也会继续堆叠。

## 目标

- AI 对话成为独立公共功能入口。
- 原助手入口调整为 AI 设置页，承载 AI 设置和 AI 风格设置。
- AI 风格从作品级选择调整为全局选择，并继续注入 API 与本地 Terminal 对话上下文。
- 保留已有 Provider、功能默认模型、聊天线程、流式传输和本地 Terminal 测试能力。

## 非目标

- 不改 Tauri command 协议。
- 不改聊天线程数据结构。
- 不做 API Key 加密或模型参数面板。
- 不把 AI 风格设置做成单独侧边栏入口。

## 用户流程

1. 用户在侧边栏公共功能区进入 AI 对话。
2. 用户使用现有聊天线程、Provider 下拉、停止、重试、复制和回填正文能力。
3. 用户在侧边栏进入 AI 设置。
4. 用户维护 Provider、全局默认模型、功能模型覆盖和本地 Terminal 测试。
5. 用户在 AI 设置页的 AI 风格设置区选择全局风格或维护自定义风格。
6. 系统在后续 AI 对话请求中注入全局风格约束。

## 数据模型

- `AssistantSettings.defaultStoryStyleId` 保存全局 AI 风格。
- `AssistantSettings.storyStyles` 继续保存内置风格和自定义风格。
- `Workspace.storyStyleId` 停止写入；迁移时清理旧字段。
- 旧文档中第一个能解析到现有风格的 `Workspace.storyStyleId` 会迁移为 `defaultStoryStyleId`。
- `StudioDataSchemaVersion` 升到 `12`。

## UI 结构

- `#assistant-chat` 渲染独立 AI 对话页。
- `#assistant` 渲染 AI 设置页。
- AI 设置页拆成 Provider 设置、本地 Terminal 测试和 AI 风格设置三个页面私有面板。
- 公共功能侧边栏显示素材、AI 对话、AI 设置。

## 技术方案

- `AssistantChatWorkspace.vue` 包装现有 `AssistantChatPanel.vue`。
- `AssistantWorkspace.vue` 作为设置页组合，不再直接渲染聊天面板。
- 新增页面私有面板组件承载 Provider、Runner 和风格表单逻辑。
- `useAssistant()` 暴露全局风格解析与更新方法。
- `useAssistantChat()` 从全局设置解析当前风格，不再读取当前作品风格。
- 导航 hash、文案和测试同步覆盖新入口。

## 验收标准

- [ ] 侧边栏可分别进入 AI 对话和 AI 设置。
- [ ] AI 对话页不显示 Provider 设置、风格表单或本地测试面板。
- [ ] AI 设置页不显示聊天线程和消息流。
- [ ] 全局风格选择会影响 API request messages 和本地 Terminal prompt。
- [ ] 旧作品级风格选择迁移为全局默认风格，workspace 不再保留风格字段。
- [ ] 现有聊天线程、Provider 配置和本地 Terminal 测试能力不回归。

## 验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```
