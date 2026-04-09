# 📌 Dynamic Kanban Board (Retool Custom Component)

A flexible and fully dynamic Kanban board built using **React** and **Retool Custom Component API**. This component automatically parses and renders tasks from any JSON structure with minimal configuration.

---

## 🚀 Features

- 🔄 Dynamic JSON Parsing
- 🧠 Smart Field Inference
- 🎯 Custom Field Mapping
- 🧲 Drag & Drop between columns
- 📊 Dynamic Columns based on status
- 🧾 JSON Sync on updates
- 👤 Avatar with fallback initials
- 📅 Due Date formatting
- ⚡ Retool integration

---

## 🧩 Tech Stack

- React
- TypeScript
- Retool Custom Component SDK
- CSS

---

## 📂 Project Structure

- index.tsx → Main Kanban logic
- index.css → Styling

---

## ⚙️ Inputs (Retool)

- dataJson
- idField
- keyField
- titleField
- descriptionField
- statusField
- priorityField
- assigneeField
- typeField
- dueDateField
- imageUrlField
- statusOrder

---

## 📤 Outputs

- tasks
- selectedData
- selectedDataId
- deletedData
- jsonError
- lastAction

---

## 🧠 How It Works

- Parses JSON dynamically
- Infers fields automatically
- Allows overrides via mappings
- Groups tasks into columns by status

---

## 🧲 Drag & Drop

- Move tasks across columns
- Status updates automatically
- JSON updates in real-time

---

## 🧪 Example

```json
[
  {
    "id": "1",
    "title": "Fix bug",
    "status": "To Do"
  }
]
```

---

## 📌 Usage

1. Add custom component in Retool
2. Bind dataJson
3. Configure fields (optional)
4. Use events

---

## 🎨 Styling

- Responsive layout
- Customizable via CSS

---

## 👨‍💻 Author

Dynamic Kanban Board for Retool
