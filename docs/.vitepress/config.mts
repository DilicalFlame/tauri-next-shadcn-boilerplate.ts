import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Tauri Template",
    description: "A professional boilerplate for building modern desktop apps",

    // Clean URLs (no .html)
    cleanUrls: true,

    // Base URL for GitHub Pages
    base: "/tauri-next-shadcn-boilerplate.ts/",

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: "/logo.svg",

        nav: [
            { text: "Manual", link: "/manual/01-intro" },
            { text: "API Reference", link: "/api/README" },
        ],

        sidebar: {
            "/manual/": [
                {
                    text: "Manual",
                    items: [
                        { text: "Introduction", link: "/manual/01-intro" },
                        { text: "Getting Started", link: "/manual/02-getting-started" },
                        { text: "Architecture", link: "/manual/03-architecture" },
                        { text: "Services", link: "/manual/04-services" },
                        { text: "Rust Backend", link: "/manual/05-rust-backend" },
                        {
                            text: "Documentation Guide",
                            link: "/manual/06-documentation-guide",
                        },
                        { text: "CI/CD & Automation", link: "/manual/07-ci-cd" },
                    ],
                },
            ],
            "/api/": [
                {
                    text: "API Reference",
                    items: [
                        { text: "Overview", link: "/api/README" },
                        {
                            text: "Logger",
                            link: "/api/lib/services/Logger/classes/LoggerService",
                        },
                        {
                            text: "TauriService",
                            link: "/api/lib/services/TauriService/classes/TauriService",
                        },
                        {
                            text: "WindowManager",
                            link: "/api/lib/services/WindowManager/classes/WindowManager",
                        },
                    ],
                },
            ],
        },

        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts",
            },
        ],

        footer: {
            message: "Released under the MIT License.",
            copyright: "Copyright © 2025",
        },

        search: {
            provider: "local",
        },
    },
});
