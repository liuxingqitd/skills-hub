mod agents;
mod instructions;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            agents::get_agents,
            agents::apply_sync_actions,
            agents::create_category,
            agents::delete_category,
            agents::get_skill_board_model,
            agents::get_skill_content,
            agents::get_categories,
            agents::install_skill_source_command,
            agents::remove_skill,
            agents::save_agents_config,
            agents::set_custom_skill,
            agents::set_skill_categories_command,
            agents::update_category,
            agents::validate_agent_path,
            instructions::get_instructions_model,
            instructions::update_instruction_asset
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
