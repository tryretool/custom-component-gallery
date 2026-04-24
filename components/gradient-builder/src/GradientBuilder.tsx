import { useState, useMemo, useRef } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0–100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
const uid = () => `cs-${++idCounter}`;

const buildGradientCSS = (stops: ColorStop[], angle: number, type: string): string => {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const colorStr = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  if (type === "radial") return `radial-gradient(circle, ${colorStr})`;
  return `linear-gradient(${angle}deg, ${colorStr})`;
};

// ─── Color Stop Row ───────────────────────────────────────────────────────────

function ColorStopRow({
  stop,
  canRemove,
  onChange,
  onRemove,
}: {
  stop: ColorStop;
  canRemove: boolean;
  onChange: (id: string, patch: Partial<ColorStop>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="gb-stop-row">
      <input
        type="color"
        className="gb-color-picker"
        value={stop.color}
        onChange={(e) => onChange(stop.id, { color: e.target.value })}
      />
      <span className="gb-color-hex">{stop.color}</span>
      <input
        type="range"
        className="gb-position-slider"
        min={0}
        max={100}
        value={stop.position}
        onChange={(e) => onChange(stop.id, { position: parseInt(e.target.value, 10) })}
      />
      <span className="gb-position-val">{stop.position}%</span>
      {canRemove && (
        <button className="gb-remove-btn" onClick={() => onRemove(stop.id)} title="Remove color">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GradientBuilder() {
  Retool.useComponentSettings({ defaultWidth: 12, defaultHeight: 36 });

  // ── Outputs
  const [, setGradientCSS] = Retool.useStateString({
    name: "gradientCSS",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onGradientChange = Retool.useEventCallback({ name: "gradientChange" });

  // ── Local state
  const [stops, setStops] = useState<ColorStop[]>([
    { id: uid(), color: "#0ea5e9", position: 0 },
    { id: uid(), color: "#8b5cf6", position: 100 },
  ]);
  const [angle, setAngle] = useState(135);
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Computed
  const gradientCSS = useMemo(() => buildGradientCSS(stops, angle, gradientType), [stops, angle, gradientType]);

  // ── Fire outputs
  const fireOutputs = (css: string, stopsArr: ColorStop[], ang: number, type: string) => {
    setGradientCSS(css);
    setModelUpdate({
      gradientCSS: css,
      angle: ang,
      type,
      stops: stopsArr.map((s) => ({ color: s.color, position: s.position })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    onGradientChange();
  };

  const updateAndFire = (newStops: ColorStop[], newAngle: number, newType: string) => {
    const css = buildGradientCSS(newStops, newAngle, newType);
    fireOutputs(css, newStops, newAngle, newType);
  };

  // ── Handlers
  const handleStopChange = (id: string, patch: Partial<ColorStop>) => {
    const next = stops.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setStops(next);
    updateAndFire(next, angle, gradientType);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    const next = stops.filter((s) => s.id !== id);
    setStops(next);
    updateAndFire(next, angle, gradientType);
  };

  const handleAddStop = () => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const mid = Math.round((sorted[0].position + sorted[sorted.length - 1].position) / 2);
    const newStop: ColorStop = { id: uid(), color: "#10b981", position: mid };
    const next = [...stops, newStop];
    setStops(next);
    updateAndFire(next, angle, gradientType);
  };

  const handleAngleChange = (val: number) => {
    setAngle(val);
    updateAndFire(stops, val, gradientType);
  };

  const handleTypeChange = (type: "linear" | "radial") => {
    setGradientType(type);
    updateAndFire(stops, angle, type);
  };

  // ── Copy
  const handleCopy = () => {
    const code = `background: ${gradientCSS};`;
    const doFallback = () => {
      if (inputRef.current) {
        inputRef.current.value = code;
        inputRef.current.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
        } catch { /* silent */ }
      }
    };
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
        () => doFallback()
      );
    } else {
      doFallback();
    }
  };

  return (
    <div className="gb-root">
      <input ref={inputRef} className="gb-hidden-input" readOnly aria-hidden="true" />

      {/* ── Preview ── */}
      <div className="gb-preview" style={{ background: gradientCSS }} />

      {/* ── Controls ── */}
      <div className="gb-controls">

        {/* Type toggle */}
        <div className="gb-type-row">
          <button
            className={["gb-type-btn", gradientType === "linear" ? "active" : ""].filter(Boolean).join(" ")}
            onClick={() => handleTypeChange("linear")}
          >Linear</button>
          <button
            className={["gb-type-btn", gradientType === "radial" ? "active" : ""].filter(Boolean).join(" ")}
            onClick={() => handleTypeChange("radial")}
          >Radial</button>
        </div>

        {/* Angle (only for linear) */}
        {gradientType === "linear" && (
          <div className="gb-angle-row">
            <span className="gb-field-lbl">Angle</span>
            <input
              type="range"
              className="gb-angle-slider"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value, 10))}
            />
            <span className="gb-angle-val">{angle}°</span>
          </div>
        )}

        {/* Color stops */}
        <div className="gb-stops-section">
          <div className="gb-stops-header">
            <span className="gb-field-lbl">Colors</span>
            <button className="gb-add-btn" onClick={handleAddStop}>+ Add</button>
          </div>
          {stops.map((stop) => (
            <ColorStopRow
              key={stop.id}
              stop={stop}
              canRemove={stops.length > 2}
              onChange={handleStopChange}
              onRemove={handleRemoveStop}
            />
          ))}
        </div>
      </div>

      {/* ── Code output ── */}
      <div className="gb-output">
        <code className="gb-code">background: {gradientCSS};</code>
        <button
          className={["gb-copy-btn", copied ? "ok" : ""].filter(Boolean).join(" ")}
          onClick={handleCopy}
        >
          {copied ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
          )}
        </button>
      </div>
    </div>
  );
}
