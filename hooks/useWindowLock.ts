import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowLock() {
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        let unlistenFn: (() => void) | undefined;

        const setupListener = async () => {
            const unlisten = await listen<{ windowLabel: string; locked: boolean }>(
                "lock-window-ui",
                (event) => {
                    if (event.payload.windowLabel === getCurrentWindow().label) {
                        setIsLocked(event.payload.locked);
                    }
                },
            );
            unlistenFn = unlisten;
        };

        setupListener();

        return () => {
            if (unlistenFn) {
                unlistenFn();
            }
        };
    }, []);

    return isLocked;
}
