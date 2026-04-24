# Multi-Metric Progress Stack

Multiple stacked progress bars in one component — each with its own label, value, color, and max. Like a battery breakdown for dashboards.

## Features

- 📊 **Stacked bars** — any number of metrics in one compact component
- 🎨 **Per-bar colors** — each metric has its own color (or auto-assigned from a palette)
- 🔢 **Custom max** — each bar has its own max value, not just 0–100
- ✨ **Animated fill** — bars animate in on load
- 🖱️ **Clickable rows** — click any metric to output its data
- 📤 **Outputs** — `modelUpdate` with all metrics and percentages, `clickedMetric`

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

For `npx retool-ccl init`:
- **Library name:** `Multi-Metric Progress Stack`
- **Description:** `Multiple stacked progress bars — each with its own label, value, color, and max`

## Usage in Retool

```
{{ multiMetricProgress1.modelUpdate.metrics }}   → [{ label, value, max, percent }]
{{ multiMetricProgress1.clickedMetric }}         → { label, value, max, color, unit }
```

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metrics` | array | [...] | Array of `{ label, value, max, color?, unit? }` |
| `title` | string | "System Metrics" | Header title |
| `showValues` | boolean | true | Show value / max next to each label |
| `barHeight` | number | 10 | Height of each progress bar in px |
| `animate` | boolean | true | Animate bars on load |

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
