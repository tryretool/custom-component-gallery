import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { RadioOption } from './components/RadioOption'
import { GroupHeader } from './components/GroupHeader'
import { DEFAULT_COLORS } from './utils/theme'
import { isGroupHeader, isValidRadioOption, evaluateShowIf } from './utils/typeGuards'
import type {
  RadioOption as RadioOptionType,
  GroupHeader as GroupHeaderType,
  ColorConfig,
  ButtonShape,
  ButtonPosition,
  LayoutMode
} from './types'

export const RadioGroup: React.FC = () => {
  // ========================================
  // SECTION 1: Options Configuration
  // ========================================
  const [options] = Retool.useStateArray({
    name: 'options',
    initialValue: [
      {
        id: '1',
        title: 'Option 1',
        description: 'This is the first option',
        disabled: false
      },
      {
        id: '2',
        title: 'Option 2',
        description: 'This is the second option',
        disabled: false
      },
      {
        id: '3',
        title: 'Option 3',
        description: 'This is the third option',
        disabled: false
      }
    ],
    label: 'Options',
    description:
      'Array of radio options: [{ id: "1", title: "Title", description: "Description", disabled: false, renderAsHtml: false }]',
    inspector: 'text'
  })

  const [multipleSelect] = Retool.useStateBoolean({
    name: 'multipleSelect',
    initialValue: false,
    label: 'Multiple Select',
    description: 'Allow selecting multiple options (transforms radio group to checkbox group)',
    inspector: 'checkbox'
  })

  const [defaultValue] = Retool.useStateString({
    name: 'defaultValue',
    initialValue: '',
    label: 'Default Value (Single)',
    description: 'ID of the option to select by default in single select mode (e.g., "1")',
    inspector: 'text'
  })

  const [defaultValues] = Retool.useStateArray({
    name: 'defaultValues',
    initialValue: [],
    label: 'Default Values (Multiple)',
    description: 'Array of IDs to select by default when Multiple Select is enabled (e.g., ["1", "2"])',
    inspector: 'text'
  })

  // ========================================
  // SECTION 2: Button Configuration
  // ========================================
  const [buttonShape] = Retool.useStateEnumeration({
    name: 'buttonShape',
    initialValue: 'bullet',
    enumDefinition: ['bullet', 'square', 'rounded-square', 'diamond'],
    enumLabels: {
      bullet: 'Bullet (Circle)',
      square: 'Square',
      'rounded-square': 'Rounded Square',
      diamond: 'Diamond'
    },
    label: 'Button Shape',
    description: 'Shape of the radio button',
    inspector: 'select'
  })

  const [buttonSize] = Retool.useStateNumber({
    name: 'buttonSize',
    initialValue: 24,
    label: 'Button Size',
    description: 'Size of the radio button in pixels (default: 24)',
    inspector: 'text'
  })

  const [buttonPosition] = Retool.useStateEnumeration({
    name: 'buttonPosition',
    initialValue: 'left',
    enumDefinition: ['left', 'right', 'top', 'bottom'],
    enumLabels: {
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom'
    },
    label: 'Button Position',
    description: 'Position of the radio button relative to the text (default: left)',
    inspector: 'segmented'
  })

  const [layout] = Retool.useStateEnumeration({
    name: 'layout',
    initialValue: 'vertical',
    enumDefinition: ['vertical', 'horizontal', 'grid', 'justified'],
    enumLabels: {
      vertical: 'Vertical (Stacked)',
      horizontal: 'Horizontal (Row)',
      grid: 'Grid',
      justified: 'Justified (Space Between)'
    },
    label: 'Layout',
    description: 'How to arrange multiple options (default: vertical)',
    inspector: 'select'
  })

  const [gridColumns] = Retool.useStateNumber({
    name: 'gridColumns',
    initialValue: 2,
    label: 'Grid Columns',
    description: 'Number of columns when layout is set to "grid" (default: 2)',
    inspector: 'text'
  })

  // ========================================
  // SECTION 3: Typography
  // ========================================
  const [titleFontSize] = Retool.useStateNumber({
    name: 'titleFontSize',
    initialValue: 16,
    label: 'Title Font Size',
    description: 'Font size for option titles in pixels (default: 16)',
    inspector: 'text'
  })

  const [descriptionFontSize] = Retool.useStateNumber({
    name: 'descriptionFontSize',
    initialValue: 14,
    label: 'Description Font Size',
    description: 'Font size for option descriptions in pixels (default: 14)',
    inspector: 'text'
  })

  const [titleTextAlign] = Retool.useStateEnumeration({
    name: 'titleTextAlign',
    initialValue: 'left',
    enumDefinition: ['left', 'center', 'right', 'justify'],
    enumLabels: {
      left: 'Left',
      center: 'Center',
      right: 'Right',
      justify: 'Justify'
    },
    label: 'Title Text Align',
    description: 'Text alignment for option titles (default: left)',
    inspector: 'segmented'
  })

  const [descriptionTextAlign] = Retool.useStateEnumeration({
    name: 'descriptionTextAlign',
    initialValue: 'left',
    enumDefinition: ['left', 'center', 'right', 'justify'],
    enumLabels: {
      left: 'Left',
      center: 'Center',
      right: 'Right',
      justify: 'Justify'
    },
    label: 'Description Text Align',
    description: 'Text alignment for option descriptions (default: left)',
    inspector: 'segmented'
  })

  const [lineClamp] = Retool.useStateNumber({
    name: 'lineClamp',
    initialValue: 0,
    label: 'Line Clamp',
    description: 'Number of lines to show for descriptions before adding ellipsis. Set to 0 to show all text (default: 0)',
    inspector: 'text'
  })

  // ========================================
  // SECTION 4: Colors
  // ========================================
  const [primary] = Retool.useStateString({
    name: 'primary',
    initialValue: '#f97316',
    label: 'Primary Color',
    description: 'Main color for selected state',
    inspector: 'text'
  })

  const [primaryLight] = Retool.useStateString({
    name: 'primaryLight',
    initialValue: '#fb923c',
    label: 'Primary Light Color',
    description: 'Lighter shade of primary color for hover states',
    inspector: 'text'
  })

  const [background] = Retool.useStateString({
    name: 'background',
    initialValue: '#ffffff',
    label: 'Background Color',
    description: 'Background color for radio options',
    inspector: 'text'
  })

  const [borderColor] = Retool.useStateString({
    name: 'borderColor',
    initialValue: '#d1d5db',
    label: 'Border Color',
    description: 'Color for borders and unselected radio buttons',
    inspector: 'text'
  })

  const [titleColor] = Retool.useStateString({
    name: 'titleColor',
    initialValue: '#1f2937',
    label: 'Title Color',
    description: 'Color for option titles',
    inspector: 'text'
  })

  const [descriptionColor] = Retool.useStateString({
    name: 'descriptionColor',
    initialValue: '#6b7280',
    label: 'Description Color',
    description: 'Color for option descriptions',
    inspector: 'text'
  })

  const [disabledColor] = Retool.useStateString({
    name: 'disabledColor',
    initialValue: '#9ca3af',
    label: 'Disabled Color',
    description: 'Color for disabled options',
    inspector: 'text'
  })

  const [hoverColor] = Retool.useStateString({
    name: 'hoverColor',
    initialValue: '#fee2e2',
    label: 'Hover Color',
    description: 'Background color on hover and selected state',
    inspector: 'text'
  })

  // ========================================
  // SECTION 5: Output States
  // ========================================
  const [_selectedValue, setSelectedValue] = Retool.useStateString({
    name: 'selectedValue',
    initialValue: '',
    label: 'Selected Value',
    description: 'Currently selected option ID (single select mode)',
    inspector: 'text'
  })

  const [_selectedValues, setSelectedValues] = Retool.useStateArray({
    name: 'selectedValues',
    initialValue: [],
    label: 'Selected Values',
    description: 'Currently selected option IDs (multiple select mode)',
    inspector: 'text'
  })

  // Component settings for responsive sizing
  Retool.useComponentSettings({
    defaultHeight: 12,
    defaultWidth: 6,
  })

  // Event callbacks
  const onSelectionChange = Retool.useEventCallback({ name: 'selectionChange' })

  // Track if we've initialized from defaults
  const hasInitialized = useRef(false)

  // Local state for selected values (supports both single and multiple)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Initialize selected value(s) from default (only once on mount)
  useEffect(() => {
    if (hasInitialized.current) {
      return
    }

    if (multipleSelect) {
      // Multiple select mode: initialize from defaultValues array
      if (defaultValues && Array.isArray(defaultValues) && defaultValues.length > 0) {
        const validIds = defaultValues
          .filter((id) => typeof id === 'string' || typeof id === 'number')
          .map((id) => String(id))
        if (validIds.length > 0) {
          setSelectedIds(new Set(validIds))
          setSelectedValues(validIds)
        }
      }
    } else {
      // Single select mode: initialize from defaultValue string
      if (defaultValue && typeof defaultValue === 'string' && defaultValue.trim()) {
        const id = defaultValue.trim()
        setSelectedIds(new Set([id]))
        setSelectedValue(id)
      }
    }

    hasInitialized.current = true
  }, [defaultValue, defaultValues, multipleSelect, setSelectedValue, setSelectedValues])

  // Build color configuration
  const colors: ColorConfig = useMemo(() => {
    return {
      primary: primary || DEFAULT_COLORS.primary,
      primaryLight: primaryLight || DEFAULT_COLORS.primaryLight,
      background: background || DEFAULT_COLORS.background,
      borderColor: borderColor || DEFAULT_COLORS.borderColor,
      titleColor: titleColor || DEFAULT_COLORS.titleColor,
      descriptionColor: descriptionColor || DEFAULT_COLORS.descriptionColor,
      disabledColor: disabledColor || DEFAULT_COLORS.disabledColor,
      hoverColor: hoverColor || DEFAULT_COLORS.hoverColor
    }
  }, [
    primary,
    primaryLight,
    background,
    borderColor,
    titleColor,
    descriptionColor,
    disabledColor,
    hoverColor
  ])

  // Parse and validate options (including group headers)
  const validItems = useMemo(() => {
    if (!options || !Array.isArray(options)) {
      return []
    }

    return options
      .map((item) => {
        // Handle group headers
        if (isGroupHeader(item)) {
          return {
            type: 'header',
            title: String(item.title),
            id: item.id ? String(item.id) : undefined
          } as GroupHeaderType
        }

        // Handle regular options
        if (isValidRadioOption(item)) {
          const option = {
            id: String(item.id),
            title: String(item.title),
            description: item.description ? String(item.description) : undefined,
            disabled: Boolean(item.disabled),
            renderAsHtml: Boolean(item.renderAsHtml),
            icon: item.icon ? String(item.icon) : undefined,
            iconPosition: (item.iconPosition === 'right' ? 'right' : 'left') as 'left' | 'right',
            badge: item.badge ? String(item.badge) : undefined,
            badgeColor: item.badgeColor ? String(item.badgeColor) : undefined,
            showIf: item.showIf ? String(item.showIf) : undefined
          } as RadioOptionType

          // Apply conditional display logic
          if (option.showIf && !evaluateShowIf(option.showIf)) {
            return null
          }

          return option
        }

        return null
      })
      .filter((item): item is RadioOptionType | GroupHeaderType => item !== null)
  }, [options])

  // Extract only the radio options (excluding headers) for selection logic
  const validOptions = useMemo(() => {
    return validItems.filter(
      (item): item is RadioOptionType => !('type' in item && item.type === 'header')
    )
  }, [validItems])

  // Handle selection
  const handleSelect = useCallback(
    (id: string) => {
      if (multipleSelect) {
        // Multiple select mode: toggle selection
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(id)) {
            newSet.delete(id)
          } else {
            newSet.add(id)
          }
          const selectedArray = Array.from(newSet)
          setSelectedValues(selectedArray)
          return newSet
        })
      } else {
        // Single select mode: replace selection
        setSelectedIds(new Set([id]))
        setSelectedValue(id)
      }
      onSelectionChange()
    },
    [multipleSelect, setSelectedValue, setSelectedValues, onSelectionChange]
  )

  // Get the shape as ButtonShape type
  const shape: ButtonShape = (buttonShape as ButtonShape) || 'bullet'

  // Get the button position with validation
  const position: ButtonPosition = (buttonPosition as ButtonPosition) || 'left'

  // Get the layout mode with validation
  const layoutMode: LayoutMode = (layout as LayoutMode) || 'vertical'

  // Get the size with validation
  const size = typeof buttonSize === 'number' && buttonSize > 0 ? buttonSize : 24

  // Get grid columns with validation
  const columns = typeof gridColumns === 'number' && gridColumns > 0 ? Math.floor(gridColumns) : 2

  // Get font sizes with validation
  const validTitleFontSize = typeof titleFontSize === 'number' && titleFontSize > 0 ? titleFontSize : 16
  const validDescriptionFontSize = typeof descriptionFontSize === 'number' && descriptionFontSize > 0 ? descriptionFontSize : 14

  // Get text alignment with validation
  const validTitleTextAlign = (titleTextAlign === 'left' || titleTextAlign === 'center' || titleTextAlign === 'right' || titleTextAlign === 'justify') ? titleTextAlign : 'left'
  const validDescriptionTextAlign = (descriptionTextAlign === 'left' || descriptionTextAlign === 'center' || descriptionTextAlign === 'right' || descriptionTextAlign === 'justify') ? descriptionTextAlign : 'left'

  // Get line clamp with validation (0 or positive integer)
  const validLineClamp = typeof lineClamp === 'number' && lineClamp >= 0 ? Math.floor(lineClamp) : 0

  // Get container styles based on layout mode
  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width: '99%',
      height: 'auto',
      fontFamily: "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      padding: '0px 0px 16px 0px'
    }

    switch (layoutMode) {
      case 'horizontal':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'stretch'
        }
      case 'grid':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '12px'
        }
      case 'justified':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'stretch'
        }
      case 'vertical':
      default:
        return baseStyles
    }
  }

  if (validOptions.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          color: colors.disabledColor,
          fontSize: '14px'
        }}
      >
        No options provided. Add options via the inspector.
      </div>
    )
  }

  return (
    <div
      role={multipleSelect ? 'group' : 'radiogroup'}
      style={getContainerStyles()}
    >
      {validItems.map((item, index) => {
        // Render group header
        if ('type' in item && item.type === 'header') {
          // Headers should span full width in grid/horizontal layouts
          return (
            <div
              key={item.id || `header-${index}`}
              style={{
                gridColumn: layoutMode === 'grid' ? `1 / -1` : undefined,
                width: layoutMode === 'horizontal' || layoutMode === 'justified' ? '100%' : undefined
              }}
            >
              <GroupHeader
                title={item.title}
                titleColor={colors.titleColor}
                titleFontSize={validTitleFontSize}
              />
            </div>
          )
        }

        // Render radio option
        const option = item as RadioOptionType
        return (
          <RadioOption
            key={option.id}
            id={option.id}
            title={option.title}
            description={option.description}
            isSelected={selectedIds.has(option.id)}
            disabled={option.disabled}
            renderAsHtml={option.renderAsHtml}
            buttonSize={size}
            buttonShape={shape}
            buttonPosition={position}
            titleFontSize={validTitleFontSize}
            descriptionFontSize={validDescriptionFontSize}
            titleTextAlign={validTitleTextAlign}
            descriptionTextAlign={validDescriptionTextAlign}
            lineClamp={validLineClamp}
            icon={option.icon}
            iconPosition={option.iconPosition}
            badge={option.badge}
            badgeColor={option.badgeColor}
            noMarginBottom={layoutMode !== 'vertical'}
            colors={colors}
            onSelect={handleSelect}
          />
        )
      })}
    </div>
  )
}
