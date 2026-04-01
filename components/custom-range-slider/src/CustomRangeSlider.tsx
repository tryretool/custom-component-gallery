import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { Histogram } from './components/Histogram'
import { RangeSlider } from './components/RangeSlider'
import { createFormatter, DEFAULT_COLORS } from './utils/formatter'
import type { Bucket, ColorConfig } from './types'
import {
  transformArrayWrappedObjectOfArrays,
  transformObjectOfArrays
} from './utils/dataTransformers'

export const CustomRangeSlider: React.FC = () => {
  // Retool state hooks with proper TypeScript API configuration
  const [min] = Retool.useStateNumber({
    name: 'min',
    initialValue: 0,
    label: 'Minimum Value',
    description: 'The minimum value of the range slider',
    inspector: 'text'
  })

  const [max] = Retool.useStateNumber({
    name: 'max',
    initialValue: 100,
    label: 'Maximum Value',
    description: 'The maximum value of the range slider',
    inspector: 'text'
  })

  const [defaultStart] = Retool.useStateNumber({
    name: 'defaultStart',
    initialValue: 25,
    label: 'Default Start',
    description: 'The initial start value of the selected range',
    inspector: 'text'
  })

  const [defaultEnd] = Retool.useStateNumber({
    name: 'defaultEnd',
    initialValue: 75,
    label: 'Default End',
    description: 'The initial end value of the selected range',
    inspector: 'text'
  })

  const [step] = Retool.useStateNumber({
    name: 'step',
    initialValue: 1,
    label: 'Step',
    description: 'The increment step size for the slider',
    inspector: 'text'
  })

  const [label] = Retool.useStateString({
    name: 'label',
    initialValue: 'Label',
    label: 'Label',
    description: 'The label displayed above the slider',
    inspector: 'text'
  })

  const [distributionData] = Retool.useStateArray({
    name: 'distributionData',
    initialValue: [],
    label: 'Distribution Data',
    description:
      'Array of buckets for histogram: [{ min, max, count }]. Example: [{ min: 0, max: 10, count: 5 }]',
    inspector: 'text'
  })

  const [formatterFunction] = Retool.useStateString({
    name: 'formatterFunction',
    initialValue: '',
    label: 'Formatter Function',
    description:
      'JavaScript function to format values (e.g., "v => `$${v}`" or "v => v.toFixed(2)")',
    inspector: 'text'
  })

  // Individual color properties with proper TypeScript API configuration
  const [primaryColor] = Retool.useStateString({
    name: 'primaryColor',
    initialValue: '#f97316',
    label: 'Primary Color',
    description: 'Main color for the selected range and active elements',
    inspector: 'text'
  })

  const [primaryLightColor] = Retool.useStateString({
    name: 'primaryLightColor',
    initialValue: '#fb923c',
    label: 'Primary Light Color',
    description: 'Lighter shade of primary color used for hover states',
    inspector: 'text'
  })

  const [secondaryColor] = Retool.useStateString({
    name: 'secondaryColor',
    initialValue: '#d1d5db',
    label: 'Secondary Color',
    description: 'Color for inactive/unselected elements',
    inspector: 'text'
  })

  const [backgroundColor] = Retool.useStateString({
    name: 'backgroundColor',
    initialValue: '#f3f4f6',
    label: 'Background Color',
    description: 'Background color for the component',
    inspector: 'text'
  })

  const [textColor] = Retool.useStateString({
    name: 'textColor',
    initialValue: '#1f2937',
    label: 'Text Color',
    description: 'Color for text labels and values',
    inspector: 'text'
  })

  const [tooltip] = Retool.useStateString({
    name: 'tooltip',
    initialValue: '#1f2937',
    label: 'Tooltip Color',
    description: 'Color for tooltip text labels and values',
    inspector: 'text'
  })

  const [histogramScale] = Retool.useStateEnumeration({
    name: 'histogramScale',
    initialValue: 'linear',
    label: 'Histogram Scale',
    description:
      'Scale type for histogram bars: linear (proportional), logarithmic (log10, better for wide value ranges), or square root',
    inspector: 'segmented',
    enumDefinition: ['linear', 'logarithmic', 'sqrt']
  })

  const [showNegativeValues] = Retool.useStateBoolean({
    name: 'showNegativeValues',
    initialValue: false,
    label: 'Show Negative Values in Histogram',
    description:
      'When enabled, raises the histogram baseline to show negative values below the x-axis. Only applicable when min or max is negative.',
    inspector: 'checkbox'
  })

  // Output state that's hidden from inspector but accessible via model
  const [_selectedRange, setSelectedRange] = Retool.useStateObject({
    name: 'selectedRange',
    inspector: 'hidden',
    initialValue: { start: 25, end: 75 }
  })

  // Component settings for responsive sizing
  Retool.useComponentSettings({
    defaultHeight: 16,
    defaultWidth: 3
  })

  // Event callback for range changes
  const onRangeChanged = Retool.useEventCallback({ name: 'rangeChanged' })

  // Local state for slider values
  const [start, setStart] = useState<number>(defaultStart)
  const [end, setEnd] = useState<number>(defaultEnd)

  // Initialize slider values when defaults change
  useEffect(() => {
    if (defaultStart !== undefined && defaultStart !== null) {
      setStart(defaultStart)
    }
  }, [defaultStart])

  useEffect(() => {
    if (defaultEnd !== undefined && defaultEnd !== null) {
      setEnd(defaultEnd)
    }
  }, [defaultEnd])

  // Memoize the formatter function
  const formatValue = useMemo(() => {
    return createFormatter(formatterFunction || '')
  }, [formatterFunction])

  // Build color configuration from individual color properties
  const themeColors: ColorConfig = useMemo(() => {
    return {
      primary: primaryColor || DEFAULT_COLORS.primary,
      primaryLight: primaryLightColor || DEFAULT_COLORS.primaryLight,
      secondary: secondaryColor || DEFAULT_COLORS.secondary,
      background: backgroundColor || DEFAULT_COLORS.background,
      text: textColor || DEFAULT_COLORS.text,
      tooltip: tooltip || DEFAULT_COLORS.tooltip
    }
  }, [
    primaryColor,
    primaryLightColor,
    secondaryColor,
    backgroundColor,
    textColor,
    tooltip
  ])

  // Handle range changes
  const handleRangeChange = useCallback(
    (newStart: number, newEnd: number) => {
      setStart(newStart)
      setEnd(newEnd)

      // Update Retool state
      setSelectedRange({ start: newStart, end: newEnd })

      // Trigger event callback
      onRangeChanged()
    },
    [setSelectedRange, onRangeChanged]
  )

  // Handle bar selection from histogram
  const handleBarSelect = useCallback(
    (bucketMin: number, bucketMax: number) => {
      const clampedStart = Math.max(min, bucketMin)
      const clampedEnd = Math.min(max, bucketMax)
      handleRangeChange(clampedStart, clampedEnd)
    },
    [min, max, handleRangeChange]
  )

  // Use query data if available, otherwise fall back to distributionData
  const validData = useMemo(() => {
    if (!distributionData) {
      return []
    }

    // Case 1: Single object with array properties
    // { bucket_index: [0,1,2], bucket_min: [...], bucket_max: [...], count: [...] }
    if (
      !Array.isArray(distributionData) &&
      typeof distributionData === 'object'
    ) {
      return transformObjectOfArrays(
        distributionData as Record<string, unknown>
      )
    }

    // Case 2: Empty array
    if (!Array.isArray(distributionData) || distributionData.length === 0) {
      return []
    }

    const firstItem = distributionData[0]

    if (!firstItem || typeof firstItem !== 'object') {
      return []
    }

    // Case 3: Array wrapping object-of-arrays
    // [{ bucket_index: [0,1,2], bucket_min: [...], bucket_max: [...], count: [...] }]
    if (
      'bucket_index' in firstItem &&
      Array.isArray((firstItem as Record<string, unknown>).bucket_index)
    ) {
      return transformArrayWrappedObjectOfArrays(distributionData)
    }

    // Case 4: Array of bucket objects
    // [{ bucket_index: 0, bucket_min: 0, bucket_max: 10, count: 5 }, ...]
    if (
      'bucket_min' in firstItem &&
      'bucket_max' in firstItem &&
      'count' in firstItem
    ) {
      return distributionData as unknown as Bucket[]
    }

    return []
  }, [distributionData])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        overflow: 'hidden',
        padding: '4px 12px 4px 2px',
        boxSizing: 'border-box',
        minHeight: '120px'
      }}
    >
      {/* First row: Label and value indicators */}
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(6px, 1vh, 8px)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: '700',
              color: themeColors.text,
              lineHeight: '1.4'
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              color: themeColors.text,
              fontWeight: 'bold'
            }}
          >
            {formatValue(start)} - {formatValue(end)}
          </div>
        </div>
      )}

      {/* Second row: Histogram */}
      {validData.length > 0 && (
        <div
          style={{
            marginBottom: 'clamp(12px, 1.5vh, 16px)',
            flexShrink: 0,
            minHeight: '60px',
            maxHeight: '40%',
            flex: '0 1 auto',
            overflow: 'visible'
          }}
        >
          <Histogram
            data={validData as unknown as Bucket[]}
            selectedStart={start}
            selectedEnd={end}
            colors={themeColors}
            onBarSelect={handleBarSelect}
            formatValue={formatValue}
            scale={histogramScale as 'linear' | 'logarithmic' | 'sqrt'}
            showNegativeValues={showNegativeValues && (min < 0 || max < 0)}
            min={min}
            max={max}
          />
        </div>
      )}

      {/* Third row: Range Slider */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 'auto',
          minHeight: '50px'
        }}
      >
        <RangeSlider
          min={min}
          max={max}
          step={step}
          start={start}
          end={end}
          colors={themeColors}
          onChange={handleRangeChange}
          formatValue={formatValue}
        />
      </div>
    </div>
  )
}
