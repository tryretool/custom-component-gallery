# Heatmap Calendar Component

A beautiful GitHub-style activity heatmap visualization built entirely in React for Retool.

## Features
- Dynamic color buckling based on relative numeric activity max counts.
- Multiple beautiful standard themes (GitHub Green, Deep Blue, Amber Orange, Royal Purple).
- Native smooth hover-scale effects with custom tooltips indicating raw count & dates.
- Interactive \`click\` event emitting allowing you to trigger queries on specific calendar days.

## Data Input Example
Feed this directly from a SQL Group-By aggregation!
\`\`\`json
[
  { "date": "2024-03-01", "count": 14 },
  { "date": "2024-03-02", "count": 42 }
]
\`\`\`

## Event Hooks
- **click**: Fires when a user clicks a calendar node, recording the \`selectedDate\`.
