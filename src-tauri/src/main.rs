#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod ai;
mod utils;

use ai::{claude::Claude, openai::OpenAI, AIModel};
use std::sync::Arc;
use tauri::Manager;

#[tauri::command]
async fn process_user_input(input: String, model_type: String) -> Result<String, String> {
    let model: Arc<dyn AIModel + Send + Sync> = match model_type.as_str() {
        "claude" => Arc::new(Claude),
        "openai" => Arc::new(OpenAI),
        _ => return Err("Unsupported AI model".to_string()),
    };

    let response = model
        .process_input(&input)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&response).map_err(|e| e.to_string())
}

#[tauri::command]
fn execute_platform_specific_step(step: utils::PlatformSpecificStep) -> Result<String, String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    let output = Command::new("powershell")
        .arg("-Command")
        .arg(&step.windows)
        .output();

    #[cfg(target_os = "macos")]
    let output = Command::new("sh").arg("-c").arg(&step.macos).output();

    #[cfg(target_os = "linux")]
    let output = Command::new("sh").arg("-c").arg(&step.linux).output();

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            process_user_input,
            execute_platform_specific_step,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
