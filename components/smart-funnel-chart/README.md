# Smart Funnel Chart

content = """# 🔻 Smart Funnel Chart

An intelligent, responsive funnel chart component built with React and Retool Custom Components.  
It automatically adapts to your data and renders optimized funnel layouts with multiple styles and optional 3D effects.

---

## ✨ Features

- Smart data detection
- Multiple funnel styles (Auto, Compact, Flat, Classic, Smooth, Pinched, Reverse)
- Optional 3D rendering
- Responsive layout
- Automatic value formatting (K, M)
- Retool integration

---

## 🏗️ Tech Stack

- React
- TypeScript
- SVG
- Retool Custom Component API

---

## 📦 Installation

npm install @tryretool/custom-component-support

---

## 🚀 Usage

Import:

import SmartFunnelChart from "./SmartFunnelChart";

---

## 📊 Sample Data

[
  { "name": "Visitors", "value": 10000 },
  { "name": "Signups", "value": 4200 },
  { "name": "Activated", "value": 2800 },
  { "name": "Subscribed", "value": 1200 },
  { "name": "Retained", "value": 650 }
]

---

## ▶️ Render

<SmartFunnelChart />

---

## 🧠 Smart Behavior

- Auto-detects structure
- Sorts and normalizes data
- Chooses best funnel type

---

## 🎛️ Funnel Types

- Auto
- Compact
- Flat
- Classic
- Smooth
- Pinched
- Reverse

---

## 🎨 3D Mode

Enable via Retool to add depth and shading.

---

## ⚠️ Notes

- Requires Retool environment
- Data must include numeric values

---

## 📄 License

MIT License
"""

file_path = "/mnt/data/Smart_Funnel_Chart_README.md"
with open(file_path, "w") as f:
    f.write(content)

file_path