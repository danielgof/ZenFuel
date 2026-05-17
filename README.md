# ZenFuel

ZenFuel is a small React + TypeScript project built with Vite. It also produces a Chromium extension (Manifest V3) in the `build/` folder after running the production build.

**What's included**
- React + TypeScript application scaffolded for Vite
- Extension `manifest.json` in `public/` copied to `build/` during the build

## Prerequisites
- Node.js (v20.19.0 or later recommended)
- npm (bundled with Node.js)

## Quick start

Install dependencies:

```bash
npm install
```

Start the dev server (hot reload):

```bash
npm run dev
```

Build production output (generates `build/`):

```bash
npm run build
```

Preview the built site locally:

```bash
npm run preview
```

## Loading the extension (unpacked)

1. Run `npm run build` to produce the `build/` folder.
2. Open the browser extensions page (`chrome://extensions` or `edge://extensions`).
3. Enable *Developer mode*.
4. Click *Load unpacked* and select the `build/` folder from this repository.

The extension popup uses `build/index.html` and the manifest is `build/manifest.json`.

## Troubleshooting

- Could not load icon 'icon.svg': this error means the manifest references an icon file that doesn't exist in `public/`. The repository includes `favicon.svg` and `icons.svg` in `public/`. Update `public/manifest.json` to reference an existing file (the repo's manifest has been updated to use `favicon.svg`). After editing `public/manifest.json`, re-run `npm run build` and reload the unpacked extension.
- Manifest fails to load after build: open `build/manifest.json` and verify that all paths (icons, popup) are relative and the files exist in `build/`.



