---
sidebar_position: 3
---

# Project Architecture

The project is structured to separate concerns between the Frontend (Next.js) and the Backend (Rust/Tauri).

## Folder Structure

```text
.
├── app/                 # Next.js App Router pages and layouts
├── components/          # React components (Shadcn UI & custom)
├── constants/           # Global constants (e.g., Logger settings)
├── docs/                # This documentation site
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and Services
│   ├── services/        # Core application services (Logger, Tauri, Window)
│   └── utils.ts         # Helper functions
├── public/              # Static assets
├── scripts/             # Build and maintenance scripts
├── src-tauri/           # Rust backend code
│   ├── src/             # Rust source files
│   ├── tauri.conf.json  # Tauri configuration
│   └── Cargo.toml       # Rust dependencies
└── styles/              # Global CSS and Tailwind styles
```

## Key Directories

### `app/`
Contains the application routes. We use the Next.js App Router.
- `page.tsx`: The main entry point.
- `layout.tsx`: The root layout, including providers.

### `lib/services/`
This is where the bridge between Frontend and Backend happens.
- `Logger.ts`: Handles logging to both console and file (via Rust).
- `TauriService.ts`: A singleton to invoke Rust commands.
- `WindowManager.ts`: Manages window state.

### `src-tauri/`
The Rust backend.
- `src/main.rs`: The entry point for the Tauri application.
- `src/lib.rs`: The library crate where commands are defined.
