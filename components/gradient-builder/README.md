# Gradient Builder

A visual CSS gradient builder for Retool. Pick two or more colors, adjust positions and angle, see the gradient preview live, and copy the CSS code. Fires the gradient string back to Retool.

## Features

- 🎨 **Live preview** — gradient updates in real time as you adjust colors, positions, and angle
- 🔄 **Linear & radial** — toggle between linear and radial gradient types
- ➕ **Multi-stop** — add as many color stops as you need, remove any except the minimum two
- 📐 **Angle control** — slider from 0° to 360° for linear gradients
- 📋 **Copy CSS** — one-click copy of the full `background: linear-gradient(...)` code
- 🔥 **Fires to Retool** — `gradientCSS` string and `modelUpdate` object

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

```
{{ gradientBuilder1.gradientCSS }}                → "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)"
{{ gradientBuilder1.modelUpdate.angle }}          → 135
{{ gradientBuilder1.modelUpdate.type }}           → "linear"
{{ gradientBuilder1.modelUpdate.stops }}          → [{ color: "#0ea5e9", position: 0 }, ...]
```

Wire the **gradientChange** event to trigger a query when the gradient changes.

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
