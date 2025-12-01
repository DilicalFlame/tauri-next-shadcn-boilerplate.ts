# Tauri + Next + shadcn Boilerplate

Production-ready desktop starter built with Tauri 2, Rust, Next.js 16, React 19, TypeScript, Tailwind 4, and shadcn/ui. Everything ships with pnpm, Biome, and the new Tauri capabilities setup so you can focus on app logic instead of wiring.

## Quick Start

```bash
git clone https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts my-app
cd my-app

rm -rf .git # linux or macos
Remove-Item -Recurse -Force .git # windows

git init # initialise your new repo
git add .
git commit -m "initial commit"
pnpm install
pnpm tauri dev
```

That single command starts the Next.js dev server and launches the desktop shell. Builds live under `src-tauri/target` via `pnpm tauri build`.

## Handy Scripts

- `node scripts/change_name.cjs <developer> <AppName>` updates every identifier (package.json, Cargo.toml, main.rs, tauri.conf.json, Cargo.lock) plus the bundle identifier (`com.<developer>.<AppName>`). Run it once after cloning instead of editing files manually.
- `node scripts/version.cjs <patch|minor|major>` bumps versions across package.json, Cargo.toml, and tauri.conf.json while appending the new value to `constants/.versions`. Use `node scripts/version.cjs peek` to print the current version and `node scripts/version.cjs pop` to roll back (will refuse if only one entry exists).
- Default pnpm scripts:
  - `pnpm dev` — Next.js only preview
  - `pnpm tauri dev` — desktop dev loop
  - `pnpm tauri build` — production bundles
  - `pnpm lint` / `pnpm format` — Biome check + fix

## Customizing The App

| Task | Where |
| --- | --- |
| App metadata | `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` (or run `change_name.cjs`) |
| Rust commands | `src-tauri/src/lib.rs` (add #[tauri::command] functions) |
| UI screens | `app/` (Next.js App Router) and `components/ui/` |
| Styles | `styles/globals.css` |

### Change the Icon

Drop a square PNG (at least 512×512) somewhere and run:

```bash
cargo tauri icon path/to/your/image.png
```

Tauri generates every platform-specific asset under `src-tauri/icons` automatically.

## Tips

- Keep `constants/.versions` under version control; it is the source of truth for release history and the `pop` command.
- When adding new Tauri capabilities edit `src-tauri/capabilities/*.json` and re-run `pnpm tauri dev` so the schema reloads.
- For a pure web preview use `pnpm dev` and open [http://localhost:3000](http://localhost:3000).
