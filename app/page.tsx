"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useWindowLock } from "@/hooks";
import { Logger, TauriService, WindowService } from "@/lib/services";
import { Button } from "@/shadcn/button";

export default function Home() {
    const [greeting, setGreeting] = useState("");
    const isLocked = useWindowLock();

    useEffect(() => {
        // Initialize WindowManager to restore windows
        WindowService.getInstance();

        TauriService.getInstance().greet("World").then(setGreeting).catch(console.error);
    }, []);

    const handleOpenAuxiliary = () => {
        WindowService.getInstance()
            .openAuxiliaryWindow("/", {
                title: "Settings",
                category: "settings",
            })
            .then((_) => Logger.info("Opened settings window", "Home"));
    };

    const handleOpenChild = () => {
        WindowService.getInstance()
            .openChildWindow("/", {
                title: "Dialog",
                category: "dialog",
            })
            .then((_) => Logger.info("Opened dialog window", "Home"));
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-24 bg-background text-foreground relative">
            {isLocked && (
                // biome-ignore lint/a11y/useKeyWithClickEvents: This overlay is intentionally blocking
                <main
                    className="fixed inset-0 z-50 bg-transparent cursor-default"
                    onClick={() => {
                        const win = getCurrentWindow();
                        win.emit("request-shake", { windowLabel: win.label }).then((_) =>
                            Logger.info("Emitted request-shake event", "Home"),
                        );
                    }}
                />
            )}
            <h1 className="text-3xl font-bold tracking-tight text-center">
                Tauri + Next.js + shadcn/ui Boilerplate
                <br />
                <span className="text-lg font-normal">{greeting}</span>
            </h1>
            <p className="text-muted-foreground text-center max-w-md">
                <br />
                Click below to spawn different window types with persistent states.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleOpenAuxiliary}>
                    Open Settings (Aux)
                </Button>

                <Button size="lg" variant="secondary" onClick={handleOpenChild}>
                    Open Dialog (Child)
                </Button>
            </div>
        </main>
    );
}
