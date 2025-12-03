import { WindowStateManager } from "./WindowStateManager";
import { TauriService } from "./TauriService";
import { emit } from "@tauri-apps/api/event";
import { WebviewWindow, getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, PhysicalPosition, LogicalPosition, LogicalSize, Window } from "@tauri-apps/api/window";

export interface WindowConfig {
    url?: string;
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
    decorations?: boolean;
    visible?: boolean;
    parent?: string;
    skipTaskbar?: boolean;
    center?: boolean;
    minimizable?: boolean;
    x?: number;
    y?: number;
    maximized?: boolean;
    label?: string;
    category?: string; // New field for window category
}

export class WindowManager {
    private static instance: WindowManager;
    
    // Track the stack of modal children for the *current* window.
    private activeChildren: WebviewWindow[] = [];
    private auxiliaryWindows: WebviewWindow[] = [];
    private isFocusListenerActive = false;
    private focusGracePeriod = false;
    private isClosing = false;
    private currentScope = 'main'; // Default scope for now

    private constructor() {
        // Private constructor for Singleton
        this.setupMainWindowListener();
        this.initialize();
    }

    public async initialize() {
        const currentWindow = getCurrentWindow();
        try {
            const stateManager = WindowStateManager.getInstance();
            await stateManager.loadState();
            
            if (currentWindow.label === 'main') {
                await this.restoreMainWindow(currentWindow, stateManager);
            }
        } catch (e) {
            console.error('WindowManager initialization failed:', e);
        } finally {
            if (currentWindow.label === 'main') {
                await currentWindow.show();
                await currentWindow.setFocus();
            }
        }
    }

    private async restoreMainWindow(currentWindow: Window, stateManager: WindowStateManager) {
        const mainState = stateManager.getWindow(this.currentScope, 'main');
        if (mainState) {
            try {
                await currentWindow.setPosition(new LogicalPosition(mainState.x, mainState.y));
                await currentWindow.setSize(new LogicalSize(mainState.width, mainState.height));
                if (mainState.maximized) {
                    await currentWindow.maximize();
                }
            } catch (e) {
                console.error('Failed to restore main window state:', e);
            }
        }
        
        stateManager.trackWindow(currentWindow, this.currentScope, '/', 'main', 'main-window');
        
        const allWindows = stateManager.getWindows(this.currentScope);
        const restoredLabels: string[] = ['main'];
        let childRestored = false;

        for (const winState of allWindows) {
            if (winState.label === 'main') continue;
            
            let restored = false;
            if (winState.type === 'aux') {
                await this.openAuxiliaryWindow(winState.url, {
                    label: winState.label,
                    x: winState.x,
                    y: winState.y,
                    width: winState.width,
                    height: winState.height,
                    maximized: winState.maximized,
                    category: winState.category
                });
                restored = true;
            } else if (winState.type === 'child' && !childRestored) {
                childRestored = true;
                await this.openChildWindow(winState.url, {
                    label: winState.label,
                    x: winState.x,
                    y: winState.y,
                    width: winState.width,
                    height: winState.height,
                    maximized: winState.maximized,
                    category: winState.category
                });
                restored = true;
            }
            
            if (restored) {
                restoredLabels.push(winState.label);
            }
        }
        
        stateManager.pruneScope(this.currentScope, restoredLabels);
    }

    private async setupMainWindowListener() {
        const currentWindow = getCurrentWindow();
        if (currentWindow.label === 'main') {
            await currentWindow.onCloseRequested(async (event) => {
                if (this.isClosing) {
                    event.preventDefault();
                    return;
                }
                this.isClosing = true;
                event.preventDefault();

                try {
                    const allWindows = await getAllWebviewWindows();
                    const windowsToClose = allWindows.filter(w => w.label !== 'main');
                    
                    const closePromises = windowsToClose.map((win) =>
                        win.destroy().catch((e) => console.error(`Failed to destroy window ${win.label}:`, e))
                    );
                    await Promise.all(closePromises);
                } finally {
                    await currentWindow.destroy();
                }
            });
        }
    }

    private removeAuxiliaryWindow(window: WebviewWindow) {
        const index = this.auxiliaryWindows.indexOf(window);
        if (index > -1) {
            this.auxiliaryWindows.splice(index, 1);
        }
    }

    public static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
        }
        return WindowManager.instance;
    }

    /**
     * Emits an event to lock/unlock the UI of the current window.
     */
    public async setUiLock(locked: boolean): Promise<void> {
        const win = getCurrentWindow();
        await emit("lock-window-ui", {
            windowLabel: win.label,
            locked: locked,
        });
    }

    /**
     * Shakes the specified window to indicate it requires attention.
     */
    public async shakeWindow(window: WebviewWindow): Promise<void> {
        try {
            const pos = await window.outerPosition();
            const shakeOffset = 10;
            const shakeDelay = 30;
            const originalX = pos.x;

            for (let i = 0; i < 6; i++) {
                const offset = i % 2 === 0 ? shakeOffset : -shakeOffset;
                await window.setPosition(new PhysicalPosition(originalX + offset, pos.y));
                await new Promise((resolve) => setTimeout(resolve, shakeDelay));
            }
            await window.setPosition(new PhysicalPosition(originalX, pos.y));
        } catch (e) {
            console.warn("Failed to shake window:", e);
        }
    }

    /**
     * Ensures the parent window has a focus listener that enforces modality.
     */
    private async ensureParentListener(): Promise<void> {
        if (this.isFocusListenerActive) return;
        const parent = getCurrentWindow();
        this.isFocusListenerActive = true;

        await parent.listen("tauri://focus", async () => {
            // If we are in a grace period (e.g. switching focus between siblings), ignore.
            if (this.focusGracePeriod) return;

            // If no children are active, we don't need to do anything.
            if (this.activeChildren.length === 0) return;

            // Small delay to check if the focus event was transient or if the child is really closed
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Re-check after delay
            if (this.activeChildren.length === 0) return;
            const currentTop = this.activeChildren[this.activeChildren.length - 1];

            // If the top child changed (e.g. one closed), use the new one
            try {
                await currentTop.setFocus();
                await TauriService.getInstance().systemBeep();
                // Only shake the top-most child
                this.shakeWindow(currentTop);
            } catch (e) {
                // Ignore errors if child is gone
            }
        });

        // Listen for manual shake requests from the UI overlay
        await parent.listen<{ windowLabel: string }>("request-shake", async (event) => {
            if (event.payload?.windowLabel !== parent.label) return;

            if (this.activeChildren.length > 0) {
                const currentTop = this.activeChildren[this.activeChildren.length - 1];
                try {
                    await currentTop.setFocus();
                    await TauriService.getInstance().systemBeep();
                    // Only shake the top-most child
                    this.shakeWindow(currentTop);
                } catch (e) {
                    // Ignore
                }
            }
        });
    }

    private mergeWindowConfig(options: Partial<WindowConfig> | undefined, defaultOptions: WindowConfig): WindowConfig {
        let presetConfig: Partial<WindowConfig> = {};
        if (options?.category) {
            const preset = WindowStateManager.getInstance().getPreset(options.category);
            if (preset) {
                presetConfig = {
                    width: preset.width,
                    height: preset.height,
                    x: preset.x,
                    y: preset.y,
                    maximized: preset.maximized
                };
            }
        }
        return { ...defaultOptions, ...presetConfig, ...options };
    }

    public async openAuxiliaryWindow(path: string = "/", options?: Partial<WindowConfig>): Promise<void> {
        const label = options?.label || `aux-${Date.now()}`;
        
        const defaultOptions: WindowConfig = {
            url: path,
            title: "Auxiliary Window",
            width: 800,
            height: 600,
            resizable: true,
            decorations: true,
            visible: false,
        };

        const fullConfig = this.mergeWindowConfig(options, defaultOptions);
        
        // Extract properties that are not part of WindowOptions to avoid errors
        // @ts-ignore - category is not in WindowOptions
        const { category, ...windowOptions } = fullConfig;

        const webview = new WebviewWindow(label, windowOptions);
        this.auxiliaryWindows.push(webview);

        webview.once("tauri://created", async () => {
            console.log(`Auxiliary window ${label} created`);
            
            if (fullConfig.maximized) {
                await webview.maximize();
            }

            webview.show();
            WindowStateManager.getInstance().trackWindow(webview, this.currentScope, path, 'aux', category);
        });

        webview.once("tauri://error", (e) => {
            console.error(`Failed to create auxiliary window ${label}:`, JSON.stringify(e));
            this.removeAuxiliaryWindow(webview);
        });

        webview.once("tauri://destroyed", () => {
            this.removeAuxiliaryWindow(webview);
            if (!this.isClosing) {
                WindowStateManager.getInstance().removeWindow(this.currentScope, label);
            }
        });
    }

    public async openChildWindow(path: string = "/", options?: Partial<WindowConfig>): Promise<void> {
        const parentWindow = getCurrentWindow();

        // 1. Check if we already have a modal child.
        if (this.activeChildren.length > 0) {
            // If yes, do NOT create a new one. Instead, focus the existing one.
            const topChild = this.activeChildren[this.activeChildren.length - 1];
            try {
                await topChild.setFocus();
                this.shakeWindow(topChild);
                await TauriService.getInstance().systemBeep();
            } catch (e) {
                console.error("Failed to focus existing child:", e);
            }
            return;
        }

        // 2. Create the new child
        const label = options?.label || `child-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const defaultOptions: WindowConfig = {
            url: path,
            title: "Child Window",
            width: 600,
            height: 400,
            parent: parentWindow.label,
            skipTaskbar: true,
            center: true,
            resizable: false,
            minimizable: false,
            visible: false,
        };

        const fullConfig = this.mergeWindowConfig(options, defaultOptions);
        
        // If we are restoring position (from options or preset), disable centering
        if (fullConfig.x !== undefined && fullConfig.y !== undefined) {
            fullConfig.center = false;
        }

        // Extract properties that are not part of WindowOptions
        // @ts-ignore - category is not in WindowOptions
        const { category, ...windowOptions } = fullConfig;

        const webview = new WebviewWindow(label, windowOptions);

        // 3. Add to stack and setup listener
        this.activeChildren.push(webview);
        this.ensureParentListener();
        this.setUiLock(true);

        // 4. Handle Lifecycle
        webview.once("tauri://created", async () => {
            console.log(`Child window ${label} created`);
            
            if (fullConfig.maximized) {
                await webview.maximize();
            }

            webview.show();
            webview.setFocus();
            WindowStateManager.getInstance().trackWindow(webview, this.currentScope, path, 'child', category);
        });

        const cleanup = () => {
            const index = this.activeChildren.indexOf(webview);
            if (index > -1) {
                this.activeChildren.splice(index, 1);
            }

            // Remove from state manager when closed
            if (!this.isClosing) {
                WindowStateManager.getInstance().removeWindow(this.currentScope, label);
            }

            if (this.activeChildren.length === 0) {
                this.setUiLock(false);
            }

            // If there are siblings left, focus the next one
            if (this.activeChildren.length > 0) {
                this.focusGracePeriod = true;
                const nextChild = this.activeChildren[this.activeChildren.length - 1];
                nextChild.setFocus().catch(() => {});
                // Reset grace period after a short time
                setTimeout(() => {
                    this.focusGracePeriod = false;
                }, 200);
            }
        };

        webview.once("tauri://error", (e) => {
            console.error(`Failed to create child window ${label}:`, JSON.stringify(e));
            cleanup();
        });

        webview.once("tauri://destroyed", () => {
            cleanup();
        });
    }
}
