## Overview

IndoorMap is a **2-way seat booking + layout component** built for Retool.

It provides:

* Interactive seat selection
* Admin layout editing
* Real-time DB sync
* Theme customization

Seat-map UIs work best when users can **visually select seats with clear availability states and instant feedback** ([Medium][1])

---

## ⚠️ Note

**Component Height must be set to `Auto` (Compulsory)**
Otherwise layout scaling, seat positioning, and image rendering will break.

---

## 🔁 Data Flow

```js
Retool → Component → Retool → Database → Retool → Component
```

---

## 📥 Inputs

### seats

```js
[{ id: "S1", x: 0.5, y: 0.3, status: "available", zone: "zone1" }]
```

### images

Floor plan image (base64 / URL)

### selectedSeatIds

(Optional controlled selection)

### isAdmin

Enable edit mode

### themeConfig

Custom theme object

---

## 📤 Outputs

### selectedSeatIdsOut

```js
["S1","S2"]
```

### layoutSeatsOut

```js
[{ id:"S1", x:0.5, y:0.3, status:"available" }]
```

---

## ⚡ Events

* `onSeatSubmit` → booking query
* `onLayoutSave` → layout save query

---

## 🎯 Modes

### Book Mode

* Select / unselect seats
* Filter (zone / available / occupied)
* Tooltip on hover
* Book / Release seats

---

### Edit Mode

* Add seats (grid snap)
* Delete seats
* Prevent overlapping
* Save / Cancel layout

---

## 🎨 Theme

Supports design tokens:

```js
{
  mode: "dark",
  colors: { background, text, accent },
  seat: { availableFill, selectedFill, occupiedFill }
}
```

---

## 🗄️ Example Queries

### Book Seats

```sql
UPDATE seats
SET status = 'occupied'
WHERE id IN (
  {{ indoorMap1.selectedSeatIdsOut.map(s => `'${s}'`).join(",") }}
);
```

---

### Save Layout

```sql
DELETE FROM seats;

INSERT INTO seats (id, x, y, status, zone)
SELECT * FROM json_to_recordset(
  '{{ JSON.stringify(indoorMap1.layoutSeatsOut) }}'
) AS s(id TEXT, x NUMERIC, y NUMERIC, status TEXT, zone TEXT);
```

---

## 🧠 Rules

* Component = UI only
* Retool = logic + queries
* DB = source of truth

---

## ✅ Features

* Seat filtering
* Tooltip
* Book / Release toggle
* Edit mode with constraints
* Theme system
* Clean 2-way binding

---

## 🏁 Summary

A **production-ready seat booking component** with:

* Editable layout
* Real-time booking
* Custom UI themes
* Clean architecture

---

