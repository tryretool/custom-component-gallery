# Formula Bar (Like Excel)

An Excel-style formula input for Retool. Type expressions like `=price * qty * (1 + tax)` and evaluate them live against row data passed from a Retool query.

## Features

- 🧮 **Live evaluation** — results update as you type
- 📊 **Row data binding** — reference field names directly in formulas (e.g. `price`, `qty`)
- 📐 **Built-in functions** — SUM, AVG, MIN, MAX, COUNT, ABS, ROUND, FLOOR, CEIL, POWER, SQRT, IF
- 🏷️ **Clickable field/function hints** — click a field or function name to insert it
- ✅ **Validation** — green result on valid formula, red error on invalid
- 📤 **Outputs** — `result`, `isValid`, and `modelUpdate` object

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Pass row data via the **Row Data** property: `{{ table1.selectedRow }}`
2. Type a formula: `=price * qty * (1 + tax) - discount`
3. Read the result:

```
{{ formulaBar1.result }}                    → "105"
{{ formulaBar1.isValid }}                   → true
{{ formulaBar1.modelUpdate.formula }}       → "=price * qty * (1 + tax) - discount"
{{ formulaBar1.modelUpdate.result }}        → 105
```

4. Wire the **evaluate** event to trigger a query when a valid result is computed

## Supported Functions

| Function | Example | Description |
|----------|---------|-------------|
| SUM | `=SUM(a, b, c)` | Sum of values |
| AVG / AVERAGE | `=AVG(a, b)` | Average |
| MIN | `=MIN(a, b)` | Minimum |
| MAX | `=MAX(a, b)` | Maximum |
| COUNT | `=COUNT(a, b, c)` | Number of arguments |
| ABS | `=ABS(a)` | Absolute value |
| ROUND | `=ROUND(a, 2)` | Round to N decimals |
| FLOOR | `=FLOOR(a)` | Round down |
| CEIL | `=CEIL(a)` | Round up |
| POWER | `=POWER(a, 2)` | Exponentiation |
| SQRT | `=SQRT(a)` | Square root |
| IF | `=IF(a > 10, a, 0)` | Conditional |

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
