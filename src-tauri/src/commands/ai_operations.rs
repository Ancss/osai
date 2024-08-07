use crate::error::Result;
use crate::ai::ai_service::{AIService, create_ai_service};

#[tauri::command]
pub async fn send_to_ai(message: String) -> Result<String> {
    let ai_service = create_ai_service("claude");
    ai_service.send_message(&message).await
}