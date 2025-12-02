import { TauriService } from "./TauriService";
import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";

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
}

export class WindowManager {
    private static instance: WindowManager;
    
    // Track the stack of modal children for the *current* window.
    private activeChildren: WebviewWindow[] = [];
    private auxiliaryWindows: WebviewWindow[] = [];
    private isFocusListenerActive = false;
    private focusGracePeriod = false;
    private isClosing = false;

    private constructor() {
        // Private constructor for Singleton
        this.setupMainWindowListener();
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
                    const closePromises = this.auxiliaryWindows.map((win) =>
                        win.destroy().catch((e) => console.error(`Failed to destroy aux window ${win.label}:`, e))
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

    public async openAuxiliaryWindow(path: string = "/", options?: Partial<WindowConfig>): Promise<void> {
        const label = `aux-${Date.now()}`;
        const defaultOptions: WindowConfig = {
            url: path,
            title: "Auxiliary Window",
            width: 800,
            height: 600,
            resizable: true,
            decorations: true,
            visible: false,
        };

        const config = { ...defaultOptions, ...options };

        const webview = new WebviewWindow(label, config);
        this.auxiliaryWindows.push(webview);

        webview.once("tauri://created", () => {
            console.log(`Auxiliary window ${label} created`);
            webview.show();
        });

        webview.once("tauri://error", (e) => {
            console.error(`Failed to create auxiliary window ${label}:`, e);
            this.removeAuxiliaryWindow(webview);
        });

        webview.once("tauri://destroyed", () => {
            this.removeAuxiliaryWindow(webview);
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
        const label = `child-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

        const config = { ...defaultOptions, ...options };

        const webview = new WebviewWindow(label, config);

        // 3. Add to stack and setup listener
        this.activeChildren.push(webview);
        this.ensureParentListener();
        this.setUiLock(true);

        // 4. Handle Lifecycle
        webview.once("tauri://created", () => {
            console.log(`Child window ${label} created`);
            webview.show();
            webview.setFocus();
        });

        const cleanup = () => {
            const index = this.activeChildren.indexOf(webview);
            if (index > -1) {
                this.activeChildren.splice(index, 1);
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
            console.error(`Failed to create child window ${label}:`, e);
            cleanup();
        });

        webview.once("tauri://destroyed", () => {
            cleanup();
        });
    }
}
