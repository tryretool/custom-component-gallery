# Expandable Row Table for Retool

A highly customizable expandable row table component built with React, TypeScript, and the Retool Custom Component SDK.

This component is designed for advanced operational dashboards, analytics tooling, audit monitoring, transaction inspection, and enterprise-style data grid interactions inside Retool.

---

## Features

### Expandable Rows

* Expandable detail sections
* Recursive nested JSON rendering
* Automatic key-value formatting
* Multi-key expandable support
* API response inspection
* Object and array visualization
* Long text handling
* URL rendering

### Advanced Table Features

* Dynamic column visibility
* Drag-and-drop column rearranging
* Persistent column ordering
* ASC → DESC → Reset sorting
* Search and filtering
* Pagination
* Responsive layout
* CSV export
* Interactive row selection

### Styling Controls

* Header colors
* Row colors
* Alternate row colors
* Font customization
* Footer styling
* Pagination styling
* Theme-aware design

---

## Technology Stack

* React 18
* TypeScript
* Retool Custom Component SDK
* Lucide React Icons

---

## Inputs

| Property               | Type    | Description                      |
| ---------------------- | ------- | -------------------------------- |
| tableData              | Array   | Main table dataset               |
| pageSize               | Number  | Rows per page                    |
| expandableDataKey      | String  | Expandable object field(s)       |
| showToolbar            | Boolean | Toggle toolbar                   |
| showSearchBar          | Boolean | Toggle search                    |
| headerColor            | String  | Header background                |
| headerTextColor        | String  | Header text color                |
| rowBackground          | String  | Row background                   |
| alternateRowBackground | String  | Alternate row background         |
| accentColor            | String  | Accent/highlight color           |
| footerBackgroundColor  | String  | Footer background                |
| paginationTextColor    | String  | Pagination text color            |
| rowHeight              | Enum    | Small / Medium / Large / Dynamic |
| columnWidthMode        | Enum    | Auto / Manual                    |

---

## Outputs

| Property        | Type   | Description                |
| --------------- | ------ | -------------------------- |
| selectedRowData | Object | Selected row data          |
| columnOrder     | Array  | Current column arrangement |
| visibleColumns  | Array  | Visible table columns      |

---

## Expandable Data Examples

### Single Key

```txt
metadata
```

### Multiple Keys

```txt
metadata,api_response,tags
```

### JSON Array Format

```json
["metadata","api_response","tags"]
```

---

## Sorting Behavior

* First click → Ascending
* Second click → Descending
* Third click → Reset sorting

---

## Column Rearranging

Columns support drag-and-drop reordering and persist after refresh using Retool state storage.

---

## Use Cases

* Audit Logs
* Transaction Monitoring
* API Debugging
* Financial Dashboards
* Shipment Tracking
* Analytics Dashboards
* Internal Admin Tools
* Operational Monitoring

---

## License

MIT License
