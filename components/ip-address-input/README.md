# IP Address Input

A segmented 4-box IPv4 input for Retool. Auto-jumps between segments, validates each octet (0–255), supports paste, and fires the full IP string back to Retool.

## Features

- 🔢 **4-segment input** — each box accepts 0–255, auto-jumps to the next on completion
- ✅ **Live validation** — red highlight on invalid segments, green border + checkmark when complete
- 📋 **Paste support** — paste a full IP like `192.168.1.1` and it fills all 4 boxes
- ⌨️ **Keyboard navigation** — arrow keys, dot key, and backspace move between segments
- 🔥 **Fires events** — `ipChange` on every edit, `ipComplete` when all 4 segments are valid
- 📤 **Outputs** — `ipValue`, `isValid`, and `modelUpdate` object

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Drag the component onto your canvas
2. Optionally set **Initial Value** to pre-fill (e.g. `192.168.1.1`)
3. Access outputs:

```
{{ ipAddressInput1.ipValue }}              → "192.168.1.1"
{{ ipAddressInput1.isValid }}              → true
{{ ipAddressInput1.modelUpdate.ipAddress }}  → "192.168.1.1"
{{ ipAddressInput1.modelUpdate.segments }}   → ["192","168","1","1"]
```

4. Wire **ipComplete** event to trigger a query when a valid IP is entered

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `initialValue` | string | "" | Pre-fill with an IPv4 address |
| `label` | string | "IP Address" | Label text above the input |
| `disabled` | boolean | false | Disable the input |

## Output Properties

| Property | Type | Description |
|----------|------|-------------|
| `ipValue` | string | Full IP string (e.g. "192.168.1.1") |
| `isValid` | boolean | True when all 4 segments are valid 0–255 |
| `modelUpdate` | object | `{ ipAddress, isValid, segments }` |

## Events

| Event | Description |
|-------|-------------|
| `ipChange` | Fired on every segment change |
| `ipComplete` | Fired when all 4 segments form a valid IPv4 address |

## Tech Stack

- React 18
- TypeScript
- @tryretool/custom-component-support
- Zero external dependencies
