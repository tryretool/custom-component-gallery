/**
 * Force Graph Custom Component for Retool
 * Interactive D3 force-directed graph with themes, node grouping,
 * zoom controls, and an info/summary panel.
 */

import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback
} from 'react'
import * as d3 from 'd3'
import { Retool } from '@tryretool/custom-component-support'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NodeData {
  id: string
  name: string
  category?: string
  model?: string
  avgLatency?: number
  avgCost?: number
  numCalls?: number
  performanceScore?: number
  [key: string]: unknown
}

interface LinkData {
  source: string
  target: string
  weight?: number
}

interface GraphData {
  nodes: NodeData[]
  links: LinkData[]
  groupKey?: string
}

interface SimNode extends NodeData, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  weight?: number
}

export interface GraphTheme {
  id: string
  name: string
  icon: string
  background: string
  gridStroke: string
  linkStroke: string
  linkOpacity: number
  nodeStroke: string
  labelColor: string
  panelBg: string
  panelBorder: string
  panelText: string
  modelColors: Record<string, string>
  tooltipAccent: string
  tooltipBg: string
  tooltipText: string
}

// ─────────────────────────────────────────────
// Constants & Themes
// ─────────────────────────────────────────────

export const PRESET_THEMES: GraphTheme[] = [
  {
    id: 'arctic',
    name: 'Arctic',
    icon: '🧊',
    background: '#f0f6ff',
    gridStroke: '#dde4ed',
    linkStroke: '#a0b4cc',
    linkOpacity: 0.65,
    nodeStroke: '#ffffff',
    labelColor: '#1e293b',
    panelBg: 'rgba(255,255,255,0.93)',
    panelBorder: '#e2e8f0',
    panelText: '#334155',
    modelColors: { 'GPT-4': '#38bdf8', Claude: '#f472b6', 'GPT-3.5': '#facc15', Whisper: '#4ade80', Sora: '#fb923c' },
    tooltipAccent: '#38bdf8',
    tooltipBg: '#ffffff',
    tooltipText: '#1e293b'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    icon: '🌑',
    background: '#0d1117',
    gridStroke: '#1e2733',
    linkStroke: '#334155',
    linkOpacity: 0.8,
    nodeStroke: '#1e293b',
    labelColor: '#94a3b8',
    panelBg: 'rgba(15,23,42,0.93)',
    panelBorder: '#1e293b',
    panelText: '#94a3b8',
    modelColors: { 'GPT-4': '#38bdf8', Claude: '#e879f9', 'GPT-3.5': '#fbbf24', Whisper: '#34d399', Sora: '#f97316' },
    tooltipAccent: '#e879f9',
    tooltipBg: '#0f172a',
    tooltipText: '#e2e8f0'
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    icon: '🌸',
    background: '#fff1f2',
    gridStroke: '#fce7f3',
    linkStroke: '#fbcfe8',
    linkOpacity: 0.7,
    nodeStroke: '#ffffff',
    labelColor: '#881337',
    panelBg: 'rgba(255,255,255,0.95)',
    panelBorder: '#fce7f3',
    panelText: '#9f1239',
    modelColors: { 'GPT-4': '#f43f5e', Claude: '#ec4899', 'GPT-3.5': '#fb7185', Whisper: '#e879f9', Sora: '#f97316' },
    tooltipAccent: '#f43f5e',
    tooltipBg: '#fff1f2',
    tooltipText: '#881337'
  },
  {
    id: 'slate',
    name: 'Slate Pro',
    icon: '🪨',
    background: '#1e2433',
    gridStroke: '#252d3d',
    linkStroke: '#3b4660',
    linkOpacity: 0.7,
    nodeStroke: '#1e2433',
    labelColor: '#cbd5e1',
    panelBg: 'rgba(22,28,42,0.95)',
    panelBorder: '#2e3952',
    panelText: '#94a3b8',
    modelColors: { 'GPT-4': '#60a5fa', Claude: '#a78bfa', 'GPT-3.5': '#fbbf24', Whisper: '#34d399', Sora: '#f87171' },
    tooltipAccent: '#60a5fa',
    tooltipBg: '#161c2a',
    tooltipText: '#cbd5e1'
  }
]

const DYNAMIC_PALETTE = [
  '#38bdf8', '#f472b6', '#facc15', '#4ade80', '#fb923c',
  '#a78bfa', '#34d399', '#f87171', '#e879f9', '#fbbf24',
  '#60a5fa', '#a3e635', '#fb7185', '#6ee7b7', '#fde68a'
]

const FALLBACK_COLOR = '#94a3b8'
const CUSTOM_THEME_ID = 'custom'
const DEFAULT_THEME_ID = 'arctic'
const LS_THEME_KEY = 'fgc_activeThemeId'
const LS_CUSTOM_KEY = 'fgc_customTheme'
const LS_GROUP_COLORS = 'fgc_groupColors'

// ─────────────────────────────────────────────
// LocalStorage helpers
// ─────────────────────────────────────────────

function saveThemeId(id: string) {
  try { localStorage.setItem(LS_THEME_KEY, id) } catch { /**/ }
}
function loadThemeId(): string {
  try { return localStorage.getItem(LS_THEME_KEY) ?? DEFAULT_THEME_ID } catch { return DEFAULT_THEME_ID }
}
function saveCustomTheme(t: GraphTheme) {
  try { localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(t)) } catch { /**/ }
}
function loadCustomTheme(fb: GraphTheme): GraphTheme {
  try {
    const r = localStorage.getItem(LS_CUSTOM_KEY)
    if (!r) return fb
    const p = JSON.parse(r) as GraphTheme
    return p && typeof p.background === 'string' ? p : fb
  } catch { return fb }
}
function saveGroupColors(m: Record<string, string>) {
  try { localStorage.setItem(LS_GROUP_COLORS, JSON.stringify(m)) } catch { /**/ }
}
function loadGroupColors(): Record<string, string> {
  try {
    const r = localStorage.getItem(LS_GROUP_COLORS)
    return r ? JSON.parse(r) : {}
  } catch { return {} }
}

// ─────────────────────────────────────────────
// Graph data helpers
// ─────────────────────────────────────────────

function detectGroupKey(nodes: NodeData[]): string | null {
  if (!nodes.length) return null
  const candidates = ['model', 'category']
  for (const k of Object.keys(nodes[0])) {
    if (!candidates.includes(k) && !['id', 'name', 'source', 'target'].includes(k))
      candidates.push(k)
  }
  for (const key of candidates) {
    const values = new Set(
      nodes.map((n) => String(n[key] ?? '')).filter((v) => v && v !== 'undefined')
    )
    if (values.size >= 2 && values.size <= 20) return key
  }
  return null
}

function buildGroupColorMap(
  nodes: NodeData[],
  groupKey: string,
  theme: GraphTheme,
  savedColors: Record<string, string>
): Record<string, string> {
  const values = [...new Set(nodes.map((n) => String(n[groupKey] ?? 'Unknown')))]
  const result: Record<string, string> = {}
  let pi = 0
  for (const val of values) {
    if (savedColors[val]) {
      result[val] = savedColors[val]
    } else if (groupKey === 'model' && theme.modelColors[val]) {
      result[val] = theme.modelColors[val]
    } else {
      result[val] = DYNAMIC_PALETTE[pi++ % DYNAMIC_PALETTE.length]
    }
  }
  return result
}

function getNodeColorFromMap(map: Record<string, string>, node: NodeData, gk: string | null): string {
  if (!gk) return FALLBACK_COLOR
  return map[String(node[gk] ?? '')] ?? FALLBACK_COLOR
}

function getNodeRadius(numCalls: unknown): number {
  const n = typeof numCalls === 'number' && isFinite(numCalls) ? numCalls : 0
  return 20 + Math.sqrt(Math.max(0, n)) / 7
}

const INTERNAL_KEYS = new Set([
  'id', 'index', 'x', 'y', 'vx', 'vy', 'fx', 'fy',
  'name', 'model', 'category', 'avgLatency', 'avgCost', 'numCalls', 'performanceScore'
])

function getExtraFields(node: NodeData): Array<[string, unknown]> {
  return Object.entries(node).filter(([k]) => !INTERNAL_KEYS.has(k))
}

// ─────────────────────────────────────────────
// Label formatting
// ─────────────────────────────────────────────

/**
 * Converts raw identifier strings (snake_case, camelCase, UPPER_CASE) into
 * readable Title Case. Used for field/key names.
 *   "property_type" → "Property Type"
 *   "avgLatency"    → "Avg Latency"
 */
function labelFromKey(key: string): string {
  const normalised = key === key.toUpperCase() && /[A-Z]{2,}/.test(key)
    ? key.toLowerCase()
    : key
  return normalised
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim()
}

/**
 * Formats a raw data value string for display. Humanises identifiers
 * while leaving natural-language strings untouched.
 *   "property_type"   → "Property Type"
 *   "agent"           → "Agent"
 *   "AGENT"           → "Agent"
 *   "GPT"             → "GPT"    (≤4-char acronym preserved)
 *   "Lakeview Towers" → "Lakeview Towers"
 */
function formatLabel(value: string): string {
  if (!value || value === '—') return value
  const hasUnderscore = value.includes('_')
  const hasSpace = value.includes(' ')
  const isAllUpper = value === value.toUpperCase() && /[A-Z]/.test(value)
  const isAllLower = value === value.toLowerCase() && /[a-z]/.test(value)
  const isCamel = !hasUnderscore && !hasSpace && /[a-z][A-Z]/.test(value)
  if (isAllUpper && !hasSpace && !hasUnderscore && value.replace(/[^A-Z]/g, '').length <= 4) return value
  if (hasUnderscore || isAllLower || isAllUpper || isCamel) return labelFromKey(value)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return isFinite(v) ? (Number.isInteger(v) ? String(v) : v.toFixed(3)) : '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') return v ? formatLabel(v) : '—'
  if (typeof v === 'object') { try { return JSON.stringify(v) } catch { return '[object]' } }
  return String(v)
}

// ─────────────────────────────────────────────
// Data coercion
// ─────────────────────────────────────────────

function coerceNode(raw: unknown): NodeData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const n = raw as Record<string, unknown>
  const rawId = n['id']
  const id = typeof rawId === 'string' ? rawId : typeof rawId === 'number' ? String(rawId) : null
  if (!id) return null
  return {
    ...n,
    id,
    name: typeof n['name'] === 'string' ? n['name'] : id,
    category: typeof n['category'] === 'string' ? n['category'] : undefined,
    model: typeof n['model'] === 'string' ? n['model'] : undefined,
    avgLatency: typeof n['avgLatency'] === 'number' ? n['avgLatency'] : undefined,
    avgCost: typeof n['avgCost'] === 'number' ? n['avgCost'] : undefined,
    numCalls: typeof n['numCalls'] === 'number' ? n['numCalls'] : undefined,
    performanceScore: typeof n['performanceScore'] === 'number' ? n['performanceScore'] : undefined
  } as NodeData
}

function coerceLink(raw: unknown): LinkData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const l = raw as Record<string, unknown>
  const source = typeof l['source'] === 'string' ? l['source'] : typeof l['source'] === 'number' ? String(l['source']) : null
  const target = typeof l['target'] === 'string' ? l['target'] : typeof l['target'] === 'number' ? String(l['target']) : null
  if (!source || !target) return null
  return { source, target, weight: typeof l['weight'] === 'number' ? l['weight'] : 1 }
}

function parseGraphData(raw: unknown): GraphData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj['nodes']) || !(obj['nodes'] as unknown[]).length) return null
  const nodes = (obj['nodes'] as unknown[]).map(coerceNode).filter(Boolean) as NodeData[]
  if (!nodes.length) return null
  const links = Array.isArray(obj['links'])
    ? (obj['links'] as unknown[]).map(coerceLink).filter(Boolean) as LinkData[]
    : []
  return { nodes, links, groupKey: detectGroupKey(nodes) ?? undefined }
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

const EmptyState: FC<{ theme: GraphTheme }> = ({ theme }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 14,
    fontFamily: "'DM Sans','Segoe UI',sans-serif"
  }}>
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="27" stroke={theme.gridStroke} strokeWidth="2" />
      <circle cx="18" cy="28" r="5" fill={theme.gridStroke} />
      <circle cx="38" cy="20" r="5" fill={theme.gridStroke} />
      <circle cx="38" cy="36" r="5" fill={theme.gridStroke} />
      <line x1="23" y1="28" x2="33" y2="21" stroke={theme.gridStroke} strokeWidth="2" />
      <line x1="23" y1="28" x2="33" y2="35" stroke={theme.gridStroke} strokeWidth="2" />
    </svg>
    <div style={{ fontSize: 14, fontWeight: 600, color: theme.panelText }}>No graph data</div>
    <div style={{ fontSize: 12, color: theme.panelText, opacity: 0.55, maxWidth: 200, textAlign: 'center' }}>
      Provide a <code style={{ opacity: 0.8 }}>graphData</code> object with a{' '}
      <code style={{ opacity: 0.8 }}>nodes</code> array
    </div>
  </div>
)

// ─────────────────────────────────────────────
// InfoPanel
// ─────────────────────────────────────────────

interface InfoPanelProps {
  node: NodeData | null
  theme: GraphTheme
  colorMap: Record<string, string>
  groupKey: string | null
  totalNodes: number
  totalLinks: number
  onClose: () => void
}

const InfoPanel: FC<InfoPanelProps> = ({ node, theme, colorMap, groupKey, totalNodes, totalLinks, onClose }) => {
  const { tooltipAccent: accent, panelBg: bg, panelBorder: border, panelText: text } = theme
  const groupVal = groupKey && node ? String(node[groupKey] ?? '—') : null
  const groupColor = groupKey && node ? (colorMap[String(node[groupKey] ?? '')] ?? FALLBACK_COLOR) : FALLBACK_COLOR
  const extra = node ? getExtraFields(node) : []

  const stat = (label: string, value: string, color?: string) => (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px',
      borderRadius: 8, background: theme.background + 'aa', border: `1px solid ${border}`
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: text, opacity: 0.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color ?? accent }}>{value}</span>
    </div>
  )

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 240,
      background: bg, borderLeft: `1.5px solid ${border}`, borderRadius: '0 10px 0 0',
      display: 'flex', flexDirection: 'column', zIndex: 20,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      backdropFilter: 'blur(12px)', overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 14px 10px', borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: text, opacity: 0.5, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {node ? 'Node Details' : 'Graph Summary'}
        </span>
        {node && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, opacity: 0.5, fontSize: 16, lineHeight: 1, padding: 2 }}
            title="Back to summary"
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {node ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: groupColor,
                flexShrink: 0, boxShadow: `0 0 0 3px ${groupColor}44`
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: text, lineHeight: 1.3 }}>
                  {formatLabel(node.name)}
                </div>
                {groupKey && groupVal && (
                  <div style={{ fontSize: 11, color: groupColor, fontWeight: 600, marginTop: 2 }}>
                    {labelFromKey(groupKey)}: {formatLabel(groupVal)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {node.avgLatency !== undefined && stat('Latency', `${node.avgLatency}ms`, accent)}
              {node.avgCost !== undefined && stat('Cost', `$${Number(node.avgCost).toFixed(3)}`, '#f59e0b')}
              {node.numCalls !== undefined && stat('Calls', Number(node.numCalls).toLocaleString(), '#4ade80')}
              {node.performanceScore !== undefined && stat('Perf', `${node.performanceScore}%`, '#a78bfa')}
            </div>

            {node.category !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: text, opacity: 0.5, fontWeight: 600 }}>CATEGORY</span>
                <span style={{
                  fontSize: 12, color: text, fontWeight: 700,
                  background: accent + '22', border: `1px solid ${accent}55`,
                  borderRadius: 6, padding: '2px 8px'
                }}>
                  {String(node.category)}
                </span>
              </div>
            )}

            {extra.length > 0 && (
              <>
                <div style={{ height: 1, background: border, margin: '10px 0 8px' }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: text, opacity: 0.4, marginBottom: 8 }}>
                  All Fields
                </div>
                {extra.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: text, opacity: 0.6, fontWeight: 500, flexShrink: 0 }}>{labelFromKey(k)}</span>
                    <span style={{ fontSize: 11.5, color: text, fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{formatValue(v)}</span>
                  </div>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {stat('Nodes', String(totalNodes), accent)}
              {stat('Links', String(totalLinks), theme.linkStroke !== theme.background ? theme.linkStroke : accent)}
            </div>
            {groupKey && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: text, opacity: 0.4, marginBottom: 8 }}>
                  {labelFromKey(groupKey)} Groups
                </div>
                {Object.entries(colorMap).map(([val, color]) => (
                  <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 0 2px ${color}44` }} />
                    <span style={{ fontSize: 12.5, color: text, fontWeight: 500, flex: 1 }}>{formatLabel(val)}</span>
                  </div>
                ))}
              </>
            )}
            {!groupKey && (
              <div style={{ fontSize: 12, color: text, opacity: 0.45, textAlign: 'center', marginTop: 20 }}>
                Click a node to see its details
              </div>
            )}
          </>
        )}
      </div>

      {!node && (
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}`, fontSize: 10.5, color: text, opacity: 0.4 }}>
          Click any node to inspect it
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// ThemeBar
// ─────────────────────────────────────────────

interface ThemeBarProps {
  theme: GraphTheme
  customTheme: GraphTheme
  isCustomActive: boolean
  groupKey: string | null
  groupColorMap: Record<string, string>
  onSelectPreset: (t: GraphTheme) => void
  onUpdateCustom: (patch: Partial<GraphTheme>) => void
  onUpdateGroupColor: (val: string, color: string) => void
  onSelectCustom: () => void
  onReset: () => void
}

const ThemeBar: FC<ThemeBarProps> = ({
  theme, customTheme, isCustomActive, groupKey, groupColorMap,
  onSelectPreset, onUpdateCustom, onUpdateGroupColor, onSelectCustom, onReset
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const openPanel = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.top, left: r.left })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      if ((t as HTMLElement)?.tagName === 'INPUT' && (t as HTMLInputElement).type === 'color') return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [open])

  const pill = (active: boolean, accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20,
    border: `1.5px solid ${active ? accent + '88' : theme.panelBorder}`,
    background: active ? accent + '18' : 'transparent', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: active ? accent : theme.panelText,
    whiteSpace: 'nowrap' as const, transition: 'all 0.15s', outline: 'none', flexShrink: 0
  })

  const colorRow = (label: string, value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: theme.panelText, fontWeight: 500 }}>{label}</span>
      <input
        type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 28, height: 20, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 0, background: 'none' }}
      />
    </div>
  )

  const section = (label: string) => (
    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: theme.panelText, opacity: 0.45, margin: '12px 0 5px' }}>
      {label}
    </div>
  )

  return (
    <>
      {open && (
        <div ref={panelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          transform: 'translateY(-100%) translateY(-8px)',
          width: 280, background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}`,
          borderRadius: 16, boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(16px)', zIndex: 99999,
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
          overflow: 'hidden', animation: 'tgIn 0.18s ease'
        }}>
          <style>{`@keyframes tgIn { from { opacity:0; transform:translateY(-100%) translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(-100%) translateY(-8px) scale(1); } }`}</style>
          <div style={{ padding: '13px 14px 10px', borderBottom: `1px solid ${theme.panelBorder}`, background: theme.panelBg }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: theme.panelText }}>Custom Theme</div>
          </div>
          <div style={{ padding: '4px 14px 14px', maxHeight: '60vh', overflowY: 'auto' }}>
            {section('Background & Grid')}
            {colorRow('Background', customTheme.background, (v) => onUpdateCustom({ background: v }))}
            {colorRow('Grid lines', customTheme.gridStroke, (v) => onUpdateCustom({ gridStroke: v }))}
            {section('Links & Labels')}
            {colorRow('Edge colour', customTheme.linkStroke, (v) => onUpdateCustom({ linkStroke: v }))}
            {colorRow('Label colour', customTheme.labelColor, (v) => onUpdateCustom({ labelColor: v }))}
            {colorRow('Node stroke', customTheme.nodeStroke, (v) => onUpdateCustom({ nodeStroke: v }))}
            {groupKey && Object.keys(groupColorMap).length > 0 && (
              <>
                {section(`Node colours · ${labelFromKey(groupKey)}`)}
                {Object.entries(groupColorMap).map(([val, color]) =>
                  colorRow(val, color, (v) => onUpdateGroupColor(val, v))
                )}
              </>
            )}
            {section('Tooltip')}
            {colorRow('Background', customTheme.tooltipBg, (v) => onUpdateCustom({ tooltipBg: v }))}
            {colorRow('Accent/border', customTheme.tooltipAccent, (v) => onUpdateCustom({ tooltipAccent: v }))}
            {colorRow('Text', customTheme.tooltipText, (v) => onUpdateCustom({ tooltipText: v }))}
            <button
              onClick={() => { onSelectCustom(); setOpen(false) }}
              style={{
                marginTop: 14, width: '100%', padding: '8px 0',
                background: customTheme.tooltipAccent + '22',
                border: `1.5px solid ${customTheme.tooltipAccent}66`,
                borderRadius: 9, color: customTheme.tooltipAccent,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans','Segoe UI',sans-serif"
              }}
            >
              {isCustomActive ? '✓ Custom active' : 'Apply Custom Theme'}
            </button>
          </div>
        </div>
      )}

      <div style={{
        height: 44, flexShrink: 0, background: theme.panelBg,
        borderTop: `1.5px solid ${theme.panelBorder}`,
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
        backdropFilter: 'blur(10px)', fontFamily: "'DM Sans','Segoe UI',sans-serif",
        overflowX: 'auto', overflowY: 'visible', boxSizing: 'border-box'
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.panelText, opacity: 0.4, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
          Theme
        </span>
        <div style={{ width: 1, height: 20, background: theme.panelBorder, flexShrink: 0, margin: '0 2px' }} />

        {PRESET_THEMES.map((t) => {
          const active = !isCustomActive && theme.id === t.id
          return (
            <button key={t.id} onClick={() => onSelectPreset(t)} style={pill(active, t.tooltipAccent)} title={t.name}>
              <span style={{ display: 'flex', gap: 2 }}>
                {Object.values(t.modelColors).slice(0, 3).map((c, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                ))}
              </span>
              {t.icon} {t.name}
            </button>
          )
        })}

        <div style={{ width: 1, height: 20, background: theme.panelBorder, flexShrink: 0, margin: '0 2px' }} />
        <button ref={btnRef} onClick={() => (open ? setOpen(false) : openPanel())} style={pill(isCustomActive || open, customTheme.tooltipAccent)}>
          ✏️ Custom
        </button>
        <div style={{ width: 1, height: 20, background: theme.panelBorder, flexShrink: 0, margin: '0 2px' }} />
        <button onClick={onReset} style={pill(false, '#f87171')} title="Reset to default theme">
          ↺ Reset
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export const ForceGraphComponent: FC = () => {
  const [rawGraphData] = Retool.useStateObject({
    name: 'graphData',
    initialValue: { nodes: [], links: [] }
  })
  Retool.useComponentSettings({ defaultWidth: 12, defaultHeight: 65 })

  // Retool.useStateObject returns a new object reference on every render,
  // even when data hasn't changed. Serialising to JSON and comparing content
  // ensures the D3 simulation only rebuilds when data actually changes.
  const stableGraphDataRef = useRef<unknown>({ nodes: [], links: [] })
  const stableSerialRef = useRef<string>('')
  const [graphDataVersion, setGraphDataVersion] = useState(0)

  useEffect(() => {
    let serial: string
    try { serial = JSON.stringify(rawGraphData) } catch { return }
    if (serial !== stableSerialRef.current) {
      stableSerialRef.current = serial
      stableGraphDataRef.current = rawGraphData
      setGraphDataVersion((v) => v + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGraphData])

  // ── Theme ─────────────────────────────────────────────────────────────────

  const [activePreset, setActivePreset] = useState<GraphTheme>(() => {
    const id = loadThemeId()
    return PRESET_THEMES.find((t) => t.id === id) ?? PRESET_THEMES[0]
  })
  const [defaultTheme, setDefaultTheme] = useState<GraphTheme>(
    () => PRESET_THEMES.find((t) => t.id === loadThemeId()) ?? PRESET_THEMES[0]
  )
  const [isCustomActive, setIsCustomActive] = useState(() => {
    const id = loadThemeId()
    if (id === CUSTOM_THEME_ID) return true
    if (!PRESET_THEMES.find((t) => t.id === id)) { saveThemeId(DEFAULT_THEME_ID); return false }
    return false
  })
  const [customTheme, setCustomTheme] = useState<GraphTheme>(() => {
    const fb = { ...PRESET_THEMES[0], id: CUSTOM_THEME_ID, name: 'Custom', icon: '✏️' }
    return loadCustomTheme(fb)
  })

  const theme: GraphTheme = isCustomActive ? customTheme : activePreset
  const themeRef = useRef<GraphTheme>(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  // ── Graph data & color map ────────────────────────────────────────────────

  const [savedGroupColors, setSavedGroupColors] = useState<Record<string, string>>(loadGroupColors)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graphData = useMemo(() => parseGraphData(stableGraphDataRef.current), [graphDataVersion])
  const groupKey = graphData?.groupKey ?? null

  const groupColorMap = useMemo(() => {
    if (!graphData || !groupKey) return {}
    return buildGroupColorMap(graphData.nodes, groupKey, theme, savedGroupColors)
  }, [graphData, groupKey, theme, savedGroupColors])

  const groupColorMapRef = useRef<Record<string, string>>(groupColorMap)
  const groupKeyRef = useRef<string | null>(groupKey)
  useEffect(() => { groupKeyRef.current = groupKey }, [groupKey])

  // ── D3 refs ───────────────────────────────────────────────────────────────

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)
  const dimsRef = useRef({ width: 0, height: 0 })
  const rafRef = useRef<number>(0)

  // ── UI state ──────────────────────────────────────────────────────────────

  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; node: NodeData | null }>(
    { visible: false, x: 0, y: 0, node: null }
  )
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)

  // ── Theme painter ─────────────────────────────────────────────────────────

  const applyThemeToSvg = useCallback(() => {
    if (!svgRef.current) return
    const t = themeRef.current
    const map = groupColorMapRef.current
    const gk = groupKeyRef.current
    const svgEl = d3.select(svgRef.current)
    svgEl.select('.bg-rect').attr('fill', t.background)
    svgEl.select('.grid-path').attr('stroke', t.gridStroke)
    svgEl.select('.arrow-path').attr('fill', t.linkStroke)
    svgEl.selectAll<SVGLineElement, SimLink>('.link-line')
      .attr('stroke', t.linkStroke)
      .attr('stroke-opacity', t.linkOpacity)
    svgEl.selectAll<SVGGElement, SimNode>('.node-g').each(function (d: SimNode) {
      const g = d3.select(this)
      const color = getNodeColorFromMap(map, d, gk)
      g.select('.node-circle').attr('fill', color).attr('stroke', t.nodeStroke)
      g.select('.node-label').style('fill', t.labelColor)
    })
  }, [])

  useEffect(() => {
    groupColorMapRef.current = groupColorMap
    if (simulationRef.current) applyThemeToSvg()
  }, [groupColorMap, applyThemeToSvg])

  useEffect(() => {
    if (simulationRef.current) applyThemeToSvg()
  }, [theme, applyThemeToSvg])

  // ── Theme handlers ────────────────────────────────────────────────────────

  const handleSelectPreset = useCallback((t: GraphTheme) => {
    setActivePreset(t)
    setDefaultTheme(t)
    setIsCustomActive(false)
    setCustomTheme({ ...t, id: CUSTOM_THEME_ID, name: 'Custom', icon: '✏️' })
    saveThemeId(t.id)
  }, [])

  const handleUpdateCustom = useCallback((patch: Partial<GraphTheme>) => {
    setCustomTheme((prev) => {
      const next = { ...prev, ...patch }
      saveCustomTheme(next)
      return next
    })
  }, [])

  const handleSelectCustom = useCallback(() => {
    setIsCustomActive(true)
    saveThemeId(CUSTOM_THEME_ID)
    setCustomTheme((prev) => { saveCustomTheme(prev); return prev })
  }, [])

  const handleResetTheme = useCallback(() => {
    const reset = { ...defaultTheme, id: CUSTOM_THEME_ID, name: 'Custom', icon: '✏️' }
    setActivePreset(defaultTheme)
    setIsCustomActive(false)
    setCustomTheme(reset)
    setSavedGroupColors({})
    saveThemeId(defaultTheme.id)
    saveGroupColors({})
    saveCustomTheme(reset)
  }, [defaultTheme])

  const handleUpdateGroupColor = useCallback((val: string, color: string) => {
    setSavedGroupColors((prev) => {
      const next = { ...prev, [val]: color }
      saveGroupColors(next)
      return next
    })
    setIsCustomActive((wasActive) => {
      if (!wasActive) saveThemeId(CUSTOM_THEME_ID)
      return true
    })
  }, [])

  // ── ResizeObserver ────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width >= 10 && rect.height >= 44) {
      dimsRef.current = { width: rect.width, height: rect.height }
      setDimensions({ width: rect.width, height: rect.height })
    }
    const ro = new ResizeObserver((entries) => {
      // Skip while hidden — browsers flush batched callbacks on tab-focus,
      // which would spuriously trigger resize events.
      if (document.hidden) return
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect
          // Only track width. In auto-height mode, reading height here creates
          // a feedback loop: SVG grows → observer fires → SVG grows again.
          if (width < 10) continue
          const prev = dimsRef.current
          if (Math.abs(width - prev.width) >= 4) {
            dimsRef.current = { ...dimsRef.current, width }
            setDimensions((d) => ({ ...d, width }))
          }
        }
      })
    })
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current) }
  }, [])

  // ── SVG resize sync ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height) return
    const svgEl = d3.select(svgRef.current)
    svgEl.attr('width', dimensions.width).attr('height', dimensions.height)
    svgEl.selectAll('.bg-rect,.bg-grid-rect').attr('width', dimensions.width).attr('height', dimensions.height)
    simulationRef.current
      ?.force('center', d3.forceCenter<SimNode>(dimensions.width / 2, dimensions.height / 2))
      .alpha(0.2).restart()
  }, [dimensions])

  // ── Zoom controls ─────────────────────────────────────────────────────────

  const handleZoom = useCallback((dir: 'in' | 'out') => {
    if (!svgRef.current || !zoomRef.current) return
    const t = d3.zoomTransform(svgRef.current)
    const k = Math.max(0.3, Math.min(t.k * (dir === 'in' ? 1.25 : 0.8), 3))
    const cx = dimsRef.current.width / 2, cy = dimsRef.current.height / 2
    d3.select(svgRef.current)
      .transition().duration(220).ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, d3.zoomIdentity
        .translate(cx - (cx - t.x) * (k / t.k), cy - (cy - t.y) * (k / t.k))
        .scale(k))
  }, [])

  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition().duration(380).ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }, [])

  // ── D3 simulation ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!svgRef.current || !graphData) return

    let width = dimsRef.current.width
    let height = dimsRef.current.height
    if ((width < 10 || height < 10) && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      width = r.width || 800
      height = r.height || 500
      dimsRef.current = { width, height }
    }
    if (width < 10 || height < 10) { width = 800; height = 500 }

    setIsLoading(true)
    setSelectedNode(null)

    const nodes: SimNode[] = graphData.nodes.map((n) => ({ ...n }))
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const links: SimLink[] = graphData.links
      .map((l) => ({
        source: nodeById.get(l.source) ?? l.source,
        target: nodeById.get(l.target) ?? l.target,
        weight: l.weight ?? 1
      }))
      .filter((l) => l.source != null && l.target != null)

    const svgEl = d3.select(svgRef.current)
    svgEl.selectAll('*').remove()
    svgEl.attr('width', width).attr('height', height)

    const defs = svgEl.append('defs')
    defs.append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -4 8 8')
      .attr('refX', 8).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('class', 'arrow-path')

    defs.append('filter').attr('id', 'node-shadow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%')
      .append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 5).attr('flood-color', '#00000033')

    defs.append('pattern').attr('id', 'grid').attr('width', 40).attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path').attr('d', 'M 40 0 L 0 0 0 40').attr('fill', 'none').attr('class', 'grid-path').attr('stroke-width', 0.7)

    svgEl.append('rect').attr('width', width).attr('height', height).attr('class', 'bg-rect')
    svgEl.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#grid)').attr('class', 'bg-grid-rect')

    const root = svgEl.append('g').attr('class', 'graph-root')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        root.attr('transform', String(event.transform))
      })
    zoomRef.current = zoom
    svgEl.call(zoom)

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(140).strength(0.7))
      .force('charge', d3.forceManyBody<SimNode>().strength(-480))
      .force('center', d3.forceCenter<SimNode>(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d.numCalls) + 10))
      .alphaDecay(0.04)

    simulationRef.current = simulation

    const linkSel = root.append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links).enter().append('line')
      .attr('class', 'link-line')
      .attr('stroke-width', (d) => (d.weight ?? 1) * 1.8)
      .attr('marker-end', 'url(#arrow)')

    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (e, d) => {
        if (!e.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => {
        if (!e.active) simulation.alphaTarget(0)
        d.fx = null; d.fy = null
      })

    const nodeSel = root.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes).enter().append('g')
      .attr('class', 'node-g')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', (d: SimNode) => formatLabel(d.name))
      .call(drag)

    nodeSel.append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d: SimNode) => getNodeRadius(d.numCalls))
      .attr('stroke-width', 3)
      .attr('filter', 'url(#node-shadow)')
      .style('cursor', 'pointer')

    nodeSel.append('text')
      .attr('class', 'node-label')
      .attr('dx', (d: SimNode) => getNodeRadius(d.numCalls) + 8)
      .attr('dy', '0.35em')
      .text((d: SimNode) => formatLabel(d.name))
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .style('font-family', "'DM Sans','Segoe UI',sans-serif")

    nodeSel.selectAll<SVGCircleElement, SimNode>('.node-circle')
      .on('mouseenter', function (this: SVGCircleElement, _e: MouseEvent, d: SimNode) {
        const fill = this.getAttribute('fill') ?? FALLBACK_COLOR
        d3.select<SVGCircleElement, SimNode>(this)
          .transition().duration(130)
          .attr('r', getNodeRadius(d.numCalls) + 5)
          .attr('stroke', fill).attr('stroke-width', 4)
      })
      .on('mouseleave', function (this: SVGCircleElement, _e: MouseEvent, d: SimNode) {
        d3.select<SVGCircleElement, SimNode>(this)
          .transition().duration(130)
          .attr('r', getNodeRadius(d.numCalls))
          .attr('stroke', themeRef.current.nodeStroke).attr('stroke-width', 3)
      })
      .on('mousemove', (e: MouseEvent, d: SimNode) => {
        setTooltip({ visible: true, x: e.clientX + 14, y: e.clientY - 10, node: d })
      })
      .on('mouseout', () => setTooltip((p) => ({ ...p, visible: false })))
      .on('click', (_e: MouseEvent, d: SimNode) =>
        setSelectedNode((prev) => (prev?.id === d.id ? null : d))
      )

    simulation.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => {
          const s = d.source as SimNode, t2 = d.target as SimNode
          const dx = (t2.x ?? 0) - (s.x ?? 0), dy = (t2.y ?? 0) - (s.y ?? 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          return (t2.x ?? 0) - (dx / dist) * (getNodeRadius(t2.numCalls) + 6)
        })
        .attr('y2', (d) => {
          const s = d.source as SimNode, t2 = d.target as SimNode
          const dx = (t2.x ?? 0) - (s.x ?? 0), dy = (t2.y ?? 0) - (s.y ?? 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          return (t2.y ?? 0) - (dy / dist) * (getNodeRadius(t2.numCalls) + 6)
        })
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    // `settled` ensures onEnd fires exactly once regardless of which path reaches
    // it first (simulation 'end' event vs. fallback timer). The visibilitychange
    // listener stops/restarts the simulation on tab hide/show to prevent rAF
    // burst callbacks from causing re-renders after tab refocus.
    let settled = false

    const onEnd = () => {
      if (settled) return
      settled = true
      simulation.stop()
      applyThemeToSvg()
      setIsLoading(false)
    }

    const onVisibilityChange = () => {
      if (document.hidden) simulation.stop()
      else if (!settled) simulation.restart()
    }

    simulation.on('end', onEnd)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const fallbackTimer = setTimeout(onEnd, 5000)
    applyThemeToSvg()

    return () => {
      settled = true
      simulation.stop()
      simulationRef.current = null
      clearTimeout(fallbackTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [graphData, applyThemeToSvg])

  // ── Render ────────────────────────────────────────────────────────────────

  const ctrlBtn = (active = false): React.CSSProperties => ({
    width: 40, height: 40,
    background: active ? theme.tooltipAccent + '22' : theme.panelBg,
    border: `1.5px solid ${active ? theme.tooltipAccent + '88' : theme.panelBorder}`,
    borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: active ? theme.tooltipAccent : theme.panelText,
    backdropFilter: 'blur(8px)', outline: 'none'
  })

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Force graph"
      style={{
        width: '100%', height: '100%', minHeight: 320,
        background: theme.background, position: 'relative',
        borderRadius: 12, border: `1.5px solid ${theme.panelBorder}`,
        overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif",
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '10px 10px 0 0', display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {graphData
            ? <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true" />
            : <EmptyState theme={theme} />
          }

          {isLoading && graphData && (
            <div aria-live="polite" style={{
              position: 'absolute', inset: 0, background: theme.background + 'cc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, backdropFilter: 'blur(2px)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
                <svg width="34" height="34" viewBox="0 0 36 36" style={{ animation: 'spin 1s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="18" cy="18" r="14" fill="none" stroke={theme.gridStroke} strokeWidth="3" />
                  <path d="M18 4 A14 14 0 0 1 32 18" fill="none" stroke={theme.tooltipAccent} strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 12.5, color: theme.panelText, fontWeight: 500 }}>Rendering…</span>
              </div>
            </div>
          )}

          {graphData && (
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 7, zIndex: 10 }}>
              <button aria-label="Zoom in" onClick={() => handleZoom('in')} style={ctrlBtn()}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="16.7" y1="16.7" x2="21" y2="21" />
                </svg>
              </button>
              <button aria-label="Zoom out" onClick={() => handleZoom('out')} style={ctrlBtn()}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="16.7" y1="16.7" x2="21" y2="21" />
                </svg>
              </button>
              <button aria-label="Reset zoom" onClick={handleReset} style={ctrlBtn()}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {graphData && (
          <InfoPanel
            node={selectedNode}
            theme={theme}
            colorMap={groupColorMap}
            groupKey={groupKey}
            totalNodes={graphData.nodes.length}
            totalLinks={graphData.links.length}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {graphData && (
        <ThemeBar
          theme={theme}
          customTheme={customTheme}
          isCustomActive={isCustomActive}
          groupKey={groupKey}
          groupColorMap={groupColorMap}
          onSelectPreset={handleSelectPreset}
          onUpdateCustom={handleUpdateCustom}
          onUpdateGroupColor={handleUpdateGroupColor}
          onSelectCustom={handleSelectCustom}
          onReset={handleResetTheme}
        />
      )}

      {tooltip.visible && tooltip.node && (
        <div role="tooltip" style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y,
          background: theme.tooltipBg,
          border: `2px solid ${getNodeColorFromMap(groupColorMap, tooltip.node, groupKey)}`,
          borderRadius: 12, padding: '10px 14px', pointerEvents: 'none',
          zIndex: 99999, boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          minWidth: 140, maxWidth: 260,
          fontFamily: "'DM Sans','Segoe UI',sans-serif", fontSize: 12
        }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: getNodeColorFromMap(groupColorMap, tooltip.node, groupKey), marginBottom: 4 }}>
            {formatLabel(tooltip.node.name)}
          </div>
          {groupKey && (
            <div style={{ color: theme.tooltipText, opacity: 0.65, fontSize: 11.5 }}>
              {labelFromKey(groupKey)}: <strong>{formatLabel(String(tooltip.node[groupKey] ?? '—'))}</strong>
            </div>
          )}
          <div style={{ color: theme.tooltipText, opacity: 0.45, fontSize: 11, marginTop: 3 }}>
            Click to inspect →
          </div>
        </div>
      )}
    </div>
  )
}

export default ForceGraphComponent