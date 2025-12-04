import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
    PhysicalPosition,
} from "@tauri-apps/api/window";
import {
    AUXILIARY_WINDOW_DEFAULT_HEIGHT,
    AUXILIARY_WINDOW_DEFAULT_WIDTH,
    CHILD_WINDOW_DEFAULT_HEIGHT,
    CHILD_WINDOW_DEFAULT_WIDTH,
} from "@/constants/window_settings";
import { TauriService } from "./TauriService";
import { WindowStateService } from "./WindowStateService";

export class WindowService {
    private static instance: WindowService;

    // Track the stack of modal children for the *current* window.
    private activeChildren: WebviewWindow[] = [];
    private auxiliaryWindows: WebviewWindow[] = [];
    private isFocusListenerActive = false;
    private focusGracePeriod = false;
    private isClosing = false;
    private currentScope = "main"; // Default scope for now

    private constructor() {
        // Private constructor for Singleton
        this.setupMainWindowListener();
        this.setupLifecycleListener();
        this.initialize();
    }

    public async initialize() {
        const currentWindow = getCurrentWindow();
        try {
            const stateManager = WindowStateService.getInstance();
            await stateManager.loadState();
            stateManager.setWorkspace(this.currentScope);

            // If we are the main window
            if (currentWindow.label === "main") {
                // Listen for tracking requests from other windows
                // This ensures the main window (which persists) manages all state tracking
                // Listen for state updates from other windows (Distributed Tracking)
                await currentWindow.listen("window-state-update", async (event: any) => {
                    const { type, payload } = event.payload;

                    switch (type) {
                        case "update-preset":
                            stateManager.updateCategoryPreset(payload.category, payload.preset);
                            break;
                        case "register-window":
                            stateManager.registerWindow(
                                payload.label,
                                payload.category,
                                payload.type,
                                payload.url,
                            );
                            break;
                        case "remove-window":
                            stateManager.removeWindow(payload.label);
                            break;
                    }
                });

                // Try to restore main window position from category preset
                const mainPreset = stateManager.getCategoryPreset("main-window");
                if (mainPreset) {
                    try {
                        await currentWindow.setPosition(
                            new LogicalPosition(mainPreset.x, mainPreset.y),
                        );
                        await currentWindow.setSize(
                            new LogicalSize(mainPreset.width, mainPreset.height),
                        );
                        if (mainPreset.maximized) {
                            await currentWindow.maximize();
                        }
                    } catch (e) {
                        console.error("Failed to restore main window state:", e);
                    }
                }

                // Start tracking main window
                await stateManager.trackWindow(currentWindow, "/", "main", "main-window");

                // Restore active windows from session
                const activeWindows = stateManager.getActiveWindows();
                const restorePromises: Promise<void>[] = [];

                for (const [label, info] of Object.entries(activeWindows)) {
                    if (label === "main") continue; // Main is already handled

                    if (info.type === "aux") {
                        restorePromises.push(
                            this.openAuxiliaryWindow(info.url, {
                                label,
                                category: info.category,
                            }),
                        );
                    } else if (info.type === "child") {
                        restorePromises.push(
                            this.openChildWindow(info.url, {
                                label,
                                category: info.category,
                            }),
                        );
                    }
                }

                await Promise.all(restorePromises);

                // Prune any windows that failed to open or were skipped (e.g. extra child windows)
                const validLabels = ["main"];
                this.auxiliaryWindows.forEach((w) => void validLabels.push(w.label));
                this.activeChildren.forEach((w) => void validLabels.push(w.label));

                stateManager.pruneInactiveWindows(validLabels);
            }
        } catch (e) {
            console.error("WindowManager initialization failed:", e);
        } finally {
            if (currentWindow.label === "main") {
                await currentWindow.show();
                await currentWindow.setFocus();
            }
        }
    }

    private async setupMainWindowListener() {
        const currentWindow = getCurrentWindow();
        if (currentWindow.label === "main") {
            await currentWindow.onCloseRequested(async (event) => {
                if (this.isClosing) {
                    event.preventDefault();
                    return;
                }
                this.isClosing = true;
                // Main window closing logic is special - it destroys everything
                // We don't prevent default here immediately because we want to run cleanup
                // But we need to keep the window alive until cleanup is done.
                // Actually, the original code prevented default, did cleanup, then destroyed.
                event.preventDefault();

                try {
                    const closePromises = this.auxiliaryWindows.map((win) =>
                        win
                            .destroy()
                            .catch((e) =>
                                console.error(`Failed to destroy aux window ${win.label}:`, e),
                            ),
                    );
                    await Promise.all(closePromises);
                } finally {
                    await currentWindow.destroy();
                }
            });
        }
    }

    private async setupLifecycleListener() {
        const currentWindow = getCurrentWindow();

        // Listen for close requests on THIS window
        await currentWindow.onCloseRequested(async (_event) => {
            // If we are main, the setupMainWindowListener handles the heavy lifting of destroying aux windows.
            // But for ALL windows (including Main, Aux, Child), we need to ensure children are cleaned up from state.

            console.log(`Window ${currentWindow.label} close requested. Cleaning up children...`);

            // 1. Clean up active children from state
            // We iterate backwards to avoid issues if array changes (though we are just reading here)
            for (const child of this.activeChildren) {
                console.log(`Requesting cleanup for child: ${child.label}`);

                // Emit event to Main to remove this child from state
                // We do this even if the child process is about to die, to ensure Main knows it's gone.
                if (currentWindow.label !== "main") {
                    await emit("window-state-update", {
                        type: "remove-window",
                        payload: { label: child.label },
                    });
                } else {
                    // If we are main, we can call directly
                    WindowStateService.getInstance().removeWindow(child.label);
                }
            }

            // 2. Clean up SELF from state (if not main)
            if (currentWindow.label !== "main") {
                await emit("window-state-update", {
                    type: "remove-window",
                    payload: { label: currentWindow.label },
                });
            }
        });
    }

    private removeAuxiliaryWindow(window: WebviewWindow) {
        const index = this.auxiliaryWindows.indexOf(window);
        if (index > -1) {
            this.auxiliaryWindows.splice(index, 1);
        }
    }

    public static getInstance(): WindowService {
        if (!WindowService.instance) {
            WindowService.instance = new WindowService();
        }
        return WindowService.instance;
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
            } catch (_e) {
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
                } catch (_e) {
                    // Ignore
                }
            }
        });
    }

    public async openAuxiliaryWindow(
        path: string = "/",
        options?: Partial<IWindowConfig>,
    ): Promise<void> {
        // Use provided label (for restoration) or generate a fresh one
        const label = options?.label || `aux-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Check for category preset if category is provided
        let presetConfig: Partial<IWindowConfig> = {};
        if (options?.category) {
            const preset = WindowStateService.getInstance().getCategoryPreset(options.category);
            if (preset) {
                presetConfig = {
                    width: preset.width,
                    height: preset.height,
                    x: preset.x,
                    y: preset.y,
                    maximized: preset.maximized,
                };
            }
        }

        const defaultOptions: Partial<IWindowConfig> = {
            url: path,
            title: "Auxiliary Window",
            width: AUXILIARY_WINDOW_DEFAULT_WIDTH,
            height: AUXILIARY_WINDOW_DEFAULT_HEIGHT,
            resizable: true,
            decorations: true,
            visible: false,
        };

        // Priority: options > preset > default
        const fullConfig = { ...defaultOptions, ...presetConfig, ...options };

        // Extract properties that are not part of WindowOptions to avoid errors
        const { category, ...windowOptions } = fullConfig;

        const webview = new WebviewWindow(label, windowOptions);
        this.auxiliaryWindows.push(webview);

        webview.once("tauri://created", async () => {
            console.log(`Auxiliary window ${label} created`);

            if (fullConfig.maximized) {
                await webview.maximize();
            }

            webview.show();
            const effectiveCategory = category || "aux";
            WindowStateService.getInstance().trackWindow(webview, path, "aux", effectiveCategory);
        });

        webview.once("tauri://error", (e) => {
            console.error(`Failed to create auxiliary window ${label}:`, JSON.stringify(e));
            this.removeAuxiliaryWindow(webview);
        });

        webview.once("tauri://destroyed", () => {
            this.removeAuxiliaryWindow(webview);
            if (!this.isClosing) {
                WindowStateService.getInstance().removeWindow(label);
            }
        });
    }

    public async openChildWindow(
        path: string = "/",
        options?: Partial<IWindowConfig>,
    ): Promise<void> {
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
        // Use provided label (for restoration) or generate a fresh one
        const label = options?.label || `child-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Check for category preset if category is provided
        let presetConfig: Partial<IWindowConfig> = {};
        if (options?.category) {
            const preset = WindowStateService.getInstance().getCategoryPreset(options.category);
            if (preset) {
                presetConfig = {
                    width: preset.width,
                    height: preset.height,
                    x: preset.x,
                    y: preset.y,
                    maximized: preset.maximized,
                };
            }
        }

        const defaultOptions: Partial<IWindowConfig> = {
            url: path,
            title: "Child Window",
            width: CHILD_WINDOW_DEFAULT_WIDTH,
            height: CHILD_WINDOW_DEFAULT_HEIGHT,
            parent: parentWindow.label,
            skipTaskbar: true,
            center: true,
            resizable: false,
            minimizable: false,
            visible: false,
        };

        // Priority: options > preset > default
        const fullConfig = { ...defaultOptions, ...presetConfig, ...options };

        // If we are restoring position (from options or preset), disable centering
        if (fullConfig.x !== undefined && fullConfig.y !== undefined) {
            fullConfig.center = false;
        }

        // Extract properties that are not part of WindowOptions
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
            const effectiveCategory = category || "child";
            WindowStateService.getInstance().trackWindow(webview, path, "child", effectiveCategory);
        });

        const cleanup = () => {
            const index = this.activeChildren.indexOf(webview);
            if (index > -1) {
                this.activeChildren.splice(index, 1);
            }

            // Remove from state manager when closed
            if (!this.isClosing) {
                WindowStateService.getInstance().removeWindow(label);
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
