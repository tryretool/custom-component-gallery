# Approval Chain Component

A visual multi-step approval flow for Retool that shows who approved, who's pending, and who rejected — with timestamps, avatars, and clickable steps that fire actions back to Retool.

## Features

- 🎯 **Visual Status Indicators** — Color-coded avatars with status badges (approved ✓, rejected ✗, pending, skipped)
- 👤 **Avatar Support** — Display profile images or initials with fallback
- 📅 **Timestamps** — Show when each approval action occurred
- 🖱️ **Interactive** — Click steps to fire events and expose data back to Retool
- 📐 **Flexible Layout** — Horizontal or vertical orientation
- 🎨 **Smart Data Parsing** — Auto-detects field names from various data formats

## Installation

1. Clone this component into your Retool custom component library
2. Run `npm install` to install dependencies
3. Run `npx retool-ccl dev` for development or `npx retool-ccl deploy` for production

## Usage

### Basic Example

Pass an array of approval steps to the component:

```json
[
  {
    "id": "1",
    "approverName": "John Smith",
    "status": "approved",
    "timestamp": "2024-01-15T10:30:00Z",
    "avatarUrl": "https://example.com/avatar1.jpg"
  },
  {
    "id": "2",
    "approverName": "Sarah Johnson",
    "status": "approved",
    "timestamp": "2024-01-16T14:20:00Z"
  },
  {
    "id": "3",
    "approverName": "Mike Davis",
    "status": "pending"
  }
]
```

### Connecting to Retool Queries

1. Create a query that returns approval data
2. Reference it in the **Steps** property: `{{ yourQuery.data }}`
3. Add an event handler for **stepClick** to respond when users click a step
4. Access the clicked step via `{{ approvalChain.selectedStep }}`

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | Array | `[]` | Array of approval step objects |
| `orientation` | Enum | `horizontal` | Layout direction (`horizontal` or `vertical`) |
| `showTimestamps` | Boolean | `true` | Display timestamps below each step |
| `showAvatars` | Boolean | `true` | Display avatar images or initials |
| `enableClick` | Boolean | `true` | Allow clicking steps to fire events |
| `connectorLength` | Number | `60` | Length of connecting lines (pixels) |

### Output Properties

| Property | Type | Description |
|----------|------|-------------|
| `selectedStep` | Object | The most recently clicked step (read via `{{ componentId.selectedStep }}`) |

### Events

| Event | Description |
|-------|-------------|
| `stepClick` | Fired when a step is clicked. Access the step data via `selectedStep` property. |

## Data Format

The component is flexible and accepts various field name formats:

### Required Fields

| Field | Aliases | Description |
|-------|---------|-------------|
| `id` | `_id`, `stepId`, `key` | Unique identifier |
| `approverName` | `name`, `approver`, `user`, `reviewer` | Display name |
| `status` | `approvalStatus`, `state` | One of: `approved`, `rejected`, `pending`, `skipped` |

### Optional Fields

| Field | Aliases | Description |
|-------|---------|-------------|
| `timestamp` | `date`, `approvedAt`, `actionDate` | ISO date string |
| `avatarUrl` | `avatar`, `photo`, `imageUrl` | URL to profile image |
| `comment` | `note`, `message`, `feedback` | Approval comment |
| `order` | `step`, `sequence` | Sort order (defaults to array position) |

### Status Values

The component normalizes various status values:

- **Approved**: `approved`, `accept`, `accepted`, `yes`, `complete`, `done`
- **Rejected**: `rejected`, `reject`, `declined`, `deny`, `denied`, `no`
- **Skipped**: `skipped`, `skip`, `bypassed`, `n/a`
- **Pending**: Any other value (default)

## Example Use Cases

- Purchase order approval workflows
- Document review processes
- Multi-level authorization flows
- Request approval chains
- Compliance checklists

## Tech Stack

- React 18
- TypeScript
- @tryretool/custom-component-support

## License

MIT
