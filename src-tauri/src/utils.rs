use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AIResponse {
    pub thought_process: String,
    pub plan: Vec<String>,
    pub user_confirmation_required: bool,
    // pub confirmation_message: Option<String>,
    pub execution: Vec<PlatformSpecificStep>,
    pub response: String,
}

#[derive(Serialize, Deserialize)]
pub struct PlatformSpecificStep {
    pub windows: String,
    pub macos: String,
    pub linux: String,
}
