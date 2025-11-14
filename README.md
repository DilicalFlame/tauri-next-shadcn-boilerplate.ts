# 🚀 Tauri + Next.js + shadcn/ui Boilerplate

<div align="center">

![Tauri](https://img.shields.io/badge/Tauri-2.x-blue?style=flat-square&logo=tauri)
![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

A professional, production-ready boilerplate for building modern cross-platform desktop applications with **Rust-Tauri** backend and **Next.js + shadcn/ui** frontend.

[Features](#-features) • [Prerequisites](#-prerequisites) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Building](#-building)
- [Scripts](#-scripts)
- [Configuration](#-configuration)
- [Adding Components](#-adding-components)

---

## ✨ Features

- ⚡ **Fast Development** - Hot Module Replacement (HMR) with Next.js for instant feedback
- 🦀 **Rust Backend** - Leverage Rust's performance and safety with Tauri
- 🎨 **Beautiful UI** - Pre-configured shadcn/ui components with Tailwind CSS
- 📦 **Type-Safe** - Full TypeScript support across the entire stack
- 🔧 **Code Quality** - Biome for blazing-fast linting and formatting
- 🤖 **Auto-Updates** - Dependabot configured for weekly dependency updates
- 🎯 **Production Ready** - Optimized build configuration for desktop deployment
- 🌙 **Dark Mode Ready** - Built-in support for light/dark themes
- 📱 **Responsive** - Mobile-first design principles
- 🔒 **Secure** - Tauri's security features enabled by default

---

## 🛠 Tech Stack

### Frontend

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5.8](https://www.typescriptlang.org/)** - Type safety and better DX
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Backend

- **[Tauri 2.x](https://tauri.app/)** - Build smaller, faster, and more secure desktop apps
- **[Rust](https://www.rust-lang.org/)** - Systems programming language

### Developer Experience

- **[Biome](https://biomejs.dev/)** - Fast formatter and linter
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[Dependabot](https://github.com/dependabot)** - Automated dependency updates

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required

1. **Node.js** (v20 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **pnpm** (v9 or higher)

   ```bash
   npm install -g pnpm
   ```

   - Verify: `pnpm --version`

3. **Rust** (latest stable)
   - Install via [rustup](https://rustup.rs/):

     ```bash
     # Windows
     # Download and run: https://win.rustup.rs/
     
     # macOS/Linux
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```

   - Verify: `rustc --version`

4. **Tauri Prerequisites**

   **Windows:**
   - Microsoft Visual Studio C++ Build Tools
   - WebView2 (usually pre-installed on Windows 10/11)

   **macOS:**

   ```bash
   xcode-select --install
   ```

   **Linux (Debian/Ubuntu):**

   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libxdo-dev \
     libssl-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

   For other Linux distributions, see [Tauri Prerequisites](https://tauri.app/v2/guides/prerequisites/)

### Optional but Recommended

- **[VS Code](https://code.visualstudio.com/)** with extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

---

## 🚀 Quick Start

### 1. Use This Template

Click the **"Use this template"** button on GitHub or clone the repository:

```bash
git clone https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts.git my-app
cd my-app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
```

Rust dependencies will be automatically installed when you run the Tauri commands.

### 3. Update Project Metadata

Update the following files with your app information:

**`package.json`**

```json
{
  "name": "your-app-name",
  "version": "0.1.0",
  ...
}
```

**`src-tauri/Cargo.toml`**

```toml
[package]
name = "your-app-name"
version = "0.1.0"
description = "Your app description"
authors = ["Your Name"]
```

**`src-tauri/tauri.conf.json`**

```json
{
  "productName": "Your App Name",
  "version": "0.1.0",
  "identifier": "com.yourcompany.yourapp",
  ...
}
```

### 4. Run Development Server

```bash
pnpm tauri dev
```

This will:

1. Start the Next.js development server on `http://localhost:3000`
2. Launch the Tauri window with your app

---

## 📁 Project Structure

```folder-structure
.
├── .github/
│   └── dependabot.yml          # Automated dependency updates
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   └── ui/                     # shadcn/ui components
│       └── button.tsx
├── lib/
│   └── utils.ts                # Utility functions (cn helper)
├── public/                     # Static assets
├── src-tauri/                  # Tauri (Rust) backend
│   ├── src/
│   │   ├── main.rs             # Rust entry point
│   │   └── lib.rs              # Rust library
│   ├── icons/                  # App icons
│   ├── capabilities/           # Tauri capabilities/permissions
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri configuration
│   └── build.rs                # Build script
├── styles/
│   └── globals.css             # Global styles & Tailwind
├── biome.json                  # Biome configuration
├── components.json             # shadcn/ui configuration
├── package.json                # Node.js dependencies & scripts
├── postcss.config.mjs          # PostCSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 💻 Development

### Development Mode

Start the development server with hot reloading:

```bash
pnpm tauri dev
```

### Next.js Only (Web Preview)

To preview the UI without Tauri:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Code Formatting & Linting

```bash
# Check for issues
pnpm lint

# Format and fix issues
pnpm format
```

### Adding New Pages

Create new pages in the `app/` directory following Next.js App Router conventions:

```tsx
// app/about/page.tsx
export default function About() {
  return <div>About Page</div>;
}
```

### Using Tauri APIs

Example of using Tauri commands:

```tsx
import { invoke } from '@tauri-apps/api/core';

// Call a Rust command
const result = await invoke('greet', { name: 'World' });
```

---

## 🏗 Building

### Development Build

```bash
pnpm tauri build --debug
```

### Production Build

```bash
pnpm tauri build
```

The built application will be in `src-tauri/target/release/bundle/`

### Build for Specific Platform

```bash
# Build only for current platform
pnpm tauri build

# See available targets
pnpm tauri build --help
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Build Next.js for production |
| `pnpm start` | Start Next.js production server |
| `pnpm tauri dev` | Run Tauri in development mode |
| `pnpm tauri build` | Build Tauri app for production |
| `pnpm lint` | Check code with Biome |
| `pnpm format` | Format and fix code with Biome |

---

## ⚙️ Configuration

### Tauri Window

Configure window properties in `src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "title": "Your App",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

### Next.js

Static export is configured for Tauri. The output directory is set to `out/` which Tauri reads from.

---

## 🎨 Adding Components

### Using shadcn/ui CLI

Add new components from shadcn/ui:

```bash
# Example: Add a card component
pnpm dlx shadcn@latest add card

# Add multiple components
pnpm dlx shadcn@latest add card dialog button
```

### Manual Component Import

Browse available components at [ui.shadcn.com](https://ui.shadcn.com/) and add them to `components/ui/`.

---

<div align="center">

**Built with ❤️ using Tauri, Next.js, and shadcn/ui**

[⬆ Back to Top](#-tauri--nextjs--shadcnui-boilerplate)

</div>
