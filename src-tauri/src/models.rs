use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub enum ResultType {
    File,
    Folder,
    Application,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub r#type: ResultType,
    pub path: String,
    pub last_modified: SystemTime,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    pub search_paths: Vec<String>,
    pub ignored_directories: Vec<String>,
    pub hotkey: String,
    pub max_index_files: usize,
    pub max_search_results: usize,
    pub search_mode: SearchMode,
}
#[derive(Serialize, Deserialize, Clone)]
pub enum SearchMode {
    WindowsNative,
    CustomIndex,
}
impl Default for Settings {
    fn default() -> Self {
        let default_path = if cfg!(target_os = "windows") {
            std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users".to_string())
        } else if cfg!(target_os = "macos") {
            std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string())
        } else {
            std::env::var("HOME").unwrap_or_else(|_| "/home".to_string())
        };

        Self {
            search_paths: vec![default_path],
            ignored_directories: vec![
                "node_modules".to_string(),
                "target".to_string(),      // Rust build output
                "build".to_string(),       // Common build output directory
                "dist".to_string(),        // Common distribution directory
                ".git".to_string(),        // Git repository
                ".svn".to_string(),        // Subversion repository
                "vendor".to_string(),      // Common vendor libraries directory
                ".vscode".to_string(),     // VS Code settings
                ".idea".to_string(),       // IntelliJ IDEA settings
                "__pycache__".to_string(), // Python cache
                "venv".to_string(),        // Python virtual environment
            ],
            hotkey: "CommandOrControl+Space".to_string(),
            max_index_files: 100000,
            max_search_results: 10,
            search_mode: SearchMode::CustomIndex, // 默认使用自定义索引
        }
    }
}
