# Create a downloadable README.md file for the Cohort Analysis Chart

content = """# 📊 Cohort Analysis Chart

An interactive, data-driven cohort heatmap component built with React and Retool Custom Components.  
It automatically detects dimensions and metrics from your dataset and renders a responsive cohort table with dynamic heatmap visualization and cell-level insights.

---

## ✨ Features

- Automatic field detection (X, Y, Value)
- Manual field override
- Heatmap visualization with intensity scaling
- Cohort table layout (rows = cohorts, columns = time)
- Interactive cells with selection panel
- Fully customizable UI (colors, fonts, layout)
- Max column control (1–12)
- Optimized performance using React hooks
- Seamless Retool integration

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

### Import Component

import CohortAnalysisChart from "./CohortAnalysisChart";

---

## 📊 Sample Data

[
  { "cohort": "Jan 2024", "month": 1, "retention": 100 },
  { "cohort": "Jan 2024", "month": 2, "retention": 78 },
  { "cohort": "Jan 2024", "month": 3, "retention": 65 },
  { "cohort": "Jan 2024", "month": 4, "retention": 52 },

  { "cohort": "Feb 2024", "month": 1, "retention": 100 },
  { "cohort": "Feb 2024", "month": 2, "retention": 72 },
  { "cohort": "Feb 2024", "month": 3, "retention": 60 },
  { "cohort": "Feb 2024", "month": 4, "retention": 48 },

  { "cohort": "Mar 2024", "month": 1, "retention": 100 },
  { "cohort": "Mar 2024", "month": 2, "retention": 70 },
  { "cohort": "Mar 2024", "month": 3, "retention": 58 },
  { "cohort": "Mar 2024", "month": 4, "retention": 45 }
]

---

## ▶️ Render

<CohortAnalysisChart />

---

## 🧠 Smart Detection

- Y-axis → cohort (e.g., Jan 2024)
- X-axis → time (month/week)
- Value → numeric metric (retention, revenue)

---

## 📊 Visualization

- Heatmap grid
- Color intensity based on values
- Handles missing values gracefully

---

## ⚠️ Notes

- Requires Retool environment
- Data must be an array of objects
- Only flat data supported

---

## 📄 License

MIT License
"""

file_path = "/mnt/data/Cohort_Analysis_Chart_README.md"
with open(file_path, "w") as f:
    f.write(content)

file_path