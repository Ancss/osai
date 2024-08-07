use super::AIModel;
use crate::utils::{AIResponse, PlatformSpecificStep};
use async_trait::async_trait;

pub struct Claude;

unsafe impl Send for Claude {}
unsafe impl Sync for Claude {}

#[async_trait]
impl AIModel for Claude {
    async fn process_input(
        &self,
        input: &str,
    ) -> Result<AIResponse, Box<dyn std::error::Error + Send + Sync>> {
        Ok(AIResponse {
            thought_process: "分析用户输入".to_string(),
            plan: vec!["步骤1".to_string(), "步骤2".to_string()],
            user_confirmation_required: false,
            confirmation_message: None,
            execution: vec![
                PlatformSpecificStep {
                    windows: r#"powershell -Command "$app = Get-StartApps | Where-Object {$_.Name -like '*网易云*'} | Select-Object -First 1; if ($app) { $app.AppId } else { Write-Error '未找到网易云应用' }""#.to_string(),
                    macos: r#"mdfind 'kMDItemContentType == "com.apple.application-bundle" && kMDItemDisplayName == "*网易云*"' | head -n 1"#.to_string(),
                    linux: r#"find /usr/share/applications -name '*网易云*.desktop' | head -n 1"#.to_string(),
                },
            ],
            response: "这是一个示例响应".to_string(),
        })
    }
}
