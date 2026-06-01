# ZenFuel

ZenFuel is a small Chrome extension that helps analyze vehicle fuel economy by referencing [https://www.fueleconomy.gov/](https://www.fueleconomy.gov/)

**What's included**

- Vanilla JavaScript application built with Vite
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
3. Enable _Developer mode_.
4. Click _Load unpacked_ and select the `build/` folder from this repository.

The extension popup uses `build/index.html` and the manifest is `build/manifest.json`.

