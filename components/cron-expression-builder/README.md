# Cron Expression Builder

A visual UI for building cron schedule expressions in Retool. Pick minutes, hours, weekdays, months and more — the cron string updates live and fires back to Retool automatically.

## Features

- 🕐 **Visual cron builder** powered by `react-js-cron`
- 📋 **Live cron string display** with one-click copy
- 📖 **Human-readable description** of the schedule (e.g. "Every weekday at 9:00 AM")
- 🔥 **Fires `cronChange` event** back to Retool on every change
- ⚙️ **Configurable** — disable, read-only, default period, clear button toggle

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage

### Connecting to Retool

1. Drag the component onto your Retool canvas
2. In the **Inspector**, set **Initial Cron Value** to a starting expression (e.g. `0 9 * * 1-5`)
3. Add an event handler for **cronChange** to trigger a query
4. Read the output via `{{ cronExpressionBuilder1.cronValue }}`

### Output Properties

| Property | Type | Description |
|----------|------|-------------|
| `cronValue` | string | The current cron expression (e.g. `0 9 * * 1-5`) |
| `humanReadable` | string | Plain-English description (e.g. "Every weekday at 9:00 AM") |

### Events

| Event | Description |
|-------|-------------|
| `cronChange` | Fired whenever the cron expression changes |

### Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `initialValue` | string | `0 9 * * 1-5` | Starting cron expression |
| `defaultPeriod` | enum | `day` | Default period when value is empty |
| `disabled` | boolean | `false` | Disable all inputs |
| `readOnly` | boolean | `false` | Make read-only |
| `showClearButton` | boolean | `true` | Show clear button on dropdowns |

## Cron Expression Format

```
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–6, Sun=0)
│ │ │ │ │
* * * * *
```

### Common Examples

| Expression | Meaning |
|------------|---------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 9 * * 1-5` | Every weekday at 9:00 AM |
| `0 9 * * 1` | Every Monday at 9:00 AM |
| `0 0 1 * *` | First day of every month at midnight |
| `*/15 * * * *` | Every 15 minutes |
| `@daily` | Every day at midnight |
| `@weekly` | Every Sunday at midnight |

## Tech Stack

- React 18
- TypeScript
- react-js-cron
- antd
- @tryretool/custom-component-support
