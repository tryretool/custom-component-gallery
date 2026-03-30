# 🌍 GeoMap Component (Retool Custom Component)

A high-performance, interactive world map component for Retool that visualizes country-level data with dynamic color scaling, tooltips, and click interactions.

---

## 🚀 Features

- 🌍 World map visualization (Leaflet-based)
- 🎨 Dynamic color gradient (0–100 scale)
- 🧠 Auto country detection (supports names, ISO2, ISO3)
- ⚡ High-performance rendering (optimized updates, caching)
- 🖱 Click interaction with output state
- 🔔 Event handler support (`onSelect`)
- 📊 Smart normalization (supports % and raw values)
- 📌 Sticky legend (color scale indicator)
- 💅 Modern tooltip UI
- 🛡 Safe fallback colors (prevents UI break)

---

## 📦 Inputs

| Name           | Type   | Description |
|----------------|--------|------------|
| `data`         | Array  | Input dataset |
| `countryKey`   | String | Field name for country |
| `valueKey`     | String | Field name for value |
| `lowColor`     | String | Color for lowest values (0%) |
| `midLowColor`  | String | Color for 25% |
| `midHighColor` | String | Color for 75% |
| `highColor`    | String | Color for highest values (100%) |

---

## 📤 Outputs

| Name              | Type   | Description |
|-------------------|--------|------------|
| `selectedCountry` | Object | Selected country data |

Example:
```json
{
  "country": "India",
  "value": 1400
}