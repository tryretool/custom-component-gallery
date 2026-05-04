# Icon Rail Nav

A compact Retool navigation component with an always-visible icon rail, a contextual detail panel, and hover-revealed labels.

## Setup

1. Add `IconRailNav` to your Retool app.
2. Set `Menu Items JSON` to a JSON array of nav items.
3. Add a `navigate` event handler.
4. Configure the handler to go to `{{ iconRailNav1.model.activePage }}`.

## Starter JSON

```json
[
  {
    "id": "home",
    "label": "Home",
    "icon": "table",
    "page": "Dashboard"
  },
  {
    "id": "users",
    "label": "Users",
    "icon": "lock",
    "subItems": [
      { "id": "users-active", "label": "Active", "page": "ActiveUsers" },
      { "id": "users-pending", "label": "Pending", "page": "PendingUsers" }
    ]
  },
  {
    "id": "reports",
    "label": "Reports",
    "icon": "chart",
    "badge": "New",
    "description": "View analytics and reports"
  }
]
```

## Model Properties

| Property | Type | Description |
|---|---|---|
| `menuEditorVisibility` | `"show"`/`"hide"` | Shows or hides the visual editor for top-level menu items and sub-items |
| `helpVisibility` | `"show"`/`"hide"` | Shows or hides the setup help drawer |
| `itemsJson` | string | Menu Items JSON: JSON array of top-level nav items |
| `bottomItemsJson` | string | JSON array of items pinned to the bottom |
| `activeItem` | string | Last selected top-level item id |
| `activeSubItem` | string | Last selected sub-item id |
| `activePage` | string | Page target from the selected item/sub-item |
| `activeApp` | string | App target from the selected item/sub-item |
| `projectName` | string | Dynamic/bindable header label in the contextual panel |
| `projectStatus` | string | `online`, `offline`, or `paused` |
| `theme` | string | `dark` or `light` |
| `accentColor` | string | Active item and badge color |
| `padding` | number | Outer padding in pixels. Negative values can compensate for Retool wrapper inset. |
| `menuItems` | array | Hidden visual editor output or directly bound menu item array |
| `pageOptions` | array | Optional page dropdown choices for the visual editor |
| `appOptions` | array | Optional app dropdown choices for the visual editor |
| `menuJsonDraft` | string | Hidden JSON output for optional save handlers |

## Item Schema

```ts
type NavItem = {
  id: string;
  label: string;
  icon: string;
  page?: string;
  app?: string;
  badge?: string;
  color?: string;
  section?: string;
  description?: string;
  subItems?: SubItem[];
};

type SubItem = {
  id: string;
  label: string;
  page?: string;
  app?: string;
};
```

Built-in icon keys: `table`, `code`, `database`, `lock`, `storage`, `function`, `realtime`, `clock`, `info`, `logs`, `chart`, `settings`.

Custom icons can be image URLs or data URLs.
