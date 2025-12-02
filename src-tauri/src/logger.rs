use chrono::Local;
use fern::colors::{Color, ColoredLevelConfig};
use log::{info, LevelFilter};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime};

// Global mutex to prevent multiple initializations or race conditions if we were to re-configure
static LOGGER_INITIALIZED: Mutex<bool> = Mutex::new(false);

#[derive(serde::Deserialize, Debug, Clone)]
pub struct LoggerSettings {
    pub log_path: Option<String>,
    pub log_type: String, // "session" or "unified"
    pub max_file_size: u64,
    pub console_level: String,
    pub file_level: String,
}

fn parse_level(level: &str) -> LevelFilter {
    match level.to_lowercase().as_str() {
        "trace" => LevelFilter::Trace,
        "debug" => LevelFilter::Debug,
        "info" => LevelFilter::Info,
        "warn" => LevelFilter::Warn,
        "error" => LevelFilter::Error,
        "off" => LevelFilter::Off,
        _ => LevelFilter::Info,
    }
}

pub fn init_logger<R: Runtime>(app: &AppHandle<R>, settings: LoggerSettings) -> Result<(), String> {
    let mut initialized = LOGGER_INITIALIZED.lock().map_err(|e| e.to_string())?;
    if *initialized {
        return Ok(()); // Already initialized
    }

    let log_dir = if let Some(path_str) = settings.log_path {
        PathBuf::from(path_str)
    } else {
        app.path().app_log_dir().map_err(|e| e.to_string())?
    };

    if !log_dir.exists() {
        fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    }

    let log_file_path = match settings.log_type.as_str() {
        "session" => {
            let now = Local::now();
            log_dir.join(format!("session_{}.log", now.format("%Y-%m-%d_%H-%M-%S")))
        }
        "unified" => get_unified_log_file(&log_dir, settings.max_file_size)?,
        _ => log_dir.join("app.log"),
    };

    let colors = ColoredLevelConfig::new()
        .debug(Color::Magenta)
        .info(Color::Green)
        .warn(Color::Yellow)
        .error(Color::Red);

    let console_level = parse_level(&settings.console_level);
    let file_level = parse_level(&settings.file_level);

    let console_dispatch = fern::Dispatch::new()
        .format(move |out, message, record| {
            out.finish(format_args!(
                "[{} {} {}] {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                colors.color(record.level()),
                record.target(),
                message
            ))
        })
        .level(console_level)
        .level_for("tao", LevelFilter::Error)
        .level_for("wry", LevelFilter::Error)
        .chain(std::io::stdout());

    let file_dispatch = fern::Dispatch::new()
        .format(move |out, message, record| {
            out.finish(format_args!(
                "[{} {} {}] {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                record.target(),
                message
            ))
        })
        .level(file_level)
        .level_for("tao", LevelFilter::Error)
        .level_for("wry", LevelFilter::Error)
        .chain(fern::log_file(log_file_path).map_err(|e| e.to_string())?);

    fern::Dispatch::new()
        .chain(console_dispatch)
        .chain(file_dispatch)
        .apply()
        .map_err(|e| e.to_string())?;

    *initialized = true;
    info!("Logger initialized. Log file: {:?}", log_dir);
    Ok(())
}

fn get_unified_log_file(log_dir: &Path, max_size: u64) -> Result<PathBuf, String> {
    let mut i = 1;
    loop {
        let file_path = log_dir.join(format!("app_{}.log", i));
        if !file_path.exists() {
            return Ok(file_path);
        }
        let metadata = fs::metadata(&file_path).map_err(|e| e.to_string())?;
        if metadata.len() < max_size {
            return Ok(file_path);
        }
        i += 1;
    }
}

#[tauri::command]
pub fn log_frontend_message(level: String, message: String, location: Option<String>) {
    let target = location.unwrap_or_else(|| "frontend".to_string());
    match level.to_lowercase().as_str() {
        "trace" => log::trace!(target: &target, "{}", message),
        "debug" => log::debug!(target: &target, "{}", message),
        "info" => log::info!(target: &target, "{}", message),
        "warn" => log::warn!(target: &target, "{}", message),
        "error" => log::error!(target: &target, "{}", message),
        _ => log::info!(target: &target, "{}", message),
    }
}

#[tauri::command]
pub fn init_logger_cmd(app: AppHandle, settings: LoggerSettings) -> Result<(), String> {
    init_logger(&app, settings)
}
