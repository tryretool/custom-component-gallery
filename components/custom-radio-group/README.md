# RadioGroup Component for Retool

A powerful, feature-rich radio/checkbox group component for Retool applications. Build beautiful selection interfaces with single or multiple choice, icons, badges, conditional display, and flexible layouts.

## Features

### Core Functionality
- **Single & Multiple Selection** - Switch between radio (single) and checkbox (multiple) behavior
- **Rich Content** - Support for titles, descriptions, and HTML rendering
- **Flexible Layouts** - Vertical, horizontal, grid, or justified arrangements
- **Button Positioning** - Place buttons on left, right, top, or bottom

### Visual Customization
- **Multiple Button Shapes** - Bullet (circle), square, rounded square, or diamond
- **Icon Support** - Add emojis or custom icons with left/right positioning
- **Badges** - Highlight options with customizable badges
- **Typography Control** - Customize font sizes and text alignment
- **Full Color Customization** - Control all colors including primary, borders, backgrounds, and hover states

### Advanced Features
- **Option Groups** - Organize options with section headers
- **Conditional Display** - Show/hide options based on JavaScript expressions
- **Smart Tooltips** - Automatic tooltips for truncated text
- **Line Clamp** - Truncate long descriptions with ellipsis
- **HTML Rendering** - Render rich formatted content
- **Keyboard Accessible** - Full keyboard navigation support
- **Disabled State** - Individual option-level disabling

## Installation

This component is part of the Librarium custom component library for Retool.

### Prerequisites
- Node.js >= 20.0.0
- Retool account with custom component support
- `retool-ccl` CLI tool

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Login to Retool:**
```bash
npx retool-ccl login
```

3. **Deploy to Retool:**
```bash
npm run deploy
```

For development with live reload:
```bash
npm run dev
```

## Quick Start

### Basic Radio Group

```json
{
  "options": [
    {
      "id": "option1",
      "title": "Option 1",
      "description": "This is the first option"
    },
    {
      "id": "option2",
      "title": "Option 2",
      "description": "This is the second option"
    },
    {
      "id": "option3",
      "title": "Option 3",
      "description": "This is the third option"
    }
  ],
  "defaultValue": "option1"
}
```

### Yes/No Decision

```json
{
  "options": [
    { "id": "yes", "title": "Yes", "icon": "✓" },
    { "id": "no", "title": "No", "icon": "✗" }
  ],
  "layout": "horizontal",
  "buttonPosition": "top",
  "titleTextAlign": "center"
}
```

### Multiple Selection with Icons

```json
{
  "options": [
    {
      "id": "email",
      "title": "Email Notifications",
      "icon": "📧",
      "badge": "Recommended",
      "badgeColor": "#10b981"
    },
    {
      "id": "sms",
      "title": "SMS Alerts",
      "icon": "📱"
    },
    {
      "id": "push",
      "title": "Push Notifications",
      "icon": "🔔",
      "badge": "New",
      "badgeColor": "#3b82f6"
    }
  ],
  "multipleSelect": true,
  "defaultValues": ["email"]
}
```

### Grid Layout with Groups

```json
{
  "options": [
    { "type": "header", "title": "Basic Features" },
    { "id": "feature1", "title": "Feature 1", "description": "Description 1" },
    { "id": "feature2", "title": "Feature 2", "description": "Description 2" },
    { "type": "header", "title": "Premium Features" },
    { "id": "feature3", "title": "Feature 3", "description": "Description 3", "badge": "+$10/mo" },
    { "id": "feature4", "title": "Feature 4", "description": "Description 4", "badge": "+$20/mo" }
  ],
  "layout": "grid",
  "gridColumns": 2
}
```

## Configuration

### Core Properties

| Property         | Type    | Default    | Description                                           |
|------------------|---------|------------|-------------------------------------------------------|
| `options`        | Array   | []         | Array of option objects or group headers              |
| `multipleSelect` | Boolean | false      | Enable multiple selection (checkbox mode)             |
| `defaultValue`   | String  | ""         | Default selected option ID (single select)            |
| `defaultValues`  | Array   | []         | Default selected option IDs (multiple select)         |

### Layout & Positioning

| Property         | Type   | Default    | Description                                           |
|------------------|--------|------------|-------------------------------------------------------|
| `layout`         | Enum   | "vertical" | Layout mode: vertical, horizontal, grid, justified    |
| `gridColumns`    | Number | 2          | Number of columns for grid layout                     |
| `buttonPosition` | Enum   | "left"     | Button position: left, right, top, bottom             |

### Button Styling

| Property      | Type   | Default  | Description                                           |
|---------------|--------|----------|-------------------------------------------------------|
| `buttonShape` | Enum   | "bullet" | Shape: bullet, square, rounded-square, diamond        |
| `buttonSize`  | Number | 24       | Button size in pixels                                 |

### Typography

| Property                | Type   | Default | Description                                    |
|-------------------------|--------|---------|------------------------------------------------|
| `titleFontSize`         | Number | 16      | Title font size in pixels                      |
| `descriptionFontSize`   | Number | 14      | Description font size in pixels                |
| `titleTextAlign`        | Enum   | "left"  | Title alignment: left, center, right, justify  |
| `descriptionTextAlign`  | Enum   | "left"  | Description alignment                          |
| `lineClamp`             | Number | 0       | Max lines for descriptions (0 = unlimited)     |

### Colors

| Property           | Type   | Default  | Description                        |
|--------------------|--------|----------|------------------------------------|
| `primary`          | String | #f97316  | Primary color for selected state   |
| `primaryLight`     | String | #fb923c  | Lighter shade for hover            |
| `background`       | String | #ffffff  | Background color                   |
| `borderColor`      | String | #d1d5db  | Border and unselected button color |
| `titleColor`       | String | #1f2937  | Title text color                   |
| `descriptionColor` | String | #6b7280  | Description text color             |
| `disabledColor`    | String | #9ca3af  | Disabled option color              |
| `hoverColor`       | String | #fee2e2  | Hover background color             |

### Output States

| Property         | Type   | Description                                    |
|------------------|--------|------------------------------------------------|
| `selectedValue`  | String | Currently selected option ID (single select)   |
| `selectedValues` | Array  | Currently selected option IDs (multiple select)|

### Events

| Event             | Description                          |
|-------------------|--------------------------------------|
| `selectionChange` | Triggered when selection changes     |

## Option Structure

### Standard Option

```typescript
{
  id: string              // Required: Unique identifier
  title: string           // Required: Option title
  description?: string    // Optional: Description text
  disabled?: boolean      // Optional: Disable this option
  renderAsHtml?: boolean  // Optional: Render as HTML
  icon?: string           // Optional: Icon/emoji
  iconPosition?: 'left' | 'right'  // Optional: Icon position
  badge?: string          // Optional: Badge text
  badgeColor?: string     // Optional: Badge color
  showIf?: string         // Optional: Conditional display expression
}
```

### Group Header

```typescript
{
  type: 'header'    // Required: Identifies as header
  title: string     // Required: Header text
}
```

## Use Cases

### Single Select
- Plan selection (pricing tiers)
- Preference settings
- Survey questions
- Filter selection
- Shipping method selection
- Payment method selection

### Multiple Select
- Feature selection (add-ons)
- User permissions
- Category assignment
- Tag selection
- Notification preferences
- Filter combinations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Note**: The diamond button shape uses CSS `clip-path` which is well-supported in modern browsers.

## Performance

- Optimized for up to 100 options
- Conditional rendering with `showIf` expressions
- Smart tooltip detection (only shows when text is truncated)
- Efficient re-renders with React hooks

## Accessibility

- Full keyboard navigation (Tab, Enter, Space)
- ARIA labels for screen readers
- Disabled state properly announced
- High contrast support
- Focus indicators

## Development

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Build for production
npm run deploy

# Run linter
npx eslint src/

# Format code
npx prettier --write .
```

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **@tryretool/custom-component-support** - Retool SDK
- **CSS-in-JS** - Inline styles with TypeScript

### Latest Features
- **Button Position Control** - Position buttons on all four sides
- **Layout Modes** - Vertical, horizontal, grid, and justified layouts
- **Grid Layout** - Configurable column count
- **Icon Support** - Add icons with flexible positioning
- **Badges** - Highlight special options
- **Option Groups** - Organize with headers
- **Conditional Display** - Show/hide based on expressions
- **Smart Tooltips** - Auto-show for truncated text

---

## License

Created by [Stackdrop](https://stackdrop.co)
