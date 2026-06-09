use serde_json::Value;
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex, OnceLock,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};

const STUDIO_DATA_FILE_NAME: &str = "story-studio-data.json";
const LOCAL_TERMINAL_MODEL_TIMEOUT_MS: u64 = 60_000;
const OPENAI_COMPATIBLE_CHAT_TIMEOUT_MS: u64 = 60_000;
const ASSISTANT_CHAT_STREAM_EVENT: &str = "assistant-chat-stream";

static LOCAL_TERMINAL_CHAT_CANCEL_FLAGS: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> =
    OnceLock::new();

#[derive(Debug, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalTerminalModelResult {
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
    duration_ms: u128,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalTerminalChatStreamEvent {
    run_id: String,
    event: String,
    stream: Option<String>,
    chunk: Option<String>,
    exit_code: Option<i32>,
    duration_ms: Option<u128>,
    error: Option<String>,
}

#[derive(Debug, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalTerminalChatStreamResult {
    exit_code: Option<i32>,
    duration_ms: u128,
}

#[derive(Debug, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalTerminalChatStreamStartResult {
    run_id: String,
    started: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Deserialize, serde::Serialize)]
struct OpenAiCompatibleChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, serde::Serialize)]
struct OpenAiCompatibleChatRequest {
    model: String,
    messages: Vec<OpenAiCompatibleChatMessage>,
    stream: bool,
}

enum StreamReaderEvent {
    Chunk { stream: &'static str, chunk: String },
    Error { stream: &'static str, error: String },
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_studio_data,
            save_studio_data,
            run_local_terminal_model,
            run_local_terminal_chat_stream,
            cancel_local_terminal_chat_stream,
            run_openai_compatible_chat_stream,
            cancel_openai_compatible_chat_stream,
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

#[tauri::command]
fn run_local_terminal_model(
    provider_id: String,
    command: String,
    model: String,
    prompt: String,
) -> Result<LocalTerminalModelResult, String> {
    run_local_terminal_model_process(
        &provider_id,
        &command,
        &model,
        &prompt,
        LOCAL_TERMINAL_MODEL_TIMEOUT_MS,
    )
}

#[tauri::command]
fn run_local_terminal_chat_stream(
    app: tauri::AppHandle,
    run_id: String,
    provider_id: String,
    command: String,
    model: String,
    prompt: String,
) -> Result<LocalTerminalChatStreamStartResult, String> {
    validate_local_terminal_chat_stream_input(&command, &prompt)?;

    let cancel_flag = Arc::new(AtomicBool::new(false));
    cancel_flags()
        .lock()
        .map_err(|_| "无法注册本地命令取消状态。".to_string())?
        .insert(run_id.clone(), Arc::clone(&cancel_flag));

    let thread_run_id = run_id.clone();
    thread::spawn(move || {
        let started_at = Instant::now();
        let result = run_local_terminal_chat_stream_process(
            &thread_run_id,
            &provider_id,
            &command,
            &model,
            &prompt,
            LOCAL_TERMINAL_MODEL_TIMEOUT_MS,
            || cancel_flag.load(Ordering::SeqCst),
            |event| {
                let _ = app.emit(ASSISTANT_CHAT_STREAM_EVENT, event);
            },
        );

        if let Err(error) = result {
            let _ = app.emit(
                ASSISTANT_CHAT_STREAM_EVENT,
                stream_error_event(&thread_run_id, error, started_at.elapsed().as_millis()),
            );
        }

        if let Ok(mut flags) = cancel_flags().lock() {
            flags.remove(&thread_run_id);
        }
    });

    Ok(LocalTerminalChatStreamStartResult {
        run_id,
        started: true,
    })
}

#[tauri::command]
fn cancel_local_terminal_chat_stream(run_id: String) -> Result<bool, String> {
    cancel_chat_stream(run_id)
}

#[tauri::command]
fn run_openai_compatible_chat_stream(
    app: tauri::AppHandle,
    run_id: String,
    provider_id: String,
    base_url: String,
    api_key: String,
    model: String,
    messages: Vec<OpenAiCompatibleChatMessage>,
) -> Result<LocalTerminalChatStreamStartResult, String> {
    validate_openai_compatible_chat_stream_input(&base_url, &api_key, &model, &messages)?;

    let cancel_flag = Arc::new(AtomicBool::new(false));
    cancel_flags()
        .lock()
        .map_err(|_| "无法注册 API 请求取消状态。".to_string())?
        .insert(run_id.clone(), Arc::clone(&cancel_flag));

    let thread_run_id = run_id.clone();
    thread::spawn(move || {
        let started_at = Instant::now();
        let result = run_openai_compatible_chat_stream_process(
            &thread_run_id,
            &provider_id,
            &base_url,
            &api_key,
            &model,
            messages,
            || cancel_flag.load(Ordering::SeqCst),
            |event| {
                let _ = app.emit(ASSISTANT_CHAT_STREAM_EVENT, event);
            },
        );

        if let Err(error) = result {
            let _ = app.emit(
                ASSISTANT_CHAT_STREAM_EVENT,
                stream_error_event(&thread_run_id, error, started_at.elapsed().as_millis()),
            );
        }

        if let Ok(mut flags) = cancel_flags().lock() {
            flags.remove(&thread_run_id);
        }
    });

    Ok(LocalTerminalChatStreamStartResult {
        run_id,
        started: true,
    })
}

#[tauri::command]
fn cancel_openai_compatible_chat_stream(run_id: String) -> Result<bool, String> {
    cancel_chat_stream(run_id)
}

fn cancel_chat_stream(run_id: String) -> Result<bool, String> {
    let flags = cancel_flags()
        .lock()
        .map_err(|_| "无法读取生成取消状态。".to_string())?;

    if let Some(flag) = flags.get(&run_id) {
        flag.store(true, Ordering::SeqCst);
        return Ok(true);
    }

    Ok(false)
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

fn run_local_terminal_model_process(
    provider_id: &str,
    command: &str,
    model: &str,
    prompt: &str,
    timeout_ms: u64,
) -> Result<LocalTerminalModelResult, String> {
    let command = command.trim();

    if command.is_empty() {
        return Err("Terminal 命令不能为空。".to_string());
    }

    if prompt.trim().is_empty() {
        return Err("Prompt 不能为空。".to_string());
    }

    let started_at = Instant::now();
    let (shell, shell_arg) = shell_command();
    let mut child = Command::new(shell)
        .arg(shell_arg)
        .arg(command)
        .env("STORY_STUDIO_PROVIDER_ID", provider_id)
        .env("STORY_STUDIO_MODEL", model)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("本地命令启动失败：{error}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|error| format!("Prompt 写入 stdin 失败：{error}"))?;
    }

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "无法读取本地命令 stdout。".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "无法读取本地命令 stderr。".to_string())?;
    let stdout_reader = thread::spawn(move || read_all(stdout));
    let stderr_reader = thread::spawn(move || read_all(stderr));
    let timeout = Duration::from_millis(timeout_ms);

    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {
                if started_at.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    let stderr = join_reader(stderr_reader, "stderr")?;
                    let timeout_message = if stderr.trim().is_empty() {
                        format!("本地命令执行超时（{} 毫秒）。", timeout_ms)
                    } else {
                        format!("本地命令执行超时（{} 毫秒）。stderr: {stderr}", timeout_ms)
                    };

                    let _ = join_reader(stdout_reader, "stdout");

                    return Err(timeout_message);
                }

                thread::sleep(Duration::from_millis(10));
            }
            Err(error) => return Err(format!("读取本地命令状态失败：{error}")),
        }
    };

    let stdout = join_reader(stdout_reader, "stdout")?;
    let stderr = join_reader(stderr_reader, "stderr")?;

    Ok(LocalTerminalModelResult {
        stdout,
        stderr,
        exit_code: status.code(),
        duration_ms: started_at.elapsed().as_millis(),
    })
}

fn run_local_terminal_chat_stream_process<C, E>(
    run_id: &str,
    provider_id: &str,
    command: &str,
    model: &str,
    prompt: &str,
    timeout_ms: u64,
    is_cancelled: C,
    mut emit_event: E,
) -> Result<LocalTerminalChatStreamResult, String>
where
    C: Fn() -> bool,
    E: FnMut(LocalTerminalChatStreamEvent),
{
    validate_local_terminal_chat_stream_input(command, prompt)?;
    let command = command.trim();

    let started_at = Instant::now();
    let (shell, shell_arg) = shell_command();
    let mut child = Command::new(shell)
        .arg(shell_arg)
        .arg(command)
        .env("STORY_STUDIO_PROVIDER_ID", provider_id)
        .env("STORY_STUDIO_MODEL", model)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("本地命令启动失败：{error}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|error| format!("Prompt 写入 stdin 失败：{error}"))?;
    }

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "无法读取本地命令 stdout。".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "无法读取本地命令 stderr。".to_string())?;
    let (sender, receiver) = mpsc::channel();
    let stdout_reader = spawn_stream_reader("stdout", stdout, sender.clone());
    let stderr_reader = spawn_stream_reader("stderr", stderr, sender);
    let timeout = Duration::from_millis(timeout_ms);

    let status = loop {
        drain_stream_events(&receiver, run_id, &started_at, &mut emit_event)?;

        if is_cancelled() {
            let _ = child.kill();
            let _ = child.wait();
            join_stream_reader(stdout_reader, "stdout")?;
            join_stream_reader(stderr_reader, "stderr")?;
            let message = "生成已停止。".to_string();
            emit_event(stream_error_event(run_id, message.clone(), started_at.elapsed().as_millis()));
            return Err(message);
        }

        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {
                if started_at.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    join_stream_reader(stdout_reader, "stdout")?;
                    join_stream_reader(stderr_reader, "stderr")?;
                    let message = format!("本地命令执行超时（{} 毫秒）。", timeout_ms);
                    emit_event(stream_error_event(run_id, message.clone(), started_at.elapsed().as_millis()));
                    return Err(message);
                }

                thread::sleep(Duration::from_millis(10));
            }
            Err(error) => return Err(format!("读取本地命令状态失败：{error}")),
        }
    };

    join_stream_reader(stdout_reader, "stdout")?;
    join_stream_reader(stderr_reader, "stderr")?;
    drain_stream_events(&receiver, run_id, &started_at, &mut emit_event)?;

    let result = LocalTerminalChatStreamResult {
        exit_code: status.code(),
        duration_ms: started_at.elapsed().as_millis(),
    };

    emit_event(LocalTerminalChatStreamEvent {
        run_id: run_id.to_string(),
        event: "done".to_string(),
        stream: None,
        chunk: None,
        exit_code: result.exit_code,
        duration_ms: Some(result.duration_ms),
        error: None,
    });

    Ok(result)
}

fn validate_local_terminal_chat_stream_input(command: &str, prompt: &str) -> Result<(), String> {
    if command.trim().is_empty() {
        return Err("Terminal 命令不能为空。".to_string());
    }

    if prompt.trim().is_empty() {
        return Err("Prompt 不能为空。".to_string());
    }

    Ok(())
}

fn validate_openai_compatible_chat_stream_input(
    base_url: &str,
    api_key: &str,
    model: &str,
    messages: &[OpenAiCompatibleChatMessage],
) -> Result<(), String> {
    openai_compatible_chat_completions_url(base_url)?;

    if api_key.trim().is_empty() {
        return Err("API Key 不能为空。".to_string());
    }

    if model.trim().is_empty() {
        return Err("模型名称不能为空。".to_string());
    }

    if messages.is_empty() {
        return Err("对话消息不能为空。".to_string());
    }

    Ok(())
}

fn run_openai_compatible_chat_stream_process<C, E>(
    run_id: &str,
    _provider_id: &str,
    base_url: &str,
    api_key: &str,
    model: &str,
    messages: Vec<OpenAiCompatibleChatMessage>,
    is_cancelled: C,
    mut emit_event: E,
) -> Result<LocalTerminalChatStreamResult, String>
where
    C: Fn() -> bool,
    E: FnMut(LocalTerminalChatStreamEvent),
{
    validate_openai_compatible_chat_stream_input(base_url, api_key, model, &messages)?;

    let started_at = Instant::now();
    let url = openai_compatible_chat_completions_url(base_url)?;
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_millis(OPENAI_COMPATIBLE_CHAT_TIMEOUT_MS))
        .build()
        .map_err(|error| format!("API 客户端初始化失败：{error}"))?;
    let request = OpenAiCompatibleChatRequest {
        model: model.trim().to_string(),
        messages,
        stream: true,
    };
    let mut response = client
        .post(url)
        .bearer_auth(api_key.trim())
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .json(&request)
        .send()
        .map_err(|error| format!("API 请求失败：{error}"))?;
    let status = response.status();

    if !status.is_success() {
        let body = response.text().unwrap_or_default();
        return Err(openai_compatible_error_message(status.as_u16(), &body));
    }

    let mut buffer = [0; 4096];
    let mut pending = String::new();

    loop {
        if is_cancelled() {
            let message = "生成已停止。".to_string();
            emit_event(stream_error_event(run_id, message.clone(), started_at.elapsed().as_millis()));
            return Err(message);
        }

        let size = response
            .read(&mut buffer)
            .map_err(|error| format!("读取 API 流式响应失败：{error}"))?;

        if size == 0 {
            break;
        }

        let chunk = String::from_utf8(buffer[..size].to_vec())
            .map_err(|_| "API 流式响应不是有效 UTF-8。".to_string())?;
        pending.push_str(&chunk);
        drain_openai_compatible_sse_lines(&mut pending, run_id, &started_at, &mut emit_event)?;
    }

    if !pending.trim().is_empty() {
        drain_openai_compatible_sse_line(pending.trim(), run_id, &started_at, &mut emit_event)?;
    }

    let result = LocalTerminalChatStreamResult {
        exit_code: Some(0),
        duration_ms: started_at.elapsed().as_millis(),
    };

    emit_event(LocalTerminalChatStreamEvent {
        run_id: run_id.to_string(),
        event: "done".to_string(),
        stream: None,
        chunk: None,
        exit_code: result.exit_code,
        duration_ms: Some(result.duration_ms),
        error: None,
    });

    Ok(result)
}

fn drain_openai_compatible_sse_lines<E>(
    pending: &mut String,
    run_id: &str,
    started_at: &Instant,
    emit_event: &mut E,
) -> Result<(), String>
where
    E: FnMut(LocalTerminalChatStreamEvent),
{
    while let Some(index) = pending.find('\n') {
        let line = pending[..index].trim_end_matches('\r').to_string();
        pending.drain(..=index);
        drain_openai_compatible_sse_line(&line, run_id, started_at, emit_event)?;
    }

    Ok(())
}

fn drain_openai_compatible_sse_line<E>(
    line: &str,
    run_id: &str,
    _started_at: &Instant,
    emit_event: &mut E,
) -> Result<(), String>
where
    E: FnMut(LocalTerminalChatStreamEvent),
{
    let line = line.trim();

    if !line.starts_with("data:") {
        return Ok(());
    }

    let data = line.trim_start_matches("data:").trim();

    if let Some(chunk) = parse_openai_compatible_sse_data(data)? {
        emit_event(stream_chunk_event(run_id, "stdout", chunk));
    }

    Ok(())
}

fn openai_compatible_chat_completions_url(base_url: &str) -> Result<String, String> {
    let normalized = base_url.trim().trim_end_matches('/');

    if normalized.is_empty() {
        return Err("API Base URL 不能为空。".to_string());
    }

    Ok(format!("{normalized}/chat/completions"))
}

fn parse_openai_compatible_sse_data(data: &str) -> Result<Option<String>, String> {
    let data = data.trim();

    if data.is_empty() || data == "[DONE]" {
        return Ok(None);
    }

    let event: OpenAiCompatibleStreamResponse = serde_json::from_str(data)
        .map_err(|error| format!("API 流式响应不是有效 JSON：{error}"))?;

    Ok(event
        .choices
        .into_iter()
        .find_map(|choice| choice.delta.content))
}

fn openai_compatible_error_message(status: u16, body: &str) -> String {
    let message = serde_json::from_str::<OpenAiCompatibleErrorResponse>(body)
        .ok()
        .and_then(|response| response.error.message)
        .filter(|message| !message.trim().is_empty())
        .unwrap_or_else(|| {
            let body = body.trim();

            if body.is_empty() {
                "服务端未返回错误详情。".to_string()
            } else {
                body.to_string()
            }
        });

    format!("API 请求失败（{status}）：{message}")
}

#[derive(Debug, serde::Deserialize)]
struct OpenAiCompatibleStreamResponse {
    choices: Vec<OpenAiCompatibleStreamChoice>,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAiCompatibleStreamChoice {
    delta: OpenAiCompatibleStreamDelta,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAiCompatibleStreamDelta {
    content: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAiCompatibleErrorResponse {
    error: OpenAiCompatibleError,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAiCompatibleError {
    message: Option<String>,
}

fn drain_stream_events<E>(
    receiver: &mpsc::Receiver<StreamReaderEvent>,
    run_id: &str,
    started_at: &Instant,
    emit_event: &mut E,
) -> Result<(), String>
where
    E: FnMut(LocalTerminalChatStreamEvent),
{
    while let Ok(event) = receiver.try_recv() {
        match event {
            StreamReaderEvent::Chunk { stream, chunk } => emit_event(stream_chunk_event(run_id, stream, chunk)),
            StreamReaderEvent::Error { stream, error } => {
                let message = format!("读取本地命令 {stream} 失败：{error}");
                emit_event(stream_error_event(run_id, message.clone(), started_at.elapsed().as_millis()));
                return Err(message);
            }
        }
    }

    Ok(())
}

fn cancel_flags() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    LOCAL_TERMINAL_CHAT_CANCEL_FLAGS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn spawn_stream_reader<R>(
    stream: &'static str,
    mut reader: R,
    sender: mpsc::Sender<StreamReaderEvent>,
) -> thread::JoinHandle<()>
where
    R: Read + Send + 'static,
{
    thread::spawn(move || {
        let mut buffer = [0; 4096];

        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(size) => match String::from_utf8(buffer[..size].to_vec()) {
                    Ok(chunk) => {
                        let _ = sender.send(StreamReaderEvent::Chunk { stream, chunk });
                    }
                    Err(_) => {
                        let _ = sender.send(StreamReaderEvent::Error {
                            stream,
                            error: "输出不是有效 UTF-8。".to_string(),
                        });
                        break;
                    }
                },
                Err(error) => {
                    let _ = sender.send(StreamReaderEvent::Error {
                        stream,
                        error: error.to_string(),
                    });
                    break;
                }
            }
        }
    })
}

fn join_stream_reader(reader: thread::JoinHandle<()>, label: &str) -> Result<(), String> {
    reader
        .join()
        .map_err(|_| format!("读取本地命令 {label} 失败。"))
}

fn stream_chunk_event(run_id: &str, stream: &str, chunk: String) -> LocalTerminalChatStreamEvent {
    LocalTerminalChatStreamEvent {
        run_id: run_id.to_string(),
        event: "chunk".to_string(),
        stream: Some(stream.to_string()),
        chunk: Some(chunk),
        exit_code: None,
        duration_ms: None,
        error: None,
    }
}

fn stream_error_event(run_id: &str, error: String, duration_ms: u128) -> LocalTerminalChatStreamEvent {
    LocalTerminalChatStreamEvent {
        run_id: run_id.to_string(),
        event: "error".to_string(),
        stream: None,
        chunk: None,
        exit_code: None,
        duration_ms: Some(duration_ms),
        error: Some(error),
    }
}

fn shell_command() -> (&'static str, &'static str) {
    if cfg!(windows) {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    }
}

fn read_all<R: std::io::Read>(mut reader: R) -> std::io::Result<Vec<u8>> {
    let mut output = Vec::new();
    std::io::Read::read_to_end(&mut reader, &mut output)?;

    Ok(output)
}

fn join_reader(
    reader: thread::JoinHandle<std::io::Result<Vec<u8>>>,
    label: &str,
) -> Result<String, String> {
    let bytes = reader
        .join()
        .map_err(|_| format!("读取本地命令 {label} 失败。"))?
        .map_err(|error| format!("读取本地命令 {label} 失败：{error}"))?;

    String::from_utf8(bytes).map_err(|_| format!("本地命令 {label} 不是有效 UTF-8。"))
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

    #[test]
    fn local_terminal_model_rejects_empty_command() {
        let result = run_local_terminal_model_process("provider-1", " ", "llama3.1", "hello", 1_000);

        assert!(result.unwrap_err().contains("Terminal 命令不能为空"));
    }

    #[test]
    fn local_terminal_model_writes_prompt_to_stdin_and_reads_stdout() {
        let result = run_local_terminal_model_process("provider-1", "cat", "llama3.1", "hello", 1_000)
            .unwrap();

        assert_eq!(result.stdout, "hello");
        assert_eq!(result.stderr, "");
        assert_eq!(result.exit_code, Some(0));
        assert!(result.duration_ms <= 1_000);
    }

    #[test]
    fn local_terminal_model_preserves_non_zero_exit_output() {
        let result = run_local_terminal_model_process(
            "provider-1",
            "sh -c 'cat 1>&2; exit 7'",
            "llama3.1",
            "bad input",
            1_000,
        )
        .unwrap();

        assert_eq!(result.stdout, "");
        assert_eq!(result.stderr, "bad input");
        assert_eq!(result.exit_code, Some(7));
    }

    #[test]
    fn local_terminal_model_times_out() {
        let result = run_local_terminal_model_process("provider-1", "sleep 2", "llama3.1", "hello", 50);

        assert!(result.unwrap_err().contains("本地命令执行超时"));
    }

    #[test]
    fn local_terminal_chat_stream_emits_stdout_chunks() {
        let mut events = Vec::new();
        let result = run_local_terminal_chat_stream_process(
            "run-1",
            "provider-1",
            "printf 'one'; printf 'two'",
            "llama3.1",
            "hello",
            1_000,
            || false,
            |event| events.push(event),
        )
        .unwrap();

        assert_eq!(result.exit_code, Some(0));
        let stdout = events
            .iter()
            .filter(|event| event.run_id == "run-1" && event.event == "chunk" && event.stream.as_deref() == Some("stdout"))
            .filter_map(|event| event.chunk.as_deref())
            .collect::<String>();

        assert_eq!(stdout, "onetwo");
        assert!(events.iter().any(|event| event.event == "done"));
    }

    #[test]
    fn local_terminal_chat_stream_marks_non_zero_exit() {
        let mut events = Vec::new();
        let result = run_local_terminal_chat_stream_process(
            "run-1",
            "provider-1",
            "printf 'bad' >&2; exit 7",
            "llama3.1",
            "hello",
            1_000,
            || false,
            |event| events.push(event),
        )
        .unwrap();

        assert_eq!(result.exit_code, Some(7));
        assert!(events.iter().any(|event| event.event == "chunk" && event.stream.as_deref() == Some("stderr") && event.chunk.as_deref() == Some("bad")));
        assert!(events.iter().any(|event| event.event == "done" && event.exit_code == Some(7)));
    }

    #[test]
    fn local_terminal_chat_stream_drains_chunks_sent_after_first_drain() {
        let (sender, receiver) = mpsc::channel();
        let started_at = Instant::now();
        let mut events = Vec::new();

        drain_stream_events(&receiver, "run-1", &started_at, &mut |event| events.push(event))
            .unwrap();

        sender
            .send(StreamReaderEvent::Chunk {
                stream: "stdout",
                chunk: "tail".to_string(),
            })
            .unwrap();
        drain_stream_events(&receiver, "run-1", &started_at, &mut |event| events.push(event))
            .unwrap();

        assert!(events.iter().any(|event| event.event == "chunk" && event.chunk.as_deref() == Some("tail")));
    }

    #[test]
    fn local_terminal_chat_stream_can_be_cancelled() {
        let mut events = Vec::new();
        let result = run_local_terminal_chat_stream_process(
            "run-1",
            "provider-1",
            "sleep 2",
            "llama3.1",
            "hello",
            1_000,
            || true,
            |event| events.push(event),
        );

        assert!(result.unwrap_err().contains("已停止"));
        assert!(events.iter().any(|event| event.event == "error" && event.error.as_deref() == Some("生成已停止。")));
    }

    #[test]
    fn local_terminal_chat_stream_times_out() {
        let mut events = Vec::new();
        let result = run_local_terminal_chat_stream_process(
            "run-1",
            "provider-1",
            "sleep 2",
            "llama3.1",
            "hello",
            50,
            || false,
            |event| events.push(event),
        );

        assert!(result.unwrap_err().contains("本地命令执行超时"));
        assert!(events.iter().any(|event| event.event == "error" && event.error.as_deref().is_some_and(|error| error.contains("本地命令执行超时"))));
    }

    #[test]
    fn openai_compatible_base_url_is_normalized_to_chat_completions_url() {
        let url = openai_compatible_chat_completions_url(" https://api.example.com/v1/// ").unwrap();

        assert_eq!(url, "https://api.example.com/v1/chat/completions");
    }

    #[test]
    fn openai_compatible_sse_chunk_reads_delta_content() {
        let chunk = parse_openai_compatible_sse_data(
            r#"{"choices":[{"delta":{"content":"第一段"}}]}"#,
        )
        .unwrap();

        assert_eq!(chunk, Some("第一段".to_string()));
    }

    #[test]
    fn openai_compatible_sse_done_is_ignored() {
        let chunk = parse_openai_compatible_sse_data("[DONE]").unwrap();

        assert_eq!(chunk, None);
    }

    #[test]
    fn openai_compatible_error_body_prefers_server_message() {
        let message = openai_compatible_error_message(
            401,
            r#"{"error":{"message":"invalid api key"}}"#,
        );

        assert_eq!(message, "API 请求失败（401）：invalid api key");
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
