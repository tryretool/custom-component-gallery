# Create a README.md file for download

content = """# 📊 Dynamic KPI Cards

An intelligent, highly customizable KPI card component built with React and Retool Custom Components.
It automatically detects fields from your data and renders responsive KPI cards with trends and styling options.

---

## ✨ Features

- Auto field detection (label, value, trend, secondary)
- Manual override support
- Responsive KPI card layout
- Trend indicators with color coding
- Fully customizable UI (colors, fonts, layout)
- Retool integration with state + events

---

## 🏗️ Tech Stack

- React
- TypeScript
- Retool Custom Component API

---

## 📦 Installation

npm install @tryretool/custom-component-support

---

## 🚀 Usage

Import:

import DynamicKpiCards from "./DynamicKpiCards";

Provide data:

[
  { "name": "Revenue", "value": 120000, "trend": 12.5, "target": 150000 },
  { "name": "Users", "value": 5400, "trend": -2.1, "target": 6000 }
]

Render:

<DynamicKpiCards />

---

## 🧠 Smart Detection

Automatically maps:
- Label → name, label, title
- Value → value, revenue, count
- Secondary → target, baseline
- Trend → trend, change, growth

---

## 🎯 Interaction

- Click a card → updates selectedCard
- Triggers Retool event: cardClick

---

## ⚠️ Notes

- Requires Retool environment
- Data must be an array of objects
- Only flat structures supported

---

## 📄 License

MIT License
"""

file_path = "/mnt/data/Dynamic_KPI_Cards_README.md"
with open(file_path, "w") as f:
    f.write(content)

file_path