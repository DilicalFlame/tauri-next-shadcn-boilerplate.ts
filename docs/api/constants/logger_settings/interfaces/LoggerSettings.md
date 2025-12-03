[**app**](../../../README.md)

***

Defined in: [constants/logger\_settings.ts:4](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L4)

## Properties

### consoleLevel

> **consoleLevel**: [`LogLevel`](../type-aliases/LogLevel.md)

Defined in: [constants/logger\_settings.ts:31](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L31)

Minimum log level for the console output.
Default: 'info'

***

### fileLevel

> **fileLevel**: [`LogLevel`](../type-aliases/LogLevel.md)

Defined in: [constants/logger\_settings.ts:37](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L37)

Minimum log level for the file output.
Default: 'info'

***

### logPath?

> `optional` **logPath**: `string`

Defined in: [constants/logger\_settings.ts:12](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L12)

The path where to log.
If null or undefined, the default OS log directory will be used:
- Windows: `%APPDATA%\<bundle-identifier>\logs`
- Linux: `~/.local/share/<bundle-identifier>/logs`
- macOS: `~/Library/Logs/<bundle-identifier>`

***

### logType

> **logType**: [`LogType`](../type-aliases/LogType.md)

Defined in: [constants/logger\_settings.ts:19](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L19)

Log type:
- 'session': New file each time application is opened (session_datetime.log)
- 'unified': Files named app_number.log with incremental numbers.

***

### maxFileSize

> **maxFileSize**: `number`

Defined in: [constants/logger\_settings.ts:25](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/constants/logger_settings.ts#L25)

Max file size in bytes for unified logging before rotation.
Default: 5MB (5 * 1024 * 1024)
