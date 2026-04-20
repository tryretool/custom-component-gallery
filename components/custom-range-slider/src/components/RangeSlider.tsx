import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { ColorConfig } from '../types'

interface RangeSliderProps {
  min: number
  max: number
  step: number
  start: number
  end: number
  colors: ColorConfig
  onChange: (start: number, end: number) => void
  formatValue: (value: number) => string
  label?: string
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  start,
  end,
  colors,
  onChange,
  formatValue,
  label
}) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null)
  const [hoveredHandle, setHoveredHandle] = useState<'start' | 'end' | null>(
    null
  )

  const valueToPercent = useCallback(
    (value: number): number => ((value - min) / (max - min)) * 100,
    [min, max]
  )

  const percentToValue = useCallback(
    (percent: number): number => {
      const rawValue = min + (percent / 100) * (max - min)
      return Math.round(rawValue / step) * step
    },
    [min, max, step]
  )

  const handleMouseDown = useCallback((handle: 'start' | 'end') => {
    setActiveHandle(handle)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeHandle || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percent = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      )
      const newValue = percentToValue(percent)

      if (activeHandle === 'start') {
        const clampedValue = Math.min(newValue, end - step)
        onChange(Math.max(min, clampedValue), end)
      } else {
        const clampedValue = Math.max(newValue, start + step)
        onChange(start, Math.min(max, clampedValue))
      }
    },
    [activeHandle, start, end, min, max, step, onChange, percentToValue]
  )

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null)
  }, [])

  useEffect(() => {
    if (activeHandle) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [activeHandle, handleMouseMove, handleMouseUp])

  const startPercent = valueToPercent(start)
  const endPercent = valueToPercent(end)

  return (
    <div
      style={{
        position: 'relative',
        width: '96%',
        marginLeft: '8px'
      }}
    >
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(8px, 1.5vh, 10px)',
            gap: 'clamp(8px, 1.5vw, 12px)',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              fontWeight: '600',
              color: colors.text,
              lineHeight: '1.4'
            }}
          >
            {label}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'clamp(8px, 1.5vw, 12px)',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${colors.background}, ${colors.secondary}15)`,
                color: colors.text,
                padding: 'clamp(6px, 1vh, 8px) clamp(8px, 1.5vw, 12px)',
                borderRadius: '6px',
                fontSize: 'clamp(12px, 1.8vw, 14px)',
                fontWeight: '600',
                border: `1px solid ${colors.secondary}`,
                minWidth: 'fit-content',
                transition: 'transform 0.2s ease',
                transform: activeHandle === 'start' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {formatValue(start)}
            </div>
            <div
              style={{
                background: `linear-gradient(135deg, ${colors.background}, ${colors.secondary}15)`,
                color: colors.text,
                padding: 'clamp(6px, 1vh, 8px) clamp(8px, 1.5vw, 12px)',
                borderRadius: '6px',
                fontSize: 'clamp(12px, 1.8vw, 14px)',
                fontWeight: '600',
                border: `1px solid ${colors.secondary}`,
                minWidth: 'fit-content',
                transition: 'transform 0.2s ease',
                transform: activeHandle === 'end' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {formatValue(end)}
            </div>
          </div>
        </div>
      )}

      <div
        ref={sliderRef}
        style={{
          position: 'relative',
          height: 'clamp(4px, 0.8vh, 6px)',
          background: `linear-gradient(to right, ${colors.secondary}dd, ${colors.secondary})`,
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
            height: '100%',
            background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
            borderRadius: '3px',
            borderLeft: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`,
            transition: 'box-shadow 0.2s ease',
            boxShadow: activeHandle ? '0 0 8px rgba(249, 115, 22, 0.3)' : 'none'
          }}
        />

        {['start', 'end'].map((handle) => {
          const isStart = handle === 'start'
          const isActive = activeHandle === handle
          const isHovered = hoveredHandle === handle
          const percent = isStart ? startPercent : endPercent

          return (
            <div
              key={handle}
              style={{
                position: 'absolute',
                left: `${percent}%`,
                top: '50%',
                transform: `translate(-50%, -50%) scale(${isActive ? 1.15 : isHovered ? 1.1 : 1})`,
                width: 'clamp(14px, 2.5vw, 18px)',
                height: 'clamp(14px, 2.5vw, 18px)',
                background: `radial-gradient(circle at 30% 30%, ${colors.primaryLight}, ${colors.primary})`,
                borderRadius: '50%',
                cursor: isActive ? 'grabbing' : 'grab',
                border: `clamp(2px, 0.3vw, 3px) solid white`,
                boxShadow: isActive
                  ? '0 4px 12px rgba(0,0,0,0.25)'
                  : '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: isActive ? 3 : 2,
                transition:
                  'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
                willChange: 'transform'
              }}
              onMouseDown={() => handleMouseDown(handle as 'start' | 'end')}
              onMouseEnter={() => setHoveredHandle(handle as 'start' | 'end')}
              onMouseLeave={() => setHoveredHandle(null)}
            />
          )
        })}
      </div>
    </div>
  )
}
