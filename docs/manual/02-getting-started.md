---
sidebar_position: 2
---

# Getting Started

Follow these steps to get your development environment set up and the application running.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **pnpm** (Recommended package manager)
- **Rust** (Latest stable) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Microsoft Visual Studio C++ Build Tools** (Windows only) - Required for Tauri.

## Installation

1.  **Clone the repository** (or use this template):
    ```bash
    git clone https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts.git my-app
    cd my-app
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

## Running Development Server

### Desktop Development (Recommended)

To start the full Tauri application (Frontend + Rust Backend):

```bash
pnpm tauri dev
```

This command will:
1.  Compile the Rust backend.
2.  Start the Next.js frontend server.
3.  Launch the native application window.

### Web-Only Development

If you only want to work on the UI without the Rust backend:

```bash
pnpm dev
```

This starts the Next.js server at `http://localhost:3000`. Note that Tauri-specific features (like `invoke`) will not work in the browser.

## Building for Production

To build the application for distribution:

```bash
pnpm tauri build
```

This will generate the installer/executable in `src-tauri/target/release/bundle/`.

## Renaming the Project

We provide a script to easily rename the project from the default "app" name.

```bash
node scripts/change_name.cjs "My New App Name"
```

This script updates `package.json`, `tauri.conf.json`, and `Cargo.toml`.
