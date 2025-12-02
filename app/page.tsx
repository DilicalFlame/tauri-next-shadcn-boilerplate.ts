"use client";

import { WindowManager } from "@/lib/services/WindowManager";
import { TauriService } from "@/lib/services/TauriService";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useWindowLock } from "@/hooks/useWindowLock";

export default function Home() {
	const [greeting, setGreeting] = useState("");
	const isLocked = useWindowLock();

	useEffect(() => {
		TauriService.getInstance()
			.greet("World")
			.then(setGreeting)
			.catch(console.error);
	}, []);

	const handleOpenAuxiliary = () => {
		WindowManager.getInstance().openAuxiliaryWindow();
	};

	const handleOpenChild = () => {
		WindowManager.getInstance().openChildWindow();
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-24 bg-background text-foreground relative">
			{isLocked && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: This overlay is intentionally blocking
				<div
					className="fixed inset-0 z-50 bg-transparent cursor-default"
					onClick={() => {
						const win = getCurrentWindow();
						win.emit("request-shake", { windowLabel: win.label });
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
				Click below to spawn different window types.
			</p>

			<div className="flex flex-col sm:flex-row gap-4">
				<Button size="lg" onClick={handleOpenAuxiliary}>
					Open Auxiliary Window
				</Button>

				<Button size="lg" variant="secondary" onClick={handleOpenChild}>
					Open Child Window
				</Button>
			</div>
		</main>
	);
}
