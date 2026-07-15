use chrono::{DateTime, FixedOffset, SecondsFormat};
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
};

const SETTINGS_FILE_NAME: &str = "automatic-backup-settings.json";
pub const AUTOMATIC_BACKUP_DIRECTORY_NAME: &str = "automatic-backups";
const BACKUP_FILE_PREFIX: &str = "story-studio-";

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AutomaticBackupSource {
    Scheduled,
    PreRestore,
}

#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AutomaticBackupStatus {
    Valid,
    Corrupted,
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

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticBackupEntry {
    pub id: String,
    pub source: AutomaticBackupSource,
    pub created_at: String,
    pub document_updated_at: String,
    pub byte_size: u64,
    pub status: AutomaticBackupStatus,
    pub summary: Option<AutomaticBackupSummary>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticBackupMutationResult {
    pub entry: AutomaticBackupEntry,
    pub cleanup_warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticBackupCleanupResult {
    pub cleanup_warnings: Vec<String>,
}

pub fn load_settings(app_data_dir: &Path) -> Result<AutomaticBackupSettings, String> {
    let path = settings_path(app_data_dir);

    if !path.exists() {
        return Ok(AutomaticBackupSettings { enabled: true });
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub fn save_settings(
    app_data_dir: &Path,
    settings: &AutomaticBackupSettings,
) -> Result<(), String> {
    fs::create_dir_all(app_data_dir).map_err(|error| error.to_string())?;
    let path = settings_path(app_data_dir);
    let temporary_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;

    fs::write(&temporary_path, content).map_err(|error| error.to_string())?;

    if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }

    fs::rename(&temporary_path, &path).map_err(|error| error.to_string())
}

fn settings_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(SETTINGS_FILE_NAME)
}

pub fn create_backup_at(
    app_data_dir: &Path,
    document: &Value,
    source: AutomaticBackupSource,
    now: DateTime<FixedOffset>,
) -> Result<AutomaticBackupMutationResult, String> {
    let directory = backup_directory(app_data_dir);
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let path = available_backup_path(&directory, source, now);
    let temporary_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(document).map_err(|error| error.to_string())?;

    fs::write(&temporary_path, content).map_err(|error| error.to_string())?;
    fs::rename(&temporary_path, &path).map_err(|error| error.to_string())?;

    let id = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "自动备份文件名无效。".to_string())?;
    let entry = read_backup_entry(&path, id, source, now)?;

    let entries = list_backups(app_data_dir)?;
    let mut keep_ids = select_backup_ids_to_keep(&entries, now);
    keep_ids.insert(entry.id.clone());
    let cleanup_warnings = prune_backups_with(app_data_dir, &entries, &keep_ids, |path| {
        fs::remove_file(path)
    });

    Ok(AutomaticBackupMutationResult {
        entry,
        cleanup_warnings,
    })
}

pub fn list_backups(app_data_dir: &Path) -> Result<Vec<AutomaticBackupEntry>, String> {
    let directory = backup_directory(app_data_dir);

    if !directory.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();

    for directory_entry in fs::read_dir(&directory).map_err(|error| error.to_string())? {
        let path = directory_entry.map_err(|error| error.to_string())?.path();
        let Some(id) = path.file_name().and_then(|name| name.to_str()) else {
            continue;
        };
        let Some((source, created_at)) = parse_backup_file_name(id) else {
            continue;
        };

        entries.push((
            created_at,
            read_backup_entry(&path, id, source, created_at)?,
        ));
    }

    entries.sort_by(|(left, _), (right, _)| right.cmp(left));
    Ok(entries.into_iter().map(|(_, entry)| entry).collect())
}

pub fn read_backup(app_data_dir: &Path, id: &str) -> Result<Value, String> {
    let entry = list_backups(app_data_dir)?
        .into_iter()
        .find(|entry| entry.id == id)
        .ok_or_else(|| "自动备份不存在或 ID 无效。".to_string())?;

    if entry.status == AutomaticBackupStatus::Corrupted {
        return Err("自动备份文件已损坏。".to_string());
    }

    let content = fs::read_to_string(backup_directory(app_data_dir).join(entry.id))
        .map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub fn backup_directory(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(AUTOMATIC_BACKUP_DIRECTORY_NAME)
}

pub fn prune_backups_at(
    app_data_dir: &Path,
    now: DateTime<FixedOffset>,
) -> Result<AutomaticBackupCleanupResult, String> {
    let entries = list_backups(app_data_dir)?;
    let keep_ids = select_backup_ids_to_keep(&entries, now);
    let cleanup_warnings = prune_backups_with(app_data_dir, &entries, &keep_ids, |path| {
        fs::remove_file(path)
    });

    Ok(AutomaticBackupCleanupResult { cleanup_warnings })
}

pub fn select_backup_ids_to_keep(
    entries: &[AutomaticBackupEntry],
    now: DateTime<FixedOffset>,
) -> HashSet<String> {
    let mut keep_ids = HashSet::new();
    let mut bucket_latest = HashMap::<String, (DateTime<FixedOffset>, String)>::new();
    let mut global_latest = None::<(DateTime<FixedOffset>, String)>;

    for entry in entries {
        if entry.status == AutomaticBackupStatus::Corrupted {
            keep_ids.insert(entry.id.clone());
            continue;
        }

        let Ok(created_at) = DateTime::parse_from_rfc3339(&entry.created_at) else {
            keep_ids.insert(entry.id.clone());
            continue;
        };
        if global_latest.as_ref().is_none_or(|(latest_at, latest_id)| {
            created_at > *latest_at || (created_at == *latest_at && entry.id > *latest_id)
        }) {
            global_latest = Some((created_at, entry.id.clone()));
        }

        let age = now.signed_duration_since(created_at);
        let bucket = if age < chrono::Duration::zero() || age <= chrono::Duration::hours(24) {
            Some(format!("hour:{}", created_at.format("%Y-%m-%d-%H-%z")))
        } else if age <= chrono::Duration::days(7) {
            Some(format!("day:{}", created_at.format("%Y-%m-%d")))
        } else {
            None
        };

        if let Some(bucket) = bucket {
            update_latest(
                bucket_latest
                    .entry(bucket)
                    .or_insert((created_at, entry.id.clone())),
                created_at,
                &entry.id,
            );
        }
    }

    keep_ids.extend(bucket_latest.into_values().map(|(_, id)| id));
    if let Some((_, id)) = global_latest {
        keep_ids.insert(id);
    }

    keep_ids
}

fn update_latest(
    latest: &mut (DateTime<FixedOffset>, String),
    created_at: DateTime<FixedOffset>,
    id: &str,
) {
    if created_at > latest.0 || (created_at == latest.0 && id > latest.1.as_str()) {
        *latest = (created_at, id.to_string());
    }
}

fn prune_backups_with<F>(
    app_data_dir: &Path,
    entries: &[AutomaticBackupEntry],
    keep_ids: &HashSet<String>,
    mut remove_file: F,
) -> Vec<String>
where
    F: FnMut(&Path) -> std::io::Result<()>,
{
    let directory = backup_directory(app_data_dir);
    let mut warnings = Vec::new();

    for entry in entries {
        if entry.status != AutomaticBackupStatus::Valid
            || keep_ids.contains(&entry.id)
            || parse_backup_file_name(&entry.id).is_none()
        {
            continue;
        }

        if let Err(error) = remove_file(&directory.join(&entry.id)) {
            warnings.push(format!("自动备份 {} 清理失败：{error}", entry.id));
        }
    }

    warnings
}

fn available_backup_path(
    directory: &Path,
    source: AutomaticBackupSource,
    now: DateTime<FixedOffset>,
) -> PathBuf {
    let source_label = match source {
        AutomaticBackupSource::Scheduled => "scheduled",
        AutomaticBackupSource::PreRestore => "pre-restore",
    };
    let timestamp = now.format("%Y%m%dT%H%M%S%3f%z");
    let base_name = format!("{BACKUP_FILE_PREFIX}{source_label}-backup-{timestamp}");
    let mut candidate = directory.join(format!("{base_name}.json"));
    let mut collision = 1_u32;

    while candidate.exists() {
        candidate = directory.join(format!("{base_name}-{collision}.json"));
        collision += 1;
    }

    candidate
}

fn parse_backup_file_name(id: &str) -> Option<(AutomaticBackupSource, DateTime<FixedOffset>)> {
    let name = id.strip_suffix(".json")?.strip_prefix(BACKUP_FILE_PREFIX)?;
    let (source, timestamp) = if let Some(value) = name.strip_prefix("scheduled-backup-") {
        (AutomaticBackupSource::Scheduled, value)
    } else if let Some(value) = name.strip_prefix("pre-restore-backup-") {
        (AutomaticBackupSource::PreRestore, value)
    } else {
        return None;
    };
    let created_at = DateTime::parse_from_str(timestamp, "%Y%m%dT%H%M%S%3f%z")
        .ok()
        .or_else(|| {
            let (timestamp, collision) = timestamp.rsplit_once('-')?;
            collision
                .chars()
                .all(|character| character.is_ascii_digit())
                .then(|| DateTime::parse_from_str(timestamp, "%Y%m%dT%H%M%S%3f%z").ok())
                .flatten()
        })?;

    Some((source, created_at))
}

fn read_backup_entry(
    path: &Path,
    id: &str,
    source: AutomaticBackupSource,
    created_at: DateTime<FixedOffset>,
) -> Result<AutomaticBackupEntry, String> {
    let byte_size = fs::metadata(path).map_err(|error| error.to_string())?.len();
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let document = serde_json::from_str::<Value>(&content);

    match document {
        Ok(document) => Ok(AutomaticBackupEntry {
            id: id.to_string(),
            source,
            created_at: created_at.to_rfc3339_opts(SecondsFormat::Millis, false),
            document_updated_at: document
                .get("updatedAt")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            byte_size,
            status: AutomaticBackupStatus::Valid,
            summary: Some(summarize_document(&document)),
        }),
        Err(_) => Ok(AutomaticBackupEntry {
            id: id.to_string(),
            source,
            created_at: created_at.to_rfc3339_opts(SecondsFormat::Millis, false),
            document_updated_at: String::new(),
            byte_size,
            status: AutomaticBackupStatus::Corrupted,
            summary: None,
        }),
    }
}

fn summarize_document(document: &Value) -> AutomaticBackupSummary {
    AutomaticBackupSummary {
        workspace_count: array_length(document, "workspaces"),
        content_count: array_length(document, "contents"),
        material_count: array_length(document, "materials"),
        assistant_thread_count: array_length(document, "assistantChatThreads"),
    }
}

fn array_length(document: &Value, key: &str) -> usize {
    document
        .get(key)
        .and_then(Value::as_array)
        .map_or(0, Vec::len)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{DateTime, FixedOffset};
    use serde_json::json;
    use std::{
        collections::HashSet,
        time::{SystemTime, UNIX_EPOCH},
    };
    use std::{fs, path::PathBuf};

    #[test]
    fn missing_settings_default_to_enabled() {
        let root = test_root("settings-default");

        assert_eq!(
            load_settings(&root).unwrap(),
            AutomaticBackupSettings { enabled: true }
        );

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn settings_are_saved_atomically_and_loaded_again() {
        let root = test_root("settings-roundtrip");
        let settings = AutomaticBackupSettings { enabled: false };

        save_settings(&root, &settings).unwrap();

        assert_eq!(load_settings(&root).unwrap(), settings);
        assert!(!settings_path(&root).with_extension("json.tmp").exists());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn corrupted_settings_return_an_error() {
        let root = test_root("settings-corrupted");
        fs::create_dir_all(&root).unwrap();
        fs::write(settings_path(&root), "{ invalid json").unwrap();

        assert!(load_settings(&root).is_err());

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn created_backup_is_listed_and_readable() {
        let root = test_root("create-list-read");
        let document = test_document("2026-07-15T02:04:00.000Z");
        let now = parse_time("2026-07-15T10:05:00+08:00");

        let created =
            create_backup_at(&root, &document, AutomaticBackupSource::Scheduled, now).unwrap();
        let entries = list_backups(&root).unwrap();

        assert_eq!(entries[0].id, created.entry.id);
        assert_eq!(entries[0].source, AutomaticBackupSource::Scheduled);
        assert_eq!(entries[0].status, AutomaticBackupStatus::Valid);
        assert_eq!(entries[0].document_updated_at, "2026-07-15T02:04:00.000Z");
        assert_eq!(entries[0].summary.as_ref().unwrap().workspace_count, 1);
        assert_eq!(read_backup(&root, &created.entry.id).unwrap(), document);
        assert!(!backup_directory(&root)
            .join(format!("{}.tmp", created.entry.id))
            .exists());

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn created_backup_supports_negative_utc_offset() {
        let root = test_root("negative-offset");
        let document = test_document("2026-07-15T15:05:00.000Z");

        create_backup_at(
            &root,
            &document,
            AutomaticBackupSource::Scheduled,
            parse_time("2026-07-15T10:05:00-05:00"),
        )
        .unwrap();

        assert_eq!(list_backups(&root).unwrap().len(), 1);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn backups_created_at_the_same_time_receive_distinct_ids() {
        let root = test_root("filename-collision");
        let document = test_document("2026-07-15T02:04:00.000Z");
        let now = parse_time("2026-07-15T10:05:00+08:00");

        let first =
            create_backup_at(&root, &document, AutomaticBackupSource::Scheduled, now).unwrap();
        let second =
            create_backup_at(&root, &document, AutomaticBackupSource::PreRestore, now).unwrap();
        let third =
            create_backup_at(&root, &document, AutomaticBackupSource::Scheduled, now).unwrap();

        assert_ne!(first.entry.id, second.entry.id);
        assert_ne!(first.entry.id, third.entry.id);
        assert_eq!(second.entry.source, AutomaticBackupSource::PreRestore);
        assert!(third.entry.id.ends_with("-1.json"));
        assert_eq!(read_backup(&root, &third.entry.id).unwrap(), document);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn backups_are_listed_by_actual_time_across_utc_offsets() {
        let root = test_root("cross-offset-order");
        let document = test_document("2026-07-15T02:04:00.000Z");

        let earlier = create_backup_at(
            &root,
            &document,
            AutomaticBackupSource::Scheduled,
            parse_time("2026-07-15T10:00:00+08:00"),
        )
        .unwrap();
        let later = create_backup_at(
            &root,
            &document,
            AutomaticBackupSource::Scheduled,
            parse_time("2026-07-14T23:30:00-05:00"),
        )
        .unwrap();

        let entries = list_backups(&root).unwrap();

        assert_eq!(entries[0].id, later.entry.id);
        assert_eq!(entries[1].id, earlier.entry.id);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn corrupted_managed_files_are_kept_but_cannot_be_read() {
        let root = test_root("corrupted");
        let directory = backup_directory(&root);
        fs::create_dir_all(&directory).unwrap();
        let id = "story-studio-pre-restore-backup-20260715T100500000+0800.json";
        fs::write(directory.join(id), "{ invalid json").unwrap();

        let entries = list_backups(&root).unwrap();

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].source, AutomaticBackupSource::PreRestore);
        assert_eq!(entries[0].status, AutomaticBackupStatus::Corrupted);
        assert!(entries[0].summary.is_none());
        assert!(read_backup(&root, id).is_err());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn unmanaged_and_temporary_files_are_ignored() {
        let root = test_root("ignored-files");
        let directory = backup_directory(&root);
        fs::create_dir_all(&directory).unwrap();
        fs::write(directory.join("notes.json"), "{}").unwrap();
        fs::write(
            directory.join("story-studio-scheduled-backup-20260715T100500000+0800.json.tmp"),
            "{}",
        )
        .unwrap();

        assert!(list_backups(&root).unwrap().is_empty());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn backup_id_rejects_path_traversal_and_unknown_files() {
        let root = test_root("safe-id");

        assert!(read_backup(&root, "../story-studio-data.json").is_err());
        assert!(read_backup(&root, "missing.json").is_err());
    }

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

    #[test]
    fn keeps_latest_backup_per_day_from_second_through_seventh_day() {
        let entries = entries_at(&[
            ("day-two-old", "2026-07-13T09:00:00+08:00"),
            ("day-two-new", "2026-07-13T20:00:00+08:00"),
            ("day-six", "2026-07-09T08:00:00+08:00"),
        ]);

        let kept = select_backup_ids_to_keep(&entries, parse_time("2026-07-15T12:00:00+08:00"));

        assert!(!kept.contains("day-two-old"));
        assert!(kept.contains("day-two-new"));
        assert!(kept.contains("day-six"));
    }

    #[test]
    fn retention_boundaries_include_exactly_24_hours_and_7_days() {
        let entries = entries_at(&[
            ("exact-hour", "2026-07-14T12:00:00+08:00"),
            ("exact-week", "2026-07-08T12:00:00+08:00"),
            ("older-than-week", "2026-07-08T11:59:59+08:00"),
            ("global-latest", "2026-07-15T11:00:00+08:00"),
        ]);

        let kept = select_backup_ids_to_keep(&entries, parse_time("2026-07-15T12:00:00+08:00"));

        assert!(kept.contains("exact-hour"));
        assert!(kept.contains("exact-week"));
        assert!(!kept.contains("older-than-week"));
    }

    #[test]
    fn retention_buckets_combine_sources_and_protect_corrupted_files() {
        let mut entries = entries_at(&[
            ("scheduled-old", "2026-07-15T10:05:00+08:00"),
            ("pre-restore-new", "2026-07-15T10:55:00+08:00"),
            ("latest", "2026-07-15T11:20:00+08:00"),
        ]);
        entries[1].source = AutomaticBackupSource::PreRestore;
        entries.push(test_entry(
            "corrupted-old",
            "2026-06-01T10:00:00+08:00",
            AutomaticBackupStatus::Corrupted,
        ));

        let kept = select_backup_ids_to_keep(&entries, parse_time("2026-07-15T12:00:00+08:00"));

        assert!(!kept.contains("scheduled-old"));
        assert!(kept.contains("pre-restore-new"));
        assert!(kept.contains("corrupted-old"));
    }

    #[test]
    fn clock_rollback_still_protects_the_global_latest_valid_backup() {
        let entries = entries_at(&[
            ("current", "2026-07-15T11:00:00+08:00"),
            ("future-old", "2026-07-16T10:00:00+08:00"),
            ("future-latest", "2026-07-16T11:00:00+08:00"),
        ]);

        let kept = select_backup_ids_to_keep(&entries, parse_time("2026-07-15T12:00:00+08:00"));

        assert!(kept.contains("future-latest"));
    }

    #[test]
    fn prune_continues_after_a_delete_failure_and_collects_warning() {
        let root = test_root("prune-failure");
        let keep_id = "story-studio-scheduled-backup-20260715T110000000+0800.json";
        let failing_id = "story-studio-scheduled-backup-20260701T110000000+0800.json";
        let deleted_id = "story-studio-scheduled-backup-20260702T110000000+0800.json";
        let entries = entries_at(&[
            (keep_id, "2026-07-15T11:00:00+08:00"),
            (failing_id, "2026-07-01T11:00:00+08:00"),
            (deleted_id, "2026-07-02T11:00:00+08:00"),
        ]);
        let keep_ids = HashSet::from([keep_id.to_string()]);
        let mut removed = Vec::new();

        let warnings = prune_backups_with(&root, &entries, &keep_ids, |path| {
            let id = path.file_name().unwrap().to_str().unwrap().to_string();
            if id == failing_id {
                return Err(std::io::Error::other("permission denied"));
            }
            removed.push(id);
            Ok(())
        });

        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains(failing_id));
        assert_eq!(removed, vec![deleted_id]);
    }

    fn test_document(updated_at: &str) -> serde_json::Value {
        json!({
            "schemaVersion": 14,
            "updatedAt": updated_at,
            "workspaces": [{ "id": "workspace-1" }],
            "contents": [{ "id": "content-1" }],
            "materials": [{ "id": "material-1" }],
            "assistantChatThreads": [{ "id": "thread-1" }]
        })
    }

    fn entries_at(values: &[(&str, &str)]) -> Vec<AutomaticBackupEntry> {
        values
            .iter()
            .map(|(id, created_at)| test_entry(id, created_at, AutomaticBackupStatus::Valid))
            .collect()
    }

    fn test_entry(
        id: &str,
        created_at: &str,
        status: AutomaticBackupStatus,
    ) -> AutomaticBackupEntry {
        AutomaticBackupEntry {
            id: id.to_string(),
            source: AutomaticBackupSource::Scheduled,
            created_at: parse_time(created_at).to_rfc3339_opts(SecondsFormat::Millis, false),
            document_updated_at: String::new(),
            byte_size: 0,
            status,
            summary: None,
        }
    }

    fn parse_time(value: &str) -> DateTime<FixedOffset> {
        DateTime::parse_from_rfc3339(value).unwrap()
    }

    fn test_root(label: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();

        std::env::temp_dir().join(format!("story-studio-{label}-{unique}"))
    }
}
