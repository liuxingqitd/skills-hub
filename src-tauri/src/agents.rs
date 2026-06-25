use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    env, fs, io,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentDefinition {
    pub(crate) id: String,
    pub(crate) name: String,
    skills_path: String,
    description: String,
    homepage: String,
    pub(crate) enabled: bool,
    #[serde(default)]
    builtin: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAgentsInput {
    agents: Vec<AgentDefinition>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateAgentPathInput {
    path: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillNameInput {
    skill_name: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillContentInput {
    path: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleCustomSkillInput {
    skill_name: String,
    is_custom: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetSkillCategoriesInput {
    skill_name: String,
    category_ids: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDraftInput {
    name: String,
    desc: String,
    icon: String,
    color: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCategoryInput {
    id: String,
    name: String,
    desc: String,
    icon: String,
    color: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCategoryInput {
    id: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplySyncInput {
    skill_name: Option<String>,
    types: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallSkillInput {
    source: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OkResult {
    ok: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillContentResult {
    content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentPathValidation {
    input_path: String,
    resolved_path: String,
    status: String,
    skill_count: usize,
    message: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    id: String,
    name: String,
    icon: String,
    desc: String,
    color: String,
    order: i64,
    is_preset: bool,
    keywords: Vec<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillBoardCell {
    agent_id: String,
    agent_name: String,
    status: String,
    display_status: String,
    target_path: String,
    detail: String,
    exists: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallState {
    skill_name: String,
    agent_id: String,
    agent_name: String,
    status: String,
    source_path: Option<String>,
    target_path: String,
    exists: bool,
    is_managed: bool,
    detail: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillRecord {
    name: String,
    description: String,
    source_path: String,
    master_agent_id: String,
    skill_file_path: String,
    has_skill_md: bool,
    updated_at: String,
    is_custom: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegistryRow {
    #[serde(flatten)]
    skill: SkillRecord,
    states: Vec<SkillInstallState>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillBoardRow {
    name: String,
    description: String,
    source_path: String,
    skill_file_path: String,
    can_sync: bool,
    missing_count: usize,
    category_ids: Vec<String>,
    cells: Vec<SkillBoardCell>,
    raw: RegistryRow,
    is_custom: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillBoardModel {
    agents: Vec<AgentDefinition>,
    rows: Vec<SkillBoardRow>,
    categories: Vec<Category>,
    pending_sync_count: usize,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncAction {
    r#type: String,
    skill_name: String,
    agent_id: String,
    agent_name: String,
    source_path: Option<String>,
    target_path: String,
    reason: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncFailedAction {
    #[serde(flatten)]
    action: SyncAction,
    error: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncExecutionResult {
    completed: Vec<SyncAction>,
    skipped: Vec<SyncAction>,
    failed: Vec<SyncFailedAction>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredInstallSkill {
    name: String,
    source_path: String,
    skill_file_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallCompleted {
    skill_name: String,
    agent_id: String,
    agent_name: String,
    target_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallSkipped {
    #[serde(flatten)]
    completed: SkillInstallCompleted,
    reason: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallFailed {
    #[serde(flatten)]
    completed: SkillInstallCompleted,
    error: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallResult {
    source: String,
    source_kind: String,
    discovered: Vec<DiscoveredInstallSkill>,
    completed: Vec<SkillInstallCompleted>,
    skipped: Vec<SkillInstallSkipped>,
    failed: Vec<SkillInstallFailed>,
}

#[derive(Clone)]
struct DiscoveredSkill {
    name: String,
    source_path: PathBuf,
    skill_file_path: PathBuf,
    mtime: Option<std::time::SystemTime>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EditableConfig {
    version: u8,
    agents: Vec<AgentDefinition>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacySelection {
    enabled_ids: Vec<String>,
    #[allow(dead_code)]
    customized: Option<bool>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WritableConfig {
    version: u8,
    agents: Vec<AgentDefinition>,
}

#[tauri::command]
pub fn get_agents(app: tauri::AppHandle) -> Vec<AgentDefinition> {
    read_agents_config(&app).unwrap_or_else(default_agents)
}

#[tauri::command]
pub fn save_agents_config(
    app: tauri::AppHandle,
    input: SaveAgentsInput,
) -> Result<Vec<AgentDefinition>, String> {
    let mut seen = std::collections::HashSet::new();
    for agent in &input.agents {
        if agent.id.trim().is_empty()
            || agent.name.trim().is_empty()
            || agent.skills_path.trim().is_empty()
        {
            return Err("Agent 配置不完整。".to_string());
        }
        if !seen.insert(agent.id.trim().to_string()) {
            return Err(format!("Duplicate agent id: {}", agent.id));
        }
    }

    let normalized = input
        .agents
        .into_iter()
        .map(|agent| AgentDefinition {
            id: agent.id.trim().to_string(),
            name: agent.name.trim().to_string(),
            skills_path: agent.skills_path.trim().to_string(),
            description: agent.description.trim().to_string(),
            homepage: agent.homepage.trim().to_string(),
            enabled: agent.enabled,
            builtin: agent.builtin,
        })
        .collect::<Vec<_>>();

    let path = agents_config_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("创建配置目录失败: {error}"))?;
    }

    let payload = serde_json::to_string_pretty(&WritableConfig {
        version: 2,
        agents: normalized,
    })
    .map_err(|error| format!("序列化 Agent 配置失败: {error}"))?;
    fs::write(path, payload).map_err(|error| format!("保存 Agent 配置失败: {error}"))?;

    Ok(read_agents_config(&app).unwrap_or_else(default_agents))
}

#[tauri::command]
pub fn validate_agent_path(input: ValidateAgentPathInput) -> AgentPathValidation {
    let resolved = expand_agent_path(&input.path);
    match fs::metadata(&resolved) {
        Ok(metadata) if !metadata.is_dir() => AgentPathValidation {
            input_path: input.path,
            resolved_path: path_to_string(&resolved),
            status: "not-directory".to_string(),
            skill_count: 0,
            message: "路径存在，但不是文件夹".to_string(),
        },
        Ok(_) => match count_skill_dirs(&resolved) {
            Ok(count) if count > 0 => AgentPathValidation {
                input_path: input.path,
                resolved_path: path_to_string(&resolved),
                status: "ok".to_string(),
                skill_count: count,
                message: format!("已找到 {count} 个 Skill"),
            },
            Ok(_) => AgentPathValidation {
                input_path: input.path,
                resolved_path: path_to_string(&resolved),
                status: "empty".to_string(),
                skill_count: 0,
                message: "目录可访问，但没有发现 Skill".to_string(),
            },
            Err(error) if error.kind() == io::ErrorKind::PermissionDenied => AgentPathValidation {
                input_path: input.path,
                resolved_path: path_to_string(&resolved),
                status: "no-access".to_string(),
                skill_count: 0,
                message: "没有权限读取此目录".to_string(),
            },
            Err(_) => AgentPathValidation {
                input_path: input.path,
                resolved_path: path_to_string(&resolved),
                status: "missing".to_string(),
                skill_count: 0,
                message: "路径不存在".to_string(),
            },
        },
        Err(error) if error.kind() == io::ErrorKind::PermissionDenied => AgentPathValidation {
            input_path: input.path,
            resolved_path: path_to_string(&resolved),
            status: "no-access".to_string(),
            skill_count: 0,
            message: "没有权限读取此目录".to_string(),
        },
        Err(_) => AgentPathValidation {
            input_path: input.path,
            resolved_path: path_to_string(&resolved),
            status: "missing".to_string(),
            skill_count: 0,
            message: "路径不存在".to_string(),
        },
    }
}

#[tauri::command]
pub fn get_skill_board_model(app: tauri::AppHandle) -> SkillBoardModel {
    build_skill_board_model(&app)
}

#[tauri::command]
pub fn get_skill_content(input: SkillContentInput) -> SkillContentResult {
    let content =
        read_safe_home_file(&input.path).unwrap_or_else(|| "未找到 SKILL.md。".to_string());
    SkillContentResult { content }
}

#[tauri::command]
pub fn get_categories(app: tauri::AppHandle) -> Vec<Category> {
    read_categories(&app)
}

#[tauri::command]
pub fn create_category(
    app: tauri::AppHandle,
    input: CategoryDraftInput,
) -> Result<Category, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("名称不能为空".to_string());
    }

    let mut categories = read_categories(&app);
    let max_order = categories
        .iter()
        .map(|category| category.order)
        .max()
        .unwrap_or(0);
    let category = Category {
        id: format!("cat-{}-{}", timestamp_millis(), max_order + 1),
        name: name.to_string(),
        icon: empty_to_default(input.icon.trim(), "📦"),
        desc: input.desc.trim().to_string(),
        color: empty_to_default(input.color.trim(), "oklch(55% 0.02 240)"),
        order: max_order + 1,
        is_preset: false,
        keywords: Vec::new(),
    };

    categories.push(category.clone());
    write_json_config(&app, "categories.json", &categories)?;
    Ok(category)
}

#[tauri::command]
pub fn update_category(
    app: tauri::AppHandle,
    input: UpdateCategoryInput,
) -> Result<Category, String> {
    let name = input.name.trim();
    if input.id.trim().is_empty() || name.is_empty() {
        return Err("参数无效".to_string());
    }

    let mut categories = read_categories(&app);
    let index = categories
        .iter()
        .position(|category| category.id == input.id)
        .ok_or_else(|| "分类不存在".to_string())?;
    categories[index].name = name.to_string();
    categories[index].desc = input.desc.trim().to_string();
    categories[index].icon = empty_to_default(input.icon.trim(), "📦");
    categories[index].color = empty_to_default(input.color.trim(), "oklch(55% 0.02 240)");

    let updated = categories[index].clone();
    write_json_config(&app, "categories.json", &categories)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_category(
    app: tauri::AppHandle,
    input: DeleteCategoryInput,
) -> Result<OkResult, String> {
    if input.id.trim().is_empty() {
        return Err("缺少 id 参数".to_string());
    }

    let mut categories = read_categories(&app);
    categories.retain(|category| category.id != input.id);
    write_json_config(&app, "categories.json", &categories)?;
    Ok(OkResult { ok: true })
}

#[tauri::command]
pub fn set_custom_skill(
    app: tauri::AppHandle,
    input: ToggleCustomSkillInput,
) -> Result<OkResult, String> {
    if input.skill_name.trim().is_empty() {
        return Err("Missing skillName".to_string());
    }

    let mut names = read_custom_skills(&app);
    if input.is_custom {
        if !names.contains(&input.skill_name) {
            names.push(input.skill_name);
        }
    } else {
        names.retain(|name| name != &input.skill_name);
    }
    names.sort();
    names.dedup();
    write_json_config(&app, "custom-skills.json", &names)?;
    Ok(OkResult { ok: true })
}

#[tauri::command]
pub fn set_skill_categories_command(
    app: tauri::AppHandle,
    input: SetSkillCategoriesInput,
) -> Result<OkResult, String> {
    if input.skill_name.trim().is_empty() {
        return Err("Missing skillName".to_string());
    }

    let mut map = read_skill_categories(&app);
    if input.category_ids.is_empty() {
        map.remove(&input.skill_name);
    } else {
        map.insert(input.skill_name, input.category_ids);
    }
    write_json_config(&app, "skill-categories.json", &map)?;
    Ok(OkResult { ok: true })
}

#[tauri::command]
pub fn apply_sync_actions(app: tauri::AppHandle, input: ApplySyncInput) -> SyncExecutionResult {
    let model = build_skill_board_model(&app);
    let requested_types = input.types.into_iter().collect::<HashSet<_>>();
    let mut actions = Vec::new();

    for row in model.rows {
        if input
            .skill_name
            .as_ref()
            .is_some_and(|name| name != &row.name)
        {
            continue;
        }
        for state in row.raw.states {
            if let Some(action) = action_from_state(state) {
                if requested_types.is_empty() || requested_types.contains(&action.r#type) {
                    actions.push(action);
                }
            }
        }
    }

    apply_actions(actions, read_sync_mode(&app))
}

#[tauri::command]
pub fn remove_skill(app: tauri::AppHandle, input: SkillNameInput) -> Result<OkResult, String> {
    if input.skill_name.trim().is_empty() {
        return Err("Missing skillName".to_string());
    }

    let mut roots = get_agents(app.clone())
        .into_iter()
        .map(|agent| PathBuf::from(agent.skills_path))
        .collect::<Vec<_>>();
    roots.push(source_skills_dir());

    for root in roots {
        let target = root.join(&input.skill_name);
        if target.exists() {
            ensure_child_path(&root, &target)?;
            fs::remove_dir_all(&target)
                .or_else(|_| fs::remove_file(&target))
                .map_err(|error| format!("删除失败: {error}"))?;
        }
    }

    Ok(OkResult { ok: true })
}

#[tauri::command]
pub fn install_skill_source_command(
    app: tauri::AppHandle,
    input: InstallSkillInput,
) -> Result<SkillInstallResult, String> {
    install_skill_source(&app, &input.source)
}

fn build_skill_board_model(app: &tauri::AppHandle) -> SkillBoardModel {
    let agents = get_agents(app.clone())
        .into_iter()
        .filter(|agent| agent.enabled)
        .collect::<Vec<_>>();
    let categories = read_categories(app);
    let skill_categories = read_skill_categories(app);
    let custom_skills = read_custom_skills(app).into_iter().collect::<HashSet<_>>();
    let skills = scan_skills(&agents);

    let mut rows = skills
        .into_iter()
        .map(|skill| {
            let states = agents
                .iter()
                .map(|agent| classify_install_state(&skill, agent))
                .collect::<Vec<_>>();
            let cells = states
                .iter()
                .map(|state| SkillBoardCell {
                    agent_id: state.agent_id.clone(),
                    agent_name: state.agent_name.clone(),
                    status: state.status.clone(),
                    display_status: display_status(&state.status).to_string(),
                    target_path: state.target_path.clone(),
                    detail: state.detail.clone(),
                    exists: state.exists,
                })
                .collect::<Vec<_>>();
            let missing_count = states
                .iter()
                .filter(|state| {
                    matches!(state.status.as_str(), "missing" | "drifted")
                        && state.source_path.is_some()
                })
                .count();
            let is_custom = custom_skills.contains(&skill.name);
            let raw = RegistryRow {
                skill: skill.clone(),
                states,
            };

            SkillBoardRow {
                name: skill.name.clone(),
                description: skill.description.clone(),
                source_path: skill.source_path.clone(),
                skill_file_path: skill.skill_file_path.clone(),
                can_sync: missing_count > 0,
                missing_count,
                category_ids: skill_categories
                    .get(&skill.name)
                    .cloned()
                    .unwrap_or_default(),
                cells,
                raw,
                is_custom,
            }
        })
        .collect::<Vec<_>>();

    rows.sort_by(|left, right| left.name.cmp(&right.name));
    let pending_sync_count = rows.iter().map(|row| row.missing_count).sum();

    SkillBoardModel {
        agents,
        rows,
        categories,
        pending_sync_count,
    }
}

fn read_safe_home_file(path: &str) -> Option<String> {
    let requested = PathBuf::from(path);
    let resolved = normalize_path(&requested);
    let home = normalize_path(&home_dir());
    if !is_inside(&home, &resolved) {
        return None;
    }
    fs::read_to_string(resolved).ok()
}

fn write_json_config<T: Serialize>(
    app: &tauri::AppHandle,
    filename: &str,
    value: &T,
) -> Result<(), String> {
    let path = writable_config_path(app, filename)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("创建配置目录失败: {error}"))?;
    }
    let payload =
        serde_json::to_string_pretty(value).map_err(|error| format!("序列化配置失败: {error}"))?;
    fs::write(path, format!("{payload}\n")).map_err(|error| format!("写入配置失败: {error}"))
}

fn empty_to_default(value: &str, default_value: &str) -> String {
    if value.is_empty() {
        default_value.to_string()
    } else {
        value.to_string()
    }
}

fn action_from_state(state: SkillInstallState) -> Option<SyncAction> {
    match state.status.as_str() {
        "missing" => Some(SyncAction {
            r#type: "create_copy".to_string(),
            skill_name: state.skill_name,
            agent_id: state.agent_id,
            agent_name: state.agent_name,
            source_path: state.source_path,
            target_path: state.target_path,
            reason: "目标目录中缺少这个技能。".to_string(),
        }),
        "drifted" => Some(SyncAction {
            r#type: "repair_copy".to_string(),
            skill_name: state.skill_name,
            agent_id: state.agent_id,
            agent_name: state.agent_name,
            source_path: state.source_path,
            target_path: state.target_path,
            reason: "目标已存在，但内容与受管主源不一致。".to_string(),
        }),
        "conflict" => Some(SyncAction {
            r#type: "skip_conflict".to_string(),
            skill_name: state.skill_name,
            agent_id: state.agent_id,
            agent_name: state.agent_name,
            source_path: state.source_path,
            target_path: state.target_path,
            reason: "未受管目录阻塞了自动同步。".to_string(),
        }),
        "orphaned" => Some(SyncAction {
            r#type: "remove_orphan".to_string(),
            skill_name: state.skill_name,
            agent_id: state.agent_id,
            agent_name: state.agent_name,
            source_path: None,
            target_path: state.target_path,
            reason: "目标存在，但缺少受管主源。".to_string(),
        }),
        _ => None,
    }
}

fn apply_actions(actions: Vec<SyncAction>, mode: String) -> SyncExecutionResult {
    let mut result = SyncExecutionResult {
        completed: Vec::new(),
        skipped: Vec::new(),
        failed: Vec::new(),
    };

    for action in actions {
        if action.r#type == "skip_conflict" || action.r#type == "remove_orphan" {
            result.skipped.push(action);
            continue;
        }

        let outcome = match action.source_path.as_ref() {
            Some(source_path) if action.r#type == "repair_copy" => repair_skill(
                Path::new(source_path),
                Path::new(&action.target_path),
                &mode,
            ),
            Some(source_path) => deploy_skill(
                Path::new(source_path),
                Path::new(&action.target_path),
                &mode,
            ),
            None => Err("Missing source path for sync action.".to_string()),
        };

        match outcome {
            Ok(()) => result.completed.push(action),
            Err(error) => result.failed.push(SyncFailedAction { action, error }),
        }
    }

    result
}

fn deploy_skill(source_path: &Path, target_path: &Path, mode: &str) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("创建目标目录失败: {error}"))?;
    }

    if mode == "symlink" {
        remove_path_if_exists(target_path)?;
        create_dir_symlink(source_path, target_path)
    } else {
        copy_dir_all(source_path, target_path)
    }
}

fn repair_skill(source_path: &Path, target_path: &Path, mode: &str) -> Result<(), String> {
    if mode == "symlink" {
        remove_path_if_exists(target_path)?;
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("创建目标目录失败: {error}"))?;
        }
        create_dir_symlink(source_path, target_path)
    } else {
        let tmp_target = target_path.with_file_name(format!(
            "{}.tmp-{}",
            target_path
                .file_name()
                .map(|name| name.to_string_lossy())
                .unwrap_or_default(),
            timestamp_millis()
        ));
        copy_dir_all(source_path, &tmp_target)?;
        remove_path_if_exists(target_path)?;
        fs::rename(&tmp_target, target_path).map_err(|error| format!("替换目标失败: {error}"))
    }
}

fn copy_dir_all(source: &Path, target: &Path) -> Result<(), String> {
    if !source.is_dir() {
        return Err(format!("源路径不是目录: {}", path_to_string(source)));
    }

    fs::create_dir_all(target).map_err(|error| format!("创建目标目录失败: {error}"))?;
    for entry in fs::read_dir(source).map_err(|error| format!("读取源目录失败: {error}"))? {
        let entry = entry.map_err(|error| format!("读取源目录失败: {error}"))?;
        let file_type = entry
            .file_type()
            .map_err(|error| format!("读取文件类型失败: {error}"))?;
        let destination = target.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_all(&entry.path(), &destination)?;
        } else if file_type.is_file() {
            fs::copy(entry.path(), destination)
                .map_err(|error| format!("复制文件失败: {error}"))?;
        }
    }
    Ok(())
}

fn remove_path_if_exists(path: &Path) -> Result<(), String> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(format!("读取目标路径失败: {error}")),
    };

    if metadata.file_type().is_symlink() || metadata.is_file() {
        fs::remove_file(path).map_err(|error| format!("删除文件失败: {error}"))
    } else if metadata.is_dir() {
        fs::remove_dir_all(path).map_err(|error| format!("删除目录失败: {error}"))
    } else {
        fs::remove_file(path).map_err(|error| format!("删除文件失败: {error}"))
    }
}

#[cfg(unix)]
fn create_dir_symlink(source_path: &Path, target_path: &Path) -> Result<(), String> {
    std::os::unix::fs::symlink(source_path, target_path)
        .map_err(|error| format!("创建软链接失败: {error}"))
}

#[cfg(windows)]
fn create_dir_symlink(source_path: &Path, target_path: &Path) -> Result<(), String> {
    std::os::windows::fs::symlink_dir(source_path, target_path)
        .map_err(|error| format!("创建软链接失败: {error}"))
}

fn install_skill_source(
    app: &tauri::AppHandle,
    raw_source: &str,
) -> Result<SkillInstallResult, String> {
    let source = raw_source.trim().to_string();
    if source.is_empty() {
        return Err("请输入 GitHub skill 项目地址或本地目录。".to_string());
    }

    let prepared = prepare_install_source(&source)?;
    let mut result = SkillInstallResult {
        source: source.clone(),
        source_kind: prepared.kind.clone(),
        discovered: Vec::new(),
        completed: Vec::new(),
        skipped: Vec::new(),
        failed: Vec::new(),
    };

    let install_result = (|| {
        let discovered = discover_installable_skills(&prepared.path)?;
        if discovered.is_empty() {
            return Err("没有找到包含 SKILL.md 的 skill 目录。".to_string());
        }
        result.discovered = discovered
            .iter()
            .map(|skill| DiscoveredInstallSkill {
                name: skill.name.clone(),
                source_path: path_to_string(&skill.source_path),
                skill_file_path: path_to_string(&skill.skill_file_path),
            })
            .collect();

        let agents = get_agents(app.clone())
            .into_iter()
            .filter(|agent| agent.enabled)
            .collect::<Vec<_>>();
        let source_root = source_skills_dir();
        let mode = read_sync_mode(app);

        for skill in discovered {
            let source_target_path = source_root.join(&skill.name);
            let mut source_ready = false;
            if source_target_path.exists() {
                source_ready = true;
            } else if let Err(error) = deploy_skill(&skill.source_path, &source_target_path, &mode)
            {
                result.failed.push(SkillInstallFailed {
                    completed: SkillInstallCompleted {
                        skill_name: skill.name.clone(),
                        agent_id: "source".to_string(),
                        agent_name: "Source".to_string(),
                        target_path: path_to_string(&source_target_path),
                    },
                    error,
                });
            } else {
                source_ready = true;
            }

            if !source_ready {
                continue;
            }

            for agent in &agents {
                let target_path = PathBuf::from(&agent.skills_path).join(&skill.name);
                let completed = SkillInstallCompleted {
                    skill_name: skill.name.clone(),
                    agent_id: agent.id.clone(),
                    agent_name: agent.name.clone(),
                    target_path: path_to_string(&target_path),
                };

                if target_path.exists() {
                    result.skipped.push(SkillInstallSkipped {
                        completed,
                        reason: "目标目录已存在，未覆盖。".to_string(),
                    });
                    continue;
                }

                match deploy_skill(&source_target_path, &target_path, &mode) {
                    Ok(()) => result.completed.push(completed),
                    Err(error) => result.failed.push(SkillInstallFailed { completed, error }),
                }
            }
        }

        Ok(())
    })();

    if let Some(cleanup_path) = prepared.cleanup_path {
        let _ = fs::remove_dir_all(cleanup_path);
    }

    install_result?;
    Ok(result)
}

struct PreparedInstallSource {
    kind: String,
    path: PathBuf,
    cleanup_path: Option<PathBuf>,
}

fn prepare_install_source(source: &str) -> Result<PreparedInstallSource, String> {
    if let Some(repo) = parse_github_repo(source) {
        let temp_root = env::temp_dir().join(format!("skills-hub-install-{}", timestamp_millis()));
        fs::create_dir_all(&temp_root).map_err(|error| format!("创建临时目录失败: {error}"))?;
        let extract_path = download_github_archive(&repo, &temp_root)?;
        let path = if let Some(subdirectory) = repo.subdirectory {
            if subdirectory.contains("..") || subdirectory.starts_with('/') {
                return Err("Invalid subdirectory path".to_string());
            }
            let joined = extract_path.join(subdirectory);
            ensure_child_path(&extract_path, &joined)?;
            joined
        } else {
            extract_path
        };
        return Ok(PreparedInstallSource {
            kind: "git".to_string(),
            path,
            cleanup_path: Some(temp_root),
        });
    }

    let path = expand_local_install_path(source);
    if !path.is_dir() {
        return Err(format!(
            "Source directory does not exist: {}",
            path_to_string(&path)
        ));
    }

    Ok(PreparedInstallSource {
        kind: "local".to_string(),
        path,
        cleanup_path: None,
    })
}

struct GitHubRepo {
    owner: String,
    repo: String,
    branch: Option<String>,
    subdirectory: Option<String>,
}

fn parse_github_repo(source: &str) -> Option<GitHubRepo> {
    let source = source.trim().trim_end_matches('/');
    let without_prefix = source
        .strip_prefix("https://github.com/")
        .or_else(|| source.strip_prefix("http://github.com/"))?;
    let parts = without_prefix.split('/').collect::<Vec<_>>();
    if parts.len() < 2 {
        return None;
    }

    let owner = parts[0].to_string();
    let repo = parts[1].trim_end_matches(".git").to_string();
    if owner.is_empty() || repo.is_empty() {
        return None;
    }

    if parts.len() >= 4 && parts[2] == "tree" {
        return Some(GitHubRepo {
            owner,
            repo,
            branch: Some(parts[3].to_string()),
            subdirectory: (parts.len() > 4).then(|| parts[4..].join("/")),
        });
    }

    Some(GitHubRepo {
        owner,
        repo,
        branch: None,
        subdirectory: None,
    })
}

fn download_github_archive(repo: &GitHubRepo, temp_root: &Path) -> Result<PathBuf, String> {
    let branches = repo
        .branch
        .clone()
        .map(|branch| vec![branch, "main".to_string(), "master".to_string()])
        .unwrap_or_else(|| vec!["main".to_string(), "master".to_string()]);
    let archive_path = temp_root.join("archive.tar.gz");
    let extract_path = temp_root.join("repo");
    fs::create_dir_all(&extract_path).map_err(|error| format!("创建解压目录失败: {error}"))?;
    let mut last_error = None;

    for branch in branches {
        let url = format!(
            "https://github.com/{}/{}/archive/refs/heads/{}.tar.gz",
            repo.owner, repo.repo, branch
        );
        let curl_status = Command::new("curl")
            .args(["-L", "--fail", "-A", "skills-hub/1.0", "-o"])
            .arg(&archive_path)
            .arg(&url)
            .status();

        match curl_status {
            Ok(status) if status.success() => {
                let tar_status = Command::new("tar")
                    .arg("-xzf")
                    .arg(&archive_path)
                    .arg("-C")
                    .arg(&extract_path)
                    .arg("--strip-components=1")
                    .status()
                    .map_err(|error| format!("找不到 tar 命令或无法解压: {error}"))?;
                if tar_status.success() {
                    return Ok(extract_path);
                }
                return Err(format!("解压失败，tar 退出码: {tar_status}"));
            }
            Ok(status) => {
                last_error = Some(format!("下载失败，curl 退出码: {status}"));
            }
            Err(error) => {
                return Err(format!("找不到 curl 命令或无法下载: {error}"));
            }
        }
    }

    Err(last_error.unwrap_or_else(|| "无法下载 GitHub archive".to_string()))
}

fn discover_installable_skills(source_path: &Path) -> Result<Vec<DiscoveredSkill>, String> {
    if source_path.join("SKILL.md").is_file() {
        let name = source_path
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_else(|| "skill".to_string());
        return Ok(vec![DiscoveredSkill {
            name,
            source_path: source_path.to_path_buf(),
            skill_file_path: source_path.join("SKILL.md"),
            mtime: fs::metadata(source_path.join("SKILL.md"))
                .ok()
                .and_then(|metadata| metadata.modified().ok()),
        }]);
    }

    Ok(discover_skill_dirs(source_path))
}

fn expand_local_install_path(source: &str) -> PathBuf {
    if source == "~" {
        return home_dir();
    }
    if let Some(rest) = source.strip_prefix("~/") {
        return home_dir().join(rest);
    }
    normalize_path(&PathBuf::from(source))
}

fn read_agents_config(app: &tauri::AppHandle) -> Option<Vec<AgentDefinition>> {
    let raw = fs::read_to_string(agents_config_path(app).ok()?).ok()?;

    if let Ok(editable) = serde_json::from_str::<EditableConfig>(&raw) {
        if editable.version == 2 {
            return Some(
                editable
                    .agents
                    .into_iter()
                    .map(expand_agent_definition)
                    .collect(),
            );
        }
    }

    if let Ok(selection) = serde_json::from_str::<LegacySelection>(&raw) {
        let enabled_ids = selection
            .enabled_ids
            .into_iter()
            .collect::<std::collections::HashSet<_>>();
        return Some(
            builtin_registry()
                .into_iter()
                .map(|mut agent| {
                    agent.enabled = enabled_ids.contains(&agent.id);
                    agent.builtin = true;
                    expand_agent_definition(agent)
                })
                .collect(),
        );
    }

    None
}

fn read_categories(app: &tauri::AppHandle) -> Vec<Category> {
    let raw = read_config_string(app, "categories.json")
        .unwrap_or_else(|| include_str!("../../config/categories.json").to_string());
    serde_json::from_str::<Vec<Category>>(&raw).unwrap_or_default()
}

fn read_skill_categories(app: &tauri::AppHandle) -> HashMap<String, Vec<String>> {
    read_config_string(app, "skill-categories.json")
        .and_then(|raw| serde_json::from_str::<HashMap<String, Vec<String>>>(&raw).ok())
        .or_else(|| {
            serde_json::from_str::<HashMap<String, Vec<String>>>(include_str!(
                "../../config/skill-categories.json"
            ))
            .ok()
        })
        .unwrap_or_default()
}

fn read_custom_skills(app: &tauri::AppHandle) -> Vec<String> {
    read_config_string(app, "custom-skills.json")
        .and_then(|raw| serde_json::from_str::<Vec<String>>(&raw).ok())
        .or_else(|| {
            serde_json::from_str::<Vec<String>>(include_str!("../../config/custom-skills.json"))
                .ok()
        })
        .unwrap_or_default()
}

fn read_sync_mode(app: &tauri::AppHandle) -> String {
    read_config_string(app, "settings.json")
        .and_then(|raw| serde_json::from_str::<serde_json::Value>(&raw).ok())
        .and_then(|json| {
            json.get("syncMode")
                .and_then(|value| value.as_str())
                .map(str::to_string)
        })
        .filter(|mode| mode == "copy" || mode == "symlink")
        .unwrap_or_else(|| "copy".to_string())
}

pub(crate) fn read_config_string(app: &tauri::AppHandle, filename: &str) -> Option<String> {
    let dev_path = env::current_dir()
        .ok()
        .map(|cwd| cwd.join("config").join(filename))
        .filter(|path| path.exists());
    if let Some(path) = dev_path {
        return fs::read_to_string(path).ok();
    }

    app.path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join("config").join(filename))
        .and_then(|path| fs::read_to_string(path).ok())
}

pub(crate) fn writable_config_path(
    app: &tauri::AppHandle,
    filename: &str,
) -> Result<PathBuf, String> {
    let dev_dir = env::current_dir()
        .map(|cwd| cwd.join("config"))
        .ok()
        .filter(|path| path.exists());
    if let Some(path) = dev_dir {
        return Ok(path.join(filename));
    }

    app.path()
        .app_config_dir()
        .map(|dir| dir.join("config").join(filename))
        .map_err(|error| format!("无法解析配置目录: {error}"))
}

fn agents_config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dev_path = env::current_dir()
        .map(|cwd| cwd.join("config").join("agents.json"))
        .ok()
        .filter(|path| path.exists());
    if let Some(path) = dev_path {
        return Ok(path);
    }

    app.path()
        .app_config_dir()
        .map(|dir| dir.join("config").join("agents.json"))
        .map_err(|error| format!("无法解析配置目录: {error}"))
}

fn default_agents() -> Vec<AgentDefinition> {
    builtin_registry()
        .into_iter()
        .map(|mut agent| {
            agent.enabled = matches!(agent.id.as_str(), "claude" | "codex");
            expand_agent_definition(agent)
        })
        .collect()
}

fn scan_skills(agents: &[AgentDefinition]) -> Vec<SkillRecord> {
    let mut by_name = HashMap::<String, SkillRecord>::new();

    for skill in discover_skill_dirs(&source_skills_dir()) {
        if let Some(record) = skill_record_from_discovery(&skill, "source") {
            by_name.insert(record.name.clone(), record);
        }
    }

    let mut candidates = HashMap::<String, Vec<(String, DiscoveredSkill)>>::new();
    for agent in agents {
        for skill in discover_skill_dirs(&PathBuf::from(&agent.skills_path)) {
            candidates
                .entry(skill.name.clone())
                .or_default()
                .push((agent.id.clone(), skill));
        }
    }

    for (name, mut skill_candidates) in candidates {
        if by_name.contains_key(&name) {
            continue;
        }

        skill_candidates.sort_by(|(_, left), (_, right)| right.mtime.cmp(&left.mtime));
        if let Some((agent_id, skill)) = skill_candidates.first() {
            if let Some(record) = skill_record_from_discovery(skill, agent_id) {
                by_name.insert(record.name.clone(), record);
            }
        }
    }

    let mut skills = by_name.into_values().collect::<Vec<_>>();
    skills.sort_by(|left, right| left.name.cmp(&right.name));
    skills
}

fn discover_skill_dirs(root: &Path) -> Vec<DiscoveredSkill> {
    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(_) => return Vec::new(),
    };

    let mut skills = Vec::new();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if is_reserved_skill_entry(&name)
            || matches!(name.as_str(), "node_modules" | ".git" | ".next")
        {
            continue;
        }

        let source_path = entry.path();
        if !source_path.is_dir() {
            continue;
        }

        let skill_file_path = source_path.join("SKILL.md");
        let Ok(metadata) = fs::metadata(&skill_file_path) else {
            continue;
        };

        skills.push(DiscoveredSkill {
            name,
            source_path,
            skill_file_path,
            mtime: metadata.modified().ok(),
        });
    }

    skills.sort_by(|left, right| left.name.cmp(&right.name));
    skills
}

fn skill_record_from_discovery(
    skill: &DiscoveredSkill,
    master_agent_id: &str,
) -> Option<SkillRecord> {
    let content = fs::read_to_string(&skill.skill_file_path).ok()?;
    Some(SkillRecord {
        name: skill.name.clone(),
        description: parse_description(&content).unwrap_or_else(|| "未提供描述。".to_string()),
        source_path: path_to_string(&skill.source_path),
        master_agent_id: master_agent_id.to_string(),
        skill_file_path: path_to_string(&skill.skill_file_path),
        has_skill_md: true,
        updated_at: system_time_to_iso(skill.mtime),
        is_custom: false,
    })
}

fn classify_install_state(skill: &SkillRecord, agent: &AgentDefinition) -> SkillInstallState {
    let target_path = PathBuf::from(&agent.skills_path).join(&skill.name);
    let mut state = SkillInstallState {
        skill_name: skill.name.clone(),
        agent_id: agent.id.clone(),
        agent_name: agent.name.clone(),
        status: "missing".to_string(),
        source_path: Some(skill.source_path.clone()),
        target_path: path_to_string(&target_path),
        exists: false,
        is_managed: false,
        detail: "目标目录中尚未安装。".to_string(),
    };

    let metadata = match fs::metadata(&target_path) {
        Ok(metadata) => metadata,
        Err(_) => return state,
    };

    state.exists = true;
    if !metadata.is_dir() {
        state.status = "conflict".to_string();
        state.detail = "目标路径存在但不是目录，阻塞了自动同步。".to_string();
        return state;
    }

    if is_copy_up_to_date(Path::new(&skill.source_path), &target_path) {
        state.status = "synced".to_string();
        state.is_managed = true;
        state.detail = "目标目录内容与主源一致。".to_string();
    } else {
        state.status = "drifted".to_string();
        state.detail = "目标目录存在，但内容与主源不一致，需要重新同步。".to_string();
    }

    state
}

fn is_copy_up_to_date(source_path: &Path, target_path: &Path) -> bool {
    let source = fs::read(source_path.join("SKILL.md")).ok();
    let target = fs::read(target_path.join("SKILL.md")).ok();
    source.is_some() && source == target
}

fn display_status(status: &str) -> &str {
    match status {
        "synced" | "orphaned" => "installed",
        "missing" => "missing",
        "drifted" | "conflict" => "broken",
        _ => "broken",
    }
}

fn parse_description(content: &str) -> Option<String> {
    let mut lines = content.lines();
    if lines.next()? != "---" {
        return None;
    }

    for line in lines {
        if line == "---" {
            break;
        }
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("description:") {
            let value = value
                .trim()
                .trim_matches('"')
                .trim_matches('\'')
                .to_string();
            if !value.is_empty() {
                return Some(value);
            }
        }
    }

    None
}

fn source_skills_dir() -> PathBuf {
    env::var_os("AGENT_SKILLS_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| home_dir().join(".agents").join("skills"))
}

fn is_reserved_skill_entry(name: &str) -> bool {
    name.starts_with('.') || name == "README.md" || name == "AGENTS.md"
}

fn ensure_child_path(root: &Path, target: &Path) -> Result<(), String> {
    let normalized_root = normalize_path(root);
    let normalized_target = normalize_path(target);
    if is_inside(&normalized_root, &normalized_target) {
        Ok(())
    } else {
        Err(format!(
            "目标路径超出允许范围: {}",
            path_to_string(&normalized_target)
        ))
    }
}

fn normalize_path(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(path)
    }
}

fn is_inside(root: &Path, target: &Path) -> bool {
    target == root || target.starts_with(root)
}

fn timestamp_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn system_time_to_iso(time: Option<std::time::SystemTime>) -> String {
    let Some(time) = time else {
        return "1970-01-01T00:00:00.000Z".to_string();
    };
    let Ok(duration) = time.duration_since(std::time::UNIX_EPOCH) else {
        return "1970-01-01T00:00:00.000Z".to_string();
    };
    format!("{}.{:03}Z", duration.as_secs(), duration.subsec_millis())
}

fn builtin_registry() -> Vec<AgentDefinition> {
    vec![
        builtin(
            "claude",
            "Claude Code",
            "$HOME/.claude/skills",
            "Anthropic 官方 CLI Agent，支持多模型、MCP 工具扩展",
            "https://claude.ai/code",
        ),
        builtin(
            "codex",
            "Codex",
            "$CODEX_HOME/skills",
            "OpenAI 推出的终端 AI 编程助手，支持 GPT-5 等模型",
            "https://github.com/openai/codex",
        ),
        builtin(
            "cursor",
            "Cursor",
            "$HOME/.cursor/skills",
            "基于 VS Code 的 AI-first 编辑器，内置 Chat 和 Composer",
            "https://cursor.com",
        ),
        builtin(
            "trae",
            "Trae",
            "$HOME/.trae/skills",
            "字节跳动推出的 AI IDE，支持 Builder 模式自动编程",
            "https://trae.ai",
        ),
        builtin(
            "hermes",
            "Hermes Agent",
            "$HERMES_HOME/skills",
            "开源 AI 编码助手，支持自定义 Agent 编排",
            "https://github.com/hermes-agent/hermes",
        ),
        builtin(
            "codebuddy",
            "CodeBuddy",
            "$HOME/.codebuddy/skills",
            "腾讯云推出的 AI IDE，支持智能编码和 Agent 模式",
            "https://www.codebuddy.cn/ide/",
        ),
        builtin(
            "antigravity",
            "Antigravity",
            "$HOME/.antigravity/skills",
            "Google 推出的 AI IDE，面向 Agent-first 时代的智能开发环境",
            "https://antigravity.google/",
        ),
        builtin(
            "opencode",
            "OpenCode",
            "$HOME/.opencode/skills",
            "开源终端 AI 编程助手，支持多模型、多供应商的灵活编码体验",
            "https://opencode.ai",
        ),
    ]
}

fn builtin(
    id: &str,
    name: &str,
    skills_path: &str,
    description: &str,
    homepage: &str,
) -> AgentDefinition {
    AgentDefinition {
        id: id.to_string(),
        name: name.to_string(),
        skills_path: skills_path.to_string(),
        description: description.to_string(),
        homepage: homepage.to_string(),
        enabled: false,
        builtin: true,
    }
}

fn expand_agent_definition(agent: AgentDefinition) -> AgentDefinition {
    AgentDefinition {
        skills_path: path_to_string(&expand_agent_path(&agent.skills_path)),
        ..agent
    }
}

fn expand_agent_path(path: &str) -> PathBuf {
    let home = home_dir();
    let mut expanded = path.to_string();

    if let Some(rest) = expanded.strip_prefix("$HOME") {
        expanded = format!("{}{}", path_to_string(&home), rest);
    } else if let Some(rest) = expanded.strip_prefix('~') {
        expanded = format!("{}{}", path_to_string(&home), rest);
    }

    let codex_home =
        env::var("CODEX_HOME").unwrap_or_else(|_| path_to_string(&home.join(".codex")));
    expanded = expanded.replace("$CODEX_HOME", &codex_home);

    let hermes_home = env::var("HERMES_HOME").unwrap_or_else(|_| {
        if cfg!(windows) {
            env::var("LOCALAPPDATA")
                .map(|path| path_to_string(&PathBuf::from(path).join("hermes")))
                .unwrap_or_else(|_| path_to_string(&home.join(".hermes")))
        } else {
            path_to_string(&home.join(".hermes"))
        }
    });
    expanded = expanded.replace("$HERMES_HOME", &hermes_home);

    PathBuf::from(expanded)
}

fn count_skill_dirs(root: &Path) -> io::Result<usize> {
    let mut count = 0;
    for entry in fs::read_dir(root)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() && entry.path().join("SKILL.md").is_file() {
            count += 1;
        }
    }
    Ok(count)
}

fn home_dir() -> PathBuf {
    env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}
