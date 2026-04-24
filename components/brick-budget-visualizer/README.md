# Brick / Block Budget Visualizer

A visual budget tracker where each brick represents a fixed unit of money or resource. As you allocate, bricks fill up like a wall being built — far more intuitive than a progress bar for non-technical stakeholders.

## Features

- 🧱 **Brick wall visualization** — each brick = a fixed unit of your total budget
- 🎨 **Partial bricks** — the last brick fills proportionally for precise representation
- ⚠️ **Over-budget detection** — bricks turn red and a warning appears when allocated > total
- 🖱️ **Clickable bricks** — click any brick to output its index
- 📊 **Legend** — shows allocated, remaining, and total with compact number formatting
- 📤 **Outputs** — `modelUpdate` with total, allocated, remaining, percent, isOverBudget

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

For `npx retool-ccl init`:
- **Library name:** `Brick Budget Visualizer`
- **Description:** `A visual budget tracker where each brick represents a fixed unit of money or resource`

## Usage in Retool

```
{{ brickBudgetVisualizer1.modelUpdate.percent }}      → 67
{{ brickBudgetVisualizer1.modelUpdate.remaining }}    → 32500
{{ brickBudgetVisualizer1.modelUpdate.isOverBudget }} → false
{{ brickBudgetVisualizer1.clickedBrick }}             → 4
```

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `total` | number | 100000 | Total budget amount |
| `allocated` | number | 67500 | Amount allocated/used |
| `brickCount` | number | 20 | Number of bricks (5–100) |
| `brickWidth` | number | 36 | Brick width in px |
| `brickHeight` | number | 28 | Brick height in px |
| `filledColor` | string | #0ea5e9 | Color of filled bricks |
| `emptyColor` | string | #e2e8f0 | Color of empty bricks |
| `unit` | string | $ | Currency/unit symbol |
| `title` | string | "Budget Allocation" | Header title |
| `showLegend` | boolean | true | Show the legend below the wall |

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
