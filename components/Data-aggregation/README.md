# 📊 Smart Aggregation Builder (Retool Custom Component)

A powerful and interactive **data aggregation builder** for Retool that allows users to dynamically group and aggregate data without writing queries.

---

## 🚀 Features

* Dynamic **Group By** selection (multi-select with search)
* Supports multiple aggregations:

  * Sum
  * Average
  * Count
* Prevents duplicate aggregations
* Auto-detects:

  * String columns (for grouping)
  * Numeric columns (for aggregation)
* Real-time validation before execution
* Clean and modern UI
* Export results as CSV
* Fully integrated with Retool state

---

## 🧩 How It Works

1. **Provide Data**

   * Pass an array of objects via Retool state `data`

2. **Group By**

   * Select one or more fields (string columns)

3. **Add Aggregations**

   * Choose:

     * Type (sum, avg, count)
     * Field (for sum/avg)

4. **Run Aggregation**

   * Click `Run Aggregation` to generate results

5. **Export**

   * Download results as CSV

---

## 📥 Retool State Inputs

| State Name     | Type  | Description           |
| -------------- | ----- | --------------------- |
| `data`         | Array | Input dataset         |
| `groupBy`      | Array | Selected group fields |
| `aggregations` | Array | Aggregation configs   |
| `result`       | Array | Output data           |

---

## 📊 Example Input Data

```json
[
  {
    "name": "Ava",
    "city": "NY",
    "salary": 5000
  },
  {
    "name": "Liam",
    "city": "NY",
    "salary": 7000
  },
  {
    "name": "Emma",
    "city": "LA",
    "salary": 6000
  }
]
```

---

## 📈 Example Output

If:

* Group By → `city`
* Aggregation → `sum(salary)`

```json
[
  {
    "City": "NY",
    "Sum Salary": 12000
  },
  {
    "City": "LA",
    "Sum Salary": 6000
  }
]
```

---

## ⚙️ Installation

1. Create a **Retool Custom Component**
2. Paste the component code
3. Bind states:

   * `data`
   * `groupBy`
   * `aggregations`
   * `result`

---

## 🧠 Logic Overview

* Scans first 50 rows to detect column types
* Groups data using selected fields
* Applies aggregations per group
* Formats output dynamically

---

## 🛡️ Validations

* Requires:

  * At least 1 group field
  * At least 1 aggregation
* Prevents:

  * Duplicate aggregations
  * Invalid configurations

---

## 🎨 UI Highlights

* Chip-based multi-select dropdown
* Clean card layout
* Interactive buttons & hover states
* Empty state with guidance
* Responsive table design

---

## 📤 Export Feature

* Generates CSV file: `aggregation_result.csv`
* Includes dynamic headers and all result rows

---

## 🔧 Customization Ideas

* Add Min / Max aggregations
* Add date grouping (monthly, yearly)
* Add sorting & filtering
* Integrate charts

---

## 🧑‍💻 Author

Built for **Retool custom component ecosystem** to simplify data aggregation workflows.
