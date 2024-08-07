use crate::utils::AIResponse;
use async_trait::async_trait;

#[async_trait]
pub trait AIModel: Send + Sync {
    async fn process_input(
        &self,
        input: &str,
    ) -> Result<AIResponse, Box<dyn std::error::Error + Send + Sync>>;
}

pub mod claude;
pub mod openai;
