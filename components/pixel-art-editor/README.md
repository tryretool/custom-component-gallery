# Pixel Art Editor

A 32×32 canvas pixel-art editor for Retool. Draw with a pencil, erase, or flood-fill with a built-in palette (or custom color picker), then export the art as a PNG — the drawing is pushed back to Retool as a base64 data URL on every change.

## Features

- ✏️ **Pencil, eraser, and flood-fill** tools with live cursor highlight
- 🎨 **24-swatch palette** plus a native color picker for custom colors
- 🧱 **32×32 grid** rendered at 512×512 with pixelated upscaling
- 🔥 **Fires `change` event** on every stroke with the full PNG as a data URL
- 💾 **Export PNG button** downloads the art locally and fires an `export` event
- 🧹 **Clear button** resets the canvas and pushes an empty state back to Retool

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Drag the component onto your canvas.
2. Wire the `change` event to save the drawing (for example, an upload query using `{{ pixelArtEditor1.imageDataUrl }}`).
3. Read the base64 PNG out via `{{ pixelArtEditor1.imageDataUrl }}` — it's a standard `data:image/png;base64,…` URL, usable directly as an `<img>` source or decoded server-side.

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disabled` | boolean | `false` | Disable all drawing and palette controls |

## Output Properties

| Property | Type | Description |
|----------|------|-------------|
| `imageDataUrl` | string | Current canvas as a 512×512 PNG data URL (empty string when the canvas is blank) |
| `currentTool` | string | Active tool: `draw`, `erase`, or `fill` |
| `currentColor` | string | Active hex color (e.g. `#ff0000`) |
| `isEmpty` | boolean | True when nothing is drawn on the canvas |

## Events

| Event | Description |
|-------|-------------|
| `change` | Fires after every stroke, fill, or clear |
| `export` | Fires when the user clicks **Export PNG** |

## Tech Stack

- React 18
- TypeScript
- HTML Canvas 2D
- @tryretool/custom-component-support
- Zero external dependencies
