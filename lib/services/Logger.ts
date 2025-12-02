import { invoke } from '@tauri-apps/api/core';
import { LOGGER_SETTINGS } from '@/constants/logger_settings';
import StackTrace from 'stacktrace-js';

class LoggerService {
  private initialized = false;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    // Ensure we are in the browser environment before invoking Tauri commands
    if (typeof window === 'undefined') return;

    try {
      // Map TS settings to Rust struct keys (snake_case)
      const settings = {
        log_path: LOGGER_SETTINGS.logPath || null,
        log_type: LOGGER_SETTINGS.logType,
        max_file_size: LOGGER_SETTINGS.maxFileSize,
        console_level: LOGGER_SETTINGS.consoleLevel,
        file_level: LOGGER_SETTINGS.fileLevel,
      };
      
      await invoke('init_logger_cmd', { settings });
      this.initialized = true;
      console.log('Logger initialized successfully');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  private async getCallerLocation(context?: string): Promise<string> {
    // Production Mode: Use manual context if provided
    if (!this.isDev && context) {
      return context;
    }

    // Development Mode (or Prod fallback): Try to resolve source location
    if (this.isDev) {
      try {
        const stackframes = await StackTrace.get();
        // 0: getCallerLocation, 1: log method, 2: public method, 3: caller
        const callerFrame = stackframes[3];
        
        if (callerFrame) {
          let fileName = callerFrame.fileName || 'unknown';
          
          // Clean up common Next.js/Webpack prefixes
          fileName = fileName
            .replace(/^webpack-internal:\/\/\/\.\//, '')
            .replace(/^webpack-internal:\/\/\//, '')
            .replace(/^file:\/\//, '');

          if (fileName.startsWith('http')) {
             try {
                const path = new URL(fileName).pathname;
                fileName = path.replace(/^\/_next\/static\/chunks\//, '');
             } catch {}
          }

          // Try to find project root relative path
          const match = fileName.match(/.*[\/\\]((?:app|src|components|lib|hooks|constants|types)[\/\\].*)/);
          if (match && match[1]) {
            fileName = match[1];
          }

          const line = callerFrame.lineNumber || '?';
          return `${fileName}:${line}`;
        }
      } catch (e) {
        console.warn('Failed to resolve stack trace:', e);
      }
    }

    return context || 'unknown';
  }

  private async log(level: string, message: string, context?: string) {
    const location = await this.getCallerLocation(context);
    
    // Also log to console for dev
    const consoleMethod = (console as any)[level] || console.log;
    const prefix = context ? `[${context}]` : '';
    consoleMethod(`[${level.toUpperCase()}] ${prefix} ${message}`);

    try {
      await invoke('log_frontend_message', {
        level,
        message,
        location,
      });
    } catch (error) {
      console.error('Failed to send log to backend:', error);
    }
  }

  public async info(message: string, context?: string) {
    await this.log('info', message, context);
  }

  public async warn(message: string, context?: string) {
    await this.log('warn', message, context);
  }

  public async error(message: string, context?: string) {
    await this.log('error', message, context);
  }

  public async debug(message: string, context?: string) {
    await this.log('debug', message, context);
  }
  
  public async trace(message: string, context?: string) {
    await this.log('trace', message, context);
  }
}

export const Logger = new LoggerService();
