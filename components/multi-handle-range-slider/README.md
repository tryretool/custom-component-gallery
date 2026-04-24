# Multi-Handle Range Slider

A slider with 3 or more draggable handles — define multiple price tiers, ranges, or thresholds simultaneously on a single track.

## Features

- 🎚️ **Multiple handles** — 2, 3, 4, or more handles on one track
- 🎨 **Colored segments** — each zone between handles gets its own color
- 🏷️ **Segment labels** — label each zone (Free, Basic, Pro, Enterprise)
- 💬 **Hover tooltips** — value shown on hover for each handle
- 📱 **Touch support** — works on mobile/tablet
- 📤 **Outputs** — `values` array, `modelUpdate` with handles and segments

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

For `npx retool-ccl init`:
- **Library name:** `Multi-Handle Range Slider`
- **Description:** `A slider with 3 or more draggable handles for defining multiple price tiers or ranges`

## Usage in Retool

```
{{ multiHandleRangeSlider1.values }}                        → [250, 500, 750]
{{ multiHandleRangeSlider1.modelUpdate.segments }}          → [{ label, from, to }]
```

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `min` | number | 0 | Minimum value |
| `max` | number | 1000 | Maximum value |
| `step` | number | 10 | Snap step size |
| `handles` | array | [250, 500, 750] | Initial handle positions |
| `segmentLabels` | array | ["Free","Basic","Pro","Enterprise"] | Label for each segment |
| `unit` | string | $ | Unit prefix |
| `title` | string | "Price Tiers" | Header title |
| `disabled` | boolean | false | Disable all handles |

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
