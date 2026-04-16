# Image Comparison Slider

A Retool Custom Component that displays two images stacked with a draggable vertical handle to reveal before/after. Accepts any two image URLs via the inspector — including Retool Storage links.

## Features

- Drag a chunky center handle to wipe between two images
- Accepts any two image URLs (inspector fields)
- Falls back to sample images when URL fields are empty, so the component never renders as a black panel
- Fills its container with `object-fit: cover` — looks good at any size
- Mouse and touch support via Pointer Events

## Installation

1. In your Retool app, add a **Custom Component** from the component panel
2. Import this component from the repository
3. Set the `beforeImageUrl` and `afterImageUrl` fields in the inspector (or leave blank to use the default sample images)

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `beforeImageUrl` | `string` | URL for the "before" image shown on the left side of the slider. Supports Retool Storage URLs. |
| `afterImageUrl` | `string` | URL for the "after" image revealed on the right side of the slider. Supports Retool Storage URLs. |

## Usage

### Wiring up Retool Storage

1. Upload two images to Retool Storage (or any image host).
2. In the custom component's inspector, reference the storage URLs:
   - `beforeImageUrl`: `{{ getBeforeImage.data.url }}`
   - `afterImageUrl`: `{{ getAfterImage.data.url }}`

### Static URLs

You can also paste any public image URL directly into the inspector fields.

## Ideal Use Cases

- Photo editing tools — raw vs. edited comparisons
- Real estate / interior design — before/after renovations
- Satellite imagery — change detection over time
- Any workflow that benefits from side-by-side visual comparison

## Author

Created by [@keanankoppenhaver](https://community.retool.com/u/keanankoppenhaver) for the Retool community.
