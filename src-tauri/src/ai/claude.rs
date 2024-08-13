use crate::prompts::{format_system_prompt, SYSTEM_PROMPT_TEMPLATE};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use sysinfo::{System, SystemExt};
use tauri::command;
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum MessageContent {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "image")]
    Image { source: ImageSource },
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageSource {
    #[serde(rename = "type")]
    pub source_type: String,
    pub media_type: String,
    pub data: String,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: Vec<MessageContent>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InputSchema {
    #[serde(rename = "type")]
    pub schema_type: String,
    pub properties: HashMap<String, InputSchemaProperty>,
    pub required: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InputSchemaProperty {
    #[serde(rename = "type")]
    pub property_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Box<InputSchemaProperty>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, InputSchemaProperty>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tool {
    pub name: String,
    pub description: String,
    pub input_schema: InputSchema,
}

lazy_static::lazy_static! {
    static ref CANCEL_FLAGS: Arc<Mutex<HashMap<String, Arc<Mutex<bool>>>>> = Arc::new(Mutex::new(HashMap::new()));
}

#[command]
pub fn create_cancel_flag() -> String {
    let flag_id = Uuid::new_v4().to_string();
    let mut flags = CANCEL_FLAGS.blocking_lock();
    flags.insert(flag_id.clone(), Arc::new(Mutex::new(false)));
    flag_id
}

#[command]
pub async fn cancel_request(flag_id: String) {
    let flags = CANCEL_FLAGS.lock().await;
    if let Some(flag) = flags.get(&flag_id) {
        let mut flag = flag.lock().await;
        *flag = true;
    }
}

#[command]
pub async fn send_message_to_anthropic(
    api_key: String,
    model: String,
    tools: Vec<Tool>,
    messages: Vec<Message>,
    max_tokens: Option<u32>,
    flag_id: String,
) -> Result<String, String> {
    let client = Client::new();
    let url = "https://api.anthropic.com/v1/messages";
    // println!("Sending request with model: {}", model);
    // println!("Messages: {:?}", messages);
    // println!("System prompt: {}", SYSTEM_PROMPT);
    // println!("Tools: {:?}", tools);
    let system_prompt = format_system_prompt();

    let body = json!({
        "model": model,
        "system": system_prompt,
        "tools": tools,
        "tool_choice": { "type": "tool", "name": "os_ai_assistant" },
        "max_tokens": max_tokens.unwrap_or(8192),
        "messages": messages,
        "temperature":0,
        "stream": false
    });
    println!("Request body: {}", body.to_string());

    let cancel_flag = {
        let flags = CANCEL_FLAGS.lock().await;
        flags.get(&flag_id).cloned()
    };

    let response_future = client
        .post(url)
        .header("Content-Type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("anthropic-beta", "max-tokens-3-5-sonnet-2024-07-15")
        .json(&body)
        .send();

    let response = if let Some(flag) = cancel_flag {
        tokio::select! {
            response = response_future => response.map_err(|e| e.to_string())?,
            _ = tokio::spawn(async move {
                while !*flag.lock().await {
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                }
            }) => return Err("Request cancelled".to_string()),
        }
    } else {
        response_future.await.map_err(|e| e.to_string())?
    };

    if !response.status().is_success() {
        return Err(format!("API request failed: {}", response.status()));
    }

    let response_text = response.text().await.map_err(|e| e.to_string())?;

    // 清理 cancel flag
    let mut flags = CANCEL_FLAGS.lock().await;
    flags.remove(&flag_id);

    Ok(response_text)
}
