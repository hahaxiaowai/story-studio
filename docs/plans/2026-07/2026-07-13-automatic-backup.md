# Tauri 自动备份实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 当前仓库默认使用 `superpowers:executing-plans`；只有用户明确要求子代理时才使用 subagent-driven-development。

**Goal:** 在 Tauri 桌面端提供默认开启、每 10 分钟检查、分层轮换、可查看并保护性恢复的完整文档自动备份，同时保持 Web 手动备份行为不变。

**Architecture:** Vue 应用级控制器负责数据加载后的立即检查、10 分钟调度、互斥和 UI 状态；独立 Tauri client 只封装 command；Rust `automatic_backup.rs` 管理设备设置、受管文件、原子写入、安全读取和本地时区轮换。现有 `DataBackupDialog` 复用 `parseStudioDataBackup()` 与 `replaceDocument()`，并通过邻近私有面板展示自动备份。

**Tech Stack:** Vue 3、TypeScript strict、Vitest、Tauri 2、Rust 2021、Serde、Chrono、现有 Dialog/Button UI、统一 `StudioDataDocument` schema 14。

## 全局约束

- 仅 Tauri 桌面运行时启用；Web 不启动调度，也不展示自动备份管理区。
- 数据加载完成后立即检查，之后每 10 分钟检查；同一时刻最多一个检查任务。
- 只要任一有效备份的 `documentUpdatedAt` 等于当前文档 `updatedAt`，不重复写入。
- 自动备份设置属于设备级数据，不进入 `StudioDataDocument`，schema 保持 14。
- 最近 24 小时每自然小时保留最新一份；第 2～7 天每自然日保留最新一份；超过 7 天删除；全局最新有效项始终保留。
- `scheduled` 与 `pre-restore` 共同参与轮换；损坏文件保留、禁用恢复且不参与有效时间桶。
- 新备份成功写入后才清理旧文件；单个清理失败不回滚已成功写入的备份。
- 恢复自动备份前必须先创建保护备份；保护失败不得调用 `replaceDocument()`。
- 不新增 Web 快照、系统后台任务、单条删除、永久保留、压缩、加密、增量或云同步。
- 真实代码按 TDD 执行；每个 Task 先观察目标测试按预期失败，再写最小实现。
- 不回滚用户已有改动；验证后恢复两个 `apps/studio/*.tsbuildinfo` 生成文件。

## 来源规格

- [`docs/specs/2026-07-13-automatic-backup.md`](../../specs/2026-07-13-automatic-backup.md)

## 状态

- 当前状态：执行中
- 优先级：P1
- 创建时间：2026-07-15
- 最后更新：2026-07-15

---

### Task 1：桌面端可以安全创建、列出和读取受管备份

**用户可验收结果：** Tauri 原生层可以持久化默认开启设置，原子创建两类完整备份，按新到旧列出有效或损坏文件，并且只能通过不透明 ID 读取受管文件。

**Files:**

- Create: `apps/studio/src-tauri/src/automatic_backup.rs`
- Modify: `apps/studio/src-tauri/src/lib.rs:1-120`
- Modify: `apps/studio/src-tauri/Cargo.toml`
- Modify: `apps/studio/src-tauri/Cargo.lock`

**Interfaces:**

- Produces: `AutomaticBackupSource::{Scheduled, PreRestore}` serialized as `scheduled` / `pre-restore`
- Produces: `AutomaticBackupStatus::{Valid, Corrupted}` serialized as `valid` / `corrupted`
- Produces: `AutomaticBackupSettings { enabled: bool }`
- Produces: `AutomaticBackupEntry { id, source, created_at, document_updated_at, byte_size, status, summary }`
- Produces commands: `get_automatic_backup_settings`, `set_automatic_backup_enabled`, `list_automatic_backups`, `create_automatic_backup`, `read_automatic_backup`
- Consumes: raw `serde_json::Value` documents; it does not know `StudioDataDocument` Rust types

- [x] **Step 1：先写设置、写入、索引和安全读取失败测试**

在 `automatic_backup.rs` 的 `#[cfg(test)]` 中先定义固定目录测试，覆盖：

```rust
#[test]
fn missing_settings_default_to_enabled() {
    let root = test_root("settings-default");
    assert_eq!(load_settings(&root).unwrap(), AutomaticBackupSettings { enabled: true });
}

#[test]
fn created_backup_is_listed_and_readable() {
    let root = test_root("create-list-read");
    let now = parse_time("2026-07-15T10:05:00+08:00");
    let document = json!({
        "schemaVersion": 14,
        "updatedAt": "2026-07-15T02:04:00.000Z",
        "workspaces": [],
        "contents": [],
        "materials": [],
        "assistantChatThreads": []
    });

    let created = create_backup_at(&root, &document, AutomaticBackupSource::Scheduled, now).unwrap();
    let entries = list_backups(&root).unwrap();

    assert_eq!(entries[0].id, created.entry.id);
    assert_eq!(entries[0].document_updated_at, "2026-07-15T02:04:00.000Z");
    assert_eq!(read_backup(&root, &created.entry.id).unwrap(), document);
}

#[test]
fn backup_id_rejects_path_traversal_and_unknown_files() {
    let root = test_root("safe-id");
    assert!(read_backup(&root, "../story-studio-data.json").is_err());
    assert!(read_backup(&root, "missing.json").is_err());
}
```

再增加测试：设置 round-trip、损坏设置文件返回错误、`pre-restore` 来源、临时 `.tmp` 文件不进入索引、非受管命名文件被忽略、列表倒序、摘要计数、损坏 JSON 标记为 `corrupted` 且读取失败。

- [x] **Step 2：运行 Rust 目标测试并确认 RED**

Run: `cd apps/studio/src-tauri && cargo test automatic_backup -- --nocapture`

Expected: FAIL，原因是模块、类型和函数尚不存在。

- [x] **Step 3：增加 Chrono 直接依赖和原生领域类型**

在 `Cargo.toml` 增加已有 lockfile 可解析的直接依赖：

```toml
chrono = { version = "0.4", features = [ "clock", "serde" ] }
```

在 `automatic_backup.rs` 定义：

```rust
use chrono::{DateTime, FixedOffset, Local};
use serde_json::Value;
use std::{fs, path::{Path, PathBuf}};

pub const AUTOMATIC_BACKUP_DIRECTORY_NAME: &str = "automatic-backups";
const SETTINGS_FILE_NAME: &str = "automatic-backup-settings.json";

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AutomaticBackupSource {
    Scheduled,
    PreRestore,
}

#[derive(Debug, Clone, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticBackupSettings {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticBackupSummary {
    pub workspace_count: usize,
    pub content_count: usize,
    pub material_count: usize,
    pub assistant_thread_count: usize,
}
```

设置缺失返回 `enabled: true`；设置写入使用 `automatic-backup-settings.json.tmp` 加 rename，不把设置放进备份目录或故事文档。

- [x] **Step 4：实现原子备份、索引、摘要和安全读取**

核心签名保持：

```rust
pub fn load_settings(app_data_dir: &Path) -> Result<AutomaticBackupSettings, String>;
pub fn save_settings(app_data_dir: &Path, settings: &AutomaticBackupSettings) -> Result<(), String>;
pub fn create_backup_at(
    app_data_dir: &Path,
    document: &Value,
    source: AutomaticBackupSource,
    now: DateTime<FixedOffset>,
) -> Result<AutomaticBackupMutationResult, String>;
pub fn list_backups(app_data_dir: &Path) -> Result<Vec<AutomaticBackupEntry>, String>;
pub fn read_backup(app_data_dir: &Path, id: &str) -> Result<Value, String>;
```

文件名固定为：

```text
story-studio-{source}-backup-YYYYMMDDTHHMMSSmmm±HHMM.json
```

写入 `*.json.tmp` 后 rename；ID 必须等于目录扫描得到的合法文件名，且拒绝 `/`、`\\`、`..`、绝对路径和未知文件。损坏文件从文件名解析来源和创建时间，返回 `status: corrupted`、空 `documentUpdatedAt` 和无 summary，不自动删除。

- [x] **Step 5：在 `lib.rs` 注册薄 command**

加入模块并在 handler 注册五个命令：

```rust
mod automatic_backup;

use automatic_backup::{AutomaticBackupEntry, AutomaticBackupMutationResult, AutomaticBackupSettings, AutomaticBackupSource};

#[tauri::command]
fn get_automatic_backup_settings(app: tauri::AppHandle) -> Result<AutomaticBackupSettings, String>;

#[tauri::command]
fn set_automatic_backup_enabled(app: tauri::AppHandle, enabled: bool) -> Result<AutomaticBackupSettings, String>;

#[tauri::command]
fn list_automatic_backups(app: tauri::AppHandle) -> Result<Vec<AutomaticBackupEntry>, String>;

#[tauri::command]
fn create_automatic_backup(
    app: tauri::AppHandle,
    document: Value,
    source: AutomaticBackupSource,
) -> Result<AutomaticBackupMutationResult, String>;

#[tauri::command]
fn read_automatic_backup(app: tauri::AppHandle, id: String) -> Result<Value, String>;
```

所有 command 只负责取得 `app_data_dir()` 并调用模块函数。

- [x] **Step 6：运行目标测试并确认 GREEN**

Run: `cd apps/studio/src-tauri && cargo test automatic_backup -- --nocapture`

Expected: PASS，设置、原子写入、列表、损坏文件和安全 ID 用例全部通过。

- [x] **Step 7：建议提交检查点**

Proposed commit: `feat: 新增 Tauri 自动备份文件服务`

执行提交前必须按 `confirm-commit-push` 确认精确范围，不推送。

**依赖：** 无。

**规模：** M。

**状态：** 已完成。

---

### Task 2：新备份按本机时间自动分层轮换

**用户可验收结果：** 每次成功创建备份后，系统保留最近 24 小时每小时最新一份、第 2～7 天每天最新一份，清理更旧有效文件，同时始终保护全局最新项和所有损坏文件。

**Files:**

- Modify: `apps/studio/src-tauri/src/automatic_backup.rs`
- Modify: `apps/studio/src-tauri/src/lib.rs`

**Interfaces:**

- Consumes: Task 1 `AutomaticBackupEntry`、`create_backup_at()`
- Produces: `select_backup_ids_to_keep(entries, now) -> HashSet<String>`
- Produces: `prune_backups_with(app_data_dir, entries, keep_ids, remove_file) -> Vec<String>` warnings
- Produces command: `prune_automatic_backups`
- Produces: `AutomaticBackupCleanupResult { cleanup_warnings }`
- Updates: `AutomaticBackupMutationResult { entry, cleanup_warnings }`

- [x] **Step 1：先写时间桶和失败隔离测试**

构造固定 `+08:00` 时间 `2026-07-15T12:00:00+08:00`，增加：

```rust
#[test]
fn keeps_latest_backup_per_recent_hour() {
    let entries = entries_at(&[
        ("10-old", "2026-07-15T10:05:00+08:00"),
        ("10-new", "2026-07-15T10:55:00+08:00"),
        ("11-new", "2026-07-15T11:20:00+08:00"),
    ]);

    let kept = select_backup_ids_to_keep(&entries, parse_time("2026-07-15T12:00:00+08:00"));

    assert!(!kept.contains("10-old"));
    assert!(kept.contains("10-new"));
    assert!(kept.contains("11-new"));
}
```

另写用例覆盖：第 2～7 天自然日桶、恰好 24 小时和 7 天边界、超过 7 天、两种来源同桶、全局最新时间回拨兜底、损坏项始终保留、一个 remove 失败后其他旧文件仍被删除且 warning 被收集。

- [x] **Step 2：运行 Rust 目标测试并确认 RED**

Run: `cd apps/studio/src-tauri && cargo test automatic_backup::tests::keeps_latest_backup_per_recent_hour -- --exact`

Expected: FAIL，轮换选择函数尚不存在。

- [x] **Step 3：实现纯时间桶选择**

使用 `DateTime<FixedOffset>` 和备份创建时间；算法顺序固定：

```rust
pub fn select_backup_ids_to_keep(
    entries: &[AutomaticBackupEntry],
    now: DateTime<FixedOffset>,
) -> HashSet<String> {
    // corrupted 永远进入 keep
    // age <= 24h: key = %Y-%m-%d-%H
    // 24h < age <= 7d: key = %Y-%m-%d
    // 每桶选择 createdAt 最大项
    // 最后无条件加入全局 createdAt 最大的有效项
}
```

负 age 视为系统时间回拨，不进入过期删除，并由小时桶与全局最新兜底保留。

- [x] **Step 4：实现删除失败隔离并接入创建流程**

```rust
fn prune_backups_with<F>(
    app_data_dir: &Path,
    entries: &[AutomaticBackupEntry],
    keep_ids: &HashSet<String>,
    mut remove_file: F,
) -> Vec<String>
where
    F: FnMut(&Path) -> std::io::Result<()>,
```

只删除合法索引中的有效 JSON 文件；每个失败转换为 warning 后继续。`create_backup_at()` 先完成新文件 rename，再重新列出、计算 keep 和 prune，并把 warnings 返回前端。

同时在 `lib.rs` 注册可独立重试清理的薄 command：

```rust
#[tauri::command]
fn prune_automatic_backups(
    app: tauri::AppHandle,
) -> Result<AutomaticBackupCleanupResult, String>;
```

该命令重新扫描当前索引并运行同一轮换函数，使文档没有变化的后续检查也能重试上次删除失败项。

- [x] **Step 5：运行全部原生自动备份测试并确认 GREEN**

Run: `cd apps/studio/src-tauri && cargo test automatic_backup -- --nocapture`

Expected: PASS，所有轮换边界和失败隔离用例通过。

- [x] **Step 6：建议提交检查点**

Proposed commit: `feat: 增加自动备份分层轮换`

**依赖：** Task 1。

**规模：** S。

**状态：** 已完成。

---

### Task 3：应用运行时自动检查并允许持久开关

**用户可验收结果：** Tauri 文档加载后立即检查，之后每 10 分钟检查；相同版本不重复写入，检查互斥且失败后可重试；用户关闭后停止、重开后立即恢复。Web 不产生任何自动备份调用。

**Files:**

- Create: `apps/studio/src/modules/storage/automaticBackup.ts`
- Create: `apps/studio/src/modules/storage/automaticBackup.test.ts`
- Create: `apps/studio/src/modules/storage/tauriAutomaticBackup.ts`
- Create: `apps/studio/src/modules/storage/tauriAutomaticBackup.test.ts`
- Create: `apps/studio/src/modules/storage/useAutomaticBackup.ts`
- Create: `apps/studio/src/modules/storage/useAutomaticBackup.test.ts`
- Modify: `apps/studio/src/App.vue`

**Interfaces:**

- Consumes commands from Task 1 and `useStudioData().ready/document`
- Produces `AutomaticBackupClient`
- Produces `createAutomaticBackupController(input)` for isolated tests
- Produces singleton `useAutomaticBackup()` for App and dialog

- [x] **Step 1：定义前端类型和纯判断失败测试**

在 `automaticBackup.test.ts` 覆盖：

```ts
it('detects an existing valid backup for the current document version', () => {
  expect(hasBackupForDocument(entries, '2026-07-15T02:04:00.000Z')).toBe(true)
  expect(hasBackupForDocument(entries, '2026-07-15T02:05:00.000Z')).toBe(false)
})
```

`corrupted` 项和空 `documentUpdatedAt` 不得命中；列表帮助函数按 `createdAt` 倒序；最近成功时间只取 `valid` 项。

- [x] **Step 2：实现领域类型和纯函数并确认 GREEN**

`automaticBackup.ts` 定义：

```ts
export const AUTOMATIC_BACKUP_INTERVAL_MS = 10 * 60 * 1000
export type AutomaticBackupSource = 'scheduled' | 'pre-restore'
export type AutomaticBackupStatus = 'valid' | 'corrupted'

export interface AutomaticBackupSettings {
  enabled: boolean
}

export interface AutomaticBackupEntry {
  id: string
  source: AutomaticBackupSource
  createdAt: string
  documentUpdatedAt: string
  byteSize: number
  status: AutomaticBackupStatus
  summary?: StudioDataBackupSummary
}

export interface AutomaticBackupMutationResult {
  entry: AutomaticBackupEntry
  cleanupWarnings: string[]
}

export interface AutomaticBackupCleanupResult {
  cleanupWarnings: string[]
}

export function hasBackupForDocument(entries: AutomaticBackupEntry[], updatedAt: string): boolean;
```

Run: `pnpm --filter @story-studio/studio test src/modules/storage/automaticBackup.test.ts`

Expected: PASS。

- [x] **Step 3：先写 Tauri client 参数失败测试**

在 `tauriAutomaticBackup.test.ts` 用注入 `invoke` 断言：

```ts
expect(invoke).toHaveBeenCalledWith('create_automatic_backup', {
  document,
  source: 'scheduled',
})
expect(invoke).toHaveBeenCalledWith('read_automatic_backup', { id: 'managed-id.json' })
expect(invoke).toHaveBeenCalledWith('set_automatic_backup_enabled', { enabled: false })
expect(invoke).toHaveBeenCalledWith('prune_automatic_backups')
```

- [x] **Step 4：实现 `AutomaticBackupClient` 并确认 GREEN**

```ts
export interface AutomaticBackupClient {
  getSettings: () => Promise<AutomaticBackupSettings>
  setEnabled: (enabled: boolean) => Promise<AutomaticBackupSettings>
  list: () => Promise<AutomaticBackupEntry[]>
  create: (document: StudioDataDocument, source: AutomaticBackupSource) => Promise<AutomaticBackupMutationResult>
  prune: () => Promise<AutomaticBackupCleanupResult>
  read: (id: string) => Promise<string>
}

export function createTauriAutomaticBackupClient(invokeCommand: TauriInvoke = invoke): AutomaticBackupClient;
```

`read()` 把 command 返回的 JSON value 序列化为字符串，确保恢复仍统一经过 `parseStudioDataBackup()`。

Run: `pnpm --filter @story-studio/studio test src/modules/storage/tauriAutomaticBackup.test.ts`

Expected: PASS。

- [x] **Step 5：先写控制器调度失败测试**

使用 fake timers 和可控 Promise 覆盖：

```ts
it('checks immediately after data is ready and every ten minutes', async () => {
  const controller = createAutomaticBackupController(testInput())
  await controller.start()
  expect(client.list).toHaveBeenCalledTimes(1)

  await vi.advanceTimersByTimeAsync(AUTOMATIC_BACKUP_INTERVAL_MS)
  expect(client.list).toHaveBeenCalledTimes(2)
})
```

另覆盖：Web `isTauri: false` 零调用；关闭开关停止 interval；重开立即检查；相同 `updatedAt` 跳过 create 但仍调用 prune；变化后传 plain JSON 创建 `scheduled`；并发调用只执行一次；设置读取失败时不创建备份；检查失败设置 error 后下一轮清除或更新；清理 warnings 进入可见状态；stop 清理 interval。

- [x] **Step 6：实现控制器和 singleton composable**

```ts
export interface AutomaticBackupController {
  entries: Ref<AutomaticBackupEntry[]>
  settings: Ref<AutomaticBackupSettings>
  isChecking: Ref<boolean>
  lastCheckedAt: Ref<string | undefined>
  nextCheckAt: Ref<string | undefined>
  error: Ref<Error | undefined>
  cleanupWarnings: Ref<string[]>
  start: () => Promise<void>
  stop: () => void
  checkNow: () => Promise<void>
  refresh: () => Promise<void>
  setEnabled: (enabled: boolean) => Promise<void>
  read: (id: string) => Promise<string>
  createProtection: (document: StudioDataDocument) => Promise<void>
}
```

`checkNow()` 在 `try/finally` 中维护互斥；创建前使用 JSON round-trip 去除 Vue proxy。版本已存在时调用独立 `prune()` 重试清理；创建成功时使用 create result 中的 warnings。`createProtection()` 创建 `pre-restore` 后刷新列表并保存 cleanup warnings。`start()` 等待 `studioData.ready` 后读取设置，关闭则只刷新列表；开启则立即检查并建立 interval。设置读取失败时记录错误且不建立自动写入任务，直到用户成功保存合法开关设置。

- [x] **Step 7：在 App 生命周期启动一次控制器**

`App.vue` 接线：

```ts
import { onMounted, onUnmounted } from 'vue'
import { useAutomaticBackup } from '@/modules/storage/useAutomaticBackup'

const automaticBackup = useAutomaticBackup()

onMounted(() => void automaticBackup.start())
onUnmounted(() => automaticBackup.stop())
```

不得在 `DataBackupDialog` 打开/关闭时启动或停止调度。

- [x] **Step 8：运行前端目标测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/modules/storage/automaticBackup.test.ts src/modules/storage/tauriAutomaticBackup.test.ts src/modules/storage/useAutomaticBackup.test.ts`

Expected: PASS，调度、互斥、开关、重试和 Web 隔离全部通过。

- [x] **Step 9：建议提交检查点**

Proposed commit: `feat: 接入桌面自动备份调度`

**依赖：** Task 1、Task 2。

**规模：** M。

**状态：** 已完成。

---

### Task 4：用户可以在现有对话框查看并保护性恢复自动备份

**用户可验收结果：** Tauri 用户能看到开关、状态和备份列表，损坏项不可恢复；选择有效项后复用现有摘要，确认时先创建保护备份，保护失败不覆盖当前数据。Web 对话框保持原状。

**Files:**

- Create: `apps/studio/src/components/AutomaticBackupPanel.vue`
- Create: `apps/studio/src/components/AutomaticBackupPanel.test.ts`
- Modify: `apps/studio/src/components/DataBackupDialog.vue`
- Modify: `apps/studio/src/components/DataBackupDialog.test.ts`
- Modify: `apps/studio/src/composables/useLocale.ts`
- Modify: `apps/studio/src/composables/useLocale.test.ts`

**Interfaces:**

- Consumes: Task 3 `useAutomaticBackup()`
- Produces component event: `select: [backupId: string]`
- Updates restore state: `pendingAutomaticBackupId?: string`

- [x] **Step 1：先写面板与双语文案失败测试**

源码测试断言面板具有：

```ts
expect(panelSource).toContain("automaticBackup.setEnabled")
expect(panelSource).toContain("automaticBackup.refresh")
expect(panelSource).toContain("entry.status === 'corrupted'")
expect(panelSource).toContain("emit('select', entry.id)")
```

locale 测试覆盖自动备份标题、开关、最近检查、最近成功、下次检查、定时来源、保护来源、损坏状态、刷新、保护失败、读取失败和清理 warning。

- [x] **Step 2：实现 Tauri-only 私有面板**

`AutomaticBackupPanel.vue` 使用 `useAutomaticBackup()`，展示：

- enabled switch；若项目现有 UI 没有 Switch，则使用带 `aria-pressed` 的 Button，不新增依赖。
- 最近检查、有效列表最新成功时间、`nextCheckAt`、有效加损坏总数。
- 检查中、最近 error、`cleanupWarnings`。
- 新到旧列表的来源、创建时间、文档时间、格式化文件大小和摘要。
- 损坏项禁用选择按钮。

组件只 emit ID，不读取或恢复文档。

- [x] **Step 3：先写保护性恢复失败测试**

扩展 `DataBackupDialog.test.ts`，断言：

```ts
expect(componentSource).toContain('v-if="isTauriRuntime()"')
expect(componentSource).toContain('await automaticBackup.read(backupId)')
expect(componentSource).toContain('parseStudioDataBackup(source)')
expect(componentSource).toContain('await automaticBackup.createProtection(document.value)')
expect(componentSource.indexOf('await automaticBackup.createProtection(document.value)'))
  .toBeLessThan(componentSource.indexOf('await replaceDocument(pendingDocument.value)'))
```

模块级行为测试或提取纯协调函数，验证保护 Promise reject 时 `replaceDocument` 调用次数为 0；手动文件导入不创建保护备份；成功恢复后清空 pending ID 并 refresh。

- [x] **Step 4：接入自动备份选择与保护恢复**

`DataBackupDialog.vue` 增加：

```ts
const automaticBackup = useAutomaticBackup()
const pendingAutomaticBackupId = ref<string>()

async function selectAutomaticBackup(backupId: string): Promise<void> {
  resetImportState()
  const source = await automaticBackup.read(backupId)
  pendingDocument.value = parseStudioDataBackup(source)
  pendingAutomaticBackupId.value = backupId
}
```

`confirmRestore()` 中只有 `pendingAutomaticBackupId` 存在时先执行：

```ts
await automaticBackup.createProtection(document.value)
await replaceDocument(pendingDocument.value)
await automaticBackup.refresh()
```

保护失败映射为独立文案，不复用主数据保存错误；手动文件选择成功时显式清空自动备份 ID。

- [x] **Step 5：运行 UI 目标测试并确认 GREEN**

Run: `pnpm --filter @story-studio/studio test src/components/AutomaticBackupPanel.test.ts src/components/DataBackupDialog.test.ts src/composables/useLocale.test.ts src/modules/storage/useAutomaticBackup.test.ts`

Expected: PASS，Tauri-only 展示、损坏禁用、选择、保护失败中止和成功刷新全部通过。

- [x] **Step 6：建议提交检查点**

Proposed commit: `feat: 增加自动备份查看与恢复`

**依赖：** Task 3。

**规模：** M。

**状态：** 已完成。

---

### Task 5：用户流程通过完整验证并完成 SDD 收口

**用户可验收结果：** 自动备份的代码、文档、测试索引和真实桌面流程一致，所有规格验收项有当前证据，活动任务入口恢复空闲。

**Files:**

- Modify: `docs/features/storage.md`
- Modify: `docs/architecture.md`
- Modify: `docs/ai/test-map.md`
- Modify: `docs/specs/2026-07-13-automatic-backup.md`
- Modify: `docs/plans/2026-07/2026-07-13-automatic-backup.md`
- Modify: `docs/plans/2026-07/TODO.md`
- Modify: `tasks/current.md`
- Modify if used: `tasks/handoff.md`

**Interfaces:**

- Consumes all Task 1-4 behavior and verification evidence
- Produces completed Spec/Plan records and current feature facts

- [ ] **Step 1：同步当前功能事实和测试入口**

`storage.md` 必须记录：Tauri-only、10 分钟、分层规则、目录、开关、损坏文件、保护恢复和 Web 边界。`architecture.md` 只补原生自动备份服务边界，不复制细节。`test-map.md` 加入三个 storage 模块测试和面板测试。

- [ ] **Step 2：运行目标验证**

```bash
pnpm --filter @story-studio/studio test src/modules/storage/automaticBackup.test.ts src/modules/storage/tauriAutomaticBackup.test.ts src/modules/storage/useAutomaticBackup.test.ts src/components/AutomaticBackupPanel.test.ts src/components/DataBackupDialog.test.ts src/composables/useLocale.test.ts
cd apps/studio/src-tauri && cargo test automatic_backup -- --nocapture
```

Expected: 全部退出码为 0，记录 Vitest 文件数/测试数和 Rust 测试数。

- [ ] **Step 3：运行全量静态与构建验证**

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
cd apps/studio/src-tauri && cargo test
git diff --check
```

Expected: 全部退出码为 0；记录非阻塞 warning，不用缓存命中替代受影响目标测试证据。

- [ ] **Step 4：恢复验证生成文件**

仅当产生 diff 时恢复：

```bash
git restore apps/studio/tsconfig.app.tsbuildinfo apps/studio/tsconfig.node.tsbuildinfo
```

不得恢复其他用户改动。

- [ ] **Step 5：真实 Tauri 验证完整流程**

Run: `pnpm --filter @story-studio/studio tauri:dev`

按以下顺序记录可观察证据，不发送 AI 请求：

1. 首次数据加载后自动备份区显示开启，目录出现 `scheduled` JSON。
2. 未修改数据等待或手动触发刷新，不生成相同 `updatedAt` 重复文件。
3. 修改故事数据后触发检查，列表出现新版本。
4. 关闭开关后不再检查；重开后立即检查。
5. 放入损坏的受管命名 JSON，列表标记损坏并禁用恢复。
6. 选择有效备份，查看摘要，确认恢复；恢复前列表生成 `pre-restore` 保护点。
7. 使用受控失败路径验证保护写入失败时当前数据不变；若无法稳定注入，记录人工限制并以自动化测试作为主要证据。
8. 构造多时间文件后验证小时/日桶结果与规格一致。

- [ ] **Step 6：执行 REVIEW**

逐条核对规格目标、非目标、17 个 TDD 点和 12 个验收标准；重点检查：路径穿越、API Key 隐私、目录增长、10 分钟 timer 泄漏、并发写入、删除失败、保护失败、Web 零副作用、无 schema 变化和无无关依赖。

- [ ] **Step 7：执行 SHIP 回填**

- Spec/Plan 标记已完成，写入实际测试数、命令、warning、真实运行结果、commit 范围和未覆盖风险。
- 月度 TODO 从当前任务移动到已完成。
- `tasks/current.md` 恢复空闲模板；若 `tasks/handoff.md` 使用过，也恢复空闲模板。
- `git status --short --branch` 只允许本任务预期文件。

- [ ] **Step 8：建议最终提交检查点**

Proposed commit: `docs: 完成 Tauri 自动备份收口`

**依赖：** Task 1、Task 2、Task 3、Task 4。

**规模：** S。

**状态：** 执行中。

---

## 检查点

- [ ] Task 2 完成后运行全部 Rust 自动备份测试并复核原生接口是否仍与计划一致。
- [ ] Task 4 完成后运行全部目标 Vitest，复核恢复顺序和 Web 隔离。
- [ ] 如果范围、数据结构、command 名称、Tauri/Web 边界或验收标准变化，先更新规格和本计划。
- [ ] 每个建议提交检查点都必须先按 `confirm-commit-push` 报告精确范围并获得确认。

## 预计影响文件

- `apps/studio/src-tauri/src/automatic_backup.rs`
- `apps/studio/src-tauri/src/lib.rs`
- `apps/studio/src-tauri/Cargo.toml`
- `apps/studio/src-tauri/Cargo.lock`
- `apps/studio/src/modules/storage/automaticBackup.ts`
- `apps/studio/src/modules/storage/automaticBackup.test.ts`
- `apps/studio/src/modules/storage/tauriAutomaticBackup.ts`
- `apps/studio/src/modules/storage/tauriAutomaticBackup.test.ts`
- `apps/studio/src/modules/storage/useAutomaticBackup.ts`
- `apps/studio/src/modules/storage/useAutomaticBackup.test.ts`
- `apps/studio/src/App.vue`
- `apps/studio/src/components/AutomaticBackupPanel.vue`
- `apps/studio/src/components/AutomaticBackupPanel.test.ts`
- `apps/studio/src/components/DataBackupDialog.vue`
- `apps/studio/src/components/DataBackupDialog.test.ts`
- `apps/studio/src/composables/useLocale.ts`
- `apps/studio/src/composables/useLocale.test.ts`
- `docs/features/storage.md`
- `docs/architecture.md`
- `docs/ai/test-map.md`
- `docs/specs/2026-07-13-automatic-backup.md`
- `docs/plans/2026-07/2026-07-13-automatic-backup.md`
- `docs/plans/2026-07/TODO.md`
- `tasks/current.md`
- `tasks/handoff.md`（仅跨会话时）

## 风险与回滚

- 风险：受管完整 JSON 包含 API Key；只写应用数据目录，不提供网络同步，并在 UI 延续敏感信息警告。
- 风险：本机时区或系统时间回拨造成桶异常；使用带 offset 的创建时间，并无条件保留全局最新有效项与未来时间项。
- 风险：轮换删除失败导致目录增长；失败隔离并持续展示 warning，后续检查重试。
- 风险：应用级 controller 重复创建 timer；singleton 加 start 幂等和 stop 测试。
- 风险：保护备份与恢复之间出现部分成功；保护失败中止，恢复失败沿用内存回滚并保留保护文件。
- 回滚：按 Task 4 → Task 3 → Task 2 → Task 1 逆序移除 UI、调度、轮换和原生 command；自动备份目录属于额外版本文件，回滚不得删除用户已生成备份。

## 完成记录

- 完成时间：未完成。
- 验证结果：尚未执行实现验证。
- 评审结果：尚未进入 REVIEW。
- commit：尚未提交计划或实现。
- 未覆盖风险：以来源规格为准，实施中新增风险必须先回填。
- 后续事项：计划确认后进入隔离工作树执行 Task 1。
