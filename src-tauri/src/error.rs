use tauri::InvokeError;
use thiserror::Error;
use walkdir::Error as WalkdirError;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("Command execution failed: {0}")]
    CommandExecutionFailed(String),
    #[error("Invalid settings: {0}")]
    InvalidSettings(String),
    #[error("Indexing error: {0}")]
    IndexingError(String),
    #[error("Walkdir error: {0}")]
    Walkdir(#[from] WalkdirError),
    #[error("General error: {0}")]
    General(String),
}

impl From<String> for AppError {
    fn from(error: String) -> Self {
        AppError::General(error)
    }
}

impl From<AppError> for InvokeError {
    fn from(error: AppError) -> Self {
        InvokeError::from(error.to_string())
    }
}
