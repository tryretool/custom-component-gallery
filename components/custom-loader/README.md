# ⚡ Custom Loader Component (Retool Custom Component)

A highly customizable loading component for Retool applications featuring multiple loader types, animated progress indicators, skeleton screens, overlay modes, fullscreen loading states, and automatic query progress tracking.

---

## 🚀 Features

* ⏳ Multiple loader types
* 🎯 Progress tracking with percentage indicators
* 📊 Automatic query completion calculation
* 🦴 Table, Dashboard, and Form Skeleton loaders
* 🔄 Multiple animated spinner styles
* 📋 Step-by-step workflow visualization
* 🖥 Inline, Overlay, and Fullscreen display modes
* 💡 Rotating loading tips
* ✅ Success state handling
* ❌ Error state handling
* 📭 Empty state handling
* 🎨 Light, Dark, and Auto themes
* 📱 Fully responsive design
* ⚡ Optimized for Retool applications

---

## 📦 Inputs

| Name               | Type    | Description                                                   |
| ------------------ | ------- | ------------------------------------------------------------- |
| `loaderStateInput` | String  | Current loader state (`loading`, `success`, `error`, `empty`) |
| `loaderType`       | String  | Loader type to display                                        |
| `theme`            | String  | Theme mode (`auto`, `light`, `dark`)                          |
| `overlayMode`      | String  | Display mode (`inline`, `overlay`, `fullscreen`)              |
| `title`            | String  | Loader title text                                             |
| `subtitle`         | String  | Loader subtitle text                                          |
| `showProgress`     | Boolean | Show progress bar                                             |
| `spinnerStyle`     | String  | Spinner animation style                                       |
| `progress`         | Number  | Manual progress value (0-100)                                 |
| `errorMessage`     | String  | Message displayed for error state                             |
| `emptyMessage`     | String  | Message displayed for empty state                             |
| `tips`             | Array   | Rotating tips array                                           |
| `steps`            | Array   | Step objects for step loader                                  |
| `queryStates`      | Object  | Query completion status object                                |
| `hideDelay`        | Number  | Auto-hide delay in milliseconds                               |

---

## 🎛 Loader Types

Supported loader types:

spinner
progress
steps
tableSkeleton
dashboardSkeleton
formSkeleton


### Spinner Loader

Traditional animated loading indicator.

### Progress Loader

Displays animated progress bar with percentage.

### Steps Loader

Shows workflow progress using completed and pending steps.

### Table Skeleton

Simulates table rows while data loads.

### Dashboard Skeleton

Simulates dashboard KPIs, charts, and tables.

### Form Skeleton

Simulates form fields during loading.

---

## 🎨 Spinner Styles

Supported spinner styles:

circle
dualRing
pulse
bars
ripple
heartbeat
cubeGrid
triangle
wave
dots


---

## 🖥 Display Modes

| Mode         | Description                        |
| ------------ | ---------------------------------- |
| `inline`     | Displays inside the component area |
| `overlay`    | Displays above component content   |
| `fullscreen` | Covers the entire viewport         |

---

## 📊 Automatic Progress Tracking

Pass query completion states:

{
  "usersLoaded": true,
  "ordersLoaded": true,
  "reportsLoaded": false,
  "analyticsLoaded": false
}


The component automatically calculates: 50% | completion progress.

---

## 📋 Steps Configuration

Example steps array:

[
  {
    "label": "Fetch Users",
    "completed": true
  },
  {
    "label": "Load Reports",
    "completed": true
  },
  {
    "label": "Generate Dashboard",
    "completed": false
  }
]


---

## 💡 Loading Tips

Example tips array:

[
  "Loading dashboard data...",
  "Fetching latest records...",
  "Preparing visualizations...",
  "Almost ready..."
]


Tips rotate automatically every few seconds.

---

## 📤 Outputs

This component is designed primarily as a visual state component and does not expose output values.

Progress, state transitions, and visibility are controlled through component inputs.

---

## 🔥 Example Usage

### Query Loading State

{{ getUsers.isFetching ? "loading" : "success" }}


### Error Handling

{{ getUsers.error ? "error" : "loading" }}


### Empty State

{{ getUsers.data?.length === 0 ? "empty" : "success" }}


### Multi Query Progress

{
  users: !getUsers.isFetching,
  reports: !getReports.isFetching,
  analytics: !getAnalytics.isFetching,
  dashboard: !getDashboard.isFetching
}


---

## 🎯 Use Cases

* Dashboard Loading Screens
* Analytics Applications
* Report Generation
* API Request Tracking
* Data Synchronization
* Workflow Automation
* Multi-Step Processes
* Table Loading States
* Form Submissions
* Background Data Processing

---

## ⚙️ Recommended Configuration

### Dashboard Loading

Loader Type: dashboardSkeleton
Display Mode: overlay
Theme: auto


### API Progress Tracking

Loader Type: progress
Show Progress: true


### Workflow Processing

Loader Type: steps
Spinner Style: cubeGrid


---

## 👨‍💻 Author

**Widle Studio LLP**

Built specifically for Retool applications to provide modern, customizable, and production-ready loading experiences.
