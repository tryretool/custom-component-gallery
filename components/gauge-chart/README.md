# Gauge / Speedometer Chart

A half-circle gauge dial for Retool that displays a single metric with configurable color zones. Use it for CPU usage, satisfaction scores, budget tracking, or any 0–N metric.

## Features

- 📊 **Half-circle gauge** with animated needle powered by `react-gauge-chart`
- 🟢🟡🔴 **Color zones** — configurable green/yellow/red arc percentages
- 🔢 **Custom range** — set min/max values (not just 0–100)
- 🏷️ **Zone badge** — shows "Good", "Warning", or "Critical" based on value
- ⚙️ **Configurable** — title, unit suffix, needle animation, zone sizes
- 📤 **Outputs** — `modelUpdate` with value, percent, zone label

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Set **Value** to `{{ query1.data.cpuUsage }}` or any number
2. Set **Min/Max** for your range (default 0–100)
3. Adjust **Green/Yellow Zone %** to define thresholds
4. Read outputs:

```
{{ gaugeChartComponent1.modelUpdate.value }}    → 72
{{ gaugeChartComponent1.modelUpdate.percent }}  → 72
{{ gaugeChartComponent1.modelUpdate.zone }}     → "Warning"
```

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | number | 72 | Current metric value |
| `minValue` | number | 0 | Minimum of the range |
| `maxValue` | number | 100 | Maximum of the range |
| `title` | string | "CPU Usage" | Label below the gauge |
| `unit` | string | "%" | Unit suffix |
| `greenZone` | number | 50 | % of arc that is green |
| `yellowZone` | number | 30 | % of arc that is yellow |
| `showNeedle` | boolean | true | Show the needle |
| `animateNeedle` | boolean | true | Animate needle movement |

## Tech Stack

- React 18 · TypeScript · react-gauge-chart · D3
