# Create the README.md file with the content

content = """# 📊 Smart 3D Chart Component

A dynamic, intelligent chart component built with React, Chart.js, and Retool Custom Component API.  
It automatically analyzes input data and selects the most appropriate chart type, with optional user overrides and visually enhanced 3D effects.

---

## ✨ Features

- 📈 Automatic Chart Type Detection
- 🎛️ User Override via dropdown
- 🎨 3D Visual Effects (Bar + Pie/Donut)
- 📊 Multiple Chart Types Supported
- ⚡ Optimized Rendering
- 🔌 Retool Integration

---

## 🏗️ Tech Stack

- React
- Chart.js
- react-chartjs-2
- Retool Custom Component Support

---

## 📦 Installation

npm install chart.js react-chartjs-2 @tryretool/custom-component-support

---

## 🚀 Usage

Import the component:

import SmartThreeDChart from "./SmartThreeDChart";

Provide data via Retool states:

- chartData → array or object
- title → string

Render:

<SmartThreeDChart />

---

## 🧠 Data Intelligence

The component auto-detects chart types:

- Object → Pie / Donut
- name/value array → Pie / Donut
- Time-based single metric → Line
- Time-based multiple metrics → Multi-line
- Single numeric → Bar
- Multiple numeric → Grouped Bar

---

## 🎨 3D Enhancements

Includes custom Chart.js plugins for:

- 3D Bar charts
- 3D Pie / Donut charts

---

## ⚙️ Customization

Edit COLORS array in code to change palette.

---

## 📁 Project Structure

- SmartThreeDChart.tsx
- README.md

---

## ⚠️ Limitations

- Requires Retool environment
- Large datasets may affect performance
- 3D is simulated (not true 3D)

---

## 📄 License

MIT License
"""

file_path = "/mnt/data/README.md"
with open(file_path, "w") as f:
    f.write(content)

file_path