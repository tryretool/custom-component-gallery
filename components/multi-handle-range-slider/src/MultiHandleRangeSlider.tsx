import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // rose
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#fb923c", // orange
];

const HANDLE_COLORS = [
  "#059669",
  "#d97706",
  "#dc2626",
  "#4f46e5",
  "#0d9488",
  "#ea580c",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function snap(val: number, step: number, min: number) {
  return Math.round((val - min) / step) * step + min;
}

function parseHandles(data: unknown, min: number, max: number): number[] {
  if (Array.isArray(data) && data.length >= 2) {
    return data
      .map((v) => clamp(parseFloat(String(v)), min, max))
      .sort((a, b) => a - b);
  }
  // Default: 3 evenly spaced handles
  const range = max - min;
  return [min + range * 0.25, min + range * 0.5, min + range * 0.75];
}

function parseLabels(data: unknown, count: number): string[] {
  if (Array.isArray(data) && data.length > 0) {
    return data.map(String);
  }
  return Array.from({ length: count + 1 }, (_, i) => {
    const labels = ["Free", "Basic", "Pro", "Enterprise", "Custom"];
    return labels[i] ?? `Tier ${i + 1}`;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MultiHandleRangeSlider() {
  Retool.useComponentSettings({ defaultWidth: 16, defaultHeight: 14 });

  // ── Inputs
  const [min] = Retool.useStateNumber({
    name: "min",
    initialValue: 0,
    label: "Min",
    inspector: "text",
  });

  const [max] = Retool.useStateNumber({
    name: "max",
    initialValue: 1000,
    label: "Max",
    inspector: "text",
  });

  const [step] = Retool.useStateNumber({
    name: "step",
    initialValue: 10,
    label: "Step",
    inspector: "text",
  });

  const [initialHandles] = Retool.useStateArray({
    name: "handles",
    initialValue: [250, 500, 750],
    label: "Handle Values",
    description: "Array of handle positions (e.g. [250, 500, 750])",
    inspector: "text",
  });

  const [segmentLabelsData] = Retool.useStateArray({
    name: "segmentLabels",
    initialValue: ["Free", "Basic", "Pro", "Enterprise"],
    label: "Segment Labels",
    description: "Labels for each segment between handles (count = handles + 1)",
    inspector: "text",
  });

  const [unit] = Retool.useStateString({
    name: "unit",
    initialValue: "$",
    label: "Unit",
    inspector: "text",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "Price Tiers",
    label: "Title",
    inspector: "text",
  });

  const [disabled] = Retool.useStateBoolean({
    name: "disabled",
    initialValue: false,
    label: "Disabled",
    inspector: "checkbox",
  });

  // ── Outputs
  const [, setValues] = Retool.useStateArray({
    name: "values",
    initialValue: [],
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onChange = Retool.useEventCallback({ name: "onChange" });

  // ── Local state
  const [handles, setHandles] = useState<number[]>(() =>
    parseHandles(initialHandles, min, max)
  );

  useEffect(() => {
    setHandles(parseHandles(initialHandles, min, max));
  }, [initialHandles, min, max]);

  const segmentLabels = useMemo(
    () => parseLabels(segmentLabelsData, handles.length),
    [segmentLabelsData, handles.length]
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);

  // ── Fire outputs
  const fireOutputs = useCallback((vals: number[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValues(vals as any);
    const segments = [min, ...vals, max].reduce<{ label: string; from: number; to: number }[]>((acc, v, i, arr) => {
      if (i < arr.length - 1) {
        acc.push({ label: segmentLabels[i] ?? `Segment ${i + 1}`, from: v, to: arr[i + 1] });
      }
      return acc;
    }, []);
    setModelUpdate({
      handles: vals,
      segments,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    onChange();
  }, [min, max, segmentLabels, setValues, setModelUpdate, onChange]);

  // ── Drag logic
  const getValueFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = min + pct * (max - min);
    return snap(raw, step, min);
  }, [min, max, step]);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    draggingIndex.current = index;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggingIndex.current === null) return;
      const idx = draggingIndex.current;
      const newVal = getValueFromX(e.clientX);
      setHandles((prev) => {
        const next = [...prev];
        const lo = idx === 0 ? min : prev[idx - 1] + step;
        const hi = idx === prev.length - 1 ? max : prev[idx + 1] - step;
        next[idx] = clamp(newVal, lo, hi);
        fireOutputs(next);
        return next;
      });
    };

    const onMouseUp = () => { draggingIndex.current = null; };
    const onTouchMove = (e: TouchEvent) => {
      if (draggingIndex.current === null) return;
      onMouseMove({ clientX: e.touches[0].clientX } as MouseEvent);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [getValueFromX, fireOutputs, min, max, step]);

  // ── Compute positions
  const toPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const allPoints = [min, ...handles, max];
  const segments = allPoints.slice(0, -1).map((from, i) => ({
    from,
    to: allPoints[i + 1],
    left: toPercent(from),
    width: toPercent(allPoints[i + 1]) - toPercent(from),
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    label: segmentLabels[i] ?? `Segment ${i + 1}`,
  }));

  return (
    <div className="mh-root">
      {/* Header */}
      <div className="mh-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="14" cy="12" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        <span className="mh-title">{title}</span>
        <span className="mh-handle-count">{handles.length} handles</span>
      </div>

      {/* Slider area */}
      <div className="mh-slider-area">
        {/* Segment labels above */}
        <div className="mh-segment-labels">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="mh-seg-label"
              style={{ left: `${seg.left + seg.width / 2}%` }}
            >
              <span className="mh-seg-name" style={{ color: seg.color }}>{seg.label}</span>
            </div>
          ))}
        </div>

        {/* Track */}
        <div className="mh-track-wrap" ref={trackRef}>
          {/* Colored segments */}
          {segments.map((seg, i) => (
            <div
              key={i}
              className="mh-segment"
              style={{
                left: `${seg.left}%`,
                width: `${seg.width}%`,
                background: seg.color,
                opacity: disabled ? 0.5 : 1,
              }}
            />
          ))}

          {/* Handles */}
          {handles.map((val, i) => (
            <div
              key={i}
              className={["mh-handle", disabled ? "disabled" : ""].filter(Boolean).join(" ")}
              style={{
                left: `${toPercent(val)}%`,
                background: HANDLE_COLORS[i % HANDLE_COLORS.length],
                borderColor: HANDLE_COLORS[i % HANDLE_COLORS.length],
              }}
              onMouseDown={(e) => handleMouseDown(e, i)}
              onTouchStart={(e) => {
                if (disabled) return;
                e.preventDefault();
                draggingIndex.current = i;
              }}
            >
              <div className="mh-handle-tooltip">
                {unit}{val.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Min/Max labels */}
        <div className="mh-minmax">
          <span>{unit}{min.toLocaleString()}</span>
          <span>{unit}{max.toLocaleString()}</span>
        </div>
      </div>

      {/* Value chips */}
      <div className="mh-chips">
        {handles.map((val, i) => (
          <div key={i} className="mh-chip" style={{ borderColor: HANDLE_COLORS[i % HANDLE_COLORS.length] }}>
            <span className="mh-chip-dot" style={{ background: HANDLE_COLORS[i % HANDLE_COLORS.length] }} />
            <span className="mh-chip-val">{unit}{val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
