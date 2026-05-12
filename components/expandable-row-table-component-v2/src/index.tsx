import React, { FC, useEffect, useMemo, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import {
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCcw,
} from 'lucide-react'

export const ExpandableTableComponent: FC = () => {
  const [data] = Retool.useStateArray({
    name: 'tableData',
    label: 'Table Data',
    description:
      'Main dataset for the table component',
  })

  const [
    selectedRowData,
    setSelectedRowData,
  ] = Retool.useStateObject({
    name: 'selectedRowData',
    label: 'Selected Row Data',
    description:
      'Currently selected row output',
  })

  const [expandableDataKey] =
    Retool.useStateString({
      name: 'expandableDataKey',
      initialValue: '',
      label: 'Expandable Data Keys',
      description:
        'Single or multiple expandable keys. Supports: metadata OR metadata,api_response OR ["metadata","api_response"]',
    })

  const [pageSize] =
    Retool.useStateNumber({
      name: 'pageSize',
      initialValue: 10,
      label: 'Page Size',
      description:
        'Number of rows per page',
    })

  const [headerColor] =
    Retool.useStateString({
      name: 'headerColor',
      initialValue: '#f3f4f6',
      label: 'Header Background',
      description:
        'Table header background color',
    })

  const [headerTextColor] =
    Retool.useStateString({
      name: 'headerTextColor',
      initialValue: '#111827',
      label: 'Header Text Color',
      description:
        'Table header text color',
    })

  const [accentColor] =
    Retool.useStateString({
      name: 'accentColor',
      initialValue: '#2563eb',
      label: 'Accent Color',
      description:
        'Primary highlight color',
    })

  const [
    visibleColumns,
    setVisibleColumns,
  ] = Retool.useStateArray({
    name: 'visibleColumns',
    label: 'Visible Columns',
    description:
      'Columns visible in the table',
  })

  const [
    columnOrder,
    setColumnOrder,
  ] = Retool.useStateArray({
    name: 'columnOrder',
    label: 'Column Order',
    description:
      'Persisted draggable column order',
  })

  const [fontFamily] =
    Retool.useStateString({
      name: 'fontFamily',
      initialValue:
        'Inter, system-ui, sans-serif',
      label: 'Font Family',
      description:
        'Global table font family',
    })

  const [headerFontSize] =
    Retool.useStateNumber({
      name: 'headerFontSize',
      initialValue: 14,
      label: 'Header Font Size',
      description:
        'Header text font size',
    })

  const [bodyFontSize] =
    Retool.useStateNumber({
      name: 'bodyFontSize',
      initialValue: 14,
      label: 'Body Font Size',
      description:
        'Table body font size',
    })

  const [rowBackground] =
    Retool.useStateString({
      name: 'rowBackground',
      initialValue: '#ffffff',
      label: 'Row Background',
      description:
        'Default table row background',
    })

  const [alternateRowBackground] =
    Retool.useStateString({
      name:
        'alternateRowBackground',
      initialValue: '#fafafa',
      label:
        'Alternate Row Background',
      description:
        'Alternate row background color',
    })

  const [emptyStateMessage] =
    Retool.useStateString({
      name: 'emptyStateMessage',
      initialValue: 'No rows found',
      label: 'Empty State Message',
      description:
        'Shown when no table rows exist',
    })

  const [showSearchBar] =
    Retool.useStateBoolean({
      name: 'showSearchBar',
      initialValue: true,
      label: 'Show Search Bar',
      inspector: 'checkbox',
      description:
        'Toggle search bar visibility',
    })

  const [showToolbar] =
    Retool.useStateBoolean({
      name: 'showToolbar',
      initialValue: true,
      label: 'Show Toolbar',
      inspector: 'checkbox',
      description:
        'Toggle footer toolbar actions',
    })

  const [rowHeight] =
    Retool.useStateEnumeration({
      name: 'rowHeight',
      enumDefinition: [
        'small',
        'medium',
        'large',
        'dynamic',
      ],
      enumLabels: {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        dynamic: 'Dynamic',
      },
      initialValue: 'medium',
      inspector: 'select',
      label: 'Row Height',
      description:
        'Height style of table rows',
    })

  const [columnWidthMode] =
    Retool.useStateEnumeration({
      name: 'columnWidthMode',
      enumDefinition: [
        'auto',
        'manual',
      ],
      enumLabels: {
        auto: 'Auto',
        manual: 'Manual',
      },
      initialValue: 'auto',
      inspector: 'select',
      label: 'Column Width Mode',
      description:
        'Auto width or manual resizable columns',
    })

  const [footerBackgroundColor] =
    Retool.useStateString({
      name:
        'footerBackgroundColor',
      initialValue: '#ffffff',
      label:
        'Footer Background Color',
      description:
        'Footer background color',
    })

  const [footerBorderColor] =
    Retool.useStateString({
      name:
        'footerBorderColor',
      initialValue: '#e5e7eb',
      label:
        'Footer Border Color',
      description:
        'Footer top border color',
    })

  const [paginationTextColor] =
    Retool.useStateString({
      name:
        'paginationTextColor',
      initialValue: '#111827',
      label:
        'Pagination Text Color',
      description:
        'Pagination text/icon color',
    })

  const [paginationButtonBackground] =
    Retool.useStateString({
      name:
        'paginationButtonBackground',
      initialValue: '#ffffff',
      label:
        'Pagination Button Background',
      description:
        'Pagination button background',
    })

  const [paginationActiveBackground] =
    Retool.useStateString({
      name:
        'paginationActiveBackground',
      initialValue: '#eff6ff',
      label:
        'Pagination Active Background',
      description:
        'Current page indicator background',
    })

  const [paginationFontSize] =
    Retool.useStateNumber({
      name:
        'paginationFontSize',
      initialValue: 14,
      label:
        'Pagination Font Size',
      description:
        'Pagination font size',
    })

  const safeData = Array.isArray(data)
    ? data
    : []

  const safeHeaderColor =
    headerColor || '#f3f4f6'

  const safeHeaderTextColor =
    headerTextColor || '#111827'

  const safeAccentColor =
    accentColor || '#2563eb'

  const safeFontFamily =
    fontFamily ||
    'Inter, system-ui, sans-serif'

  const safeRowBackground =
    rowBackground || '#ffffff'

  const safeAlternateRowBackground =
    alternateRowBackground || '#fafafa'

  const safeHeaderFontSize =
    Number(headerFontSize) || 14

  const safeBodyFontSize =
    Number(bodyFontSize) || 14

  const safePageSize =
    Number(pageSize) || 10

  const safeFooterBackgroundColor =
    footerBackgroundColor ||
    '#ffffff'

  const safeFooterBorderColor =
    footerBorderColor ||
    '#e5e7eb'

  const safePaginationTextColor =
    paginationTextColor ||
    '#111827'

  const safePaginationButtonBackground =
    paginationButtonBackground ||
    '#ffffff'

  const safePaginationActiveBackground =
    paginationActiveBackground ||
    '#eff6ff'

  const safePaginationFontSize =
    Number(
      paginationFontSize
    ) || 14

  const [selectedRow, setSelectedRow] =
    useState<any>(null)

  const [expandedRow, setExpandedRow] =
    useState<any>(null)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [sortConfig, setSortConfig] =
    useState<{
      key: string
      direction: 'asc' | 'desc'
    } | null>(null)

  const [currentPage, setCurrentPage] =
    useState(1)

  const [
    draggedColumn,
    setDraggedColumn,
  ] = useState<string | null>(
    null
  )

  const getRowHeight = () => {
    switch (rowHeight) {
      case 'small':
        return 38

      case 'large':
        return 72

      case 'dynamic':
        return 'auto'

      default:
        return 52
    }
  }

  useEffect(() => {
    if (
      selectedRow !== null &&
      paginatedData.length
    ) {
      const matchedRow =
        paginatedData.find(
          (row, index) =>
            (row?.id ?? index) ===
            selectedRow
        )

      if (matchedRow) {
        setSelectedRowData({
          ...matchedRow,
          __selectedRowId:
            selectedRow,
        })
      }
    }
  }, [selectedRow])

  const rowHeightValue =
    getRowHeight()

  const allColumns = useMemo(() => {
    if (
      !safeData.length ||
      typeof safeData[0] !== 'object'
    ) {
      return []
    }

    return Object.keys(
      safeData[0]
    ).filter((key) => {
      if (!expandableDataKey)
        return true

      return (
        key !== expandableDataKey
      )
    })
  }, [safeData, expandableDataKey])

  useEffect(() => {
    if (!allColumns.length) {
      return
    }

    if (
      !Array.isArray(
        columnOrder
      ) ||
      !columnOrder.length
    ) {
      setColumnOrder(allColumns)

      return
    }

    const missingColumns =
      allColumns.filter(
        (col) =>
          !columnOrder.includes(col)
      )

    if (missingColumns.length) {
      setColumnOrder([
        ...columnOrder,
        ...missingColumns,
      ])
    }
  }, [allColumns])

  const tableHeaders = useMemo(() => {
    const orderedColumns =
      Array.isArray(
        columnOrder
      ) &&
        columnOrder.length
        ? columnOrder.filter((col) =>
          allColumns.includes(col)
        )
        : allColumns

    if (
      !Array.isArray(
        visibleColumns
      ) ||
      !visibleColumns.length
    ) {
      return orderedColumns
    }

    return orderedColumns.filter((col) =>
      visibleColumns.includes(col)
    )
  }, [
    allColumns,
    visibleColumns,
    columnOrder,
  ])

  const filteredSortedData = useMemo(() => {
    let filtered = [...safeData]

    if (searchTerm) {
      filtered = filtered.filter(
        (row) =>
          Object.values(
            row || {}
          ).some((value) =>
            String(value)
              .toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              )
          )
      )
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const A =
          a?.[sortConfig.key]
        const B =
          b?.[sortConfig.key]

        if (A < B) {
          return sortConfig.direction ===
            'asc'
            ? -1
            : 1
        }

        if (A > B) {
          return sortConfig.direction ===
            'asc'
            ? 1
            : -1
        }

        return 0
      })
    }

    return filtered
  }, [
    safeData,
    searchTerm,
    sortConfig,
  ])

  const paginatedData = useMemo(() => {
    const start =
      (currentPage - 1) *
      safePageSize

    return filteredSortedData.slice(
      start,
      start + safePageSize
    )
  }, [
    filteredSortedData,
    currentPage,
    safePageSize,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSortedData.length /
      safePageSize
    )
  )

  useEffect(() => {
    if (paginatedData.length > 0) {
      const existsOnPage =
        paginatedData.some(
          (row, index) =>
            (row?.id ?? index) ===
            selectedRow
        )

      if (!existsOnPage) {
        const firstRow =
          paginatedData[0]

        const rowId =
          firstRow?.id ?? 0

        setSelectedRow(rowId)

        setSelectedRowData({
          ...firstRow,
          __selectedRowId:
            rowId,
        })
      }
    }
  }, [paginatedData])

  const toggleRow = (id: any) => {
    setExpandedRow((prev) =>
      prev === id ? null : id
    )
  }

  const handleSort = (
    key: string
  ) => {
    if (
      !sortConfig ||
      sortConfig.key !== key
    ) {
      setSortConfig({
        key,
        direction: 'asc',
      })

      return
    }

    if (
      sortConfig.direction ===
      'asc'
    ) {
      setSortConfig({
        key,
        direction: 'desc',
      })

      return
    }

    if (
      sortConfig.direction ===
      'desc'
    ) {
      setSortConfig(null)

      return
    }
  }

  const exportCSV = () => {
    const rows = []

    rows.push(tableHeaders.join(','))

    filteredSortedData.forEach(
      (row) => {
        rows.push(
          tableHeaders
            .map((header) =>
              JSON.stringify(
                row?.[header] ?? ''
              )
            )
            .join(',')
        )
      }
    )

    const blob = new Blob(
      [rows.join('\n')],
      {
        type: 'text/csv',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url

    a.download =
      'table-data.csv'

    a.click()

    URL.revokeObjectURL(url)
  }

  const formatLabel = (key: string) => {
    return key
      .split('.')
      .map((part) =>
        part
          .replace(/_/g, ' ')
          .replace(
            /([a-z])([A-Z])/g,
            '$1 $2'
          )
          .replace(/\b\w/g, (c) =>
            c.toUpperCase()
          )
      )
      .join('.')
  }

  const isDateValue = (
    value: any
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return false
    }

    if (value instanceof Date) {
      return true
    }

    if (
      typeof value !== 'string'
    ) {
      return false
    }

    const parsedDate =
      new Date(value)

    return (
      !isNaN(
        parsedDate.getTime()
      ) &&
      (
        /^\d{4}-\d{2}-\d{2}/.test(
          value
        ) ||
        value.includes('T') ||
        value.includes(':')
      )
    )
  }

  const formatDateTime = (
    value: any
  ) => {
    try {
      const date =
        new Date(value)

      if (
        isNaN(date.getTime())
      ) {
        return value
      }

      return date.toLocaleString(
        'en-US',
        {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      )
    } catch {
      return value
    }
  }

  const normalizeExpandableData = (
    data: any,
    parentKey = ''
  ): any[] => {
    if (
      data === null ||
      data === undefined ||
      data === ''
    ) {
      return []
    }

    if (typeof data === 'string') {
      const trimmed = data.trim()

      if (
        (trimmed.startsWith('{') &&
          trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') &&
          trimmed.endsWith(']'))
      ) {
        try {
          const parsed = JSON.parse(trimmed)

          return normalizeExpandableData(
            parsed,
            parentKey
          )
        } catch {
          return [
            {
              key: formatLabel(
                parentKey || 'Value'
              ),
              value: isDateValue(data)
                ? formatDateTime(
                  data
                )
                : data,
            },
          ]
        }
      }

      return [
        {
          key: formatLabel(
            parentKey || 'Value'
          ),
          value: isDateValue(data)
            ? formatDateTime(
              data
            )
            : String(data),
        },
      ]
    }

    if (Array.isArray(data)) {
      return data.flatMap(
        (item, index) =>
          normalizeExpandableData(
            item,
            parentKey
              ? `${parentKey}.${index}`
              : `${index}`
          )
      )
    }

    if (
      typeof data === 'object' &&
      data !== null
    ) {
      return Object.entries(data).flatMap(
        ([key, value]) =>
          normalizeExpandableData(
            value,
            parentKey
              ? `${parentKey}.${key}`
              : key
          )
      )
    }

    return [
      {
        key: formatLabel(
          parentKey || 'Value'
        ),
        value: isDateValue(data)
          ? formatDateTime(
            data
          )
          : String(data),
      },
    ]
  }

  const getExpandableData = (
    item: any
  ) => {
    if (!expandableDataKey) {
      return item
    }

    let keys: string[] = []

    if (
      typeof expandableDataKey ===
      'string'
    ) {
      const trimmed =
        expandableDataKey.trim()

      if (
        trimmed.startsWith('[')
      ) {
        try {
          const parsed =
            JSON.parse(trimmed)

          if (
            Array.isArray(parsed)
          ) {
            keys = parsed.map(
              String
            )
          }
        } catch {
          keys = trimmed
            .split(',')
            .map((k) =>
              k.trim()
            )
        }
      } else {
        keys = trimmed
          .split(',')
          .map((k) =>
            k.trim()
          )
      }
    }

    if (!keys.length) {
      return item
    }

    const combined: Record<
      string,
      any
    > = {}

    keys.forEach((key) => {
      combined[key] =
        item?.[key]
    })

    return combined
  }

  const renderExpandableContent = (
    details: any
  ) => {
    const normalized =
      normalizeExpandableData(details)

    if (!normalized.length) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          {emptyStateMessage ||
            'No data found'}
        </div>
      )
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {normalized.map(
          (item, index) => (
            <div
              key={index}
              style={{
                border:
                  '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                background: '#fff',
                boxShadow:
                  '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 8,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.04em',
                  wordBreak:
                    'break-word',
                }}
              >
                {item.key}
              </div>

              <div
                style={{
                  fontSize:
                    safeBodyFontSize,
                  color: '#111827',
                  lineHeight: 1.6,
                  wordBreak:
                    'break-word',
                  whiteSpace:
                    'pre-wrap',
                  fontFamily:
                    item.value?.startsWith(
                      '{'
                    ) ||
                      item.value?.startsWith(
                        '['
                      )
                      ? 'monospace'
                      : 'inherit',
                }}
              >
                {item.value}
              </div>
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        fontFamily: safeFontFamily,
      }}
    >
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* <div
          style={{
            padding: 16,
            borderBottom:
              '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Visible Columns
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {allColumns.map((column) => {
              const isSelected =
                !visibleColumns?.length ||
                visibleColumns.includes(
                  column
                )

              return (
                <button
                  key={column}
                  onClick={() => {
                    if (
                      !visibleColumns?.length
                    ) {
                      setVisibleColumns(
                        allColumns.filter(
                          (c) =>
                            c !== column
                        )
                      )

                      return
                    }

                    if (isSelected) {
                      const updated =
                        visibleColumns.filter(
                          (c) =>
                            c !== column
                        )

                      setVisibleColumns(
                        updated
                      )
                    } else {
                      setVisibleColumns([
                        ...visibleColumns,
                        column,
                      ])
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: `1px solid ${isSelected
                      ? safeAccentColor
                      : '#d1d5db'
                      }`,
                    background:
                      isSelected
                        ? `${safeAccentColor}15`
                        : '#fff',
                    color: isSelected
                      ? safeAccentColor
                      : '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition:
                      '0.15s ease',
                    fontWeight: 500,
                  }}
                >
                  {column
                    .replace(
                      /_/g,
                      ' '
                    )
                    .replace(
                      /\b\w/g,
                      (c) =>
                        c.toUpperCase()
                    )}
                </button>
              )
            })}
          </div>
        </div> */}
        {showSearchBar && (
          <div
            style={{
              padding: 16,
              borderBottom:
                '1px solid #e5e7eb',
              background: '#fff',
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              style={{
                width: 280,
                height: 38,
                padding: '0 14px',
                border:
                  '1px solid #d1d5db',
                borderRadius: 8,
                outline: 'none',
                fontSize: 14,
              }}
            />
          </div>
        )}

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse',
              tableLayout:
                columnWidthMode ===
                  'manual'
                  ? 'fixed'
                  : 'auto',
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    safeHeaderColor,
                }}
              >
                <th
                  style={{
                    width: 50,
                    padding: 12,
                    color:
                      safeHeaderTextColor,
                    borderBottom:
                      '1px solid #d1d5db',
                  }}
                />

                {tableHeaders.map(
                  (key) => (
                    <th
                      key={key}
                      draggable
                      onDragStart={() => {
                        setDraggedColumn(key)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={() => {
                        if (
                          !draggedColumn ||
                          draggedColumn === key
                        ) {
                          return
                        }

                        const updated = [
                          ...columnOrder,
                        ]

                        const fromIndex =
                          updated.indexOf(
                            draggedColumn
                          )

                        const toIndex =
                          updated.indexOf(key)

                        updated.splice(
                          fromIndex,
                          1
                        )

                        updated.splice(
                          toIndex,
                          0,
                          draggedColumn
                        )

                        setColumnOrder(updated)
                      }}
                      onClick={() =>
                        handleSort(
                          key
                        )
                      }
                      style={{
                        padding:
                          '14px 16px',
                        textAlign:
                          'left',
                        cursor:
                          'pointer',
                        fontWeight: 600,
                        fontSize:
                          safeHeaderFontSize,
                        resize:
                          columnWidthMode ===
                            'manual'
                            ? 'horizontal'
                            : 'none',
                        overflow:
                          'auto',
                        minWidth: 160,
                        color:
                          safeHeaderTextColor,
                        borderBottom:
                          '1px solid #d1d5db',
                        whiteSpace:
                          'nowrap',
                        userSelect:
                          'none',
                        opacity:
                          draggedColumn === key
                            ? 0.5
                            : 1,
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 6,
                          cursor: 'grab',
                        }}
                      >
                        {key
                          .replace(
                            /_/g,
                            ' '
                          )
                          .replace(
                            /\b\w/g,
                            (
                              c
                            ) =>
                              c.toUpperCase()
                          )}

                        {sortConfig?.key ===
                          key &&
                          (sortConfig.direction ===
                            'asc'
                            ? '↑'
                            : sortConfig.direction ===
                              'desc'
                              ? '↓'
                              : '')}
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {!paginatedData.length ? (
                <tr>
                  <td
                    colSpan={
                      tableHeaders.length +
                      1
                    }
                    style={{
                      padding: 40,
                      textAlign:
                        'center',
                      color:
                        '#6b7280',
                      fontSize: 15,
                    }}
                  >
                    {emptyStateMessage ||
                      'No rows found'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(
                  (
                    item,
                    index
                  ) => {
                    const rowId =
                      item?.id ??
                      index

                    const isExpanded =
                      expandedRow ===
                      rowId

                    const expandableData =
                      getExpandableData(item)

                    return (
                      <React.Fragment
                        key={
                          rowId
                        }
                      >
                        <tr
                          onClick={() => {
                            setSelectedRow(
                              rowId
                            )

                            setSelectedRowData(
                              {
                                ...item,
                                __selectedRowId:
                                  rowId,
                              }
                            )
                          }}
                          style={{
                            background:
                              selectedRow ===
                                rowId
                                ? `${safeAccentColor}15`
                                : index %
                                  2 ===
                                  0
                                  ? safeRowBackground
                                  : safeAlternateRowBackground,
                            borderBottom:
                              '1px solid #e5e7eb',
                            height:
                              rowHeightValue,
                            cursor:
                              'pointer',
                            transition:
                              '0.15s ease',
                          }}
                        >
                          <td
                            style={{
                              padding: 12,
                              color:
                                '#111827',
                              verticalAlign:
                                'top',
                            }}
                            onClick={(
                              e
                            ) => {
                              e.stopPropagation()

                              toggleRow(
                                rowId
                              )
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown
                                size={
                                  16
                                }
                              />
                            ) : (
                              <ChevronRight
                                size={
                                  16
                                }
                              />
                            )}
                          </td>

                          {tableHeaders.map(
                            (
                              key
                            ) => {
                              const value =
                                item[
                                key
                                ]

                              const renderCellValue =
                                () => {
                                  if (
                                    value ===
                                    null ||
                                    value ===
                                    undefined ||
                                    value ===
                                    ''
                                  ) {
                                    return '—'
                                  }

                                  if (
                                    typeof value ===
                                    'boolean'
                                  ) {
                                    return value
                                      ? 'Yes'
                                      : 'No'
                                  }

                                  if (
                                    typeof value ===
                                    'number'
                                  ) {
                                    return value.toLocaleString()
                                  }

                                  if (
                                    Array.isArray(
                                      value
                                    )
                                  ) {
                                    return (
                                      <div
                                        style={{
                                          display:
                                            'flex',
                                          flexWrap:
                                            'wrap',
                                          gap: 6,
                                        }}
                                      >
                                        {value.map(
                                          (
                                            v,
                                            i
                                          ) => (
                                            <span
                                              key={
                                                i
                                              }
                                              style={{
                                                background:
                                                  '#eef2ff',
                                                color:
                                                  '#3730a3',
                                                padding:
                                                  '4px 8px',
                                                borderRadius: 999,
                                                fontSize:
                                                  safeBodyFontSize -
                                                  1,
                                                fontWeight: 500,
                                              }}
                                            >
                                              {typeof v ===
                                                'object'
                                                ? JSON.stringify(
                                                  v
                                                )
                                                : String(
                                                  v
                                                )}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    )
                                  }
                                  if (
                                    isDateValue(value)
                                  ) {
                                    return formatDateTime(
                                      value
                                    )
                                  }
                                  if (
                                    typeof value ===
                                    'object' &&
                                    value !==
                                    null
                                  ) {
                                    return (
                                      <div
                                        style={{
                                          background:
                                            '#f9fafb',
                                          padding: 8,
                                          borderRadius: 6,
                                          fontSize:
                                            safeBodyFontSize -
                                            1,
                                          maxHeight: 120,
                                          overflow:
                                            'auto',
                                          fontFamily:
                                            'monospace',
                                        }}
                                      >
                                        <pre
                                          style={{
                                            margin: 0,
                                            whiteSpace:
                                              'pre-wrap',
                                            wordBreak:
                                              'break-word',
                                          }}
                                        >
                                          {JSON.stringify(
                                            value,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )
                                  }

                                  if (
                                    typeof value ===
                                    'string' &&
                                    /^(https?:\/\/)/i.test(
                                      value
                                    )
                                  ) {
                                    return (
                                      <a
                                        href={
                                          value
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color:
                                            '#2563eb',
                                          textDecoration:
                                            'none',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {
                                          value
                                        }
                                      </a>
                                    )
                                  }

                                  if (
                                    typeof value ===
                                    'string' &&
                                    value.length >
                                    120
                                  ) {
                                    return (
                                      <div
                                        style={{
                                          maxHeight: 120,
                                          overflow:
                                            'auto',
                                          lineHeight: 1.5,
                                        }}
                                      >
                                        {
                                          value
                                        }
                                      </div>
                                    )
                                  }

                                  return String(
                                    value
                                  )
                                }

                              return (
                                <td
                                  key={
                                    key
                                  }
                                  style={{
                                    padding:
                                      '12px 16px',
                                    fontSize:
                                      safeBodyFontSize,
                                    wordBreak:
                                      'break-word',
                                    whiteSpace:
                                      'pre-wrap',
                                    borderBottom:
                                      '1px solid #f3f4f6',
                                    verticalAlign:
                                      'top',
                                    color:
                                      '#111827',
                                  }}
                                >
                                  {renderCellValue()}
                                </td>
                              )
                            }
                          )}
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={
                                tableHeaders.length +
                                1
                              }
                              style={{
                                padding: 20,
                                background:
                                  '#f9fafb',
                              }}
                            >
                              {renderExpandableContent(
                                expandableData
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            height: 52,
            minHeight: 52,
            borderTop: `1px solid ${safeFooterBorderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            background:
              safeFooterBackgroundColor,
            padding: '0 16px',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 13,
              color:
                safePaginationTextColor,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            Showing{' '}
            {(currentPage - 1) *
              safePageSize +
              1}
            -
            {Math.min(
              currentPage *
              safePageSize,
              filteredSortedData.length
            )}{' '}
            of{' '}
            {
              filteredSortedData.length
            }
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              height: '100%',
            }}
          >
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              disabled={currentPage === 1}
              style={{
                width: 28,
                height: 28,
                border: 'none',
                background:
                  'transparent',
                color:
                  currentPage === 1
                    ? '#c4c4c4'
                    : safePaginationTextColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                cursor:
                  currentPage === 1
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: 26,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ‹
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 32,
              }}
            >
              <div
                style={{
                  minWidth: 30,
                  height: 30,
                  borderRadius: 6,
                  border:
                    '1px solid #d1d5db',
                  background:
                    safePaginationActiveBackground,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                  padding: '0 8px',
                  color:
                    safePaginationTextColor,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {currentPage}
              </div>

              <span
                style={{
                  color:
                    safePaginationTextColor,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                of {totalPages}
              </span>
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    totalPages,
                    p + 1
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
              style={{
                width: 28,
                height: 28,
                border: 'none',
                background:
                  'transparent',
                color:
                  currentPage ===
                    totalPages
                    ? '#c4c4c4'
                    : safePaginationTextColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                cursor:
                  currentPage ===
                    totalPages
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: 26,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ›
            </button>
          </div>

          {showToolbar && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: '100%',
              }}
            >
              <button
                onClick={exportCSV}
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  background:
                    'transparent',
                  color:
                    safePaginationTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Download size={18} />
              </button>

              <button
                onClick={() =>
                  window.location.reload()
                }
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  background:
                    'transparent',
                  color:
                    safePaginationTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}