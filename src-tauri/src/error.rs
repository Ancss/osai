use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum OsaiError {
    #[error("IO error: {0}")]
    Io(String),
    #[error("Request error: {0}")]
    Request(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
    #[error("Environment variable not found: {0}")]
    EnvVar(String),
    #[error("Unexpected response from AI")]
    UnexpectedAIResponse,
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    #[error("AI Service error: {0}")]
    AIService(String),
    #[error("Unknown error occurred")]
    Unknown,
}

impl From<std::io::Error> for OsaiError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => OsaiError::FileNotFound(err.to_string()),
            std::io::ErrorKind::PermissionDenied => OsaiError::PermissionDenied(err.to_string()),
            _ => OsaiError::Io(err.to_string()),
        }
    }
}

impl From<reqwest::Error> for OsaiError {
    fn from(err: reqwest::Error) -> Self {
        OsaiError::Request(err.to_string())
    }
}

impl From<serde_json::Error> for OsaiError {
    fn from(err: serde_json::Error) -> Self {
        OsaiError::Serialization(err.to_string())
    }
}

impl From<std::env::VarError> for OsaiError {
    fn from(err: std::env::VarError) -> Self {
        OsaiError::EnvVar(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, OsaiError>;
