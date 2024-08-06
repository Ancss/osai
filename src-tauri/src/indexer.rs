use crate::error::AppError;
use crate::models::{ResultType, SearchMode, SearchResult, Settings};
use dashmap::DashMap;
use log::{info, warn};
use serde::Serialize;
use std::collections::HashMap;
use std::collections::HashSet;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::ptr;
use std::result::Result;
use std::time::SystemTime;
use tauri::Manager;
use unicode_normalization::UnicodeNormalization;
use walkdir::WalkDir;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::enums::*;
use winreg::RegKey;
use wmi::{COMLibrary, WMIConnection};

pub struct Indexer {
    index: DashMap<String, SearchResult>,
    settings: Settings,
}
#[derive(Serialize)]
struct InstalledApp {
    name: String,
    version: Option<String>,
}
impl Indexer {
    pub fn new(settings: Settings) -> Self {
        Self {
            index: DashMap::new(),
            settings,
        }
    }

    pub fn index_files(&mut self) -> Result<(), AppError> {
        self.index.clear();
        let mut item_count = 0;

        let app_extensions: HashSet<_> = [".exe", ".app", ".desktop"].iter().cloned().collect();

        for path in &self.settings.search_paths {
            info!("Indexing path: {}", path);
            for entry in WalkDir::new(path)
                .into_iter()
                .filter_map(Result::ok)
                .filter(|e| self.should_index(e.path()))
                .take(self.settings.max_index_files)
            {
                let path = entry.path();
                let name = path
                    .file_name()
                    .ok_or_else(|| AppError::IndexingError("Invalid file name".to_string()))?
                    .to_string_lossy()
                    .into_owned();
                let metadata = entry.metadata()?;
                let last_modified = metadata.modified().map_err(|e| AppError::Io(e))?;

                let result_type = if entry.file_type().is_dir() {
                    ResultType::Folder
                } else if entry.file_type().is_file() {
                    if path.extension().map_or(false, |ext| {
                        app_extensions.contains(&ext.to_str().unwrap_or(""))
                    }) {
                        ResultType::Application
                    } else {
                        ResultType::File
                    }
                } else {
                    continue; // Skip if not a file or folder
                };

                let result = SearchResult {
                    id: path.to_string_lossy().into_owned(),
                    name: name.clone(),
                    r#type: result_type,
                    path: path.to_string_lossy().into_owned(),
                    last_modified,
                };

                self.index.insert(result.id.clone(), result);
                item_count += 1;
            }
        }

        info!("Indexed {} items in total", item_count);
        Ok(())
    }
    fn should_index(&self, path: &Path) -> bool {
        let path_str = path.to_string_lossy().to_lowercase();
        // check if is in the ignore list
        if self
            .settings
            .ignored_directories
            .iter()
            .any(|dir| path_str.contains(&dir.to_lowercase()))
        {
            return false;
        }
        // exclude systems and hidden directories
        if (path_str.contains("\\.") || path_str.contains("\\appdata"))
            || path_str.contains("\\windows\\")
            || path_str.contains("\\program files")
        {
            return false;
        }

        // contains directories commonly used by users
        if path_str.contains("\\documents\\")
            || path_str.contains("\\downloads\\")
            || path_str.contains("\\pictures\\")
            || path_str.contains("\\music\\")
            || path_str.contains("\\videos\\")
            || path_str.contains("\\desktop\\")
        {
            return true;
        }

        // check if you are in a user-defined search path
        self.settings
            .search_paths
            .iter()
            .any(|custom_path| path_str.starts_with(&custom_path.to_lowercase()))
    }

    pub fn index_windows_apps(&mut self) -> Result<(), AppError> {
        let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg("Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate")
        .output()
        .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(AppError::from(
                String::from_utf8_lossy(&output.stderr).into_owned(),
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = stdout.split('\n').collect();

        for line in lines.iter().skip(3) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let name = parts[0..parts.len() - 2].join(" ");
                let install_location = parts[parts.len() - 1].to_string();
                let last_modified = SystemTime::now();

                let result = SearchResult {
                    id: install_location.clone(),
                    name: name.clone(),
                    r#type: ResultType::Application,
                    path: install_location,
                    last_modified,
                };
                println!("Indexing Windows App: {:?}", name);
                self.index.insert(result.id.clone(), result);
            }
        }
        Ok(())
    }
    pub fn search(&self, query: &str) -> Result<Vec<SearchResult>, AppError> {
        info!("Indexer Search: {}", query);

        let mut results = Vec::new();
        let mut app_results = Vec::new();
        let normalized_query = query.nfc().collect::<String>().to_lowercase();
        println!("Normalized Query: {}", normalized_query);
        // first search the application program
        let apps: Vec<SearchResult> = self
            .index
            .iter()
            .filter(|entry| {
                entry.value().r#type == ResultType::Application
                    && entry
                        .value()
                        .name
                        .to_lowercase()
                        .contains(&query.to_lowercase())
            })
            .map(|entry| entry.value().clone())
            .collect();

        app_results.extend(apps);

        match self.settings.search_mode {
            SearchMode::WindowsNative => {
                // TODO: use the native search of Windows
                // match self.search_files_with_windows_native(&normalized_query) {
                //     Ok(file_results) => results.extend(file_results),
                //     Err(e) => {
                //         eprintln!("An error occurred while searching for files: {:?}", e);
                //     }
                // }
            }
            SearchMode::CustomIndex => {
                // search using custom index
                // then search for files and folders
                let file_results = self.search_folder_and_files(&normalized_query)?;
                results.extend(file_results);
            }
        }

        results.truncate(self.settings.max_search_results);
        app_results.extend(results);
        Ok(app_results)
    }
    fn search_folder_and_files(
        &self,
        normalized_query: &str,
    ) -> Result<Vec<SearchResult>, AppError> {
        let mut results = Vec::new();

        // First, search for exact folder matches
        let folder_results: Vec<SearchResult> = self
            .index
            .iter()
            .filter(|entry| {
                entry.value().r#type == ResultType::Folder
                    && Path::new(&entry.value().path)
                        .file_name()
                        .map(|name| name.to_string_lossy().to_lowercase() == normalized_query)
                        .unwrap_or(false)
            })
            .map(|entry| entry.value().clone())
            .collect();

        results.extend(folder_results);

        // If no exact folder match, then search for partial matches in folders and files
        if results.is_empty() {
            let partial_results: Vec<SearchResult> = self
                .index
                .iter()
                .filter(|entry| {
                    let path = Path::new(&entry.value().path);
                    let name_match = path
                        .file_name()
                        .map(|name| {
                            name.to_string_lossy()
                                .to_lowercase()
                                .contains(&normalized_query)
                        })
                        .unwrap_or(false);
                    let path_match = entry
                        .value()
                        .path
                        .to_lowercase()
                        .contains(&normalized_query);

                    name_match || path_match
                })
                .map(|entry| entry.value().clone())
                .collect();

            results.extend(partial_results);
        }

        // Sort results: folders first, then by relevance (e.g., how closely the name matches the query)
        results.sort_by(|a, b| match (&a.r#type, &b.r#type) {
            (ResultType::Folder, ResultType::Folder) => a.name.cmp(&b.name),
            (ResultType::Folder, _) => std::cmp::Ordering::Less,
            (_, ResultType::Folder) => std::cmp::Ordering::Greater,
            _ => {
                let a_relevance = calculate_relevance(&a.name, &normalized_query);
                let b_relevance = calculate_relevance(&b.name, &normalized_query);
                b_relevance.cmp(&a_relevance)
            }
        });

        results.truncate(self.settings.max_search_results);
        Ok(results)
    }
    // fn search_files_with_windows_native(&self, query: &str) -> Result<Vec<SearchResult>, AppError> {
    //     let file_results = self.search_files(query)?;
    //     Ok(file_results)
    // }
}

fn calculate_relevance(name: &str, query: &str) -> usize {
    let name_lower = name.to_lowercase();
    let query_lower = query.to_lowercase();

    if name_lower == query_lower {
        return usize::MAX; // Exact match gets highest priority
    }

    if name_lower.starts_with(&query_lower) {
        return usize::MAX - 1; // Prefix match gets second highest priority
    }

    if let Some(index) = name_lower.find(&query_lower) {
        return usize::MAX - 2 - index; // Substring match, earlier is better
    }

    0 // No match
}
