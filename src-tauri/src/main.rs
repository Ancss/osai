mod ai;
mod prompts;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ai::claude::send_message_to_anthropic,
            ai::claude::cancel_request,
            ai::claude::create_cancel_flag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
