# Custom Range Slider for Retool

A customizable range slider component with histogram visualization for Retool applications. Perfect for filtering data ranges and visualizing distributions.

## Features

- **Interactive Range Selection**: Drag handles to select min/max values
- **Histogram Visualization**: Display data distribution alongside the slider
- **Multiple Scale Types**: Linear, logarithmic, and square root scales
- **Flexible Data Input**: Supports multiple data formats from Retool queries
- **Custom Formatting**: Define custom value formatters with JavaScript functions
- **Fully Customizable**: Colors, labels, and step sizes
- **Negative Value Support**: Optional display of negative values in histogram
- **Click-to-Select**: Click histogram bars to quickly select ranges

## Installation

1. Clone this repository or navigate to your project directory

2. Install dependencies:

   ```bash
   npm install
   ```

3. Log in to Retool:

   ```bash
   npx retool-ccl login
   ```

   > Note: You'll need an API access token with read and write scopes for Custom Component Libraries.

4. Start development mode:

   ```bash
   npm run dev
   ```

5. Deploy your component:

   ```bash
   npm run deploy
   ```

6. Switch component versions:
   > To pin your app to the component version you just published, navigate to the Custom Component settings in your Retool app and change dev to the latest version.

## Configuration

The component exposes the following properties in Retool:

### Range Configuration

| Property       | Type   | Default | Description                           |
| -------------- | ------ | ------- | ------------------------------------- |
| `min`          | Number | 0       | Minimum value of the range slider     |
| `max`          | Number | 100     | Maximum value of the range slider     |
| `defaultStart` | Number | 25      | Initial start value of selected range |
| `defaultEnd`   | Number | 75      | Initial end value of selected range   |
| `step`         | Number | 1       | Increment step size for the slider    |
| `label`        | String | "Label" | Label displayed above the slider      |

### Histogram Configuration

| Property              | Type   | Default    | Description                                                                     |
| --------------------- | ------ | ---------- | ------------------------------------------------------------------------------- |
| `distributionData`    | Array  | []         | Array of buckets: `[{ min, max, count }]`                                       |
| `histogramScale`      | Enum   | "linear"   | Scale type: "linear", "logarithmic", or "sqrt"                                  |
| `showNegativeValues`  | Boolean| false      | Show negative values below x-axis when min or max is negative                   |

### Styling

| Property           | Type   | Default   | Description                                          |
| ------------------ | ------ | --------- | ---------------------------------------------------- |
| `primaryColor`     | String | #f97316   | Main color for selected range and active elements    |
| `primaryLightColor`| String | #fb923c   | Lighter shade for hover states                       |
| `secondaryColor`   | String | #d1d5db   | Color for inactive/unselected elements               |
| `backgroundColor`  | String | #f3f4f6   | Background color for the component                   |
| `textColor`        | String | #1f2937   | Color for text labels and values                     |
| `tooltip`          | String | #1f2937   | Color for tooltip text                               |

### Formatting

| Property            | Type   | Default | Description                                                     |
| ------------------- | ------ | ------- | --------------------------------------------------------------- |
| `formatterFunction` | String | ""      | JavaScript function to format values (e.g., `"v => \`$${v}\`"`) |

### Output

| Property        | Type   | Description                                      |
| --------------- | ------ | ------------------------------------------------ |
| `selectedRange` | Object | Current selected range: `{ start: number, end: number }` |

### Events

| Event          | Description                                |
| -------------- | ------------------------------------------ |
| `rangeChanged` | Triggered when the selected range changes  |

## Usage Example

### Basic Setup

1. Add the Custom Range Slider to your Retool app
2. Configure basic range:
   - Set `min` to 0
   - Set `max` to 100
   - Set `label` to "Price Range"

### With Histogram Data

Connect a query that returns distribution data in any of these formats:

**Format 1: Array of objects**
```json
[
  { "min": 0, "max": 10, "count": 5 },
  { "min": 10, "max": 20, "count": 8 },
  { "min": 20, "max": 30, "count": 3 }
]
```

**Format 2: Object of arrays**
```json
{
  "bucket_index": [0, 1, 2],
  "bucket_min": [0, 10, 20],
  "bucket_max": [10, 20, 30],
  "count": [5, 8, 3]
}
```

Set `distributionData` to `{{ query1.dataArray }}`

### Custom Formatting

Add a custom formatter to display values as currency:
- Set `formatterFunction` to `"v => \`$${v.toFixed(2)}\`"`

Or format as dates using moment:
- Set `formatterFunction` to `"v => moment.unix(v).format('MMM DD')"`

### Using the Selected Range

Access the selected range in other components or queries:
- `{{ customRangeSlider1.selectedRange.start }}`
- `{{ customRangeSlider1.selectedRange.end }}`

Use the `rangeChanged` event to trigger queries when the range changes.

## Development

### Prerequisites

- Node.js >= 20.0.0
- Retool developer account

### Local Development

1. Run `npm install` to install dependencies
2. Make changes to components in the `src` directory
3. Run `npm run dev` to test your changes
4. Run `npm run deploy` to deploy to Retool

### Project Structure

- `src/index.tsx` - Main entry point
- `src/CustomRangeSlider.tsx` - Main component
- `src/components/` - Reusable sub-components (Histogram, RangeSlider)
- `src/utils/` - Utility functions (data transformers, formatters)
- `src/types/` - TypeScript type definitions

## License

This project is licensed under the MIT License.

## About

Created by [Stackdrop](https://stackdrop.co)
