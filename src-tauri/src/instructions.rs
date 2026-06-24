use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    env, fs,
    path::{Path, PathBuf},
    process::Command,
};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct InstructionAsset {
    id: String,
    agent: String,
    kind: String,
    scope: String,
    status: String,
    path: String,
    exists: bool,
    title: String,
    description: String,
    load_behavior: String,
    priority: u8,
    parent_path: Option<String>,
    content_preview: Option<String>,
    content_hash: Option<String>,
    is_editable: bool,
    can_create: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct InstructionSummary {
    main_files: u8,
    rule_files: u8,
    nested_files: u8,
    recommended_missing_files: u8,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct InstructionSurface {
    agent: String,
    root_path: String,
    assets: Vec<InstructionAsset>,
    summary: InstructionSummary,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstructionsPageModel {
    surfaces: Vec<InstructionSurface>,
    assets: Vec<InstructionAsset>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstructionInput {
    path: String,
    content: String,
    previous_hash: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetInstructionPathsInput {
    instruction_paths: HashMap<String, String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectInstructionFileResult {
    path: String,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    #[serde(default = "default_sync_mode")]
    sync_mode: String,
    #[serde(default)]
    instruction_paths: HashMap<String, String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstructionResult {
    ok: bool,
    path: String,
    content_hash: String,
    exists: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstructionCommandError {
    ok: bool,
    code: &'static str,
    error: String,
}

impl InstructionCommandError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            ok: false,
            code,
            error: message.into(),
        }
    }
}

struct AgentInstructionConfig {
    agent: &'static str,
    root_dir: PathBuf,
    main_file_name: String,
    id: &'static str,
    title: &'static str,
    description: &'static str,
    load_behavior: &'static str,
}

fn default_sync_mode() -> String {
    "copy".to_string()
}

#[tauri::command]
pub fn get_instructions_model() -> InstructionsPageModel {
    let settings = read_settings();
    let surfaces = instruction_configs(&settings.instruction_paths)
        .iter()
        .map(scan_agent_instructions)
        .collect::<Vec<_>>();

    let mut assets = surfaces
        .iter()
        .flat_map(|surface| surface.assets.clone())
        .collect::<Vec<_>>();

    assets.sort_by(|left, right| {
        left.agent
            .cmp(&right.agent)
            .then(left.priority.cmp(&right.priority))
            .then(left.path.cmp(&right.path))
    });

    InstructionsPageModel { surfaces, assets }
}

#[tauri::command]
pub fn update_instruction_asset(
    input: UpdateInstructionInput,
) -> Result<UpdateInstructionResult, InstructionCommandError> {
    let settings = read_settings();
    let (target_path, root_path) = resolve_update_target(&input.path, &settings.instruction_paths)?;
    let current_content = fs::read_to_string(&target_path).map_err(|_| {
        InstructionCommandError::new("NOT_FOUND", "目标文件不存在，请重新加载后再试。")
    })?;

    let current_hash = hash_instruction_content(&current_content);
    if input.previous_hash.as_deref() != Some(current_hash.as_str()) {
        return Err(InstructionCommandError::new(
            "STALE_CONTENT",
            "文件内容已经变化，请刷新后重试。",
        ));
    }

    ensure_writable_target(&target_path, &root_path)?;
    fs::write(&target_path, &input.content).map_err(|error| {
        InstructionCommandError::new("INVALID_PATH", format!("写入失败: {error}"))
    })?;

    Ok(UpdateInstructionResult {
        ok: true,
        path: target_path.to_string_lossy().into_owned(),
        content_hash: hash_instruction_content(&input.content),
        exists: true,
    })
}

#[tauri::command]
pub fn get_instruction_paths() -> HashMap<String, String> {
    read_settings().instruction_paths
}

#[tauri::command]
pub fn set_instruction_paths(input: SetInstructionPathsInput) -> HashMap<String, String> {
    let mut settings = read_settings();
    settings.instruction_paths = normalize_instruction_paths(&input.instruction_paths);
    write_settings(&settings);
    settings.instruction_paths
}

#[tauri::command]
pub fn select_instruction_file() -> Result<SelectInstructionFileResult, String> {
    let selected = select_file().map_err(|error| error.to_string())?;
    if selected.trim().is_empty() {
        return Err("No file selected".to_string());
    }
    Ok(SelectInstructionFileResult { path: selected })
}

fn scan_agent_instructions(config: &AgentInstructionConfig) -> InstructionSurface {
    let root_file = config.root_dir.join(&config.main_file_name);
    let root_content = fs::read_to_string(&root_file).ok();
    let exists = root_content.is_some();
    let content_hash = root_content
        .as_ref()
        .map(|content| hash_instruction_content(content));
    let asset = InstructionAsset {
        id: config.id.to_string(),
        agent: config.agent.to_string(),
        kind: "main".to_string(),
        scope: "user".to_string(),
        status: if exists { "found" } else { "missing" }.to_string(),
        path: root_file.to_string_lossy().into_owned(),
        exists,
        title: config.title.to_string(),
        description: config.description.to_string(),
        load_behavior: config.load_behavior.to_string(),
        priority: 0,
        parent_path: None,
        content_preview: root_content,
        content_hash,
        is_editable: exists,
        can_create: false,
    };

    InstructionSurface {
        agent: config.agent.to_string(),
        root_path: config.root_dir.to_string_lossy().into_owned(),
        summary: InstructionSummary {
            main_files: if asset.exists { 1 } else { 0 },
            rule_files: 0,
            nested_files: 0,
            recommended_missing_files: if asset.exists { 0 } else { 1 },
        },
        assets: vec![asset],
    }
}

fn instruction_configs(overrides: &HashMap<String, String>) -> Vec<AgentInstructionConfig> {
    let home = home_dir();
    let claude_root = home.join(".claude");
    let codex_root = env::var_os("CODEX_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| home.join(".codex"));
    let hermes_root = env::var_os("HERMES_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            if cfg!(windows) {
                env::var_os("LOCALAPPDATA")
                    .map(PathBuf::from)
                    .map(|path| path.join("hermes"))
                    .unwrap_or_else(|| home.join(".hermes"))
            } else {
                home.join(".hermes")
            }
        });

    let default_claude_path = claude_root.join("CLAUDE.md");
    let default_codex_path = codex_root.join("AGENTS.md");
    let default_hermes_path = hermes_root.join("AGENTS.md");
    let claude_path = override_path(overrides, "claude").unwrap_or(default_claude_path);
    let codex_path = override_path(overrides, "codex").unwrap_or(default_codex_path);
    let hermes_path = override_path(overrides, "hermes").unwrap_or(default_hermes_path);

    vec![
        AgentInstructionConfig {
            agent: "claude",
            root_dir: parent_or_home(&claude_path),
            main_file_name: file_name_or_default(&claude_path, "CLAUDE.md"),
            id: "claude:CLAUDE.md",
            title: "~/.claude/CLAUDE.md",
            description: "Claude Code 的用户级全局指令文件。",
            load_behavior:
                "对这台机器上的所有 Claude Code 项目生效，适合放个人级偏好和长期工作流。",
        },
        AgentInstructionConfig {
            agent: "codex",
            root_dir: parent_or_home(&codex_path),
            main_file_name: file_name_or_default(&codex_path, "AGENTS.md"),
            id: "codex:AGENTS.md",
            title: "~/.codex/AGENTS.md",
            description: "Codex 的全局 AGENTS 指令文件。",
            load_behavior: "作为 Codex 的用户级基础说明，对本机上的 Codex 工作区提供默认行为约束。",
        },
        AgentInstructionConfig {
            agent: "hermes",
            root_dir: parent_or_home(&hermes_path),
            main_file_name: file_name_or_default(&hermes_path, "AGENTS.md"),
            id: "hermes:AGENTS.md",
            title: "~/.hermes/AGENTS.md",
            description: "Hermes Agent 的用户级全局指令文件。",
            load_behavior: "作为 Hermes 的用户级基础说明，对所有 Hermes 工作区提供默认行为约束。",
        },
    ]
}

fn resolve_update_target(
    path: &str,
    overrides: &HashMap<String, String>,
) -> Result<(PathBuf, PathBuf), InstructionCommandError> {
    let requested = PathBuf::from(path);
    if !requested.is_absolute() {
        return Err(InstructionCommandError::new(
            "INVALID_PATH",
            "目标路径无效。",
        ));
    }

    for config in instruction_configs(overrides) {
        let target = config.root_dir.join(config.main_file_name);
        if normalize_path(&requested) == normalize_path(&target) {
            return Ok((target, config.root_dir));
        }
    }

    Err(InstructionCommandError::new(
        "INVALID_PATH",
        "目标路径不在允许更新的全局规则范围内。",
    ))
}

fn ensure_writable_target(
    target_path: &Path,
    root_path: &Path,
) -> Result<(), InstructionCommandError> {
    let real_root = fs::canonicalize(root_path)
        .map_err(|_| InstructionCommandError::new("INVALID_PATH", "根目录不存在或无法访问。"))?;
    let parent_path = target_path.parent().ok_or_else(|| {
        InstructionCommandError::new("INVALID_PATH", "目标路径超出了允许写入的根目录。")
    })?;
    let real_parent = fs::canonicalize(parent_path).map_err(|_| {
        InstructionCommandError::new("INVALID_PATH", "目标路径超出了允许写入的根目录。")
    })?;

    if !is_inside(&real_root, &real_parent) {
        return Err(InstructionCommandError::new(
            "INVALID_PATH",
            "目标路径超出了允许写入的根目录。",
        ));
    }

    let metadata = fs::symlink_metadata(target_path).map_err(|error| {
        InstructionCommandError::new("INVALID_PATH", format!("无法验证目标路径: {error}"))
    })?;
    if !metadata.file_type().is_file() || metadata.file_type().is_symlink() {
        return Err(InstructionCommandError::new(
            "INVALID_PATH",
            "目标路径不是可直接写入的普通文件。",
        ));
    }

    Ok(())
}

fn hash_instruction_content(content: &str) -> String {
    let normalized = content
        .strip_prefix('\u{feff}')
        .unwrap_or(content)
        .replace("\r\n", "\n");
    let digest = Sha256::digest(normalized.as_bytes());
    digest[..8]
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>()
}

fn normalize_path(path: &Path) -> PathBuf {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(path)
    };

    if cfg!(windows) {
        PathBuf::from(absolute.to_string_lossy().to_lowercase())
    } else {
        absolute
    }
}

fn is_inside(root: &Path, candidate: &Path) -> bool {
    candidate == root || candidate.starts_with(root)
}

fn settings_path() -> PathBuf {
    env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("config")
        .join("settings.json")
}

fn read_settings() -> AppSettings {
    fs::read_to_string(settings_path())
        .ok()
        .and_then(|content| serde_json::from_str::<AppSettings>(&content).ok())
        .map(|mut settings| {
            settings.instruction_paths = normalize_instruction_paths(&settings.instruction_paths);
            settings
        })
        .unwrap_or_default()
}

fn write_settings(settings: &AppSettings) {
    let path = settings_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(content) = serde_json::to_string_pretty(settings) {
        let _ = fs::write(path, format!("{content}\n"));
    }
}

fn normalize_instruction_paths(paths: &HashMap<String, String>) -> HashMap<String, String> {
    let mut normalized = HashMap::new();
    for agent in ["claude", "codex", "hermes"] {
        if let Some(path) = paths
            .get(agent)
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        {
            normalized.insert(agent.to_string(), path.to_string());
        }
    }
    normalized
}

fn override_path(paths: &HashMap<String, String>, agent: &str) -> Option<PathBuf> {
    paths
        .get(agent)
        .map(|path| path.trim())
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
}

fn parent_or_home(path: &Path) -> PathBuf {
    path.parent().map(PathBuf::from).unwrap_or_else(home_dir)
}

fn file_name_or_default(path: &Path, fallback: &str) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

fn select_file() -> std::io::Result<String> {
    if cfg!(target_os = "macos") {
        let output = Command::new("osascript")
            .args([
                "-e",
                "POSIX path of (choose file with prompt \"选择全局规则 Markdown 文件\" of type {\"md\"})",
            ])
            .output()?;
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    if cfg!(target_os = "windows") {
        let script = [
            "Add-Type -AssemblyName System.Windows.Forms",
            "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
            "$dialog.Title = '选择全局规则 Markdown 文件'",
            "$dialog.Filter = 'Markdown files (*.md)|*.md|All files (*.*)|*.*'",
            "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.FileName }",
        ]
        .join("; ");
        let output = Command::new("powershell.exe")
            .args(["-NoProfile", "-STA", "-Command", &script])
            .output()?;
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    for (command, args) in [
        (
            "zenity",
            vec![
                "--file-selection",
                "--title=选择全局规则 Markdown 文件",
                "--file-filter=Markdown files | *.md",
            ],
        ),
        ("kdialog", vec!["--getopenfilename", ".", "*.md"]),
    ] {
        if let Ok(output) = Command::new(command).args(args).output() {
            let selected = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !selected.is_empty() {
                return Ok(selected);
            }
        }
    }

    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "File picker unavailable",
    ))
}

fn home_dir() -> PathBuf {
    if let Some(home) = env::var_os("HOME") {
        return PathBuf::from(home);
    }
    if let Some(profile) = env::var_os("USERPROFILE") {
        return PathBuf::from(profile);
    }
    match (env::var_os("HOMEDRIVE"), env::var_os("HOMEPATH")) {
        (Some(drive), Some(path)) => PathBuf::from(drive).join(path),
        _ => PathBuf::from("."),
    }
}

#[cfg(test)]
mod tests {
    use super::hash_instruction_content;

    #[test]
    fn hash_normalizes_bom_and_crlf() {
        assert_eq!(
            hash_instruction_content("hello\nworld\n"),
            hash_instruction_content("\u{feff}hello\r\nworld\r\n")
        );
    }
}
