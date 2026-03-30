# imageZoom

A custom [Retool](https://retool.com/) component that adds image zoom and magnification capabilities to your Retool applications.

## Features

- **Normal mode** — Click to zoom in/out on the image; drag to pan while zoomed in.
- **Glass mode** — A circular magnifier lens follows the cursor over the image.

## Retool State Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `imageUrl` | `string` | Sample flower image | URL of the image to display |
| `imageAlt` | `string` | `""` | Alt text for the image |
| `zoomMode` | `string` | `"normal"` | Zoom mode: `normal`, `glass`, `self`, or `side` |
| `zoomLevel` | `number` | `3` | Magnification multiplier |

## Zoom Modes

### `normal`
Click anywhere on the image to zoom in to the configured `zoomLevel`. Click again to zoom back out. While zoomed in, drag the image to pan.

### `glass`
A circular magnifier lens (180×180 px by default) follows the mouse cursor and shows the area under it at `zoomLevel` magnification.

