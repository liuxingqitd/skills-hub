use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    env, fs,
    path::{Path, PathBuf},
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
    main_file_name: &'static str,
    id: &'static str,
    title: &'static str,
    description: &'static str,
    load_behavior: &'static str,
}

#[tauri::command]
pub fn get_instructions_model() -> InstructionsPageModel {
    let surfaces = instruction_configs()
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
    let (target_path, root_path) = resolve_update_target(&input.path)?;
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

fn scan_agent_instructions(config: &AgentInstructionConfig) -> InstructionSurface {
    let root_file = config.root_dir.join(config.main_file_name);
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
        is_editable: true,
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

fn instruction_configs() -> Vec<AgentInstructionConfig> {
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

    vec![
        AgentInstructionConfig {
            agent: "claude",
            root_dir: claude_root,
            main_file_name: "CLAUDE.md",
            id: "claude:CLAUDE.md",
            title: "~/.claude/CLAUDE.md",
            description: "Claude Code 的用户级全局指令文件。",
            load_behavior:
                "对这台机器上的所有 Claude Code 项目生效，适合放个人级偏好和长期工作流。",
        },
        AgentInstructionConfig {
            agent: "codex",
            root_dir: codex_root,
            main_file_name: "AGENTS.md",
            id: "codex:AGENTS.md",
            title: "~/.codex/AGENTS.md",
            description: "Codex 的全局 AGENTS 指令文件。",
            load_behavior: "作为 Codex 的用户级基础说明，对本机上的 Codex 工作区提供默认行为约束。",
        },
        AgentInstructionConfig {
            agent: "hermes",
            root_dir: hermes_root,
            main_file_name: "AGENTS.md",
            id: "hermes:AGENTS.md",
            title: "~/.hermes/AGENTS.md",
            description: "Hermes Agent 的用户级全局指令文件。",
            load_behavior: "作为 Hermes 的用户级基础说明，对所有 Hermes 工作区提供默认行为约束。",
        },
    ]
}

fn resolve_update_target(path: &str) -> Result<(PathBuf, PathBuf), InstructionCommandError> {
    let requested = PathBuf::from(path);
    if !requested.is_absolute() {
        return Err(InstructionCommandError::new(
            "INVALID_PATH",
            "目标路径无效。",
        ));
    }

    for config in instruction_configs() {
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
