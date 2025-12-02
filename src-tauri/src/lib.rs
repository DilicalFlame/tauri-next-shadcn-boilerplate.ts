// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod logger;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn system_beep() {
    #[cfg(target_os = "windows")]
    {
        #[link(name = "user32")]
        unsafe extern "system" {
            fn MessageBeep(uType: u32) -> i32;
        }
        unsafe {
            let _ = MessageBeep(0);
        }
    }
    #[cfg(target_os = "macos")]
    {
        #[link(name = "AppKit", kind = "framework")]
        unsafe extern "C" {
            fn NSBeep();
        }
        unsafe {
            NSBeep();
        }
    }
    #[cfg(target_os = "linux")]
    {
        // Best effort for Linux without extra dependencies
        use std::io::Write;
        let _ = std::io::stdout().write_all(b"\x07");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            system_beep,
            logger::init_logger_cmd,
            logger::log_frontend_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
