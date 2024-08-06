mod error;
mod indexer;
mod models;

use crate::error::AppError;
use crate::indexer::Indexer;
use crate::models::{SearchResult, Settings};
use log::{error, info};
use models::ResultType;
use std::process::Command;
use std::sync::Mutex;
use tauri::Manager;
use url::Url;
struct AppState {
    indexer: Mutex<Indexer>,
    settings: Mutex<Settings>,
}

fn main() {
    env_logger::init();

    let settings = Settings::default();
    let indexer = Indexer::new(settings.clone());

    let app_state = AppState {
        indexer: Mutex::new(indexer),
        settings: Mutex::new(settings),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = setup(app_handle).await {
                    error!("Setup error: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search,
            open_file_or_app,
            get_file_preview,
            execute_command,
            update_settings,
            search_in_browser
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn open_file_or_app(path: String, result_type: ResultType) -> Result<(), AppError> {
    match result_type {
        ResultType::Folder => {
            open::that(path).map_err(|e| AppError::Io(e))?;
        }
        ResultType::File => {
            open::that(path).map_err(|e| AppError::Io(e))?;
        }
        ResultType::Application => {
            if cfg!(target_os = "windows") {
                Command::new(&path).spawn().map_err(|e| AppError::Io(e))?;
            } else if cfg!(target_os = "macos") {
                Command::new("open")
                    .arg(&path)
                    .spawn()
                    .map_err(|e| AppError::Io(e))?;
            } else {
                // Linux
                if path.to_lowercase().ends_with(".desktop") {
                    Command::new("gtk-launch")
                        .arg(&path)
                        .spawn()
                        .map_err(|e| AppError::Io(e))?;
                } else {
                    Command::new(&path).spawn().map_err(|e| AppError::Io(e))?;
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn search_in_browser(query: String) -> Result<(), AppError> {
    let encoded_query = Url::parse("https://www.google.com/search")
        .map_err(|_| AppError::InvalidSettings("Failed to parse URL".to_string()))?
        .query_pairs_mut()
        .append_pair("q", &query)
        .finish()
        .to_string();

    if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", &encoded_query])
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&encoded_query)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    } else {
        Command::new("xdg-open")
            .arg(&encoded_query)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }
    Ok(())
}

#[tauri::command]
fn open_application(path: String) -> Result<(), AppError> {
    if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    } else {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }
    Ok(())
}

async fn setup(app: tauri::AppHandle) -> Result<(), AppError> {
    let state = app.state::<AppState>();
    let mut indexer = state
        .indexer
        .lock()
        .map_err(|_| AppError::IndexingError("Failed to acquire lock".to_string()))?;
    indexer.index_windows_apps()?;
    indexer.index_files()?;

    Ok(())
}

#[tauri::command]
async fn search(
    query: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<SearchResult>, AppError> {
    info!("Searching for: {}", query);
    let indexer = state
        .indexer
        .lock()
        .map_err(|_| AppError::IndexingError("Failed to acquire lock".to_string()))?;
    // indexer.search(&query)?;
    Ok(indexer.search(&query)?)
}
#[tauri::command]
fn open_file(path: String) -> Result<(), AppError> {
    open::that(path).map_err(|e| AppError::Io(e))
}

#[tauri::command]
fn get_file_preview(path: String) -> Result<String, AppError> {
    std::fs::read_to_string(path).map_err(|e| AppError::Io(e))
}

#[tauri::command]
fn execute_command(command: String) -> Result<String, AppError> {
    std::process::Command::new("cmd")
        .args(&["/C", &command])
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).to_string())
        .map_err(|e| AppError::CommandExecutionFailed(e.to_string()))
}

#[tauri::command]
async fn update_settings(
    settings: Settings,
    state: tauri::State<'_, AppState>,
) -> Result<(), AppError> {
    {
        let mut app_settings = state
            .settings
            .lock()
            .map_err(|_| AppError::InvalidSettings("Failed to acquire lock".to_string()))?;
        *app_settings = settings.clone();
    }
    let mut indexer = state
        .indexer
        .lock()
        .map_err(|_| AppError::IndexingError("Failed to acquire lock".to_string()))?;
    *indexer = Indexer::new(settings);
    indexer.index_windows_apps()?;
    indexer.index_files()?;
    Ok(())
}
