use crate::error::Result;
use std::fs;

#[tauri::command]
pub fn read_file(path: String) -> Result<String> {
    fs::read_to_string(path).map_err(Into::into)
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<()> {
    fs::write(path, content).map_err(Into::into)
}

#[tauri::command]
pub fn list_files(path: String) -> Result<Vec<String>> {
    let entries = fs::read_dir(path)?;
    let files = entries
        .filter_map(|entry| {
            entry.ok().and_then(|e| e.path().to_str().map(String::from))
        })
        .collect();
    Ok(files)
}