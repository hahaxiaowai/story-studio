# Story Studio Agent Guide

## 基本要求

- 使用中文回答。
- 修改代码前先理解现有结构，优先沿用当前项目约定。
- 不要回滚或覆盖用户已有改动；工作树可能包含未提交变更。
- 手动编辑文件时优先使用 `apply_patch`。

## 项目定位

Story Studio 是一个 pnpm workspace monorepo，当前包含一个 Vue 3 + Vite + Tauri 桌面应用，以及共享的 config、types、utils 包。

## 技术栈

- pnpm 11
- Turbo
- Vue 3 + Vite
- Tauri 2
- TypeScript strict
- Vitest
- `@antfu/eslint-config`
- `devmoji` + `simple-git-hooks`

## Workspace 结构

- `apps/studio`: 主应用，Vue/Vite 前端与 Tauri 外壳都在这里。
- `packages/config`: 共享配置，例如 tsconfig 和 Vitest 配置。
- `packages/types`: 跨包共享类型。
- `packages/utils`: 跨包共享工具函数。

## Studio 前端结构

`apps/studio/src` 参考 Vitesse 的目录风格：

- `main.ts`: 浏览器入口，挂载 Vue 应用。
- `App.vue`: 根组件。
- `pages/`: 页面级组件。当前首页是 `pages/index.vue`。
- `styles/`: 全局样式。当前入口是 `styles/main.css`。
- `constants/`: 应用侧常量。当前示例项目数据在 `constants/project.ts`。

后续如需要新增通用 UI、组合式逻辑、布局、模块初始化或状态管理，优先使用这些 Vitesse 风格目录：

- `components/`
- `composables/`
- `layouts/`
- `modules/`
- `stores/`

不要为了目录对齐而引入无用依赖；当前没有引入 Vitesse 的文件路由、自动导入、Pinia 或 UnoCSS。

## 代码质量约束

- 页面文件优先负责页面组合、状态接线和流程入口，不承载复杂业务编排、请求细节或大段派生计算。
- 单页私有组件、组合式逻辑和局部类型优先就近内聚；只有出现真实跨页面复用后，才上提到 `components/`、`composables/` 或共享包。
- `components/` 只放真实跨页面复用 UI；页面私有组件优先留在页面邻近目录，避免为了拆分视觉结构提前上提。
- `composables/` 只放稳定跨页面逻辑；页面私有业务逻辑优先就近拆分，并保持清晰输入输出。
- `stores/` 仅在后续引入状态管理且确有跨页面或跨会话状态时使用，不把页面局部状态提前全局化。
- Vue 模板避免复杂表达式、长三元判断和多层业务计算；复杂判断提取为具名变量、computed 或小函数。
- 组件、组合式函数、变量和事件函数命名必须体现业务意图，避免 `CommonPanel`、`DataList`、`useHandler`、`handleClick` 这类泛名，除非上下文足够小。
- 类型优先复用 `packages/types` 或当前模块已有类型，不在组件内重复声明与接口结构相似但不一致的类型。
- 避免无关抽象、无关重构、重复类型定义、全局状态膨胀、`any` 和过宽的 `Record<string, unknown>`；确需使用宽类型时限制在最小作用域。

## 代码风格

遵循 Antfu 风格和当前 ESLint 配置：

- 类型和接口拆到 `types.ts` 或 `types/*`。
- 常量拆到 `constants.ts` 或 `constants/*`。
- 每个文件保持单一职责。
- 测试文件与实现文件同目录，例如 `slug.ts` 对应 `slug.test.ts`。
- 使用 Vitest 的 `describe` / `it`。
- 尽量显式声明函数返回类型。
- 避免无意义注释，只在解释原因或复杂意图时添加简短注释。

## 包管理

- 使用 pnpm catalog 管理依赖版本。
- 不使用默认 catalog；按用途放入 `prod`、`frontend`、`tauri`、`dev` 等 catalog。
- 项目启用了 `trustPolicy: no-downgrade`。
- 当前 `undici-types@6.21.0` 是 lockfile 中的精确 trust policy 例外。
- `allowBuilds` 当前允许 `esbuild` 和 `simple-git-hooks`。

## Git 与 Commit

- 使用 Conventional Commit。
- 提交信息的描述部分使用中文，例如 `feat: 新增编辑器`。
- `devmoji` 已通过 `simple-git-hooks` 接入 `prepare-commit-msg`。
- 提交时 `feat: add editor` 会自动转换为类似 `feat: ✨ add editor`。
- 可用 `pnpm run log` 查看带 devmoji 效果的提交日志。

## 常用命令

- `pnpm install`
- `pnpm run dev`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`
- `pnpm run log`

## 验证要求

完成代码或配置变更后，根据影响范围运行：

- 样式/格式：`pnpm exec eslint . --fix`
- 静态检查：`pnpm run lint`
- 类型检查：`pnpm run typecheck`
- 单元测试：`pnpm run test`
- 构建验证：`pnpm run build`

在当前 Codex 沙箱中，Vitest/Vite/esbuild 或带管道的脚本可能因为子进程启动触发 `spawn EPERM`。如果普通执行失败且错误指向沙箱权限，按权限流程在沙箱外重跑。Turbo 可能出现 `.turbo/cache` rename warning，只要命令退出码为 0，一般不代表验证失败。

## SDD 工作流

项目采用 Spec-Driven Development。新增功能或较大行为调整时，先写规格，再拆计划，最后实现。

- 规格文档放在 `docs/specs/`。
- 实施计划放在 `docs/plans/`。
- 规格先说明背景、目标、非目标、用户流程、数据模型、UI 结构、技术方案、验收标准和验证命令。
- 计划应从已批准的规格拆出具体步骤，标明涉及文件和验证方式。
- 不要在规格未明确时直接扩大实现范围。
- 小修小补可以不写完整规格，但仍应遵循 `AGENTS.md` 中的目录、风格和验证约定。

## 本地运行

- Studio dev server 默认使用 `http://127.0.0.1:5173/`。
- `apps/studio` 的 `dev` 脚本是 `vite --host 127.0.0.1`。

## 当前重要上下文

- 前端目录已从早期 `app/`、`features/project/` 调整为 Vitesse 风格。
- 共享类型已拆到 `packages/types/src/types/story.ts`，由 `packages/types/src/index.ts` 统一导出。
- `createSlug` 已拆到 `packages/utils/src/slug.ts`，测试在 `packages/utils/src/slug.test.ts`。
- commit 可视化已接入 `devmoji`。
