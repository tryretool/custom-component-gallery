# Diff Viewer

Retool custom component to compare two data sources (`oldData` and `newData`) in either JSON or text mode.

## Features

- JSON diff with flattened nested paths
- Added/removed/changed highlighting
- Side-by-side or inline layout
- Text diff powered by `react-diff-viewer-continued`
- Search, sort, and "show only changes"
- Performance controls for large payloads
- Field detail panel for focused review

## Inspector State

- `label`: Header text shown in the component
- `type`: `json` or `text`
- `viewMode`: `side-by-side` or `inline`
- `showOnlyChanges`: Hide unchanged rows
- `oldData`: First input payload (JSON text/object or plain text)
- `newData`: Second input payload (JSON text/object or plain text)
- `addedColor`, `removedColor`, `changedColor`: Diff highlight colors
- `headerBackgroundColor`, `panelBackgroundColor`: UI theme colors
- `maxRows`: Render cap in JSON mode
- `lightweightMode`: Faster filtering by limiting search scope
- `diffRows` (hidden output): Filtered/sorted rows currently displayed

## Notes

- JSON mode accepts either raw objects or JSON strings.
- Text mode auto-normalizes line endings and pretty-prints JSON-like text before comparing.
