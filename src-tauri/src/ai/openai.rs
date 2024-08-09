use super::AIModel;
use crate::utils::{AIResponse, PlatformSpecificStep};
use async_trait::async_trait;

pub struct OpenAI;

unsafe impl Send for OpenAI {}
unsafe impl Sync for OpenAI {}

#[async_trait]
impl AIModel for OpenAI {
    async fn process_input(
        &self,
        input: &str,
    ) -> Result<AIResponse, Box<dyn std::error::Error + Send + Sync>> {
        // 实现OpenAI特定的逻辑
        // 这里是一个示例实现
        Ok(AIResponse {
            thought_process: "Analyzing user input".to_string(),
            plan: vec!["Step 1".to_string(), "Step 2".to_string()],
            user_confirmation_required: false,
            // confirmation_message: None,
            execution: String,
            response: "This is a sample response".to_string(),
        })
    }
}
