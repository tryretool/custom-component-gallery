# ProgressTimeline

Vertical animated Retool timeline focused on view-only milestone status.

## State

- `milestones` (array): Required timeline items. Each item supports:
  - `id` (string, optional): Auto-generated when omitted.
  - `title` (string, required)
  - `status` (required): Any status value defined in `statusConfig`
  - `date` (string, required): Date-like string used for sorting and display.
  - `description` (string, optional)
- `statusConfig` (array): Dynamic status definitions used for labels and colors.
  - `value` (string, required): Status value used by each milestone.
  - `label` (string, required): UI label shown in the badge.
  - `color` (string, required): Hex/rgb color for dot + badge.
- `doneStatuses` (array of strings): Status values counted as complete for progress fill.
- `fieldMapping` (object): Optional key mapping for incoming milestone rows.
  - `id` default: `id`
  - `title` default: `title`
  - `status` default: `status`
  - `date` default: `date`
  - `description` default: `description`
- Style fields (configured directly in inspector, not JSON):
  - `backgroundColor`
  - `cardBackgroundColor`
  - `titleColor`
  - `textColor`
  - `borderColor`
  - `trackColor`
  - `lineGradientStart`
  - `lineGradientEnd`
  - `borderRadius` (number, px)
  - `titleFontSize` (number, px)
  - `descriptionFontSize` (number, px)
  - `dateFontSize` (number, px)
  - `statusFontSize` (number, px)
- `dateFormat` (string): Token-based output date format shown on the card. Default: `MMM D, YYYY`.
- `sortBy` (dropdown): Sort mode for milestones. Options: `none`, `date`, `title`, `status`. Default: `none` (uses input milestone order).
- `sortDirection` (dropdown): Sort order. Options: `asc`, `desc`. Default: `asc`.
- `emptyStateText` (string): Message shown when no milestones are available. Default: `No milestones yet`.

## Behavior

- Milestones are automatically sorted by date ascending.
- View-only: no editing or drag reorder.
- Card selection is supported and exposes `selectedMilestone`, then triggers `milestoneClick`.
- Includes subtle enter animations for cards/status and animated vertical progress fill.
- Progress fill logic: uses `doneStatuses` as the single source of truth.
- Dates are displayed using `dateFormat` tokens (`YYYY`, `MMMM`, `MMM`, `MM`, `DD`, `D`).
- Sorting is configurable through `sortBy` and `sortDirection`.
