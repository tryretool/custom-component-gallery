# Breadcrumb Navigator

A dynamic clickable breadcrumb trail for Retool — Home > Customers > Ahmed > Orders — that updates based on navigation state in your app.

## Features

- 🗺️ **Dynamic trail** — pass an array of breadcrumb items from Retool state or queries
- 🖱️ **Clickable navigation** — click any crumb to navigate back, outputs the clicked key/label/index
- 🏠 **Home icon** — optional home icon on the first breadcrumb
- ✂️ **Auto-collapse** — set max visible items and middle crumbs collapse into "…"
- 🔀 **Separator styles** — chevron, slash, arrow, or dot
- 📤 **Outputs** — `clickedKey`, `clickedLabel`, `clickedIndex`, `modelUpdate`

## Installation

```bash
npm install
npx retool-ccl login
npx retool-ccl init
npx retool-ccl dev
```

## Usage in Retool

1. Set **Breadcrumbs** to an array: `{{ [{ label: "Home", key: "home" }, { label: "Users", key: "users" }] }}`
2. Wire the **crumbClick** event to update your app's navigation state
3. Read which crumb was clicked:

```
{{ breadcrumbNavigator1.clickedKey }}     → "users"
{{ breadcrumbNavigator1.clickedLabel }}   → "Users"
{{ breadcrumbNavigator1.clickedIndex }}   → 1
{{ breadcrumbNavigator1.modelUpdate }}    → { clickedKey, clickedLabel, clickedIndex }
```

## Inspector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `crumbs` | array | [...] | Array of `{ label, key }` objects |
| `separator` | enum | chevron | Separator style: chevron, slash, arrow, dot |
| `homeIcon` | boolean | true | Show home icon on first crumb |
| `maxItems` | number | 0 | Max visible items (0 = all). Middle items collapse |

## Tech Stack

- React 18 · TypeScript · Zero external dependencies
