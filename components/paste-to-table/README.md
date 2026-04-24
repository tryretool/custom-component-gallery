# Paste to Table (CSV Preview)

Paste raw CSV text and instantly see it rendered as a clean preview table. The parsed data fires back to Retool for use in queries and workflows.

## Features

- 📋 **Paste and preview** — paste CSV data and see a formatted table instantly
- 🔍 **Auto-detect delimiter** — commas, semicolons, tabs, pipes — or pick one manually
- 📊 **Row/column stats** — shows row and column count in the preview header
- 🔥 **Fires parsed data to Retool** — `parsedData`, `headers`, `rowCount`, `columnCount`, and `modelUpdate`
- ⚡ **Real-time parsing** — table updates as you type or paste
- 🧹 **Clear button** — one click to reset

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Drag the component onto your canvas
2. Paste CSV data into the text area
3. The table renders instantly
4. Access parsed data via:

```
{{ pasteToTable1.parsedData }}       → Array of row objects
{{ pasteToTable1.headers }}          → Array of column names
{{ pasteToTable1.rowCount }}         → Number of rows
{{ pasteToTable1.columnCount }}      → Number of columns
{{ pasteToTable1.modelUpdate }}      → { headers, data, rowCount, columnCount }
```

5. Wire the **dataParsed** event to trigger a query

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | string | "Paste CSV data here..." | Placeholder text for the input area |
| `maxPreviewRows` | number | 100 | Max rows shown in the preview table |
| `delimiter` | enum | auto | CSV delimiter: auto, comma, semicolon, tab, pipe |

## Output Properties

| Property | Type | Description |
|----------|------|-------------|
| `parsedData` | array | Array of parsed row objects |
| `headers` | array | Column header names |
| `rowCount` | number | Total number of parsed rows |
| `columnCount` | number | Total number of columns |
| `modelUpdate` | object | `{ headers, data, rowCount, columnCount }` |

## Events

| Event | Description |
|-------|-------------|
| `dataParsed` | Fired whenever CSV is parsed successfully |

## Tech Stack

- React 18
- TypeScript
- PapaParse
- @tryretool/custom-component-support
