use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::Manager;

const STUDIO_DATA_FILE_NAME: &str = "story-studio-data.json";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_studio_data,
            save_studio_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn load_studio_data(app: tauri::AppHandle) -> Result<Option<Value>, String> {
    load_studio_data_from_path(&studio_data_path(&app)?)
}

#[tauri::command]
fn save_studio_data(app: tauri::AppHandle, document: Value) -> Result<(), String> {
    save_studio_data_to_path(&studio_data_path(&app)?, &document)
}

fn studio_data_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join(STUDIO_DATA_FILE_NAME))
}

fn load_studio_data_from_path(path: &Path) -> Result<Option<Value>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let document = serde_json::from_str(&content).map_err(|error| error.to_string())?;

    Ok(Some(document))
}

fn save_studio_data_to_path(path: &Path, document: &Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let temporary_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(document).map_err(|error| error.to_string())?;

    fs::write(&temporary_path, content).map_err(|error| error.to_string())?;

    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }

    fs::rename(&temporary_path, path).map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn load_returns_none_when_file_is_missing() {
        let path = test_data_path("missing");

        assert_eq!(load_studio_data_from_path(&path).unwrap(), None);
    }

    #[test]
    fn save_writes_json_that_can_be_loaded_again() {
        let path = test_data_path("roundtrip");
        let document = json!({
            "schemaVersion": 1,
            "workspaces": [],
            "activeWorkspaceId": "",
        });

        save_studio_data_to_path(&path, &document).unwrap();

        assert_eq!(load_studio_data_from_path(&path).unwrap(), Some(document));
        let _ = fs::remove_file(path);
    }

    #[test]
    fn load_returns_error_for_invalid_json() {
        let path = test_data_path("invalid");
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(&path, "{ invalid json").unwrap();

        assert!(load_studio_data_from_path(&path).is_err());
        let _ = fs::remove_file(path);
    }

    fn test_data_path(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();

        std::env::temp_dir()
            .join("story-studio-tests")
            .join(format!("{name}-{nonce}.json"))
    }
}
