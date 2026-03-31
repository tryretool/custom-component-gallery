# 📅 React Whiteboard Calendar (Retool Custom Component)

A high-performance **whiteboard-style calendar** built for Retool.  
Designed for **crew scheduling, timeline planning, and multi-day event visualization**.

---

## ✨ Features

- 📆 Week, 2 Weeks, and Month views
- 🧑‍🔧 Crew-based row grouping
- 🎯 Multi-day event rendering
- 🧠 Smart lane management (no overlapping UI issues)
- ⚡ Optimized performance for large datasets
- 🎨 Auto color assignment per crew
- 🖱️ Clickable events & cells (Retool event support)
- 🌍 Timezone support

---

## 🧩 Inputs (Retool State)

### 1. `calendarEventData` (Array)

Event data to render on calendar.

```json
[
  {
    "id": "1",
    "title": "Job 1",
    "start": "2026-04-01",
    "end": "2026-04-03",
    "resource_id": "crew_a",
    "crew_name": "Crew A"
  }
]