import React, { useState, useRef, useEffect } from 'react'
import type { ColorConfig, ButtonShape, ButtonPosition } from '../types'

interface RadioOptionProps {
  id: string
  title: string
  description?: string
  isSelected: boolean
  disabled?: boolean
  renderAsHtml?: boolean
  buttonSize: number
  buttonShape: ButtonShape
  buttonPosition: ButtonPosition
  colors: ColorConfig
  titleFontSize: number
  descriptionFontSize: number
  titleTextAlign: string
  descriptionTextAlign: string
  lineClamp: number
  icon?: string
  iconPosition?: 'left' | 'right'
  badge?: string
  badgeColor?: string
  noMarginBottom?: boolean
  onSelect: (id: string) => void
}

const renderButtonShape = (
  shape: ButtonShape,
  size: number,
  isSelected: boolean,
  colors: ColorConfig
) => {
  const commonStyle = {
    width: `${size}px`,
    height: `${size}px`,
    border: `2px solid ${isSelected ? colors.primary : colors.borderColor}`,
    transition: 'all 0.2s ease',
    flexShrink: 0,
    position: 'relative' as const,
    backgroundColor: colors.background
  }

  const innerDotStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${size * 0.5}px`,
    height: `${size * 0.5}px`,
    backgroundColor: colors.primary,
    transition: 'all 0.2s ease',
    opacity: isSelected ? 1 : 0
  }

  switch (shape) {
    case 'bullet':
      return (
        <div style={{ ...commonStyle, borderRadius: '50%' }}>
          <div style={{ ...innerDotStyle, borderRadius: '50%' }} />
        </div>
      )
    case 'square':
      return (
        <div style={{ ...commonStyle, borderRadius: '4px' }}>
          <div style={{ ...innerDotStyle, borderRadius: '2px' }} />
        </div>
      )
    case 'rounded-square':
      return (
        <div style={{ ...commonStyle, borderRadius: '8px' }}>
          <div style={{ ...innerDotStyle, borderRadius: '4px' }} />
        </div>
      )
    case 'diamond':
      return (
        <div
          style={{
            ...commonStyle,
            transform: 'rotate(45deg)',
            borderRadius: '2px'
          }}
        >
          <div
            style={{
              ...innerDotStyle,
              borderRadius: '1px'
            }}
          />
        </div>
      )
    default:
      return (
        <div style={{ ...commonStyle, borderRadius: '50%' }}>
          <div style={{ ...innerDotStyle, borderRadius: '50%' }} />
        </div>
      )
  }
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  id,
  title,
  description,
  isSelected,
  disabled = false,
  renderAsHtml = false,
  buttonSize,
  buttonShape,
  buttonPosition = 'left',
  colors,
  titleFontSize,
  descriptionFontSize,
  titleTextAlign,
  descriptionTextAlign,
  lineClamp,
  icon,
  iconPosition = 'left',
  badge,
  badgeColor,
  noMarginBottom = false,
  onSelect
}) => {
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  // Check if description is truncated
  useEffect(() => {
    if (lineClamp > 0 && descriptionRef.current && description) {
      const element = descriptionRef.current
      setIsTruncated(element.scrollHeight > element.clientHeight)
    }
  }, [description, lineClamp])

  const handleClick = () => {
    if (!disabled) {
      onSelect(id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onSelect(id)
    }
  }

  // Determine flex direction based on button position
  const getFlexDirection = (): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
    switch (buttonPosition) {
      case 'left':
        return 'row'
      case 'right':
        return 'row-reverse'
      case 'top':
        return 'column'
      case 'bottom':
        return 'column-reverse'
      default:
        return 'row'
    }
  }

  // Determine alignment based on button position
  const getAlignment = () => {
    if (buttonPosition === 'top' || buttonPosition === 'bottom') {
      return 'center'
    }
    return 'flex-start'
  }

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: getFlexDirection(),
        alignItems: getAlignment(),
        gap: '12px',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${colors.borderColor}`,
        backgroundColor: isSelected ? colors.hoverColor : colors.background,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        marginBottom: noMarginBottom ? '0' : '12px'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = colors.hoverColor
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = colors.background
        }
      }}
    >
      {/* Radio button */}
      <div style={{
        paddingTop: (buttonPosition === 'left' || buttonPosition === 'right') ? '2px' : '0',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {renderButtonShape(buttonShape, buttonSize, isSelected, colors)}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        width: (buttonPosition === 'top' || buttonPosition === 'bottom') ? '100%' : 'auto'
      }}>
        {/* Title with Icon and Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: description ? '4px' : '0',
            flexWrap: 'wrap'
          }}
        >
          {/* Icon (Left) */}
          {icon && iconPosition === 'left' && (
            <span
              style={{
                fontSize: `${titleFontSize + 2}px`,
                lineHeight: '1',
                opacity: disabled ? 0.5 : 1
              }}
            >
              {icon}
            </span>
          )}

          {/* Title Text */}
          <div
            style={{
              color: disabled ? colors.disabledColor : colors.titleColor,
              fontFamily:
                "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
              fontSize: `${titleFontSize}px`,
              fontWeight: isSelected ? '600' : '500',
              lineHeight: '1.5',
              textAlign: titleTextAlign as 'left' | 'center' | 'right' | 'justify',
              flex: 1
            }}
          >
            {renderAsHtml ? (
              <div dangerouslySetInnerHTML={{ __html: title }} />
            ) : (
              title
            )}
          </div>

          {/* Icon (Right) */}
          {icon && iconPosition === 'right' && (
            <span
              style={{
                fontSize: `${titleFontSize + 2}px`,
                lineHeight: '1',
                opacity: disabled ? 0.5 : 1
              }}
            >
              {icon}
            </span>
          )}

          {/* Badge */}
          {badge && (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: `${Math.max(10, titleFontSize - 4)}px`,
                fontWeight: '600',
                backgroundColor: badgeColor || colors.primary,
                color: '#ffffff',
                lineHeight: '1.4',
                whiteSpace: 'nowrap'
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Description with Tooltip */}
        {description && (
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => lineClamp > 0 && isTruncated && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div
              ref={descriptionRef}
              style={{
                color: disabled ? colors.disabledColor : colors.descriptionColor,
                fontFamily:
                  "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                fontSize: `${descriptionFontSize}px`,
                lineHeight: '1.6',
                textAlign: descriptionTextAlign as 'left' | 'center' | 'right' | 'justify',
                ...(lineClamp > 0 && {
                  display: '-webkit-box',
                  WebkitLineClamp: lineClamp,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                })
              }}
            >
              {renderAsHtml ? (
                <div dangerouslySetInnerHTML={{ __html: description }} />
              ) : (
                description
              )}
            </div>

            {/* Tooltip */}
            {showTooltip && lineClamp > 0 && isTruncated && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: `${descriptionFontSize}px`,
                  lineHeight: '1.6',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  maxWidth: '100%',
                  wordWrap: 'break-word'
                }}
              >
                {renderAsHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                ) : (
                  description
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
