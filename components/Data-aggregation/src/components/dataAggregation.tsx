import React, { type FC, useMemo, useState, useRef, useEffect } from 'react'
import { Retool } from '@tryretool/custom-component-support'

type AggItem = {
  type: string
  field?: string
}

export const dataAggregation: FC = () => {
  const [dataRaw] = Retool.useStateArray({ name: 'data' })
  const data = (dataRaw || []) as any[]

  const [groupBy, setGroupBy] = Retool.useStateArray({ name: 'groupBy' })
  const [aggregations, setAggregations] = Retool.useStateArray({ name: 'aggregations' })
  const [_result, setResult] = Retool.useStateArray({ name: 'result' })

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedValues = Array.isArray(groupBy)
    ? (groupBy.filter((item): item is string => typeof item === 'string') as string[])
    : []
  const aggList: AggItem[] = Array.isArray(aggregations)
    ? (aggregations.filter((item): item is AggItem => item !== null && typeof item === 'object') as AggItem[])
    : []
  const [hoverAdd, setHoverAdd] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])


  const { stringCols, numberCols } = useMemo(() => {
    const stringSet = new Set<string>()
    const numberSet = new Set<string>()

    data.slice(0, 50).forEach(row => {
      Object.entries(row || {}).forEach(([key, val]) => {
        if (val === null || val === undefined) return
        if (!isNaN(Number(val))) numberSet.add(key)
        else stringSet.add(key)
      })
    })

    return {
      stringCols: Array.from(stringSet),
      numberCols: Array.from(numberSet)
    }
  }, [data])


  const formatLabel = (text: string) => {
    if (!text) return ''
    return text
      .toString()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
  }


  const addAggregation = () => {
    setAggregations([...(aggList || []), { type: '', field: '' }])
  }

  const updateAggregation = (index: number, key: string, value: string) => {
    const updated = [...aggList]

    const newItem = {
      ...updated[index],
      [key]: value,
      ...(key === 'type' && value === 'count' ? { field: '' } : {})
    }


    const isDuplicate = updated.some((item, i) => {
      if (i === index) return false

      return (
        item.type === (newItem.type || item.type) &&
        (item.type === 'count' || item.field === newItem.field)
      )
    })

    if (isDuplicate) {
      alert("This aggregation already selected")
      return
    }

    updated[index] = newItem
    setAggregations(updated)
  }

  const removeAggregation = (index: number) => {
    setAggregations(aggList.filter((_, i) => i !== index))
  }


  const isValid =
    selectedValues.length > 0 &&
    aggList.length > 0 &&
    aggList.every(a => a.type && (a.type === 'count' || a.field))


  const runAggregation = () => {
    if (!isValid) return alert("Complete all fields")

    const grouped: Record<string, any> = {}

    data.forEach(row => {
      const key = selectedValues.map(g => row[g] ?? 'Unknown').join(' | ')

      if (!grouped[key]) {
        grouped[key] = { label: key }

        aggList.forEach((_, i) => {
          grouped[key][`sum_${i}`] = 0
          grouped[key][`count_${i}`] = 0
          grouped[key][`valid_${i}`] = 0
        })
      }

      aggList.forEach((agg, i) => {
        if (agg.type === 'count') {
          grouped[key][`count_${i}`]++
        } else {
          const val = Number(row[agg.field!])
          if (!isNaN(val)) {
            grouped[key][`sum_${i}`] += val
            grouped[key][`valid_${i}`]++
          }
        }
      })
    })

    const result = Object.values(grouped).map((group: any) => {
      const row: any = {}

      const keys = group.label.split(' | ')
      selectedValues.forEach((g, i) => {
        row[formatLabel(g as string)] = keys[i]
      })

      aggList.forEach((agg, i) => {
        let output = 0

        if (agg.type === 'count') output = group[`count_${i}`]
        else if (agg.type === 'sum') output = group[`sum_${i}`]
        else if (agg.type === 'avg') {
          const sum = group[`sum_${i}`]
          const valid = group[`valid_${i}`]
          output = valid ? sum / valid : 0
        }

        const label =
          agg.type === 'count'
            ? 'Count'
            : `${formatLabel(agg.type)} ${formatLabel(agg.field!)}`

        row[label] = Number(output.toFixed(2))
      })

      return row
    })

    setResult(result)
  }


  return (
    <div style={container}>
      <h2 style={title}>Smart Aggregation Builder</h2>

      <div style={card}>


        <div style={{ marginBottom: 14, position: "relative" }} ref={dropdownRef}>
          <label style={label}>Group By</label>

          <div style={multiSelectBox} onClick={() => setIsOpen(prev => !prev)}>
            <div style={chipContainer}>
              {selectedValues.map(item => (
                <div key={String(item)} style={chipNew}>
                  {formatLabel(item as string)}
                  <span
                    style={chipCloseNew}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsOpen(prev => !prev)
                      setGroupBy(selectedValues.filter(g => g !== item))
                    }}
                  >
                    ×
                  </span>
                </div>
              ))}

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={selectedValues.length === 0 ? "Select..." : ""}
                style={searchInputNew}
              />
            </div>


            <div style={rightIcons}>
              {selectedValues.length > 0 && (
                <span style={clearBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setGroupBy([])
                    setAggregations([])
                    setResult([])
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}


              <span style={arrowBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(prev => !prev)
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="#000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          {isOpen && (
            <div style={dropdownNew}>
              {stringCols
                .filter(col => col.toLowerCase().includes(search.toLowerCase()))
                .map(col => {
                  const selected = selectedValues.includes(col)

                  return (
                    <div
                      key={col}
                      onClick={() => {
                        if (selected) {
                          setGroupBy(selectedValues.filter(g => g !== col))
                        } else {
                          setGroupBy([...selectedValues, col])
                        }
                      }}
                      style={{
                        ...dropdownItem,
                        background: selected ? "#f1f5f9" : "#fff"
                      }}
                    >
                      {formatLabel(col)}
                    </div>
                  )
                })}
            </div>
          )}
        </div>


        {aggList.map((agg, i) => (
          <div key={i} style={aggCard}>


            <div style={aggIndex}>{i + 1}</div>


            <select
              style={aggSelect}
              value={agg.type}
              onChange={e => updateAggregation(i, 'type', e.target.value)}
            >
              <option value="">Type</option>
              <option value="sum">Sum</option>
              <option value="avg">Avg</option>
              <option value="count">Count</option>
            </select>


            <select
              style={{
                ...aggSelect,
                backgroundColor: agg.type === 'count' ? '#f1f5f9' : '#fff' // ✅ FIX
              }}
              disabled={agg.type === 'count'}
              value={agg.field}
              onChange={e => updateAggregation(i, 'field', e.target.value)}
            >
              <option value="">Field</option>
              {numberCols.map(col => (
                <option key={col} value={col}>
                  {formatLabel(col)}
                </option>
              ))}
            </select>


            <button
              style={deleteIcon}
              onClick={() => removeAggregation(i)}

              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fee2e2"
                e.currentTarget.style.border = "1px solid #fca5a5"
              }}

              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fef2f2"
                e.currentTarget.style.border = "1px solid #fecaca"
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        ))}
        <div style={buttonRow}>

          <button
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              ...addBtn,
              color: hoverAdd ? "#4f46e5" : "#0F1729",
              background: hoverAdd ? "#eef2ff" : "#f9f9fb",
              border: hoverAdd ? "1px solid #c7d2fe" : "1px solid #e5e7eb"
            }}
            onClick={addAggregation}
          >
            + Add Aggregation
          </button>


          <button
            onClick={runAggregation}
            disabled={!isValid}
            style={{
              ...runBtn,
              opacity: !isValid ? 0.5 : 1
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              ▶ Run Aggregation
            </span>
          </button>
        </div>
      </div>


      <div style={card}>


        <div style={resultHeaderWrap}>
          <div style={resultHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={resultIcon}>📊</span>
              <span style={resultTitle}>RESULTS</span>

              {_result.length > 0 && (
                <span style={rowBadge}>{_result.length} rows</span>
              )}
            </div>

            {_result.length > 0 && (
              <button
                style={exportBtn}
                onClick={() => {
                  if (!_result || _result.length === 0) return


                  const headers = Object.keys((_result[0] ?? {}) as Record<string, unknown>)


                  const rows = _result.map(row => {
                    const rowObj = (row ?? {}) as Record<string, unknown>
                    return headers
                      .map(h => `"${String(rowObj[h] ?? "")}"`)
                      .join(",")
                  })


                  const csvContent = [headers.join(","), ...rows].join("\n")


                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)

                  const link = document.createElement("a")
                  link.href = url
                  link.download = "aggregation_result.csv"
                  link.click()

                  URL.revokeObjectURL(url)
                }}
              >
                ⬇ Export CSV
              </button>
            )}
          </div>
        </div>


        <div style={divider} />


        {_result.length === 0 ? (
          <div style={emptyWrapper}>
            <div style={emptyIconBox}>📊</div>
            <h4 style={emptyHeading}>No results yet</h4>
            <p style={emptySubtext}>
              Configure your group fields and aggregations above, then hit{" "}
              <span style={highlight}>Run Aggregation</span>
            </p>
          </div>
        ) : (
          <table style={tableNew}>
            <thead>
              <tr>
                {Object.keys(_result[0] || {}).map(key => (
                  <th key={key} style={thNew}>{formatLabel(key)}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {_result.map((row: any, i: number) => (
                <tr key={i} style={trNew}>
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} style={tdNew}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



const container = { fontFamily: 'Inter', padding: 16, background: '#f8fafc' }
const title = { marginBottom: 12 }

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"

}

const label = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 4,
  display: "block"
}

const input = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid #d1d5db',
  width: '100%'
}


const multiSelectBox = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  minHeight: 25,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 10px",
  marginTop: 6,
  background: "#fff"
}

const chipContainer: any = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
  flex: 1
}

const chipNew = {
  background: "#e5e7eb",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 6
}

const chipCloseNew = { cursor: "pointer" }

const searchInputNew = {
  border: "none",
  outline: "none",
  fontSize: 13,
  minWidth: 80,
  flex: 1
}


const rightIcons = { display: "flex", gap: 8 }

const arrowBtn = {
  width: 27,
  height: 27,
  borderRadius: 4,
  border: "1px solid #d1d5db",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "transform 0.25s ease"
}

const clearBtn = {
  width: 27,
  height: 27,
  borderRadius: 4,
  border: "1px solid #ef4444",
  background: "#ef4444",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer"
}


const dropdownNew = {
  position: "absolute" as const,
  width: "100%",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  marginTop: 6,
  maxHeight: 200,
  overflowY: "auto" as const,
  zIndex: 9999
}

const dropdownItem = {
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: 13
}


const aggRow = { display: 'flex', gap: 10, marginBottom: 10 }

const button = {
  padding: 10,
  background: '#6366f1',
  color: '#fff',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}

const removeBtn = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  width: 57,
  height: 34,
  borderRadius: 6,
  cursor: 'pointer'
}

const table = { width: '100%', borderCollapse: 'collapse' as const }
const th = { padding: 8, background: '#f1f5f9', textAlign: 'left' as const }
const td = { padding: 8, borderTop: '1px solid #e2e8f0' }


const resultHeaderWrap = {
  padding: "6px 20px 19px 20px"
}

const resultHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const resultIcon = {
  fontSize: 13,
  display: "flex",
  alignItems: "center"
}

const resultTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#6a7181",
}

const rowBadge = {
  background: "#eef2ff",
  color: "#4f46e5",
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 20
}

const exportBtn = {
  background: "#fff",
  border: "1px solid #d1d5db",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13
}


const divider = {
  height: 1,
  background: "#e5e7eb",
  width: "100%"
}

const tableNew = {
  width: "100%",
  borderCollapse: "separate" as const,
  borderSpacing: 0
}

const thNew = {
  textAlign: "left" as const,
  padding: "14px 20px",
  fontSize: 12,
  color: "#6366f1",
  textTransform: "uppercase" as const,
  borderBottom: "1px solid #e5e7eb",
  background: "#fafafa"
}

const tdNew = {
  padding: "16px 20px",
  fontSize: 14,
  borderBottom: "1px solid #f1f5f9"
}

const trNew = {
  background: "#fff"
}

const emptyWrapper = {
  textAlign: "center" as const,
  padding: "50px 20px",
  color: "#6b7280"
}

const emptyIconBox = {
  width: 56,
  height: 56,
  borderRadius: 14,
  background: "#eef2ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px auto",
  fontSize: 22
}

const emptyHeading = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 6,
  color: "#111827"
}

const emptySubtext = {
  fontSize: 13,
  color: "#6b7280",
  maxWidth: 340,
  margin: "0 auto",
  lineHeight: 1.5
}

const highlight = {
  fontWeight: 600,
  color: "#111827"
}

const buttonRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14
}

const runBtn = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(90deg, #6a5af9, #8b5cf6)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: 8
}
const addBtn = {
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 14,
  border: "1px solid #e5e7eb",
  background: "#f9f9fb",
  cursor: "pointer",
  fontWeight: 600,
  color: "#0F1729",
  transition: "all 0.2s ease"
}
const aggCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  marginBottom: 10
}

const aggIndex = {
  minWidth: 32,
  height: 32,
  borderRadius: 8,
  background: "#eef2ff",
  color: "#4f46e5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: 13
}

const aggSelect: any = {
  flex: 1,
  padding: "10px 36px 10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
  fontSize: 13,
  cursor: "pointer",

  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",

  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",

  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "14px"
}

const deleteIcon = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease"
}


