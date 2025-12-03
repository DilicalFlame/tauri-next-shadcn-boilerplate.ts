---
sidebar_position: 7
---

# CI/CD & Automation

This template comes with pre-configured GitHub Actions and Dependabot settings to automate maintenance and deployment.

## Dependabot

We use GitHub Dependabot to keep dependencies up to date. The configuration is located in `.github/dependabot.yml`.

It is configured to monitor two separate package ecosystems:
1.  **Root Application**: Checks `package.json` in the root directory.
2.  **Documentation**: Checks `docs/package.json` in the docs directory.

### Customizing Updates

You can modify `.github/dependabot.yml` to change the update frequency or grouping.

```yaml
# .github/dependabot.yml
updates:
  - package-ecosystem: "npm"
    directory: "/docs"
    schedule:
      interval: "weekly" # Options: daily, weekly, monthly
```

## GitHub Pages Deployment

The documentation is automatically deployed to GitHub Pages whenever you push changes to the `main` branch that affect the `docs/` folder.

The workflow is defined in `.github/workflows/deploy-docs.yml`.

### Setup Instructions

To enable this for your repository:

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Pages**.
3.  Under **Build and deployment**, select **GitHub Actions** as the source.
4.  The next time you push to `main`, the `Deploy Docs to Pages` workflow will run, and your site will be live.

### Workflow Details

The workflow performs the following steps:
1.  **Checkout**: Clones the repository.
2.  **Setup**: Installs Node.js and pnpm.
3.  **Build**: Runs `pnpm build` inside the `docs/` folder.
4.  **Deploy**: Uploads the `docs/.vitepress/dist` artifact to GitHub Pages.

You can customize the trigger in the workflow file:

```yaml
# .github/workflows/deploy-docs.yml
on:
  push:
    branches: ["main"]
    paths:
      - "docs/**" # Only triggers if files in docs/ change
```
