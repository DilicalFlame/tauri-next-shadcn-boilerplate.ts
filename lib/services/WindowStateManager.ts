import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Window } from '@tauri-apps/api/window';

export type WindowType = 'main' | 'aux' | 'child';

export interface WindowState {
    label: string;
    url: string;
    type: WindowType;
    category?: string; // The 'role' of the window (e.g., 'settings', 'editor')
    x: number;
    y: number;
    width: number;
    height: number;
    maximized: boolean;
}

export interface AppState {
    // Global presets for window categories (e.g., all 'settings' windows share this default state)
    presets: Record<string, Partial<WindowState>>;
    // Windows grouped by Scope ID (e.g., Project Name or 'main' for default)
    scopes: Record<string, WindowState[]>;
}

const STATE_FILENAME = 'window-state.json';

export class WindowStateManager {
    private static instance: WindowStateManager;
    private state: AppState = { presets: {}, scopes: {} };
    private saveTimeout: NodeJS.Timeout | null = null;
    private trackedWindows: Map<string, (() => void) | null> = new Map(); // Map label to unlisten function

    private constructor() {}

    public static getInstance(): WindowStateManager {
        if (!WindowStateManager.instance) {
            WindowStateManager.instance = new WindowStateManager();
        }
        return WindowStateManager.instance;
    }

    public async loadState(): Promise<AppState> {
        try {
            const stateExists = await exists(STATE_FILENAME, { baseDir: BaseDirectory.AppLocalData });
            if (stateExists) {
                const content = await readTextFile(STATE_FILENAME, { baseDir: BaseDirectory.AppLocalData });
                const loaded = JSON.parse(content);
                
                // Migration check: if loaded state is array (old format), convert it
                if (Array.isArray(loaded.windows)) {
                    this.state = {
                        presets: {},
                        scopes: {
                            'main': loaded.windows // Migrate old windows to 'main' scope
                        }
                    };
                } else {
                    this.state = loaded;
                }
                
                console.log('Loaded window state:', this.state);
            } else {
                console.log('No window state file found.');
            }
        } catch (e) {
            console.error('Failed to load window state:', e);
        }
        return this.state;
    }

    public async saveState() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            try {
                // Ensure directory exists
                await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
                await writeTextFile(STATE_FILENAME, JSON.stringify(this.state, null, 2), { baseDir: BaseDirectory.AppLocalData });
                console.log('Saved window state');
            } catch (e) {
                console.error('Failed to save window state:', e);
            }
        }, 1000); // Debounce 1s
    }

    public updateWindowState(scope: string, label: string, update: Partial<WindowState>) {
        if (!this.state.scopes[scope]) return;
        
        const index = this.state.scopes[scope].findIndex(w => w.label === label);
        if (index > -1) {
            const current = this.state.scopes[scope][index];
            const newState = { ...current, ...update };
            this.state.scopes[scope][index] = newState;
            
            // If this window has a category, update the global preset for that category
            if (current.category) {
                // We only update position/size/maximized in presets, not label/url
                const { x, y, width, height, maximized } = newState;
                this.state.presets[current.category] = { x, y, width, height, maximized };
            }
            
            this.saveState();
        }
    }
    
    public addOrUpdateWindow(scope: string, windowState: WindowState) {
         if (!this.state.scopes[scope]) {
             this.state.scopes[scope] = [];
         }
         
         const index = this.state.scopes[scope].findIndex(w => w.label === windowState.label);
         if (index > -1) {
             this.state.scopes[scope][index] = { ...this.state.scopes[scope][index], ...windowState };
         } else {
             this.state.scopes[scope].push(windowState);
         }
         
         // Update preset if category exists
         if (windowState.category) {
             const { x, y, width, height, maximized } = windowState;
             this.state.presets[windowState.category] = { x, y, width, height, maximized };
         }

         this.saveState();
    }

    public removeWindow(scope: string, label: string) {
        if (this.state.scopes[scope]) {
            this.state.scopes[scope] = this.state.scopes[scope].filter(w => w.label !== label);
            this.saveState();
        }
        
        if (this.trackedWindows.has(label)) {
            const unlisten = this.trackedWindows.get(label);
            if (unlisten) unlisten();
            this.trackedWindows.delete(label);
        }
    }

    public pruneScope(scope: string, keepLabels: string[]) {
        if (this.state.scopes[scope]) {
            const initialCount = this.state.scopes[scope].length;
            this.state.scopes[scope] = this.state.scopes[scope].filter(w => keepLabels.includes(w.label));
            if (this.state.scopes[scope].length !== initialCount) {
                console.log(`Pruned ${initialCount - this.state.scopes[scope].length} stale windows from scope ${scope}`);
                this.saveState();
            }
        }
    }
    
    public getWindow(scope: string, label: string): WindowState | undefined {
        return this.state.scopes[scope]?.find(w => w.label === label);
    }
    
    public getWindows(scope: string): WindowState[] {
        return this.state.scopes[scope] || [];
    }

    public getPreset(category: string): Partial<WindowState> | undefined {
        return this.state.presets[category];
    }

    public async trackWindow(window: Window | WebviewWindow, scope: string, url: string, type: WindowType, category?: string) {
        const label = window.label;
        const effectiveCategory = category || type;
        
        // Mark as tracked immediately to handle race conditions
        this.trackedWindows.set(label, null);

        const update = async () => {
            try {
                // If we stopped tracking this window, don't update state
                if (!this.trackedWindows.has(label)) {
                     return;
                }

                if (await window.isMinimized()) return; 
                
                const isMaximized = await window.isMaximized();
                
                if (isMaximized) {
                    const existing = this.getWindow(scope, label);
                    if (existing) {
                        this.updateWindowState(scope, label, { maximized: true });
                        return;
                    }
                }

                const factor = await window.scaleFactor();
                const posPhysical = await window.outerPosition();
                const sizePhysical = await window.innerSize();
                
                const pos = posPhysical.toLogical(factor);
                const size = sizePhysical.toLogical(factor);

                this.addOrUpdateWindow(scope, {
                    label,
                    url,
                    type,
                    category: effectiveCategory,
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                    maximized: isMaximized
                });
            } catch (e) {
                // Window might be destroyed
            }
        };

        // Initial capture
        await update();

        // Listeners
        const unlistenMove = await window.onMoved(update);
        const unlistenResize = await window.onResized(update);
        
        // Store unlisten functions to clean up if needed
        // Only set if it hasn't been removed in the meantime
        if (this.trackedWindows.has(label)) {
            this.trackedWindows.set(label, () => {
                unlistenMove();
                unlistenResize();
            });
        } else {
            // It was removed during setup! Clean up listeners.
            unlistenMove();
            unlistenResize();
        }
    }
}
