---
sidebar_position: 4
---

# Services

The application uses a Service-based architecture in the frontend to manage complex logic and communication with the backend.

## Logger Service

The `Logger` service (`lib/services/Logger.ts`) provides a unified way to log messages. It logs to the browser console in development and sends logs to the Rust backend for file storage.

### Usage

```typescript
import { Logger } from '@/lib/services/Logger';

// Log an info message
await Logger.info('Application started');

// Log an error with context
await Logger.error('Failed to fetch data', 'DataFetcher');
```

### Configuration

Logger settings are defined in `constants/logger_settings.ts`. You can configure:
- Log file path
- Log levels (Console vs File)
- Max file size
- Rotation strategy

## Tauri Service

The `TauriService` (`lib/services/TauriService.ts`) is a singleton wrapper around Tauri's `invoke` function. It provides type-safe methods to call backend commands.

### Usage

```typescript
import { TauriService } from '@/lib/services/TauriService';

const tauri = TauriService.getInstance();

// Call the 'greet' command
const message = await tauri.greet('World');
```

## Window Manager

The `WindowManager` handles window operations like minimizing, maximizing, and closing, ensuring consistent behavior across platforms.
