# Custom Email Viewer for Retool

An email viewer component for previewing email messages in Retool applications. Parses and renders emails from multiple formats (MIME/RFC822, MSG, MBOX, JSON) directly in the browser with built-in HTML sanitization, signature detection, and attachment listing.

## Features

- **Multiple Input Formats**: Accepts raw MIME/RFC822 strings, base64-encoded email data, Outlook `.msg` files, MBOX archives, and structured JSON objects
- **Safe HTML Rendering**: HTML email bodies are sanitized with `DOMPurify` using a strict tag/attribute allowlist; event handlers and dangerous URL schemes (`javascript:`, `vbscript:`, `data:`) are stripped
- **Remote Image Blocking**: Optional toggle to block remote images (tracking pixels); inline and embedded images remain visible
- **Signature Detection**: Optional hiding of common email signatures (Gmail, Outlook, "Sent from my iPhone", `--` separator, etc.)
- **Attachment List**: Displays filenames, file sizes, and MIME types for all attachments
- **Accessible**: Semantic HTML, ARIA landmarks, heading structure, focus management, and screen-reader announcements aligned with WCAG 2.0 AA
- **Customizable Styling**: Configure background colors, text color, font family, font size, and padding
- **Error Handling**: Error boundary plus an exposed `error` state for programmatic handling
- **Size Safety**: Input is capped at 10MB to prevent browser resource exhaustion

## Installation

1. Clone this repository or navigate to your project directory

2. Install dependencies:

   ```bash
   npm install
   ```

3. Log in to Retool:

   ```bash
   npx retool-ccl login
   ```

   > Note: You'll need an API access token with read and write scopes for Custom Component Libraries.

4. Start development mode:

   ```bash
   npm run dev
   ```

5. Deploy your component:

   ```bash
   npm run deploy
   ```

6. Switch component versions:
   > To pin your app to the component version you just published, navigate to the Custom Component settings in your Retool app and change dev to the latest version.

## Configuration

The component exposes the following properties in Retool:

### Email Input

| Property    | Type   | Default | Description                                                                            |
| ----------- | ------ | ------- | -------------------------------------------------------------------------------------- |
| `emailData` | String | ""      | Base64-encoded email, raw MIME/RFC822 string, MBOX content, or a JSON object (stringified) with email fields |

### Styling

| Property                | Type   | Default    | Description                                 |
| ----------------------- | ------ | ---------- | ------------------------------------------- |
| `backgroundColor`       | String | `#ffffff`  | Background color of the viewer              |
| `textColor`             | String | `#000000`  | Primary text color                          |
| `headerBackgroundColor` | String | `#f5f5f5`  | Background color for the email header block |
| `fontFamily`            | Enum   | `Arial`    | `Arial`, `Helvetica`, `Georgia`, `Times New Roman`, `Courier New` |
| `fontSize`              | Number | `14`       | Base font size in pixels                    |
| `padding`               | Number | `16`       | Internal padding in pixels                  |

### Display

| Property           | Type    | Default | Description                                             |
| ------------------ | ------- | ------- | ------------------------------------------------------- |
| `showSignature`    | Boolean | `true`  | Show or hide the detected email signature               |
| `showAttachments`  | Boolean | `true`  | Show or hide the attachment list                        |

### Security

| Property            | Type    | Default | Description                                                                 |
| ------------------- | ------- | ------- | --------------------------------------------------------------------------- |
| `allowRemoteImages` | Boolean | `false` | When disabled, remote images (e.g. tracking pixels) are blocked. Inline and embedded images are always allowed. |

### Output (Read-Only)

| Property | Type   | Description                                                                |
| -------- | ------ | -------------------------------------------------------------------------- |
| `error`  | Object | Last parse or render error: `{ message, source, timestamp }` — empty if no error |

## Usage Example

### Basic Setup

1. Add the Custom Email Viewer to your Retool app
2. Set `emailData` to email content from a query or file input:
   - `{{ fileInput1.value[0] }}` (from a File Input component — base64)
   - `{{ query1.data.rawEmail }}` (from a query returning a MIME string, MSG base64, or MBOX content)

### With a File Input

1. Add a **File Input** component to your app
2. Set the Email Viewer's `emailData` to `{{ fileInput1.value[0] }}`
3. Upload an `.eml`, `.msg`, or `.mbox` file — the component auto-detects the format

### With a JSON Query

If your query returns a structured email object, pass it as a JSON string:

```
{{ JSON.stringify(getEmail.data) }}
```

The expected shape is:

```json
{
  "subject": "Hello",
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "date": "2025-01-01T12:00:00Z",
  "body": { "html": "<p>...</p>", "text": "..." },
  "attachments": [{ "filename": "report.pdf", "size": 12345, "contentType": "application/pdf" }]
}
```

### Handling Errors

Access the `error` state in other components or queries to respond to parse or render failures:

- `{{ customEmailViewer1.error.message }}` — human-readable error message
- `{{ customEmailViewer1.error.source }}` — `"parse"` or `"render"`

## Supported Formats

- **MIME / RFC822** — raw `.eml` content or base64-encoded
- **MSG** — Outlook Compound File Binary (base64-encoded ArrayBuffer detected via CFB magic bytes)
- **MBOX** — first message in the archive is rendered
- **JSON** — structured object matching the shape above

## Security

This component is designed for use in **internal Retool applications with trusted data sources**.

- **Client-side only**: All parsing and rendering happens in the browser. No email content is sent to external servers.
- **HTML sanitization**: HTML bodies are passed through `DOMPurify` with a strict allowlist of tags and attributes. Event handlers (`onclick`, `onerror`, etc.) are stripped, and dangerous URL schemes are blocked on both `href` and `src`.
- **Link safety**: All outbound links are rewritten to `target="_blank" rel="noopener noreferrer"`.
- **Tracking-pixel mitigation**: Set `allowRemoteImages` to `false` to block `http://`, `https://`, and protocol-relative image URLs; inline (`cid:`) images remain visible.
- **Input size cap**: Inputs over 10MB are rejected to prevent browser resource exhaustion.
- **Dependency risk**: Email parsing relies on `postal-mime` and `@kenjiuno/msgreader`. A maliciously crafted email could theoretically exploit parser vulnerabilities. Keep dependencies up to date and only render emails from trusted sources.

## Accessibility

- Semantic landmarks: `<article>` for the email, `<header>` for metadata, `<section>` for body and attachments
- The email subject is rendered as an `<h2>` and the attachment list heading as an `<h2>` for heading navigation
- `aria-live="polite"` and `aria-busy` on loading state
- `role="alert"` on parse and render errors
- Images without an `alt` attribute are given `alt=""` during sanitization to prevent URL readout
- Programmatic focus is moved to the content region after load

## Development

### Prerequisites

- Node.js >= 20.0.0
- Retool developer account

### Local Development

1. Run `npm install` to install dependencies
2. Make changes to components in the `src` directory
3. Run `npm run dev` to test your changes
4. Run `npm run deploy` to deploy to Retool

### Project Structure

- `src/index.tsx` — Retool integration layer (state management, props)
- `src/components/EmailHeader.tsx` — Header metadata (subject, from, to, cc, date)
- `src/components/EmailBody.tsx` — HTML and plaintext body rendering with sanitization
- `src/components/AttachmentList.tsx` — Attachment display
- `src/components/ErrorBoundary.tsx` — Render error isolation
- `src/utils/sanitize.ts` — DOMPurify configuration
- `src/utils/postalMimeAdapter.ts` — MIME/RFC822 parser
- `src/utils/msgAdapter.ts` — Outlook MSG parser
- `src/utils/mboxAdapter.ts` — MBOX archive parser
- `src/utils/signatureDetection.ts` — Signature detection heuristics
- `src/utils/typeGuards.ts` — Input validation and format routing

## License

This project is licensed under the MIT License.

## About

Created by [Stackdrop](https://stackdrop.co)
