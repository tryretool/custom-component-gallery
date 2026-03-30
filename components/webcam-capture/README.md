# Webcam Capture

A Retool Custom Component that provides a live webcam feed with real-time visual filters and image capture. Captured photos are exposed as base64-encoded PNGs for use in your Retool app.

## Features

- Live webcam feed with HD video (1280x720)
- 8 real-time visual filters: Grayscale, Sepia, Blur, Brightness, Contrast, Invert, Saturate
- Mirror/normal toggle for the camera feed
- One-click photo capture with filter applied
- Image preview overlay with dismiss
- Captured image exposed as base64 string for downstream use

## Installation

1. In your Retool app, add a **Custom Component** from the component panel
2. Import this component from the repository
3. Configure the component properties to connect it to your Retool data

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `capturedImage` | `string` | Base64-encoded PNG of the most recently captured photo (read-only from Retool) |
| `activeFilter` | `string` | Name of the currently active filter (read-only from Retool) |

## Events

| Event | Description |
|-------|-------------|
| `capture` | Fires when the user captures a photo |

## Usage

### Capturing and Storing Photos

Use the `capture` event to trigger a Retool query that saves the `capturedImage` base64 string to your database or storage service.

### Available Filters

- **None** - No filter applied
- **Grayscale** - Black and white
- **Sepia** - Warm vintage tone
- **Blur** - Soft blur effect
- **Bright** - Increased brightness
- **Contrast** - Enhanced contrast
- **Invert** - Inverted colors
- **Saturate** - Boosted color saturation

## Ideal Use Cases

- User profile photo capture
- Document scanning workflows
- Visual inspection and quality control
- Photo booth experiences in internal tools
- Any workflow that requires capturing images from a webcam

## Author

Created by [@keanankoppenhaver](https://community.retool.com/u/keanankoppenhaver) for the Retool community.
