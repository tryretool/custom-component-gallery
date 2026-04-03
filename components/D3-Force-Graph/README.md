# ForceGraphComponent

An interactive D3 force-directed graph custom component for Retool. Visualises node-link data with dynamic grouping, multiple themes, zoom controls, and a detail panel.

---

## Features

- `Force-directed layout` via D3 with drag, zoom, and pan
- `Auto node grouping` — detects a model, category, or any suitable key and colour-codes nodes accordingly
- `4 preset themes` — Arctic, Midnight, Rose Gold, Slate Pro
- `Custom theme editor` — live colour pickers for background, grid, edges, labels, node strokes, per-group node colours, and tooltip
- `Info panel` — click any node to inspect all its fields; shows a graph summary when nothing is selected
- `Hover tooltip` — displays node name, group value, and a prompt to click
- `Zoom controls` — zoom in, zoom out, reset
- `Stable rendering` — data identity is tracked by content, not object reference, so the simulation only rebuilds when data actually changes
- `Persisted preferences` — active theme and custom colour overrides survive page refresh via localStorage

---

## Input
The component accepts a single Retool state object named `graphData`.

Schema
```json
{
  "nodes": [
    {
      "id": "string | number",
      "name": "string",
      "model": "string (optional)",
      "category": "string (optional)",
      "avgLatency": "number (optional)",
      "avgCost": "number (optional)",
      "numCalls": "number (optional)",
      "performanceScore": "number (optional)"
    }
  ],
  "links": [
    {
      "source": "string | number (node id)",
      "target": "string | number (node id)",
      "weight": "number (optional, default 1)"
    }
  ]
}
```

---


Any additional fields on a node are displayed in the `All Fields` section of the info panel.

Example
```json
{
  "nodes": [
    { "id": "1", "name": "Classifier", "model": "GPT-4", "numCalls": 120, "avgLatency": 340 },
    { "id": "2", "name": "Summariser", "model": "Claude", "numCalls": 80,  "avgCost": 0.002 },
    { "id": "3", "name": "Embedder",   "model": "GPT-3.5", "numCalls": 200 }
  ],
  "links": [
    { "source": "1", "target": "2", "weight": 2 },
    { "source": "2", "target": "3" }
  ]
}
```


---


## Automatic grouping

The component scans all node keys in order — model, category, then any other key — and picks the first one that has between 2 and 20 distinct values. That key becomes the group key, used to colour nodes and populate the legend in the info panel.
To disable grouping, ensure no key on your nodes produces 2–20 distinct values

---

# Theming

## Preset themes

Select from the theme bar at the bottom of the component: `Arctic, Midnight, Rose Gold, Slate Pro`.

## Custom theme

Click ✏️ `Custom` to open the colour editor. Changes to background, grid, edges, labels, node stroke, and tooltip colours apply instantly. Edits to per-group node colours also apply immediately and automatically activate the custom theme — no need to click Apply Custom Theme first.
Click `↺ Reset` to restore the last selected preset and clear all custom colour overrides.