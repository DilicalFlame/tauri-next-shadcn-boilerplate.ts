import { invoke } from "@tauri-apps/api/core";

export class TauriService {
    private static instance: TauriService;

    private constructor() {
        // Private constructor for Singleton
    }

    public static getInstance(): TauriService {
        if (!TauriService.instance) {
            TauriService.instance = new TauriService();
        }
        return TauriService.instance;
    }

    /**
     * Invokes the 'greet' command on the backend.
     * @param name The name to greet.
     */
    public async greet(name: string): Promise<string> {
        try {
            return await invoke<string>("greet", { name });
        } catch (error) {
            console.error("Failed to invoke greet:", error);
            throw error;
        }
    }

    /**
     * Invokes the 'system_beep' command on the backend.
     */
    public async systemBeep(): Promise<void> {
        try {
            await invoke("system_beep");
        } catch (error) {
            console.error("Failed to invoke system_beep:", error);
        }
    }
}
