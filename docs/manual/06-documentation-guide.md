---
sidebar_position: 6
---

# Documentation Guide

This documentation site is built with **VitePress**, a static site generator powered by Vite and Vue. It is designed to be fast, lightweight, and easy to customize.

As you build your application on top of this boilerplate, you should also update this documentation to reflect your own features and API.

## Structure

The documentation source code is located in the `docs/` directory.

```text
docs/
├── .vitepress/
│   └── config.mts       # Main configuration (sidebar, nav, theme)
├── api/                 # Auto-generated API reference (do not edit manually)
├── manual/              # Your handwritten guides (Markdown)
├── index.md             # The landing page
├── package.json         # Docs-specific dependencies
└── typedoc.json         # Configuration for API generation
```

## Writing Manual Pages

To add a new guide:

1.  Create a new Markdown file in `docs/manual/`.
    *   Example: `docs/manual/06-my-new-feature.md`
2.  Add content using standard Markdown. You can also use [VitePress features](https://vitepress.dev/guide/markdown) like custom containers, code groups, and more.
3.  Register the new page in the sidebar configuration.
    *   Open `docs/.vitepress/config.mts`.
    *   Add an entry to the `sidebar['/manual/']` array:

```typescript
// docs/.vitepress/config.mts
sidebar: {
  '/manual/': [
    {
      text: 'Manual',
      items: [
        // ... existing items
        { text: 'My New Feature', link: '/manual/06-my-new-feature' }
      ]
    }
  ]
}
```

## Updating API Reference

The API reference is automatically generated from your TypeScript code comments using **TypeDoc**.

1.  **Write Comments**: Ensure your classes, functions, and interfaces have JSDoc comments.
    ```typescript
    /**
     * Calculates the total sum.
     * @param a First number
     * @param b Second number
     */
    export function add(a: number, b: number): number { ... }
    ```
2.  **Generate**: Run the generation script.
    ```bash
    pnpm docs:gen-api
    ```
    This will update the files in `docs/api/`.

## Customizing the Theme

You can change the logo, colors, and layout in `docs/.vitepress/config.mts`.

- **Title & Description**: Update `title` and `description`.
- **Logo**: Replace `docs/public/logo.svg`.
- **Social Links**: Update the `socialLinks` array.
- **Footer**: Update the `footer` message.

## Deployment

The documentation is a static site. You can build it using:

```bash
pnpm docs:build
```

The output will be in `docs/.vitepress/dist`. You can deploy this folder to GitHub Pages, Vercel, Netlify, or any static host.
