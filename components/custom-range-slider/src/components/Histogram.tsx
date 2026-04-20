import React, { useState, useMemo } from 'react'
import type { Bucket, ColorConfig } from '../types'

interface HistogramProps {
  data: Bucket[]
  selectedStart: number
  selectedEnd: number
  colors: ColorConfig
  onBarSelect?: (bucketMin: number, bucketMax: number) => void
  formatValue: (value: number) => string
  scale?: 'linear' | 'logarithmic' | 'sqrt'
  showNegativeValues?: boolean
  min: number
  max: number
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  selectedStart,
  selectedEnd,
  colors,
  onBarSelect,
  formatValue,
  scale = 'linear',
  showNegativeValues = false,
  min,
  max
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const maxCount = useMemo(
    () => Math.max(...data.map((b) => b.count), 1),
    [data]
  )

  // Calculate where zero falls in the range (as a percentage from bottom)
  const zeroLinePosition = useMemo(() => {
    if (!showNegativeValues || min >= 0) return 0
    if (max <= 0) return 100
    // Zero position as percentage from bottom
    return (Math.abs(min) / (max - min)) * 100
  }, [showNegativeValues, min, max])

  // Determine if a bucket represents primarily negative or positive values
  const getBucketValence = (bucket: Bucket): 'negative' | 'positive' | 'mixed' => {
    if (bucket.bucket_max <= 0) return 'negative'
    if (bucket.bucket_min >= 0) return 'positive'
    return 'mixed'
  }

  const calculateScaledHeight = (count: number, maxCount: number): number => {
    if (count === 0) return 0

    switch (scale) {
      case 'logarithmic':
        // Add 1 to avoid log(0), then normalize
        const logValue = Math.log10(count + 1)
        const logMax = Math.log10(maxCount + 1)
        return (logValue / logMax) * 100

      case 'sqrt':
        // Square root scale
        const sqrtValue = Math.sqrt(count)
        const sqrtMax = Math.sqrt(maxCount)
        return (sqrtValue / sqrtMax) * 100

      case 'linear':
      default:
        return (count / maxCount) * 100
    }
  }

  const getTooltipPosition = (barIndex: number, barHeight: number) => {
    const totalBars = data.length
    const horizontalPosition = ((barIndex + 0.5) / totalBars) * 100

    // Determine if tooltip should be on left, center, or right
    let leftPosition = `${horizontalPosition}%`
    let transform = 'translateX(-50%)'

    // If on the left edge (first ~20% of bars), align left
    if (barIndex < totalBars * 0.2) {
      leftPosition = `${(barIndex / totalBars) * 100}%`
      transform = 'translateX(0)'
    }
    // If on the right edge (last ~20% of bars), align right
    else if (barIndex > totalBars * 0.8) {
      leftPosition = `${((barIndex + 1) / totalBars) * 100}%`
      transform = 'translateX(-100%)'
    }

    // Determine vertical position
    // If bar is very tall (> 80% height), show tooltip below it
    const showBelow = barHeight > 80

    return { leftPosition, transform, showBelow }
  }

  const getBarOpacity = (bucket: Bucket): number => {
    const bucketCenter = (bucket.bucket_min + bucket.bucket_max) / 2
    if (bucketCenter >= selectedStart && bucketCenter <= selectedEnd) {
      return 1
    }
    return 0.3
  }

  const handleBarMouseDown = (bucket: Bucket) => {
    setSelectionStart(bucket.bucket_index)
    setIsDragging(true)
  }

  const handleBarMouseEnter = (bucket: Bucket) => {
    setHoveredBar(bucket.bucket_index)
    if (isDragging && selectionStart !== null && onBarSelect) {
      const startIdx = Math.min(selectionStart, bucket.bucket_index)
      const endIdx = Math.max(selectionStart, bucket.bucket_index)
      const startBucket = data[startIdx]
      const endBucket = data[endIdx]
      if (startBucket && endBucket) {
        onBarSelect(startBucket.bucket_min, endBucket.bucket_max)
      }
    }
  }

  const handleBarMouseUp = (bucket: Bucket) => {
    if (selectionStart !== null && onBarSelect) {
      const startIdx = Math.min(selectionStart, bucket.bucket_index)
      const endIdx = Math.max(selectionStart, bucket.bucket_index)
      const startBucket = data[startIdx]
      const endBucket = data[endIdx]
      if (startBucket && endBucket) {
        onBarSelect(startBucket.bucket_min, endBucket.bucket_max)
      }
    }
    setIsDragging(false)
    setSelectionStart(null)
  }

  const handleMouseLeave = () => {
    setHoveredBar(null)
    if (isDragging) {
      setIsDragging(false)
      setSelectionStart(null)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '96%',
        height: '100%',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '8px',
        boxSizing: 'border-box'
      }}
      onMouseLeave={handleMouseLeave}
      onMouseUp={() => {
        setIsDragging(false)
        setSelectionStart(null)
      }}
    >
      {/* Bars container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: showNegativeValues ? 'flex-start' : 'flex-end',
          gap: 'clamp(1px, 0.2vw, 2px)'
        }}
      >
        {data.map((bucket) => {
          const height = calculateScaledHeight(bucket.count, maxCount)
          const opacity = getBarOpacity(bucket)
          const valence = getBucketValence(bucket)
          const isNegative = showNegativeValues && valence === 'negative'

          // Calculate bar position from the zero line
          let barStyles: React.CSSProperties = {}

          if (showNegativeValues) {
            // Calculate available space for negative and positive bars
            const availableNegativeSpace = zeroLinePosition
            const availablePositiveSpace = 100 - zeroLinePosition

            // Position bars relative to the zero line
            if (isNegative) {
              // Negative bars grow downward from zero line
              // Scale height to fit within available negative space
              const scaledHeight = (height / 100) * availableNegativeSpace
              barStyles = {
                position: 'absolute',
                bottom: `${zeroLinePosition - scaledHeight}%`,
                height: `${scaledHeight}%`
              }
            } else {
              // Positive bars grow upward from zero line
              // Scale height to fit within available positive space
              const scaledHeight = (height / 100) * availablePositiveSpace
              barStyles = {
                position: 'absolute',
                bottom: `${zeroLinePosition}%`,
                height: `${scaledHeight}%`
              }
            }
          } else {
            // Standard mode - all bars grow from bottom
            barStyles = {
              position: 'absolute',
              bottom: 0,
              height: `${height}%`
            }
          }

          return (
            <div
              key={bucket.bucket_index}
              style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                minWidth: '2px'
              }}
            >
              <div
                style={{
                  ...barStyles,
                  width: '100%',
                  backgroundColor: colors.primary,
                  opacity,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  borderRadius: isNegative
                    ? '0 0 2px 2px'
                    : '2px 2px 0 0'
                }}
                onMouseEnter={() => handleBarMouseEnter(bucket)}
                onMouseDown={() => handleBarMouseDown(bucket)}
                onMouseUp={() => handleBarMouseUp(bucket)}
              />
            </div>
          )
        })}

        {/* Zero line indicator */}
        {showNegativeValues && zeroLinePosition > 0 && zeroLinePosition < 100 && (
          <div
            style={{
              position: 'absolute',
              bottom: `${zeroLinePosition}%`,
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: colors.text,
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        )}
      </div>

      {/* Tooltip rendered outside bars */}
      {hoveredBar !== null && data[hoveredBar] && (() => {
        const barHeight = calculateScaledHeight(data[hoveredBar].count, maxCount)
        const { leftPosition, transform, showBelow } = getTooltipPosition(
          hoveredBar,
          barHeight
        )

        return (
          <div
            style={{
              position: 'absolute',
              ...(showBelow
                ? {
                    top: `${100 - barHeight}%`,
                    marginTop: '4px'
                  }
                : {
                    bottom: `${barHeight}%`,
                    marginBottom: '4px'
                  }),
              left: leftPosition,
              transform,
              backgroundColor: colors.background,
              color: colors.tooltip,
              padding: 'clamp(3px, 0.5vh, 4px) clamp(6px, 1vw, 8px)',
              borderRadius: '4px',
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              border: `1px solid ${colors.secondary}`,
              userSelect: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', userSelect: 'none' }}>
              Count: {data[hoveredBar].count}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.2vw, 10px)',
                marginTop: '2px',
                userSelect: 'none'
              }}
            >
              {formatValue(data[hoveredBar].bucket_min)} -{' '}
              {formatValue(data[hoveredBar].bucket_max)}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
