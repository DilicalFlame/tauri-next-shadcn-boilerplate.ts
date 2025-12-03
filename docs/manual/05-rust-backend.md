---
sidebar_position: 5
---

# Rust Backend

The backend is built with Tauri and Rust. It handles system-level operations, file system access, and heavy computations.

## Structure

The Rust code is located in `src-tauri/src`.

- `main.rs`: Initializes the Tauri application, sets up plugins, and runs the app.
- `lib.rs`: Defines the `run` function and registers commands.
- `logger.rs`: Implements the backend logging logic using `log4rs`.

## Commands

Tauri commands are Rust functions annotated with `#[tauri::command]`. They can be called from the frontend.

### Example Command

```rust
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

To add a new command:
1.  Define the function in `lib.rs` (or a separate module).
2.  Register it in the `tauri::Builder` handler in `lib.rs`.
3.  Add a corresponding method in `TauriService.ts` on the frontend.

## Capabilities

Tauri v2 uses a capability-based security model. Permissions are defined in `src-tauri/capabilities/default.json`.

If you add a plugin (e.g., `fs`, `http`), make sure to enable the required permissions in the capabilities file.
