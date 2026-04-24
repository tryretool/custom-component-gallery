# Regex Tester Input

A two-field regex tester for Retool. Paste a pattern and a test string — matches are highlighted live in the preview, and the full match array fires back to Retool.

## Features

- 🔍 **Live match highlighting** — matches are highlighted in yellow as you type
- 🚩 **Flag toggles** — toggle g, i, m, s flags with one click
- ✅ **Pattern validation** — red border and error message on invalid regex
- 📋 **Match list** — shows each match with its position and named groups
- 🔥 **Fires to Retool** — `matches`, `isValid`, `matchCount`, and `modelUpdate`

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

```
{{ regexTesterInput1.matches }}       → ["match1", "match2"]
{{ regexTesterInput1.isValid }}       → true
{{ regexTesterInput1.matchCount }}    → 2
{{ regexTesterInput1.modelUpdate }}   → { matches, matchDetails, isValid, matchCount, pattern, flags }
```

Wire the **onMatch** event to trigger a query when matches are found.

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
