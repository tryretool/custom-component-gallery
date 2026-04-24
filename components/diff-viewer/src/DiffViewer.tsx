import React, { type FC, useEffect, useMemo, useState } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { DiffMethod } from 'react-diff-viewer-continued'
import { Retool } from '@tryretool/custom-component-support'
import styles from './DiffViewer.module.css'
import { buildDiffRows, normalizeDisplayValue, type DiffRow, type DiffStatus } from './diffUtils'

type DiffType = 'json' | 'text'
type ViewMode = 'side-by-side' | 'inline'

const statusClassMap: Record<DiffStatus, string> = {
  added: styles.statusAdded,
  removed: styles.statusRemoved,
  changed: styles.statusChanged,
  unchanged: ''
}

const statusRank: Record<DiffStatus, number> = {
  added: 0,
  removed: 1,
  changed: 2,
  unchanged: 3
}

const toTextValue = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw
  }
  if (raw == null) {
    return ''
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw)
  }
  try {
    return JSON.stringify(raw, null, 2)
  } catch (error) {
    return String(raw)
  }
}

const parseJsonPayload = (raw: unknown): { value: unknown; error: string | null } => {
  if (raw == null || raw === '') {
    return { value: {}, error: null }
  }

  if (typeof raw === 'object') {
    return { value: raw, error: null }
  }

  const text = toTextValue(raw)
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return { value: {}, error: null }
  }
  try {
    return { value: JSON.parse(trimmed), error: null }
  } catch (error) {
    return { value: null, error: 'Invalid JSON input. Provide valid JSON in oldData and newData.' }
  }
}

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n')

const tryFormatJsonText = (value: string): string => {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return value
  }

  const looksLikeJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))
  if (!looksLikeJson) {
    return value
  }

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch (error) {
    return value
  }
}

const toDiffText = (raw: unknown): string => tryFormatJsonText(normalizeLineEndings(toTextValue(raw)))

const renderInlineValue = (row: DiffRow): React.ReactNode => (
  <div className={styles.inlineValue}>
    <div>
      <span className={styles.inlineLabel}>Old: </span>
      {normalizeDisplayValue(row.oldValue)}
    </div>
    <div>
      <span className={styles.inlineLabel}>New: </span>
      {normalizeDisplayValue(row.newValue)}
    </div>
  </div>
)

export const DiffViewer: FC = () => {
  Retool.useComponentSettings({ defaultWidth: 8, defaultHeight: 15 })

  const [label] = Retool.useStateString({
    name: 'label',
    label: 'Label',
    description: 'Display label shown in the component header.',
    initialValue: 'DiffViewer'
  })
  const [typeRaw] = Retool.useStateEnumeration({
    name: 'type',
    label: 'Comparison type',
    description: 'Choose JSON or text comparison mode.',
    inspector: 'select',
    enumDefinition: ['json', 'text'],
    enumLabels: { json: 'JSON', text: 'Text' },
    initialValue: 'json'
  })
  const [viewModeRaw] = Retool.useStateEnumeration({
    name: 'viewMode',
    label: 'Layout',
    description: 'Choose side-by-side or inline rendering.',
    inspector: 'select',
    enumDefinition: ['side-by-side', 'inline'],
    enumLabels: { 'side-by-side': 'Side-by-side', inline: 'Inline' },
    initialValue: 'side-by-side'
  })
  const [showOnlyChanges] = Retool.useStateBoolean({
    name: 'showOnlyChanges',
    label: 'Show only changes',
    description: 'Hide unchanged rows.',
    initialValue: false
  })
  const [oldData] = Retool.useStateString({
    name: 'oldData',
    label: 'Old data',
    description: 'JSON for JSON mode, or plain text for text mode.',
    initialValue: '{"name":"Alice","address":{"city":"NYC","zip":"10001"}}'
  })
  const [newData] = Retool.useStateString({
    name: 'newData',
    label: 'New data',
    description: 'JSON for JSON mode, or plain text for text mode.',
    initialValue: '{"name":"Alice","address":{"city":"Boston","zip":"10001"},"status":"active"}'
  })
  const [addedColor] = Retool.useStateString({
    name: 'addedColor',
    label: 'Added color',
    description: 'Highlight color for added values.',
    initialValue: '#dcfce7'
  })
  const [removedColor] = Retool.useStateString({
    name: 'removedColor',
    label: 'Removed color',
    description: 'Highlight color for removed values.',
    initialValue: '#fee2e2'
  })
  const [changedColor] = Retool.useStateString({
    name: 'changedColor',
    label: 'Changed color',
    description: 'Highlight color for changed values.',
    initialValue: '#fef9c3'
  })
  const [headerBackgroundColor] = Retool.useStateString({
    name: 'headerBackgroundColor',
    label: 'Header background',
    description: 'Background color for table headers.',
    initialValue: '#f1f5f9'
  })
  const [panelBackgroundColor] = Retool.useStateString({
    name: 'panelBackgroundColor',
    label: 'Panel background',
    description: 'Main panel background color.',
    initialValue: '#ffffff'
  })
  const [maxRows] = Retool.useStateNumber({
    name: 'maxRows',
    label: 'Max rows',
    description: 'Maximum rows rendered in JSON mode to keep UI responsive.',
    initialValue: 500
  })
  const [lightweightMode] = Retool.useStateBoolean({
    name: 'lightweightMode',
    label: 'Performance mode',
    description: 'Skips value search to improve filtering speed on very large datasets.',
    initialValue: false
  })
  const [, setDiffRows] = Retool.useStateArray({
    name: 'diffRows',
    label: 'Diff rows',
    description: 'Filtered and sorted diff rows currently shown in the table.',
    inspector: 'hidden',
    initialValue: []
  })

  const type: DiffType = typeRaw === 'text' ? 'text' : 'json'
  const viewMode: ViewMode = viewModeRaw === 'inline' ? 'inline' : 'side-by-side'
  const oldTextValue = toDiffText(oldData)
  const newTextValue = toDiffText(newData)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'smart' | 'field' | 'changeType'>('smart')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedField, setSelectedField] = useState<string | null>(null)

  const jsonResult = useMemo(() => {
    if (type !== 'json') {
      return { rows: [] as DiffRow[], error: null as string | null }
    }
    const oldParsed = parseJsonPayload(oldData)
    const newParsed = parseJsonPayload(newData)
    const error = oldParsed.error ?? newParsed.error
    if (error != null) {
      return { rows: [] as DiffRow[], error }
    }

    const rows = buildDiffRows(oldParsed.value, newParsed.value)
    return { rows, error: null as string | null }
  }, [type, oldData, newData])

  const visibleRows = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    const filtered = jsonResult.rows.filter((row) => {
      if (showOnlyChanges && row.status === 'unchanged') {
        return false
      }
      if (normalizedQuery.length === 0) {
        return true
      }
      if (row.field.toLowerCase().includes(normalizedQuery)) {
        return true
      }
      if (lightweightMode) {
        return false
      }
      return (
        normalizeDisplayValue(row.oldValue).toLowerCase().includes(normalizedQuery) ||
        normalizeDisplayValue(row.newValue).toLowerCase().includes(normalizedQuery)
      )
    })

    const direction = sortDirection === 'asc' ? 1 : -1

    return filtered.sort((left, right) => {
      if (sortBy === 'smart') {
        const leftRank = statusRank[left.status]
        const rightRank = statusRank[right.status]
        if (leftRank !== rightRank) {
          return (leftRank - rightRank) * direction
        }
        return left.field.localeCompare(right.field) * direction
      }

      const compareValue =
        sortBy === 'changeType'
          ? statusRank[left.status] - statusRank[right.status]
          : left.field.localeCompare(right.field)
      return compareValue * direction
    })
  }, [jsonResult.rows, searchTerm, showOnlyChanges, sortBy, sortDirection, lightweightMode])

  const safeMaxRows = Number.isFinite(maxRows) ? Math.max(1, Math.floor(maxRows)) : 500
  const displayedRows = useMemo(() => visibleRows.slice(0, safeMaxRows), [visibleRows, safeMaxRows])
  const hasRowLimit = visibleRows.length > displayedRows.length
  const activeModeRows = displayedRows.map((row) => row.field)
  const selectedFieldSafe = selectedField != null && activeModeRows.includes(selectedField) ? selectedField : null

  const summaryStats = useMemo(() => {
    return displayedRows.reduce(
      (stats, row) => {
        stats[row.status] += 1
        return stats
      },
      { added: 0, removed: 0, changed: 0, unchanged: 0 }
    )
  }, [displayedRows])

  const selectedRowDetails = useMemo(() => {
    if (selectedFieldSafe == null) {
      return null
    }
    const row = displayedRows.find((item) => item.field === selectedFieldSafe)
    if (!row) {
      return null
    }
    return {
      field: row.field,
      baseline: 'source-1',
      sources: [
        { id: 'source-1', label: 'Old value', status: 'unchanged', value: normalizeDisplayValue(row.oldValue) },
        { id: 'source-2', label: 'New value', status: row.status, value: normalizeDisplayValue(row.newValue) }
      ]
    }
  }, [selectedFieldSafe, displayedRows])

  useEffect(() => {
    const serializedRows = displayedRows.map((row) => ({
      field: row.field,
      status: row.status,
      oldValue: normalizeDisplayValue(row.oldValue),
      newValue: normalizeDisplayValue(row.newValue)
    }))
    setDiffRows(serializedRows as import('@tryretool/custom-component-support').Retool.SerializableObject[])
  }, [displayedRows, setDiffRows])

  const rootStyle = {
    '--diffviewer-added-bg': addedColor,
    '--diffviewer-removed-bg': removedColor,
    '--diffviewer-changed-bg': changedColor,
    '--diffviewer-table-header-bg': headerBackgroundColor,
    '--diffviewer-panel-bg': panelBackgroundColor
  } as React.CSSProperties

  return (
    <div className={styles.root} style={rootStyle}>
      <div className={styles.panel}>
        <div className={styles.header}>{label.trim().length > 0 ? label : 'DiffViewer'}</div>

        {type === 'json' ? (
          <>
            {jsonResult.error != null ? (
              <div className={styles.error}>{jsonResult.error}</div>
            ) : null}
            {jsonResult.error == null ? (
              <>
                <div className={styles.controls}>
                  <input
                    className={styles.searchInput}
                    aria-label='Search diff fields and values'
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder='Search fields or values...'
                  />
                  <select
                    className={styles.select}
                    aria-label='Sort rows by'
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as 'smart' | 'field' | 'changeType')}
                  >
                    <option value='smart'>Sort: Changes first</option>
                    <option value='field'>Sort: Field</option>
                    <option value='changeType'>Sort: Change type</option>
                  </select>
                  {sortBy !== 'smart' ? (
                    <select
                      className={styles.select}
                      aria-label='Sort direction'
                      value={sortDirection}
                      onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
                    >
                      <option value='asc'>Asc</option>
                      <option value='desc'>Desc</option>
                    </select>
                  ) : null}
                </div>
                <div className={styles.scrollContainer}>
                  {hasRowLimit ? (
                    <div className={styles.summary}>Limited to {safeMaxRows} rows for performance.</div>
                  ) : null}
                  <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>Added: {summaryStats.added}</div>
                    <div className={styles.summaryCard}>Removed: {summaryStats.removed}</div>
                    <div className={styles.summaryCard}>Changed: {summaryStats.changed}</div>
                  </div>
                  {displayedRows.length === 0 ? (
                    <div className={styles.empty}>No rows to display.</div>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Field</th>
                          {viewMode === 'side-by-side' ? (
                            <>
                              <th>Old value</th>
                              <th>New value</th>
                            </>
                          ) : (
                            <th>Diff</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRows.map((row) => {
                          const statusClass = statusClassMap[row.status]
                          return (
                            <tr
                              key={row.field}
                              className={selectedFieldSafe === row.field ? styles.selectedRow : ''}
                              onClick={() => setSelectedField(row.field)}
                            >
                              <td className={`${styles.fieldCell} ${statusClass}`}>{row.field}</td>
                              {viewMode === 'side-by-side' ? (
                                <>
                                  <td className={`${styles.valueCell} ${statusClass}`}>
                                    {normalizeDisplayValue(row.oldValue)}
                                  </td>
                                  <td className={`${styles.valueCell} ${statusClass}`}>
                                    {normalizeDisplayValue(row.newValue)}
                                  </td>
                                </>
                              ) : (
                                <td className={`${styles.valueCell} ${statusClass}`}>{renderInlineValue(row)}</td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                  {selectedRowDetails != null ? (
                    <div className={styles.detailsPanel}>
                      <div className={styles.detailsTitle}>Field details: {selectedRowDetails.field}</div>
                      {selectedRowDetails.sources.map((source) => (
                        <div key={source.id} className={styles.detailsBlock}>
                          <div className={styles.detailsLabel}>
                            {source.label} {source.id === selectedRowDetails.baseline ? '(baseline)' : ''} - {source.status}
                          </div>
                          <pre className={styles.detailsValue}>{source.value}</pre>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className={styles.scrollContainer}>
            <ReactDiffViewer
              oldValue={oldTextValue}
              newValue={newTextValue}
              splitView={viewMode === 'side-by-side'}
              showDiffOnly={showOnlyChanges}
              compareMethod={DiffMethod.WORDS}
              disableWordDiff={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
