use std::process::Command;
use tauri::command;

#[command]
pub fn execute_code(code: String) -> Result<String, String> {
    let output = if cfg!(target_os = "windows") {
        Command::new("powershell")
            .arg("-Command")
            .arg(&code)
            .output()
    } else if cfg!(target_os = "macos") {
        Command::new("sh").arg("-c").arg(&code).output()
    } else {
        // Assuming Linux or other Unix-like systems
        Command::new("bash").arg("-c").arg(&code).output()
    };

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}
