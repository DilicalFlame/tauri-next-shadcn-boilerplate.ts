import { emit } from "@tauri-apps/api/event";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export type WindowType = "main" | "aux" | "child";

export interface CategoryPreset {
    x: number;
    y: number;
    width: number;
    height: number;
    maximized: boolean;
}

export interface ActiveWindow {
    category: string;
    type: WindowType;
    url: string;
}

export interface WorkspaceState {
    active_windows: Record<string, ActiveWindow>; // label -> window info
    category_presets: Record<string, CategoryPreset>; // category -> position/size
}

export interface AppState {
    workspaces: Record<string, WorkspaceState>; // workspace_id -> workspace state
}

const STATE_FILENAME = "window-state.json";

export class WindowStateManager {
    private static instance: WindowStateManager;
    private state: AppState = { workspaces: {} };
    private saveTimeout: NodeJS.Timeout | null = null;
    private trackedWindows: Map<string, () => void> = new Map(); // Map label to unlisten function
    private currentWorkspace: string = "default"; // Current workspace identifier

    private constructor() {}

    public static getInstance(): WindowStateManager {
        if (!WindowStateManager.instance) {
            WindowStateManager.instance = new WindowStateManager();
        }
        return WindowStateManager.instance;
    }

    public setWorkspace(workspaceId: string) {
        this.currentWorkspace = workspaceId;
        // Ensure workspace exists
        if (!this.state.workspaces[workspaceId]) {
            this.state.workspaces[workspaceId] = {
                active_windows: {},
                category_presets: {},
            };
        }
    }

    public getWorkspace(): string {
        return this.currentWorkspace;
    }

    public async loadState(): Promise<AppState> {
        try {
            const stateExists = await exists(STATE_FILENAME, {
                baseDir: BaseDirectory.AppLocalData,
            });
            if (stateExists) {
                const content = await readTextFile(STATE_FILENAME, {
                    baseDir: BaseDirectory.AppLocalData,
                });
                const loaded = JSON.parse(content);

                // Validate new format
                if (loaded.workspaces && typeof loaded.workspaces === "object") {
                    this.state = { workspaces: {} };

                    // Validate each workspace
                    for (const wsId in loaded.workspaces) {
                        const ws = loaded.workspaces[wsId];
                        if (ws.active_windows && ws.category_presets) {
                            this.state.workspaces[wsId] = {
                                active_windows: ws.active_windows || {},
                                category_presets: ws.category_presets || {},
                            };
                        } else {
                            console.warn(`Workspace ${wsId} has invalid format, skipping`);
                        }
                    }
                } else {
                    // Old format or unknown, start fresh
                    console.warn("Old or unknown state format detected, starting fresh");
                    this.state = { workspaces: {} };
                }

                console.log("Loaded window state:", this.state);
            } else {
                console.log("No window state file found, starting fresh.");
            }
        } catch (e) {
            console.error("Failed to load window state:", e);
            this.state = { workspaces: {} };
        }

        // Ensure current workspace exists
        if (!this.state.workspaces[this.currentWorkspace]) {
            this.state.workspaces[this.currentWorkspace] = {
                active_windows: {},
                category_presets: {},
            };
        }

        return this.state;
    }

    public async saveState() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            try {
                await mkdir("", {
                    baseDir: BaseDirectory.AppLocalData,
                    recursive: true,
                });
                await writeTextFile(STATE_FILENAME, JSON.stringify(this.state, null, 2), {
                    baseDir: BaseDirectory.AppLocalData,
                });
                console.log("Saved window state");
            } catch (e) {
                console.error("Failed to save window state:", e);
            }
        }, 1000); // Debounce 1s
    }

    /**
     * Register a window as active in the current workspace
     */
    public registerWindow(label: string, category: string, type: WindowType, url: string) {
        const currentWindow = getCurrentWindow();
        if (currentWindow.label !== "main") {
            emit("window-state-update", {
                type: "register-window",
                payload: { label, category, type, url },
            });
            return;
        }

        const ws = this.state.workspaces[this.currentWorkspace];
        if (!ws) return;

        ws.active_windows[label] = { category, type, url };
        this.saveState();
    }

    /**
     * Update category preset with new position/size
     */
    public updateCategoryPreset(category: string, preset: CategoryPreset) {
        const currentWindow = getCurrentWindow();
        if (currentWindow.label !== "main") {
            emit("window-state-update", {
                type: "update-preset",
                payload: { category, preset },
            });
            return;
        }

        const ws = this.state.workspaces[this.currentWorkspace];
        if (!ws) return;

        ws.category_presets[category] = preset;
        console.log(`Updated preset for category '${category}':`, preset);
        this.saveState();
    }

    /**
     * Remove a window from active windows (called on window close)
     */
    public removeWindow(label: string) {
        const currentWindow = getCurrentWindow();
        if (currentWindow.label !== "main") {
            emit("window-state-update", {
                type: "remove-window",
                payload: { label },
            });
            return;
        }

        const ws = this.state.workspaces[this.currentWorkspace];
        if (!ws) return;

        delete ws.active_windows[label];
        this.saveState();

        // Clean up tracking
        if (this.trackedWindows.has(label)) {
            const unlisten = this.trackedWindows.get(label);
            if (unlisten) unlisten();
            this.trackedWindows.delete(label);
        }
    }

    /**
     * Get category preset for positioning
     */
    public getCategoryPreset(category: string): CategoryPreset | undefined {
        const ws = this.state.workspaces[this.currentWorkspace];
        return ws?.category_presets[category];
    }

    /**
     * Get all active windows in current workspace
     */
    public getActiveWindows(): Record<string, ActiveWindow> {
        const ws = this.state.workspaces[this.currentWorkspace];
        return ws?.active_windows || {};
    }

    /**
     * Check if a window is registered as active
     */
    public isWindowActive(label: string): boolean {
        const ws = this.state.workspaces[this.currentWorkspace];
        return !!ws?.active_windows[label];
    }

    /**
     * Clean up windows that no longer exist
     */
    public pruneInactiveWindows(activeLabels: string[]) {
        const ws = this.state.workspaces[this.currentWorkspace];
        if (!ws) return;

        const currentLabels = Object.keys(ws.active_windows);
        const removed = currentLabels.filter((label) => !activeLabels.includes(label));

        if (removed.length > 0) {
            removed.forEach((label) => {
                delete ws.active_windows[label];
            });
            console.log(`Pruned ${removed.length} inactive windows: ${removed.join(", ")}`);
            this.saveState();
        }
    }

    public async trackWindow(
        window: Window | WebviewWindow,
        url: string,
        type: WindowType,
        category: string,
    ) {
        const label = window.label;
        const currentWindow = getCurrentWindow();

        // If we are not the main window, we still track locally but send updates to main
        // No need to delegate tracking logic anymore, just the saving.

        // Register window as active
        console.log(`Registering window ${label} with category ${category}`);
        this.registerWindow(label, category, type, url);

        const update = async () => {
            try {
                // Skip if window is minimized
                if (await window.isMinimized()) return;

                const isMaximized = await window.isMaximized();
                const factor = await window.scaleFactor();
                const posPhysical = await window.outerPosition();
                const sizePhysical = await window.innerSize();

                const pos = posPhysical.toLogical(factor);
                const size = sizePhysical.toLogical(factor);

                // Update the category preset with current window state
                if (isMaximized) {
                    // Only update maximized state, preserve restore bounds
                    const currentPreset = this.getCategoryPreset(category);
                    if (currentPreset) {
                        this.updateCategoryPreset(category, {
                            ...currentPreset,
                            maximized: true,
                        });
                    } else {
                        // If no preset exists, we have to save something, but we don't want to save the maximized size as the restore size.
                        // Best effort: save current (maximized) size but mark as maximized.
                        // Ideally we would want to know the restore bounds, but we can't easily get them if we started maximized.
                        // However, usually we start unmaximized, so we should have a preset.
                        this.updateCategoryPreset(category, {
                            x: pos.x,
                            y: pos.y,
                            width: size.width,
                            height: size.height,
                            maximized: true,
                        });
                    }
                } else {
                    // Update everything including restore bounds
                    this.updateCategoryPreset(category, {
                        x: pos.x,
                        y: pos.y,
                        width: size.width,
                        height: size.height,
                        maximized: false,
                    });
                }
            } catch (_e) {
                // Window might be destroyed, ignore
            }
        };

        // Initial capture
        await update();

        // Listeners for position/size changes
        const unlistenMove = await window.onMoved(update);
        const unlistenResize = await window.onResized(update);
        const unlistenFocus = await window.onFocusChanged(async (isFocused) => {
            if (isFocused) {
                await update();
            }
        });

        // Store unlisten functions to clean up later
        this.trackedWindows.set(label, () => {
            unlistenMove();
            unlistenResize();
            unlistenFocus();
        });

        // Listen for window destruction to clean up
        window.once("tauri://destroyed", () => {
            this.removeWindow(label);
        });

        // Also listen for close requested to ensure we remove before destruction (if possible)
        // This helps when the window itself is tracking itself
        if (window.label === currentWindow.label) {
            window.onCloseRequested(() => {
                this.removeWindow(label);
            });
        }
    }
}
