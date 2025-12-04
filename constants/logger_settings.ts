export type LogType = "session" | "unified";
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "off";

export interface LoggerSettings {
    /**
     * The path where to log.
     * If null or undefined, the default OS log directory will be used:
     * - Windows: `%APPDATA%\<bundle-identifier>\logs`
     * - Linux: `~/.local/share/<bundle-identifier>/logs`
     * - macOS: `~/Library/Logs/<bundle-identifier>`
     */
    logPath?: string;

    /**
     * Log type:
     * - 'session': New file each time application is opened (session_datetime.log)
     * - 'unified': Files named app_number.log with incremental numbers.
     */
    logType: LogType;

    /**
     * Max file size in bytes for unified logging before rotation.
     * Default: 5MB (5 * 1024 * 1024)
     */
    maxFileSize: number;

    /**
     * Minimum log level for the console output.
     * Default: 'info'
     */
    consoleLevel: LogLevel;

    /**
     * Minimum log level for the file output.
     * Default: 'info'
     */
    fileLevel: LogLevel;
}

export const LOGGER_SETTINGS: LoggerSettings = {
    logType: "unified",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    consoleLevel: "debug",
    fileLevel: "info",
    // logPath: '~/app_name/log/'
};
