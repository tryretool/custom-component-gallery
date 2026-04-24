import React, { useState, useEffect, useCallback, useRef } from 'react'
import { type FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreeNode {
  name: string
  type: 'file' | 'folder'
  alias?: string      // nom d'affichage alternatif (remplace name dans l'arbre)
  url?: string        // lien physique vers le fichier (NAS, Google Drive, Retool Files…)
  children?: TreeNode[]
  [key: string]: unknown
}

interface ColumnDef {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'currency'
  format?: string
  align?: 'left' | 'center' | 'right'
  width?: number
  colors?: Record<string, string>
}

interface FlatNode {
  node: TreeNode
  depth: number
  path: string
  hasChildren: boolean
}

// ─── Tree flattening ──────────────────────────────────────────────────────────

function flattenTree(
  node: TreeNode, depth: number, parentPath: string, collapsed: Set<string>
): FlatNode[] {
  const path = parentPath ? `${parentPath}/${node.name}` : node.name
  const hasChildren = node.type === 'folder' && Boolean(node.children?.length)
  const result: FlatNode[] = [{ node, depth, path, hasChildren }]
  if (hasChildren && !collapsed.has(path))
    for (const child of node.children!) result.push(...flattenTree(child, depth + 1, path, collapsed))
  return result
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
//
// Available icon names for iconConfig:
//   folder | folder-open | file | file-pdf | file-text | file-code |
//   file-image | file-audio | file-video | file-archive | file-data | file-spreadsheet

type IconFC = FC<{ size?: number; color?: string }>

const ChevronRight: FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronDown: FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const FolderIcon: IconFC = ({ size = 16, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={{ display: 'block' }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const FolderOpenIcon: IconFC = ({ size = 16, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={{ display: 'block' }}>
    <path d="M3 9a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3z" />
    <path d="M3 10h18l-1.68 8.39A2 2 0 0 1 17.36 20H6.64a2 2 0 0 1-1.96-1.61z" />
  </svg>
)
const FileIcon: IconFC = ({ size = 16, color = '#6b7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
  </svg>
)
const FilePdfIcon: IconFC = ({ size = 16, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
  </svg>
)
const FileTextIcon: IconFC = ({ size = 16, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
  </svg>
)
const FileCodeIcon: IconFC = ({ size = 16, color = '#8b5cf6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <polyline points="9 13 7 15 9 17" /><polyline points="15 13 17 15 15 17" />
  </svg>
)
const FileImageIcon: IconFC = ({ size = 16, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <circle cx="10" cy="13" r="1.5" fill={color} stroke="none" />
    <polyline points="6 19 10 14 13 16.5 15 14 18 19" />
  </svg>
)
const FileAudioIcon: IconFC = ({ size = 16, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <path d="M7 15.5c1-2.5 2.5-2.5 3.5 0s2.5 2.5 3.5 0" />
  </svg>
)
const FileVideoIcon: IconFC = ({ size = 16, color = '#ec4899' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <polygon points="10 13 10 19 16 16" fill={color} stroke="none" />
  </svg>
)
const FileArchiveIcon: IconFC = ({ size = 16, color = '#78716c' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <line x1="11" y1="12" x2="13" y2="12" /><line x1="11" y1="14" x2="13" y2="14" /><line x1="11" y1="16" x2="13" y2="16" />
  </svg>
)
const FileDataIcon: IconFC = ({ size = 16, color = '#06b6d4' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="16" x2="16" y2="16" /><line x1="12" y1="13" x2="12" y2="19" />
  </svg>
)
const FileSpreadsheetIcon: IconFC = ({ size = 16, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    <line x1="7" y1="13" x2="17" y2="13" /><line x1="7" y1="17" x2="17" y2="17" />
    <line x1="10" y1="12" x2="10" y2="19" /><line x1="14" y1="12" x2="14" y2="19" />
  </svg>
)

type IconName =
  | 'folder' | 'folder-open' | 'file' | 'file-pdf' | 'file-text' | 'file-code'
  | 'file-image' | 'file-audio' | 'file-video' | 'file-archive' | 'file-data' | 'file-spreadsheet'

const ICON_REGISTRY: Record<IconName, IconFC> = {
  'folder': FolderIcon, 'folder-open': FolderOpenIcon,
  'file': FileIcon, 'file-pdf': FilePdfIcon, 'file-text': FileTextIcon,
  'file-code': FileCodeIcon, 'file-image': FileImageIcon, 'file-audio': FileAudioIcon,
  'file-video': FileVideoIcon, 'file-archive': FileArchiveIcon,
  'file-data': FileDataIcon, 'file-spreadsheet': FileSpreadsheetIcon,
}

const ICON_PALETTE: Array<{ name: IconName; label: string }> = [
  { name: 'folder',           label: 'Dossier' },
  { name: 'folder-open',      label: 'Dossier ouvert' },
  { name: 'file',             label: 'Fichier' },
  { name: 'file-pdf',         label: 'PDF' },
  { name: 'file-text',        label: 'Texte / Markdown' },
  { name: 'file-code',        label: 'Code (ts, js, py…)' },
  { name: 'file-image',       label: 'Image (png, jpg…)' },
  { name: 'file-audio',       label: 'Audio (mp3, wav…)' },
  { name: 'file-video',       label: 'Vidéo (mp4, mov…)' },
  { name: 'file-archive',     label: 'Archive (zip, tar…)' },
  { name: 'file-data',        label: 'Data (json, yaml…)' },
  { name: 'file-spreadsheet', label: 'Tableur (xlsx, csv…)' },
]

const DEFAULT_EXT_MAP: Record<string, IconName> = {
  pdf: 'file-pdf',
  txt: 'file-text', md: 'file-text', rst: 'file-text',
  ts: 'file-code', tsx: 'file-code', js: 'file-code', jsx: 'file-code',
  py: 'file-code', go: 'file-code', rs: 'file-code', c: 'file-code',
  cpp: 'file-code', java: 'file-code', php: 'file-code', rb: 'file-code',
  css: 'file-code', scss: 'file-code', html: 'file-code', xml: 'file-code',
  json: 'file-data', yaml: 'file-data', yml: 'file-data',
  toml: 'file-data', env: 'file-data', ini: 'file-data',
  png: 'file-image', jpg: 'file-image', jpeg: 'file-image',
  gif: 'file-image', svg: 'file-image', ico: 'file-image', webp: 'file-image',
  mp3: 'file-audio', wav: 'file-audio', ogg: 'file-audio', flac: 'file-audio',
  mp4: 'file-video', mov: 'file-video', avi: 'file-video', mkv: 'file-video',
  zip: 'file-archive', tar: 'file-archive', gz: 'file-archive', rar: 'file-archive',
  xls: 'file-spreadsheet', xlsx: 'file-spreadsheet', csv: 'file-spreadsheet',
}

function resolveIcon(node: TreeNode, isOpen: boolean, iconConfig: Record<string, string>): IconFC {
  let name: string
  if (node.type === 'folder') {
    name = isOpen ? (iconConfig['folder-open'] ?? 'folder-open') : (iconConfig['folder'] ?? 'folder')
  } else {
    const ext = node.name.includes('.') ? node.name.split('.').pop()!.toLowerCase() : ''
    name = iconConfig[ext] ?? iconConfig['default'] ?? DEFAULT_EXT_MAP[ext] ?? 'file'
  }
  return ICON_REGISTRY[name as IconName] ?? FileIcon
}

// ─── Contrast helper ─────────────────────────────────────────────────────────

function parseRgb(color: string): [number, number, number] | null {
  if (!color || color === 'transparent') return null
  if (color.startsWith('#')) {
    const h = color.replace('#', '')
    if (h.length === 3)
      return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)]
    if (h.length === 6)
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (m) return [+m[1], +m[2], +m[3]]
  // Named colors via canvas
  try {
    const c = document.createElement('canvas'); c.width = c.height = 1
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color; ctx.fillRect(0,0,1,1)
    const d = ctx.getImageData(0,0,1,1).data
    return [d[0], d[1], d[2]]
  } catch { return null }
}

function getContrastColor(bgColor: string): string {
  const rgb = parseRgb(bgColor)
  if (!rgb) return '#111827'
  const lc = (c: number) => { const s = c/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4) }
  const L = 0.2126*lc(rgb[0]) + 0.7152*lc(rgb[1]) + 0.0722*lc(rgb[2])
  return L > 0.179 ? '#111827' : '#f9fafb'
}

// ─── Column formatting ────────────────────────────────────────────────────────

const DEFAULT_ALIGN: Record<ColumnDef['type'], React.CSSProperties['textAlign']> = {
  text: 'left', number: 'right', currency: 'right',
  date: 'center', boolean: 'center', badge: 'left',
}

function formatCell(value: unknown, col: ColumnDef): { text: string; badgeColor?: string } {
  if (value === null || value === undefined || value === '') return { text: '' }
  switch (col.type) {
    case 'text': return { text: String(value) }
    case 'number': {
      const n = Number(value); if (isNaN(n)) return { text: String(value) }
      const fmt = col.format ?? 'decimal:0'
      if (fmt === 'integer') return { text: n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) }
      if (fmt.startsWith('decimal:')) {
        const d = parseInt(fmt.split(':')[1] ?? '0')
        return { text: n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) }
      }
      if (fmt === 'percent' || fmt.startsWith('percent:')) {
        const d = fmt.includes(':') ? parseInt(fmt.split(':')[1]) : 1
        return { text: (n * 100).toFixed(d) + ' %' }
      }
      if (fmt === 'filesize') {
        const units = ['o', 'Ko', 'Mo', 'Go', 'To']
        let v = n, i = 0
        while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
        return { text: `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}` }
      }
      return { text: n.toLocaleString('fr-FR') }
    }
    case 'currency': {
      const n = Number(value); if (isNaN(n)) return { text: String(value) }
      return { text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: col.format ?? 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) }
    }
    case 'date': {
      try {
        const d = new Date(String(value)); if (isNaN(d.getTime())) return { text: String(value) }
        return { text: col.format === 'datetime' ? d.toLocaleString('fr-FR') : d.toLocaleDateString('fr-FR') }
      } catch { return { text: String(value) } }
    }
    case 'boolean': return { text: value ? '✓' : '✗' }
    case 'badge': { const text = String(value); return { text, badgeColor: col.colors?.[text] } }
    default: return { text: String(value) }
  }
}

// ─── Column Editor ────────────────────────────────────────────────────────────

const COL_TYPES: ColumnDef['type'][] = ['text', 'number', 'date', 'boolean', 'badge', 'currency']

const FORMAT_HINT: Partial<Record<ColumnDef['type'], string>> = {
  number: 'integer · decimal:2 · percent · filesize',
  currency: 'EUR · USD · GBP · JPY …',
  date: 'date · datetime',
}

// ─── Retool value helper ──────────────────────────────────────────────────────
// Retool may pass inspector values as already-parsed objects instead of strings.

function parseRetoolValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value as T
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      // Handle double-encoded strings
      return typeof parsed === 'string' ? JSON.parse(parsed) as T : parsed as T
    } catch {}
  }
  return fallback
}

// Coerce any value to a type accepted by Retool.useStateObject setter (no undefined, no functions)
function toSerializable(v: unknown): string | number | boolean | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  return JSON.stringify(v)
}

// ─── JSON Copy Field ──────────────────────────────────────────────────────────

const JsonCopyField: FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          JSON à coller dans « {label} »
        </span>
        <button
          onClick={copy}
          style={{ padding: '2px 8px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', backgroundColor: copied ? '#dcfce7' : '#fff', color: copied ? '#16a34a' : '#374151' }}>
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <textarea
        readOnly
        value={value}
        style={{ width: '100%', height: 56, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f9fafb', color: '#374151', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
        onClick={e => (e.target as HTMLTextAreaElement).select()}
      />
    </div>
  )
}

const ColumnEditor: FC<{
  columns: ColumnDef[]
  onChange: (cols: ColumnDef[]) => void
  onClose: () => void
}> = ({ columns: initialColumns, onChange, onClose }) => {
  const [cols, setCols] = useState<ColumnDef[]>(initialColumns)

  const commit = (next: ColumnDef[]) => { setCols(next); onChange(next) }
  const upd = (i: number, patch: Partial<ColumnDef>) =>
    commit(cols.map((c, idx) => idx === i ? { ...c, ...patch } : c))

  const s = {
    panel: { position: 'absolute', inset: 0, zIndex: 20, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 } as React.CSSProperties,
    head:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 } as React.CSSProperties,
    body:  { flex: 1, overflowY: 'auto', padding: '10px 12px' } as React.CSSProperties,
    foot:  { padding: '8px 12px', borderTop: '1px solid #e5e7eb', flexShrink: 0 } as React.CSSProperties,
    input: { width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' } as React.CSSProperties,
    select:{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: '#fff' } as React.CSSProperties,
    btn:   { padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 12, backgroundColor: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
  }

  return (
    <div style={s.panel}>
      <div style={s.head}>
        <span style={{ fontWeight: 600, color: '#111827' }}>⚙ Colonnes</span>
        <button style={s.btn} onClick={onClose}>Fermer</button>
      </div>

      <div style={s.body}>
        {/* Column header labels */}
        {cols.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 1fr 68px 52px 24px', gap: 6, marginBottom: 4, fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center' }}>
            <span>Clé</span><span>Label</span><span>Type</span>
            <span>Format</span><span>Align.</span><span>Larg.</span><span />
          </div>
        )}

        {cols.map((col, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 1fr 68px 52px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              {/* key */}
              <input style={s.input} value={col.key} placeholder="clé"
                onChange={e => upd(i, { key: e.target.value })} />
              {/* label */}
              <input style={s.input} value={col.label} placeholder="Label"
                onChange={e => upd(i, { label: e.target.value })} />
              {/* type */}
              <select style={s.select} value={col.type}
                onChange={e => upd(i, { type: e.target.value as ColumnDef['type'], format: undefined })}>
                {COL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {/* format */}
              <input style={{ ...s.input, color: FORMAT_HINT[col.type] ? '#111827' : '#d1d5db' }}
                value={col.format ?? ''}
                placeholder={FORMAT_HINT[col.type] ?? '—'}
                disabled={!FORMAT_HINT[col.type]}
                onChange={e => upd(i, { format: e.target.value || undefined })} />
              {/* align — G C D buttons */}
              <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
                {(['left', 'center', 'right'] as const).map((a, ai) => (
                  <button key={a}
                    style={{ flex: 1, border: 'none', borderLeft: ai > 0 ? '1px solid #d1d5db' : 'none', cursor: 'pointer', padding: '4px 2px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', backgroundColor: col.align === a ? '#dbeafe' : '#fff', color: col.align === a ? '#1d4ed8' : '#6b7280' }}
                    title={a}
                    onClick={() => upd(i, { align: a })}>
                    {a === 'left' ? 'G' : a === 'center' ? 'C' : 'D'}
                  </button>
                ))}
              </div>
              {/* width */}
              <input style={{ ...s.input, textAlign: 'right' }} type="number" min={40}
                value={col.width ?? 100}
                onChange={e => upd(i, { width: Math.max(40, parseInt(e.target.value) || 100) })} />
              {/* delete */}
              <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => commit(cols.filter((_, j) => j !== i))}>✕</button>
            </div>

            {/* Badge colors row */}
            {col.type === 'badge' && (
              <div style={{ marginBottom: 10, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>Couleurs badge :</span>
                <input style={{ ...s.input, fontFamily: 'monospace', fontSize: 11 }}
                  value={col.colors ? JSON.stringify(col.colors) : ''}
                  placeholder='{"actif":"#22c55e","inactif":"#ef4444"}'
                  onChange={e => {
                    try { upd(i, { colors: JSON.parse(e.target.value) }) }
                    catch { /* wait for valid JSON */ }
                  }} />
              </div>
            )}
          </React.Fragment>
        ))}

        {cols.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            Aucune colonne — cliquez « + Ajouter » pour commencer.
          </p>
        )}
      </div>

      <div style={s.foot}>
        <button style={{ ...s.btn, color: '#2563eb', borderColor: '#bfdbfe' }}
          onClick={() => commit([...cols, { key: '', label: 'Nouvelle colonne', type: 'text', width: 100 }])}>
          + Ajouter une colonne
        </button>
        <JsonCopyField value={JSON.stringify(cols)} label="columns" />
      </div>
    </div>
  )
}

// ─── Icon Config Editor ───────────────────────────────────────────────────────

interface IconMapping { id: string; ext: string; icon: string }

const IconConfigEditor: FC<{
  iconConfig: Record<string, string>
  onChange: (cfg: Record<string, string>) => void
  onClose: () => void
}> = ({ iconConfig, onChange, onClose }) => {
  const [mappings, setMappings] = useState<IconMapping[]>(() =>
    Object.entries(iconConfig).map(([ext, icon], i) => ({ id: String(i), ext, icon }))
  )

  const toConfig = (m: IconMapping[]) =>
    Object.fromEntries(m.filter(x => x.ext.trim()).map(x => [x.ext.trim(), x.icon]))

  const upd = (id: string, field: 'ext' | 'icon', val: string) => {
    const next = mappings.map(m => m.id === id ? { ...m, [field]: val } : m)
    setMappings(next)
    onChange(toConfig(next))
  }

  const remove = (id: string) => {
    const next = mappings.filter(m => m.id !== id)
    setMappings(next)
    onChange(toConfig(next))
  }

  const add = () => setMappings(prev => [...prev, { id: String(Date.now()), ext: '', icon: 'file' }])

  const s = {
    panel: { position: 'absolute', inset: 0, zIndex: 20, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 } as React.CSSProperties,
    head:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 } as React.CSSProperties,
    body:  { flex: 1, overflowY: 'auto', padding: '12px' } as React.CSSProperties,
    btn:   { padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 12, backgroundColor: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
    input: { padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    select:{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', backgroundColor: '#fff', boxSizing: 'border-box' } as React.CSSProperties,
    section:{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 } as React.CSSProperties,
  }

  return (
    <div style={s.panel}>
      <div style={s.head}>
        <span style={{ fontWeight: 600, color: '#111827' }}>🎨 Icônes</span>
        <button style={s.btn} onClick={onClose}>Fermer</button>
      </div>

      <div style={s.body}>
        {/* Palette */}
        <div style={s.section}>Palette disponible</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, marginBottom: 20 }}>
          {ICON_PALETTE.map(({ name, label }) => {
            const Ico = ICON_REGISTRY[name]
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 5, backgroundColor: '#f9fafb' }}>
                <Ico size={16} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>{name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.2 }}>{label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mappings */}
        <div style={s.section}>Mappings extension → icône</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>
          Surcharge les associations par défaut. Utilisez <code>default</code> pour les extensions inconnues,
          <code> folder</code> et <code>folder-open</code> pour les dossiers.
        </div>

        {mappings.map(({ id, ext, icon }) => {
          const Ico = ICON_REGISTRY[icon as IconName] ?? FileIcon
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input style={{ ...s.input, width: 80 }} value={ext} placeholder="ext"
                onChange={e => upd(id, 'ext', e.target.value)} />
              <span style={{ color: '#9ca3af', flexShrink: 0 }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ico size={16} />
                <select style={{ ...s.select, flex: 1 }} value={icon}
                  onChange={e => upd(id, 'icon', e.target.value)}>
                  {ICON_PALETTE.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}
                onClick={() => remove(id)}>✕</button>
            </div>
          )
        })}

        <button style={{ ...s.btn, color: '#2563eb', borderColor: '#bfdbfe', marginTop: 4 }} onClick={add}>
          + Ajouter un mapping
        </button>
        <JsonCopyField value={JSON.stringify(toConfig(mappings))} label="iconConfig" />
      </div>
    </div>
  )
}

// ─── FileTree main component ──────────────────────────────────────────────────

const INDENT_PX = 16
const CHEVRON_W = 20
const ICON_W    = 22

const DEFAULT_TREE_DATA = '{"name":"project","type":"folder","children":[{"name":"src","type":"folder","children":[{"name":"index.tsx","type":"file"},{"name":"App.tsx","type":"file"}]},{"name":"README.md","type":"file"},{"name":"package.json","type":"file"}]}'

export const FileTree: FC = () => {
  const [treeDataRaw] = Retool.useStateString({
    name: 'treeData',
    initialValue: '{"name":"project","type":"folder","children":[{"name":"src","type":"folder","children":[{"name":"index.tsx","type":"file","size":4096,"modified":"2024-03-01","price":12.5,"status":"actif"},{"name":"App.tsx","type":"file","size":2048,"modified":"2024-02-20","price":8.0,"status":"brouillon"}]},{"name":"README.md","type":"file","size":512,"modified":"2024-01-15","price":0,"status":"publié"},{"name":"package.json","type":"file","size":1024,"modified":"2024-03-01","price":0,"status":"actif"}]}',
  })

  const [columnsRaw, setColumnsRaw] = Retool.useStateString({
    name: 'columns',
    label: 'Columns',
    description: 'JSON array of column definitions. Each item: { key, label, type (text|number|date|boolean|badge|currency), format?, align? (left|center|right), width?, colors? }. Use the ⚙ editor (showEditors: true) for a visual editor.',
    initialValue: '[{"key":"size","label":"Taille","type":"number","format":"filesize","align":"right","width":80},{"key":"modified","label":"Modifié","type":"date","align":"center","width":100},{"key":"price","label":"Prix","type":"currency","format":"EUR","align":"right","width":90},{"key":"status","label":"Statut","type":"badge","colors":{"actif":"#22c55e","brouillon":"#f59e0b","publié":"#3b82f6"},"width":80}]',
  })

  const [iconConfigRaw, setIconConfigRaw] = Retool.useStateString({
    name: 'iconConfig',
    label: 'Icon config',
    description: 'JSON object mapping file extensions to icon names. Available icons: folder, folder-open, file, file-pdf, file-text, file-code, file-image, file-audio, file-video, file-archive, file-data, file-spreadsheet. Special keys: "folder", "folder-open", "default". Use the 🎨 editor (showEditors: true) for a visual editor.',
    initialValue: '{}',
  })

  const [showEditors] = Retool.useStateBoolean({
    name: 'showEditors',
    label: 'Show editors',
    description: 'Enable the ⚙ Columns and 🎨 Icons visual editors directly on the component.',
    initialValue: false,
    inspector: 'checkbox',
  })

  const [selectedPath, setSelectedPath] = Retool.useStateString({
    name: 'selectedPath',
    label: 'Selected path',
    description: 'Tree path of the selected node (e.g. project/src/index.tsx).',
    initialValue: '',
    inspector: 'hidden',
  })

  const [selectedFileUrl, setSelectedFileUrl] = Retool.useStateString({
    name: 'selectedFileUrl',
    label: 'Selected file URL',
    description: 'The url property of the selected file node — physical path or link (NAS, Google Drive, Retool Files…). Set url on each file node in treeData.',
    initialValue: '',
    inspector: 'hidden',
  })

  const [, setSelectedNode] = Retool.useStateString({
    name: 'selectedNode',
    label: 'Selected node',
    description: 'JSON du nœud sélectionné. Dans Retool : JSON.parse(filetree1.selectedNode).name',
    initialValue: '{}',
    inspector: 'hidden',
  })

  const [fontFamily] = Retool.useStateString({
    name: 'fontFamily',
    label: 'Font (rows)',
    description: 'Font family for row values. Leave empty to inherit the project font.',
    initialValue: '',
    inspector: 'text',
  })

  const [headerFontFamily] = Retool.useStateString({
    name: 'headerFontFamily',
    label: 'Font (headers)',
    description: 'Font family for column headers. Leave empty to inherit the project font.',
    initialValue: '',
    inspector: 'text',
  })

  const [bgColor] = Retool.useStateString({
    name: 'bgColor',
    label: 'Background color',
    description: 'Component background color (CSS value, e.g. #fff or transparent).',
    initialValue: '#ffffff',
    inspector: 'text',
  })

  const [selectedBgColor] = Retool.useStateString({
    name: 'selectedBgColor',
    label: 'Selected row color',
    description: 'Background color of the selected row.',
    initialValue: '#dbeafe',
    inspector: 'text',
  })

  const [hoverBgColor] = Retool.useStateString({
    name: 'hoverBgColor',
    label: 'Hover row color',
    description: 'Background color of the hovered row.',
    initialValue: '#f3f4f6',
    inspector: 'text',
  })

  const [badgeBorderRadius] = Retool.useStateNumber({
    name: 'badgeBorderRadius',
    label: 'Badge border radius',
    description: 'Border radius (px) for badge cells.',
    initialValue: 4,
    inspector: 'text',
  })

  const [textColor] = Retool.useStateString({
    name: 'textColor',
    label: 'Text color (rows)',
    description: 'Row text color. Leave empty to auto-detect from background (dark text on light bg, light text on dark bg).',
    initialValue: '',
    inspector: 'text',
  })

  const [selectedTextColor] = Retool.useStateString({
    name: 'selectedTextColor',
    label: 'Text color (selected)',
    description: 'Text color for the selected row. Leave empty to auto-detect from selected row background.',
    initialValue: '',
    inspector: 'text',
  })

  const [hoverTextColor] = Retool.useStateString({
    name: 'hoverTextColor',
    label: 'Text color (hover)',
    description: 'Text color for hovered rows. Leave empty to auto-detect from hover background.',
    initialValue: '',
    inspector: 'text',
  })

  const [headerBgColor] = Retool.useStateString({
    name: 'headerBgColor',
    label: 'Header background',
    description: 'Background color of the column header row.',
    initialValue: '#f9fafb',
    inspector: 'text',
  })

  const [headerTextColor] = Retool.useStateString({
    name: 'headerTextColor',
    label: 'Header text color',
    description: 'Text color of column headers. Leave empty to auto-detect from header background.',
    initialValue: '',
    inspector: 'text',
  })

  const [nameColumnLabel] = Retool.useStateString({
    name: 'nameColumnLabel',
    label: 'Name column label',
    description: 'Label for the first (name) column header.',
    initialValue: 'Nom',
    inspector: 'text',
  })

  const onFileSelect = Retool.useEventCallback({ name: 'fileSelect' })

  // Mirror parent Retool page fonts into this iframe (iframes don't inherit parent fonts)
  useEffect(() => {
    if (document.getElementById('filetree-fonts-loaded')) return
    const marker = document.createElement('meta')
    marker.id = 'filetree-fonts-loaded'
    document.head.appendChild(marker)

    // 1 — Try copying stylesheets from the parent page (works when same-origin)
    try {
      const parent = window.parent.document
      Array.from(parent.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).forEach(pl => {
        if (document.querySelector(`link[href="${pl.href}"]`)) return
        const l = document.createElement('link')
        l.rel = 'stylesheet'; l.href = pl.href
        document.head.appendChild(l)
      })
      Array.from(parent.querySelectorAll<HTMLStyleElement>('style')).forEach(ps => {
        if (!ps.textContent?.includes('@font-face') && !ps.textContent?.includes('font-family')) return
        const s = document.createElement('style')
        s.textContent = ps.textContent
        document.head.appendChild(s)
      })
    } catch {
      // Cross-origin fallback: load Inter from Google Fonts
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  const [collapsed,   setCollapsed]   = useState<Set<string>>(new Set())
  const [hoveredPath, setHoveredPath] = useState<string>('')
  const [editorMode,  setEditorMode]  = useState<null | 'columns' | 'icons'>(null)

  // Local state — source of truth for rendering
  const [columns,    setColumns]    = useState<ColumnDef[]>(() => parseRetoolValue(columnsRaw,    [] as ColumnDef[]))
  const [iconConfig, setIconConfig] = useState<Record<string, string>>(() => parseRetoolValue(iconConfigRaw, {} as Record<string, string>))

  // One-way sync: inspector → local state (user edits the JSON field directly)
  useEffect(() => { setColumns(parseRetoolValue(columnsRaw,    [] as ColumnDef[]))          }, [columnsRaw])
  useEffect(() => { setIconConfig(parseRetoolValue(iconConfigRaw, {} as Record<string, string>)) }, [iconConfigRaw])

  const [colWidths, setColWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map(c => [c.key, c.width ?? 100]))
  )

  useEffect(() => {
    setColWidths(prev => { const n: Record<string, number> = {}; for (const c of columns) n[c.key] = prev[c.key] ?? c.width ?? 100; return n })
  }, [columns])

  const colWidthsRef = useRef(colWidths)
  useEffect(() => { colWidthsRef.current = colWidths }, [colWidths])

  const startResize = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = colWidthsRef.current[key] ?? 100
    const onMove = (ev: MouseEvent) => setColWidths(prev => ({ ...prev, [key]: Math.max(40, startW + ev.clientX - startX) }))
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [])

  const defaultRoot: TreeNode = JSON.parse(DEFAULT_TREE_DATA)
  let root: TreeNode = defaultRoot
  let treeDataError  = false

  if (treeDataRaw) {
    const parsed = parseRetoolValue<TreeNode | null>(treeDataRaw, null)
    if (parsed && typeof parsed === 'object') root = parsed
    else treeDataError = true
  }

  const toggleCollapse = (path: string) => setCollapsed(prev => {
    const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n
  })

  const colBlock = columns.map(c => `${colWidths[c.key] ?? c.width ?? 100}px`).join(' ')
  const gridCols = `1fr${colBlock ? ' ' + colBlock : ''}`

  const resolvedFont            = fontFamily       || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const resolvedHeaderFont      = headerFontFamily || resolvedFont
  const resolvedBg              = bgColor          || '#ffffff'
  const resolvedSelectedBg      = selectedBgColor  || '#dbeafe'
  const resolvedHoverBg         = hoverBgColor     || '#f3f4f6'
  const resolvedHeaderBg        = headerBgColor    || '#f9fafb'
  const resolvedTextColor         = textColor         || getContrastColor(resolvedBg)
  const resolvedSelectedTextColor = selectedTextColor || getContrastColor(resolvedSelectedBg)
  const resolvedHoverTextColor    = hoverTextColor    || getContrastColor(resolvedHoverBg)
  const resolvedHeaderTextColor   = headerTextColor   || getContrastColor(resolvedHeaderBg)
  const resolvedNameLabel         = nameColumnLabel   || 'Nom'

  // Inject scoped styles with !important so they beat any Retool iframe CSS reset
  useEffect(() => {
    let el = document.getElementById('ft-dynamic-styles') as HTMLStyleElement | null
    if (!el) { el = document.createElement('style'); el.id = 'ft-dynamic-styles'; document.head.appendChild(el) }
    el.textContent = `
      #ft-root, #ft-root * { font-family: ${resolvedFont} !important; }
      #ft-root .ft-header-cell { font-family: ${resolvedHeaderFont} !important; }
    `
  }, [resolvedFont, resolvedHeaderFont])

  const containerStyle: React.CSSProperties = {
    fontSize: 13, color: resolvedTextColor, backgroundColor: resolvedBg,
    border: '1px solid #e5e7eb', borderRadius: 6,
    overflow: 'hidden', height: '100%', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', position: 'relative',
  }

  const headerCell: React.CSSProperties = {
    padding: '5px 8px', fontWeight: 600, fontSize: 11,
    color: resolvedHeaderTextColor, backgroundColor: resolvedHeaderBg,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    position: 'sticky', top: 0, zIndex: 1, userSelect: 'none',
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 4, padding: '4px 8px',
    borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0,
  }

  const toolBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 8px', border: '1px solid #d1d5db', borderRadius: 4,
    cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
    backgroundColor: active ? '#dbeafe' : '#fff',
    color: active ? '#1d4ed8' : '#374151',
  })

  const flatNodes = flattenTree(root, 0, '', collapsed)

  return (
    <div id="ft-root" style={containerStyle}>
      {/* Erreur JSON visible uniquement si treeData est vraiment malformé */}
      {treeDataError && (
        <div style={{ padding: '4px 8px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: 11, color: '#b91c1c' }}>
          treeData invalide — arbre par défaut affiché.
        </div>
      )}

      {/* Toolbar — visible uniquement si showEditors est activé dans l'inspector */}
      {showEditors && (
        <div style={toolbarStyle}>
          <button style={toolBtnStyle(editorMode === 'columns')}
            onClick={() => setEditorMode(m => m === 'columns' ? null : 'columns')}>
            ⚙ Colonnes
          </button>
          <button style={toolBtnStyle(editorMode === 'icons')}
            onClick={() => setEditorMode(m => m === 'icons' ? null : 'icons')}>
            🎨 Icônes
          </button>
        </div>
      )}

      {/* Tree grid */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 0 }}>

          {/* Header */}
          <div className="ft-header-cell" style={{ ...headerCell, paddingLeft: CHEVRON_W + ICON_W + 8 }}>{resolvedNameLabel}</div>
          {columns.map(col => (
            <div key={col.key} className="ft-header-cell" style={{ ...headerCell, textAlign: col.align ?? DEFAULT_ALIGN[col.type], position: 'relative' }}>
              {col.label}
              <span
                onMouseDown={e => startResize(col.key, e)}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 2, height: '60%', backgroundColor: '#d1d5db', borderRadius: 1, pointerEvents: 'none' }} />
              </span>
            </div>
          ))}

          {/* Rows */}
          {flatNodes.map(({ node, depth, path, hasChildren }) => {
            const isCollapsed = collapsed.has(path)
            const isSelected  = selectedPath === path
            const isHovered   = hoveredPath  === path
            const bg       = isSelected ? resolvedSelectedBg : isHovered ? resolvedHoverBg : 'transparent'
            const textCol  = isSelected ? resolvedSelectedTextColor : isHovered ? resolvedHoverTextColor : resolvedTextColor
            const IconComp = resolveIcon(node, !isCollapsed, iconConfig)
            const cellBase: React.CSSProperties = { backgroundColor: bg, display: 'flex', alignItems: 'center', padding: '2px 8px', overflow: 'hidden' }

            return (
              <React.Fragment key={path}>
                <div
                  style={{ ...cellBase, paddingLeft: depth * INDENT_PX, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPath(path)
                    setSelectedFileUrl(node.url ?? '')
                    setSelectedNode(JSON.stringify(Object.fromEntries(Object.entries(node).filter(([k]) => k !== 'children'))))
                    onFileSelect()
                  }}
                  onMouseEnter={() => setHoveredPath(path)}
                  onMouseLeave={() => setHoveredPath('')}>
                  <span
                    style={{ width: CHEVRON_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textCol }}
                    onClick={e => { if (hasChildren) { e.stopPropagation(); toggleCollapse(path) } }}>
                    {hasChildren && (isCollapsed ? <ChevronRight /> : <ChevronDown />)}
                  </span>
                  <span style={{ width: ICON_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={15} />
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textCol }}>
                    {(node.alias as string) ?? node.name}
                  </span>
                </div>

                {columns.map(col => {
                  const { text, badgeColor } = formatCell(node[col.key], col)
                  const align   = col.align ?? DEFAULT_ALIGN[col.type]
                  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
                  return (
                    <div key={col.key}
                      style={{ ...cellBase, justifyContent: justify, color: textCol }}
                      onMouseEnter={() => setHoveredPath(path)}
                      onMouseLeave={() => setHoveredPath('')}>
                      {badgeColor ? (
                        <span style={{ backgroundColor: badgeColor + '20', color: badgeColor, border: `1px solid ${badgeColor}50`, borderRadius: badgeBorderRadius, padding: '1px 6px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {text}
                        </span>
                      ) : (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>

        {/* Editor overlays */}
        {editorMode === 'columns' && (
          <ColumnEditor
            columns={columns}
            onChange={setColumns}
            onClose={() => setEditorMode(null)} />
        )}
        {editorMode === 'icons' && (
          <IconConfigEditor
            iconConfig={iconConfig}
            onChange={setIconConfig}
            onClose={() => setEditorMode(null)} />
        )}
      </div>
    </div>
  )
}
