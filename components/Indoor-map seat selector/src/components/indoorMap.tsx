import React, { type FC, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Retool } from '@tryretool/custom-component-support';

type SeatStatus = 'available' | 'occupied';
type SeatShape  = 'circle' | 'square' | 'rounded' | 'diamond';
type AppMode    = 'book' | 'edit';
type FilterMode = 'all' | 'available' | 'occupied';
type ThemePreset = 'default' | 'dark' | 'light' | 'highContrast';

interface RawSeatBase {
  id: string; x: number; y: number;
  label?: string; zone?: string; floor?: string;
  status?: SeatStatus;
}
interface RawSeatAbsolute extends RawSeatBase {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
type RawSeatGrid = RawSeatBase[][];

interface NormalizedSeat {
  id: string; x: number; y: number;
  label?: string; zone?: string; floor?: string;
  status: SeatStatus;
}

interface TooltipState {
  visible: boolean; x: number; y: number; seat: NormalizedSeat | null;
}

interface ThemeConfig {
  mode?: 'light' | 'dark';
  preset?: ThemePreset;
  colors?: {
    background?: string; surface?: string; border?: string;
    text?: string; textDim?: string; accent?: string;
    success?: string; warning?: string;
  };
  seat?: {
    availableFill?: string; availableStroke?: string;
    selectedFill?: string; selectedStroke?: string;
    occupiedFill?: string; occupiedStroke?: string;
    sizeMultiplier?: number;
  };
  typography?: {
    fontFamily?: string; seatFontSize?: number; toolbarFontSize?: number;
  };
  ui?: {
    borderRadius?: number; compactMode?: boolean;
  };
}

interface ResolvedTheme {
  colors: {
    background: string; surface: string; border: string;
    text: string; textDim: string; accent: string;
    success: string; warning: string;
  };
  seat: {
    availableFill: string; availableStroke: string;
    selectedFill: string; selectedStroke: string;
    occupiedFill: string; occupiedStroke: string;
    sizeMultiplier: number;
  };
  typography: { fontFamily: string; seatFontSize: number; toolbarFontSize: number; };
  ui: { borderRadius: number; compactMode: boolean; };
}

const PRESETS: Record<ThemePreset, Partial<ThemeConfig>> = {
  default: {},
  dark: {
    colors: {
      background: '#0f1117', surface: '#1a1f2e', border: '#2d3348',
      text: '#f1f5f9', textDim: '#94a3b8', accent: '#3b82f6',
      success: '#10b981', warning: '#f59e0b',
    },
    seat: {
      availableFill: '#1e2a3a', availableStroke: '#3b5068',
      selectedFill: '#1e3a8a', selectedStroke: '#60a5fa',
      occupiedFill: '#3b1219', occupiedStroke: '#ef4444',
    },
  },
  light: {
    colors: {
      background: '#f8fafc', surface: '#ffffff', border: '#e2e8f0',
      text: '#0f172a', textDim: '#64748b', accent: '#2563eb',
      success: '#059669', warning: '#d97706',
    },
    seat: {
      availableFill: '#dbeafe', availableStroke: '#93c5fd',
      selectedFill: '#1d4ed8', selectedStroke: '#60a5fa',
      occupiedFill: '#fee2e2', occupiedStroke: '#f87171',
    },
  },
  highContrast: {
    colors: {
      background: '#000000', surface: '#111111', border: '#ffffff',
      text: '#ffffff', textDim: '#cccccc', accent: '#ffff00',
      success: '#00ff88', warning: '#ffaa00',
    },
    seat: {
      availableFill: '#003300', availableStroke: '#00ff88',
      selectedFill: '#003399', selectedStroke: '#ffff00',
      occupiedFill: '#330000', occupiedStroke: '#ff4444',
    },
  },
};

const DEFAULT_THEME: ResolvedTheme = {
  colors: {
    background: '#0f1117', surface: '#1a1f2e', border: '#2d3348',
    text: '#f1f5f9', textDim: '#94a3b8', accent: '#3b82f6',
    success: '#10b981', warning: '#f59e0b',
  },
  seat: {
    availableFill: '#1e2a3a', availableStroke: '#3b5068',
    selectedFill: '#1e3a8a', selectedStroke: '#60a5fa',
    occupiedFill: '#3b1219', occupiedStroke: '#ef4444',
    sizeMultiplier: 1,
  },
  typography: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    seatFontSize: 1,
    toolbarFontSize: 11,
  },
  ui: { borderRadius: 7, compactMode: false },
};

function resolveTheme(raw: unknown): ResolvedTheme {
  const cfg = (raw && typeof raw === 'object' ? raw : {}) as ThemeConfig;
  const preset = cfg.preset && PRESETS[cfg.preset] ? PRESETS[cfg.preset] : {};
  return {
    colors: { ...DEFAULT_THEME.colors, ...preset.colors, ...cfg.colors },
    seat:   { ...DEFAULT_THEME.seat,   ...preset.seat,   ...cfg.seat   },
    typography: { ...DEFAULT_THEME.typography, ...preset.typography, ...cfg.typography },
    ui:     { ...DEFAULT_THEME.ui,     ...preset.ui,     ...cfg.ui     },
  };
}

const BASE_SEAT_R = 0.013;
const SNAP_GRID   = 0.025;
const PLACE_MIN   = 0.05;
const PLACE_MAX   = 0.95;

function snapToGrid(v: number) { return Math.round(v / SNAP_GRID) * SNAP_GRID; }
function clampPlace(v: number) { return Math.max(PLACE_MIN, Math.min(PLACE_MAX, v)); }

function stableId(seats: NormalizedSeat[], editSeats: NormalizedSeat[]): string {
  const max = [...seats, ...editSeats].reduce((m, s) => {
    const n = parseInt(s.id.replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `S${max + 1}`;
}

function resolveImageSrc(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(s.slice(0, 50))) return `data:image/jpeg;base64,${s}`;
    if (s.startsWith('http') || s.startsWith('/')) return s;
    return null;
  }
  if (Array.isArray(raw)) {
    if (!raw.length) return null;
    const first = raw[0];
    if (typeof first === 'string') return resolveImageSrc(first);
    if (typeof first === 'object') {
      if (first.base64) {
        const b = first.base64.trim();
        return b.startsWith('data:') ? b : `data:${first.mimeType || 'image/jpeg'};base64,${b}`;
      }
      if (first.src) return first.src;
    }
  }
  return null;
}

function normalizeSeats(raw: unknown[]): NormalizedSeat[] {
  if (!raw.length) return [];
  if (Array.isArray(raw[0])) {
    const grid = raw as RawSeatGrid;
    const rows = grid.length, cols = Math.max(...grid.map(r => r.length));
    return grid.flatMap((row, ri) => row.map((s, ci) => ({
      ...s, status: s.status ?? 'available',
      x: cols > 1 ? (ci + 0.5) / cols : 0.5,
      y: rows > 1 ? (ri + 0.5) / rows : 0.5,
    })));
  }
  return (raw as (RawSeatBase | RawSeatAbsolute)[]).map(seat => {
    if ('bounds' in seat && seat.bounds) {
      const { minX, minY, maxX, maxY } = seat.bounds;
      return {
        id: seat.id,
        x: (seat.x - minX) / (maxX - minX || 1),
        y: (seat.y - minY) / (maxY - minY || 1),
        label: seat.label, zone: seat.zone, floor: seat.floor,
        status: seat.status ?? 'available',
      };
    }
    const s = seat as RawSeatBase;
    return {
      id: s.id,
      x: Math.max(0, Math.min(1, s.x)),
      y: Math.max(0, Math.min(1, s.y)),
      label: s.label, zone: s.zone, floor: s.floor,
      status: s.status ?? 'available',
    };
  });
}

const SeatEl: FC<{ shape: SeatShape; cx: number; cy: number; fill: string; stroke: string; r: number; glow?: boolean }> =
  ({ shape, cx, cy, fill, stroke, r, glow }) => {
    const hw = r * 0.85;
    const glowFilter = glow ? 'url(#seatGlow)' : undefined;
    if (shape === 'circle')
      return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={0.0025} filter={glowFilter} />;
    if (shape === 'diamond') {
      const d = `M${cx} ${cy - r * 1.15}L${cx + r * 1.15} ${cy}L${cx} ${cy + r * 1.15}L${cx - r * 1.15} ${cy}Z`;
      return <path d={d} fill={fill} stroke={stroke} strokeWidth={0.0025} filter={glowFilter} />;
    }
    return <rect x={cx - hw} y={cy - hw} width={hw * 2} height={hw * 2}
      rx={shape === 'rounded' ? r * 0.45 : 0} fill={fill} stroke={stroke} strokeWidth={0.0025} filter={glowFilter} />;
  };

export const IndoorMap: FC = () => {
  Retool.useComponentSettings({ defaultWidth: 16, defaultHeight: 52 });

  const [imagesRaw] = Retool.useStateArray({
    name: 'images', label: 'Images',
    description: 'Floor plan image. First item used.',
    inspector: 'text',
  });

  const [seatsRaw] = Retool.useStateArray({
    name: 'seats', label: 'Seats',
    description: 'Seat array from DB: { id, x, y, zone?, floor?, status? }.',
    inspector: 'text',
  });

  const [controlledSelectedRaw] = Retool.useStateArray({
    name: 'selectedSeatIds', label: 'Selected Seat IDs (controlled)',
    description: 'Externally controlled selection.',
    inspector: 'hidden',
  });

  const [showAvailableOnly] = Retool.useStateBoolean({
    name: 'showAvailableOnly', label: 'Show Available Only',
    initialValue: false, inspector: 'checkbox',
    description: 'Hide occupied seats in book mode.',
  });

  const [isAdmin] = Retool.useStateBoolean({
    name: 'isAdmin', label: 'Show Edit Mode Button',
    initialValue: false, inspector: 'checkbox',
    description: 'Reveals the Edit Layout button for admins.',
  });

  const [activeFloor] = Retool.useStateString({
    name: 'activeFloor', label: 'Active Floor',
    description: 'Filter seats by floor value. Empty = all.',
    inspector: 'hidden',
  });

  const [seatShape] = Retool.useStateEnumeration({
    name: 'seatShape', label: 'Seat Shape',
    enumDefinition: ['circle', 'square', 'rounded', 'diamond'],
    initialValue: 'rounded', inspector: 'segmented',
    description: 'Visual shape for seat markers.',
  }) as [SeatShape, (v: SeatShape) => void];

  const [themeConfigRaw] = Retool.useStateObject({
    name: 'themeConfig',
    label: 'Theme Config',
    description: 'Optional design token overrides. Supports: mode, preset, colors, seat, typography, ui.',
    inspector: 'text',
  });

  const [, setLayoutSeatsOut] = Retool.useStateArray({
    name: 'layoutSeatsOut', label: 'Layout Seats (output)',
    inspector: 'hidden',
    description: 'Full seat array. Updated live in edit mode.',
  });

  const [, setSelectedSeatIdsOut] = Retool.useStateArray({
    name: 'selectedSeatIdsOut', label: 'Selected Seat IDs (output)',
    inspector: 'hidden',
    description: 'Selected seat IDs.',
  });

  const onLayoutSave = Retool.useEventCallback({ name: 'onLayoutSave' });
  const onSeatSubmit = Retool.useEventCallback({ name: 'onSeatSubmit' });

  const theme = useMemo(() => resolveTheme(themeConfigRaw), [themeConfigRaw]);
  const seatRadius = useMemo(() => BASE_SEAT_R * (theme.seat.sizeMultiplier || 1), [theme.seat.sizeMultiplier]);

  const br = theme.ui.borderRadius;
  const ff = theme.typography.fontFamily;
  const toolbarPad = theme.ui.compactMode ? '4px 10px' : '7px 10px';
  const toolbarFs  = theme.typography.toolbarFontSize;

  const seats    = useMemo(() => normalizeSeats((seatsRaw ?? []) as unknown[]), [seatsRaw]);
  const imageSrc = useMemo(() => resolveImageSrc(imagesRaw), [imagesRaw]);

  const controlledSelected = useMemo(() => {
    if (Array.isArray(controlledSelectedRaw)) return controlledSelectedRaw;
    if (typeof controlledSelectedRaw === 'string') {
      try { return JSON.parse(controlledSelectedRaw); } catch { return []; }
    }
    return [];
  }, [controlledSelectedRaw]);

  const isControlled = controlledSelected.length > 0;

  const [mode, setMode]               = useState<AppMode>('book');
  const [internalSelected, setIntern] = useState<string[]>([]);
  const [editSeats, setEditSeats]     = useState<NormalizedSeat[]>([]);
  const [editSubmode, setEditSubmode] = useState<'place' | 'delete'>('place');
  const [editDotSize, setEditDotSize] = useState(9);
  const [editZone, setEditZone]       = useState('zone1');
  const [editStatus, setEditStatus]   = useState<SeatStatus>('available');
  const [filterMode, setFilterMode]   = useState<FilterMode>('all');
  const [zoneFilter, setZoneFilter]   = useState<string>('all');
  const [tooltip, setTooltip]         = useState<TooltipState>({ visible: false, x: 0, y: 0, seat: null });
  const [hoveredId, setHoveredId]     = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSeats = Array.isArray(isControlled ? controlledSelected : internalSelected)
    ? (isControlled ? controlledSelected : internalSelected)
    : [];
  const editDotR = editDotSize * 0.001;

  const seatsKey = useMemo(() => seats.map(s => s.id + s.status).join(','), [seats]);
  const prevKey  = useRef('');

  useEffect(() => {
    if (seatsKey === prevKey.current) return;
    prevKey.current = seatsKey;
    if (!isControlled) setIntern([]);
    setSelectedSeatIdsOut([]);
    setLayoutSeatsOut(seats.length ? (seats as unknown as unknown[]) : []);
  }, [seatsKey]);

  useEffect(() => {
    if (mode !== 'edit') return;
    setLayoutSeatsOut(editSeats.length ? (editSeats as unknown as unknown[]) : []);
  }, [editSeats, mode]);

  const prevIsAdmin = useRef(isAdmin);
  useEffect(() => {
    if (prevIsAdmin.current === isAdmin) return;
    prevIsAdmin.current = isAdmin;
    if (!isAdmin && mode === 'edit') {
      setEditSeats([]);
      setMode('book');
      setLayoutSeatsOut(seats.length ? (seats as unknown as unknown[]) : []);
      setTooltip(t => ({ ...t, visible: false }));
    }
  }, [isAdmin, mode, seats]);

  const allZones = useMemo(() => {
    const zSet = new Set<string>();
    seats.forEach(s => { if (s.zone) zSet.add(s.zone); });
    return Array.from(zSet).sort();
  }, [seats]);

  const visibleSeats = useMemo(() => {
    const src = mode === 'edit' ? editSeats : seats;
    return src.filter(s => {
      if (mode === 'book' && showAvailableOnly && s.status === 'occupied') return false;
      if (mode === 'book' && filterMode === 'available' && s.status === 'occupied') return false;
      if (mode === 'book' && filterMode === 'occupied' && s.status === 'available') return false;
      if (mode === 'book' && zoneFilter !== 'all' && s.zone !== zoneFilter) return false;
      if (activeFloor && s.floor && s.floor !== activeFloor) return false;
      return true;
    });
  }, [seats, editSeats, mode, showAvailableOnly, activeFloor, filterMode, zoneFilter]);

  const toggleSeat = useCallback((id: string) => {
    const next = selectedSeats.includes(id)
      ? selectedSeats.filter(s => s !== id)
      : [...selectedSeats, id];
    if (!isControlled) setIntern(next);
    setSelectedSeatIdsOut(next);
  }, [selectedSeats, isControlled]);

  const clearSelection = useCallback(() => {
    if (!isControlled) setIntern([]);
    setSelectedSeatIdsOut([]);
  }, [isControlled]);

  const enterEdit = useCallback(() => {
    setEditSeats(seats.map(s => ({ ...s })));
    setMode('edit');
    if (!isControlled) setIntern([]);
    setSelectedSeatIdsOut([]);
    setTooltip(t => ({ ...t, visible: false }));
  }, [seats, isControlled]);

  const exitEdit = useCallback((save: boolean) => {
    if (save) {
      setLayoutSeatsOut(editSeats as unknown as unknown[]);
      setTimeout(() => { onLayoutSave(); }, 0);
    } else {
      setLayoutSeatsOut(seats.length ? (seats as unknown as unknown[]) : []);
    }
    setEditSeats([]);
    setMode('book');
  }, [editSeats, seats]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'edit') return;
    const svg  = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const vb   = svg.viewBox.baseVal;
    const rawX = (e.clientX - rect.left) / rect.width  * vb.width  + vb.x;
    const rawY = (e.clientY - rect.top)  / rect.height * vb.height + vb.y;
    const nx   = parseFloat(clampPlace(snapToGrid(rawX)).toFixed(4));
    const ny   = parseFloat(clampPlace(snapToGrid(rawY)).toFixed(4));

    if (editSubmode === 'delete' || e.shiftKey) {
      const hitR = editDotSize * 0.003;
      let best = { d: Infinity, i: -1 };
      editSeats.forEach((s, i) => {
        const d = Math.hypot(s.x - nx, s.y - ny);
        if (d < best.d) best = { d, i };
      });
      if (best.i >= 0 && best.d < hitR)
        setEditSeats(prev => prev.filter((_, i) => i !== best.i));
      return;
    }

    const tooClose = editSeats.some(s => Math.hypot(s.x - nx, s.y - ny) < seatRadius * 2.2);
    if (tooClose) return;

    const id = stableId(seats, editSeats);
    setEditSeats(prev => [...prev, { id, x: nx, y: ny, zone: editZone, status: editStatus }]);
  }, [mode, editSubmode, editDotSize, editSeats, seats, editZone, editStatus, seatRadius]);

  const handleSeatMouseEnter = useCallback((e: React.MouseEvent, seat: NormalizedSeat) => {
    if (mode !== 'book') return;
    setHoveredId(seat.id);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, seat });
  }, [mode]);

  const handleSeatMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode !== 'book') return;
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip(prev => prev.visible ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
  }, [mode]);

  const handleSeatMouseLeave = useCallback(() => {
    setHoveredId(null);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 80);
  }, []);

  const allOccupied = selectedSeats.length > 0 && selectedSeats.every(id => {
    const s = seats.find(s => s.id === id);
    return s?.status === 'occupied';
  });

  const bookBtnLabel = allOccupied
    ? `Release ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`
    : `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`;

  const countAvail    = seats.filter(s => s.status === 'available').length;
  const countOccupied = seats.filter(s => s.status === 'occupied').length;

  const T = theme.colors;
  const S = theme.seat;

  const btnBase: React.CSSProperties = {
    height: 28, padding: '0 10px', background: 'transparent',
    border: `1px solid ${T.border}`, borderRadius: br, fontSize: toolbarFs,
    color: T.textDim, cursor: 'pointer', fontFamily: ff,
    transition: 'color .15s, background .15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      overflow: 'hidden', background: T.background, fontFamily: ff }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .tb-btn:hover  { background: rgba(255,255,255,.09) !important; }
        .clr-btn:hover { background: rgba(239,68,68,.12) !important; color: #f87171 !important; }
        select option  { background: ${T.surface}; color: ${T.text}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #3b4360; border-radius: 2px; }
        .seat-g { cursor: pointer; }
        .seat-g circle, .seat-g rect, .seat-g path {
          transition: opacity 150ms ease, transform 150ms ease;
          transform-box: fill-box; transform-origin: center;
        }
        .seat-g:hover circle, .seat-g:hover rect, .seat-g:hover path { opacity: .82; transform: scale(1.11); }
        .seat-selected circle, .seat-selected rect, .seat-selected path { transform: scale(1.09); }
        .seat-selected:hover circle, .seat-selected:hover rect, .seat-selected:hover path { transform: scale(1.16); }
        .filter-btn {
          height: 25px; padding: 0 9px; background: transparent;
          border: 1px solid ${T.border}; font-size: ${toolbarFs}px; color: ${T.textDim};
          cursor: pointer; font-family: ${ff};
          transition: background 120ms, color 120ms, border-color 120ms; white-space: nowrap;
        }
        .filter-btn:first-child { border-radius: ${br}px 0 0 ${br}px; border-right: none; }
        .filter-btn:last-child  { border-radius: 0 ${br}px ${br}px 0; }
        .filter-btn:not(:first-child):not(:last-child) { border-radius: 0; border-left: none; }
        .filter-btn.active-all  { background: rgba(100,116,139,.2); color: #e2e8f0; border-color: #475569; }
        .filter-btn.active-avail{ background: rgba(16,185,129,.14); color: #34d399; border-color: rgba(16,185,129,.35); }
        .filter-btn.active-occ  { background: rgba(239,68,68,.14);  color: #f87171; border-color: rgba(239,68,68,.35); }
        .zone-select {
          height: 25px; padding: 0 7px; background: ${T.background};
          border: 1px solid ${T.border}; border-radius: ${br}px; font-size: ${toolbarFs}px;
          color: ${T.textDim}; cursor: pointer; font-family: ${ff}; outline: none;
          transition: border-color 120ms;
        }
        .zone-select:focus { border-color: ${T.accent}; }
        .book-btn {
          height: 28px; padding: 0 14px; border: none; border-radius: ${br}px;
          font-size: 12px; font-weight: 600; color: #fff; cursor: pointer;
          font-family: ${ff}; transition: opacity 150ms, transform 150ms, box-shadow 150ms;
        }
        .book-btn:not(:disabled):hover { opacity: .87; transform: translateY(-1px); }
        .book-btn:not(:disabled):active { transform: translateY(0); }
        .book-btn:disabled { opacity: .35; cursor: not-allowed; }
        .seat-tooltip {
          position: absolute; pointer-events: none; z-index: 99;
          background: rgba(13,16,25,.97); border: 1px solid #3b4360;
          border-radius: ${Math.min(br + 2, 12)}px; padding: 8px 11px;
          font-size: 11px; color: ${T.text};
          backdrop-filter: blur(10px); white-space: nowrap;
          transition: opacity 150ms ease; box-shadow: 0 6px 20px rgba(0,0,0,.5); min-width: 120px;
        }
        .seat-tooltip.show { opacity: 1; }
        .seat-tooltip.hide { opacity: 0; }
      `}</style>

      {mode === 'book' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: toolbarPad, borderBottom: `1px solid ${T.border}`,
          background: T.surface, flexShrink: 0, flexWrap: 'wrap' }}>

          <span style={{ fontSize: toolbarFs, fontFamily: "'DM Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ color: T.success, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="7" height="7"><circle cx="3.5" cy="3.5" r="3.5" fill={T.success}/></svg>
              {countAvail} Available
            </span>
            {countOccupied > 0 && (
              <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="7" height="7"><circle cx="3.5" cy="3.5" r="3.5" fill="#ef4444"/></svg>
                {countOccupied} Occupied
              </span>
            )}
            {selectedSeats.length > 0 && (
              <span style={{ color: T.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="7" height="7"><circle cx="3.5" cy="3.5" r="3.5" fill={T.accent}/></svg>
                {selectedSeats.length} Selected
              </span>
            )}
          </span>

          <span style={{ flex: 1 }} />

          {allZones.length > 0 && (
            <select className="zone-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
              <option value="all">All Zones</option>
              {allZones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          )}

          <div style={{ display: 'flex' }}>
            <button className={`filter-btn ${filterMode === 'all'       ? 'active-all'   : ''}`} onClick={() => setFilterMode('all')}>All</button>
            <button className={`filter-btn ${filterMode === 'available' ? 'active-avail' : ''}`} onClick={() => setFilterMode('available')}>Available</button>
            <button className={`filter-btn ${filterMode === 'occupied'  ? 'active-occ'  : ''}`} onClick={() => setFilterMode('occupied')}>Occupied</button>
          </div>

          {selectedSeats.length > 0 && (
            <>
              <button className="clr-btn tb-btn" onClick={clearSelection} style={btnBase}>Clear</button>
              <button className="book-btn"
                disabled={isActionLoading}
                onClick={() => {
                  setIsActionLoading(true);
                  setSelectedSeatIdsOut(selectedSeats);
                  onSeatSubmit();
                  setTimeout(() => setIsActionLoading(false), 900);
                }}
                style={{
                  background: allOccupied
                    ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow: allOccupied
                    ? '0 2px 12px rgba(239,68,68,.28)'
                    : '0 2px 12px rgba(16,185,129,.28)',
                }}>
                {isActionLoading ? '…' : bookBtnLabel}
              </button>
            </>
          )}

          {isAdmin && (
            <button className="tb-btn" onClick={enterEdit}
              style={{ height: 28, padding: '0 10px', background: `rgba(245,158,11,.08)`,
                border: `1px solid rgba(245,158,11,.25)`, borderRadius: br, fontSize: toolbarFs,
                color: T.warning, cursor: 'pointer', fontFamily: ff, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'background .15s' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
              Edit layout
            </button>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
            background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.2)',
            fontSize: toolbarFs, color: T.warning, fontWeight: 500 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Edit mode — click to place · shift+click or delete mode to remove · overlapping seats are blocked
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: toolbarPad,
            borderBottom: `1px solid ${T.border}`, background: T.surface, flexWrap: 'wrap' }}>

            <label style={{ fontSize: toolbarFs, color: T.textDim }}>Zone</label>
            <input value={editZone} onChange={e => setEditZone(e.target.value)}
              style={{ height: 26, width: 72, padding: '0 7px', background: T.background,
                border: `1px solid ${T.border}`, borderRadius: br, fontSize: 12,
                color: T.text, outline: 'none', fontFamily: ff }} />

            <label style={{ fontSize: toolbarFs, color: T.textDim }}>Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value as SeatStatus)}
              style={{ height: 26, padding: '0 7px', background: T.background,
                border: `1px solid ${T.border}`, borderRadius: br, fontSize: 12,
                color: T.textDim, outline: 'none', fontFamily: ff }}>
              <option value="available">available</option>
              <option value="occupied">occupied</option>
            </select>

            <div style={{ display: 'flex', borderRadius: br, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              {(['place', 'delete'] as const).map(m => (
                <button key={m} onClick={() => setEditSubmode(m)}
                  style={{ height: 26, padding: '0 10px', fontSize: toolbarFs, fontFamily: ff,
                    cursor: 'pointer', border: 'none',
                    background: editSubmode === m
                      ? (m === 'delete' ? 'rgba(239,68,68,.2)' : `rgba(59,130,246,.2)`)
                      : 'transparent',
                    color: editSubmode === m
                      ? (m === 'delete' ? '#f87171' : T.accent)
                      : T.textDim,
                    fontWeight: editSubmode === m ? 500 : 400 }}>
                  {m === 'place' ? '+ Place' : '× Delete'}
                </button>
              ))}
            </div>

            <label style={{ fontSize: toolbarFs, color: T.textDim }}>Size</label>
            <input type="range" min="4" max="20" value={editDotSize} step="1"
              onChange={e => setEditDotSize(parseInt(e.target.value))}
              style={{ width: 70, accentColor: T.accent, cursor: 'pointer' }} />
            <span style={{ fontSize: toolbarFs, fontFamily: "'DM Mono', monospace", color: T.textDim, minWidth: 16 }}>
              {editDotSize}
            </span>

            <span style={{ flex: 1 }} />
            <span style={{ fontSize: toolbarFs, fontFamily: "'DM Mono', monospace", color: T.textDim }}>
              {editSeats.length} seats
            </span>

            <button className="clr-btn tb-btn" onClick={() => setEditSeats([])} style={btnBase}>Clear all</button>
            <button className="tb-btn" onClick={() => exitEdit(false)} style={btnBase}>Cancel</button>
            <button onClick={() => exitEdit(true)}
              style={{ height: 28, padding: '0 14px', background: T.success, border: 'none',
                borderRadius: br, fontSize: 12, fontWeight: 600, color: '#fff',
                cursor: 'pointer', fontFamily: ff, boxShadow: `0 2px 8px rgba(16,185,129,.3)` }}>
              Save layout ✓
            </button>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden',
        cursor: mode === 'edit' ? (editSubmode === 'delete' ? 'crosshair' : 'cell') : 'default' }}>

        {imageSrc && (
          <img src={imageSrc} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'unset', display: 'block', pointerEvents: 'none' }} />
        )}

        <svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
          onClick={mode === 'edit' ? handleSvgClick : undefined}
          onMouseMove={mode === 'book' ? handleSeatMouseMove : undefined}
          style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>

          <defs>
            <filter id="seatGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="0.005" result="blur"/>
              <feFlood floodColor={T.accent} floodOpacity="0.4" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="shadow"/>
              <feComposite in="SourceGraphic" in2="shadow" operator="over"/>
            </filter>
          </defs>

          {seats.length === 0 && mode === 'book' && (
            <text x="0.5" y="0.5" textAnchor="middle" dominantBaseline="central"
              fontSize="0.035" fill="#334155" fontFamily={ff}>
              No seats configured
            </text>
          )}

          {mode === 'book' && visibleSeats.map(seat => {
            const isSel = selectedSeats.includes(seat.id);
            const isOcc = seat.status === 'occupied';
            return (
              <g key={seat.id}
                className={`seat-g${isSel ? ' seat-selected' : ''}`}
                onClick={() => !isOcc && toggleSeat(seat.id)}
                onMouseEnter={e => handleSeatMouseEnter(e, seat)}
                onMouseLeave={handleSeatMouseLeave}
                style={{ cursor: isOcc ? 'not-allowed' : 'pointer' }}>

                <circle cx={seat.x} cy={seat.y} r={seatRadius * 2.2} fill="transparent" />

                {isSel && (
                  <circle cx={seat.x} cy={seat.y} r={seatRadius * 1.65}
                    fill="none" stroke="rgba(96,165,250,.25)" strokeWidth={0.004} />
                )}

                <SeatEl shape={seatShape} cx={seat.x} cy={seat.y}
                  fill={isOcc ? S.occupiedFill  : isSel ? S.selectedFill  : S.availableFill}
                  stroke={isOcc ? S.occupiedStroke : isSel ? S.selectedStroke : S.availableStroke}
                  r={seatRadius} glow={isSel} />

                {isOcc && (
                  <circle cx={seat.x} cy={seat.y} r={seatRadius} fill="rgba(239,68,68,.08)" stroke="none" />
                )}

                <text x={seat.x} y={seat.y} textAnchor="middle" dominantBaseline="central"
                  fontSize={seatRadius * 0.88 * (theme.typography.seatFontSize || 1)}
                  fill={isSel ? '#ffffff' : isOcc ? '#fca5a5' : '#cbd5e1'}
                  fontWeight={isSel ? '700' : '500'}
                  fontFamily="DM Mono, monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {isSel ? '✓' : seat.id}
                </text>
              </g>
            );
          })}

          {mode === 'edit' && visibleSeats.map((seat, idx) => (
            <g key={seat.id}>
              <circle cx={seat.x} cy={seat.y} r={editDotR * 1.8} fill="transparent" />
              <circle cx={seat.x} cy={seat.y} r={editDotR}
                fill={seat.status === 'occupied' ? '#ef4444' : '#10b981'}
                stroke={seat.status === 'occupied' ? '#7f1d1d' : '#064e3b'}
                strokeWidth={editDotR * 0.22} opacity={0.92} />
              <text x={seat.x + editDotR * 1.35} y={seat.y + editDotR * 0.42}
                fontSize={editDotR * 1.05} fill="#1e293b"
                fontFamily="DM Mono, monospace" fontWeight="700"
                stroke="#f1f5f9" strokeWidth={editDotR * 0.3} paintOrder="stroke"
                style={{ pointerEvents: 'none', userSelect: 'none' }}>{idx + 1}</text>
            </g>
          ))}
        </svg>

        {mode === 'book' && tooltip.seat && (
          <div className={`seat-tooltip ${tooltip.visible ? 'show' : 'hide'}`}
            style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: T.text, marginBottom: 4, fontSize: 12 }}>
              {tooltip.seat.id}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: tooltip.seat.status === 'available' ? T.success : '#ef4444' }}/>
              <span style={{ color: tooltip.seat.status === 'available' ? '#34d399' : '#f87171' }}>
                {tooltip.seat.status}
              </span>
            </div>
            {tooltip.seat.zone && (
              <div style={{ color: T.textDim, fontSize: 10, marginTop: 3 }}>
                Zone: <span style={{ color: '#cbd5e1' }}>{tooltip.seat.zone}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 12,
          background: 'rgba(10,13,20,.9)', backdropFilter: 'blur(10px)',
          borderRadius: br + 2, padding: '6px 13px', fontSize: 11,
          border: `1px solid ${T.border}`, pointerEvents: 'none', color: T.textDim }}>
          {mode === 'book'
            ? (
              [
                { key: 'available', fill: S.availableFill, stroke: S.availableStroke, label: 'Available', color: '#94a3b8' },
                { key: 'selected',  fill: S.selectedFill,  stroke: S.selectedStroke,  label: 'Selected',  color: '#93c5fd' },
                { key: 'occupied',  fill: S.occupiedFill,  stroke: S.occupiedStroke,  label: 'Occupied',  color: '#fca5a5' },
              ].map(({ key, fill, stroke, label, color }) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="9" height="9">
                    <circle cx="4.5" cy="4.5" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.5"/>
                  </svg>
                  <span style={{ color }}>{label}</span>
                </span>
              ))
            )
            : [{ color: '#10b981', stroke: '#064e3b', label: 'Available' },
               { color: '#ef4444', stroke: '#7f1d1d', label: 'Occupied' }].map(({ color, stroke, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="9" height="9"><circle cx="4.5" cy="4.5" r="3.5" fill={color} stroke={stroke} strokeWidth="1.5"/></svg>
                <span style={{ color: '#94a3b8' }}>{label}</span>
              </span>
            ))
          }
          {mode === 'edit' && (
            <span style={{ color: '#475569', marginLeft: 2 }}>click · shift+click to delete</span>
          )}
        </div>
      </div>
    </div>
  );
};