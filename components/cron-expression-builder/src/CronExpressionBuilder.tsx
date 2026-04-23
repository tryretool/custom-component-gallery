import { useState, useEffect, useRef, useCallback } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "minute" | "hour" | "day" | "week" | "month" | "year";

interface CronState {
  period: Period;
  minutes: number[];
  hours: number[];
  monthDays: number[];
  months: number[];
  weekDays: number[];
  everyNMinutes: number;
  everyNHours: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const MONTHS = [
  { label: "Jan", value: 1 },
  { label: "Feb", value: 2 },
  { label: "Mar", value: 3 },
  { label: "Apr", value: 4 },
  { label: "May", value: 5 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
  { label: "Aug", value: 8 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 10 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
];

const PERIODS: { label: string; value: Period }[] = [
  { label: "Minute", value: "minute" },
  { label: "Hour",   value: "hour"   },
  { label: "Day",    value: "day"    },
  { label: "Week",   value: "week"   },
  { label: "Month",  value: "month"  },
  { label: "Year",   value: "year"   },
];

// ─── Cron Parser / Builder ────────────────────────────────────────────────────

function parseCron(cron: string): CronState {
  const defaults: CronState = {
    period: "day", minutes: [0], hours: [9],
    monthDays: [1], months: [], weekDays: [],
    everyNMinutes: 5, everyNHours: 1,
  };
  if (!cron || cron.trim() === "") return defaults;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaults;
  const [min, hour, dom, month, dow] = parts;

  const parseList = (s: string, max: number): number[] => {
    if (s === "*") return [];
    const result: number[] = [];
    s.split(",").forEach((part) => {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        for (let i = a; i <= Math.min(b, max); i++) result.push(i);
      } else if (!part.includes("/")) {
        const n = parseInt(part, 10);
        if (!isNaN(n)) result.push(n);
      }
    });
    return [...new Set(result)].sort((a, b) => a - b);
  };

  let period: Period = "day";
  if (min === "*" && hour === "*") period = "minute";
  else if (hour === "*" && dom === "*" && month === "*" && dow === "*") period = "hour";
  else if (dom === "*" && month === "*" && dow === "*") period = "day";
  else if (dom === "*" && month === "*" && dow !== "*") period = "week";
  else if (dom !== "*" && month === "*" && dow === "*") period = "month";
  else if (dom !== "*" && month !== "*" && dow === "*") period = "year";

  const everyNMinutes = min.startsWith("*/") ? parseInt(min.slice(2), 10) : 5;
  const everyNHours   = hour.startsWith("*/") ? parseInt(hour.slice(2), 10) : 1;

  return {
    period,
    minutes:    parseList(min, 59),
    hours:      parseList(hour, 23),
    monthDays:  parseList(dom, 31),
    months:     parseList(month, 12),
    weekDays:   parseList(dow, 6),
    everyNMinutes: isNaN(everyNMinutes) ? 5 : everyNMinutes,
    everyNHours:   isNaN(everyNHours)   ? 1 : everyNHours,
  };
}

function buildCron(s: CronState): string {
  const f = (arr: number[], wc = "*") => arr.length === 0 ? wc : arr.join(",");
  switch (s.period) {
    case "minute": return `*/${s.everyNMinutes} * * * *`;
    case "hour":   return `${f(s.minutes)} */${s.everyNHours} * * *`;
    case "day":    return `${f(s.minutes)} ${f(s.hours)} * * *`;
    case "week":   return `${f(s.minutes)} ${f(s.hours)} * * ${f(s.weekDays, "0")}`;
    case "month":  return `${f(s.minutes)} ${f(s.hours)} ${f(s.monthDays, "1")} * *`;
    case "year":   return `${f(s.minutes)} ${f(s.hours)} ${f(s.monthDays, "1")} ${f(s.months, "1")} *`;
    default:       return "0 9 * * *";
  }
}

function describe(s: CronState): string {
  const fmtTime = (h: number[], m: number[]) => {
    const hh = h.length ? h : [0];
    const mm = m.length ? m : [0];
    if (hh.length === 1 && mm.length === 1) {
      const ap = hh[0] >= 12 ? "PM" : "AM";
      const h12 = hh[0] % 12 === 0 ? 12 : hh[0] % 12;
      return `${h12}:${String(mm[0]).padStart(2, "0")} ${ap}`;
    }
    return `${hh.join(",")}:${mm.map((v) => String(v).padStart(2, "0")).join(",")}`;
  };
  const fmtDays   = (d: number[]) => d.length === 0 || d.length === 7 ? "every day" : d.map((v) => DAYS[v]?.label).join(", ");
  const fmtMonths = (m: number[]) => m.length === 0 || m.length === 12 ? "every month" : m.map((v) => MONTHS[v - 1]?.label).join(", ");

  switch (s.period) {
    case "minute": return s.everyNMinutes === 1 ? "Every minute" : `Every ${s.everyNMinutes} minutes`;
    case "hour":   return s.everyNHours === 1 ? `Every hour at :${String(s.minutes[0] ?? 0).padStart(2,"0")}` : `Every ${s.everyNHours} hours at :${String(s.minutes[0] ?? 0).padStart(2,"0")}`;
    case "day":    return `Every day at ${fmtTime(s.hours, s.minutes)}`;
    case "week":   return `Every ${fmtDays(s.weekDays)} at ${fmtTime(s.hours, s.minutes)}`;
    case "month":  return `Day ${s.monthDays.join(", ") || "1"} of every month at ${fmtTime(s.hours, s.minutes)}`;
    case "year":   return `Day ${s.monthDays.join(", ") || "1"} of ${fmtMonths(s.months)} at ${fmtTime(s.hours, s.minutes)}`;
    default:       return "";
  }
}

// ─── DayPicker ────────────────────────────────────────────────────────────────

function DayPicker({ selected, onChange, disabled }: {
  selected: number[];
  onChange: (d: number[]) => void;
  disabled: boolean;
}) {
  const dragging  = useRef(false);
  const dragMode  = useRef<"add" | "remove">("add");
  const dragStart = useRef<number | null>(null);
  const dragEnd   = useRef<number | null>(null);
  const base      = useRef<number[]>([]);
  const [, forceRender] = useState(0);

  const range = (): number[] => {
    if (dragStart.current === null || dragEnd.current === null) return [];
    const a = Math.min(dragStart.current, dragEnd.current);
    const b = Math.max(dragStart.current, dragEnd.current);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  };

  const compute = (): number[] => {
    const r = range();
    return dragMode.current === "add"
      ? [...new Set([...base.current, ...r])].sort((a, b) => a - b)
      : base.current.filter((d) => !r.includes(d));
  };

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    dragStart.current = null;
    dragEnd.current = null;
    forceRender((n) => n + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [onUp]);

  const onDown = (v: number) => {
    if (disabled) return;
    dragging.current = true;
    dragStart.current = v;
    dragEnd.current = v;
    dragMode.current = selected.includes(v) ? "remove" : "add";
    base.current = [...selected];
    onChange(compute());
    forceRender((n) => n + 1);
  };

  const onEnter = (v: number) => {
    if (!dragging.current || disabled) return;
    dragEnd.current = v;
    onChange(compute());
    forceRender((n) => n + 1);
  };

  const r = range();

  return (
    <div className="day-picker">
      {DAYS.map((day) => {
        const sel = selected.includes(day.value);
        const inRange    = dragging.current && r.includes(day.value);
        const willAdd    = inRange && dragMode.current === "add"    && !sel;
        const willRemove = inRange && dragMode.current === "remove" && sel;
        return (
          <div
            key={day.value}
            className={["day-chip", sel ? "sel" : "", willAdd ? "drag-add" : "", willRemove ? "drag-rm" : "", disabled ? "dis" : ""].filter(Boolean).join(" ")}
            onMouseDown={() => onDown(day.value)}
            onMouseEnter={() => onEnter(day.value)}
          >
            {day.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── ChipGrid ─────────────────────────────────────────────────────────────────

function ChipGrid({ items, selected, onChange, disabled, cols = 8, customInput, onCustomChange }: {
  items: { label: string; value: number }[];
  selected: number[];
  onChange: (v: number[]) => void;
  disabled: boolean;
  cols?: number;
  customInput?: boolean;
  onCustomChange?: (vals: number[]) => void;
}) {
  const [customVal, setCustomVal] = useState("");

  const toggle = (v: number) => {
    if (disabled) return;
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v].sort((a, b) => a - b));
  };

  const applyCustom = () => {
    if (!onCustomChange || !customVal.trim()) return;
    const nums = customVal
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 59);
    if (nums.length > 0) {
      onCustomChange([...new Set([...selected, ...nums])].sort((a, b) => a - b));
      setCustomVal("");
    }
  };

  // Merge preset items with any custom selected values so they all show as chips
  const presetValues = new Set(items.map((i) => i.value));
  const customSelected = selected.filter((v) => !presetValues.has(v));
  const allItems = [
    ...items,
    ...customSelected.map((v) => ({ label: String(v), value: v })),
  ];

  return (
    <div className="chip-grid-wrap">
      <div className="chip-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {allItems.map((item) => (
          <div
            key={item.value}
            className={["chip", selected.includes(item.value) ? "sel" : "", disabled ? "dis" : ""].filter(Boolean).join(" ")}
            onClick={() => toggle(item.value)}
          >
            {item.label}
          </div>
        ))}
      </div>
      {customInput && (
        <div className="custom-input-row">
          <input
            className="custom-input"
            type="text"
            placeholder="Custom values, e.g. 2, 4, 17"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            disabled={disabled}
          />
          <button className="custom-apply-btn" onClick={applyCustom} disabled={disabled || !customVal.trim()}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NumStepper ───────────────────────────────────────────────────────────────

function NumStepper({ value, min, max, onChange, disabled }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; disabled: boolean;
}) {
  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min}>−</button>
      <span className="step-val">{String(value).padStart(2, "0")}</span>
      <button className="step-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max}>+</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CronExpressionBuilder() {
  Retool.useComponentSettings({ defaultWidth: 18, defaultHeight: 30 });

  const [initialValue] = Retool.useStateString({
    name: "initialValue", initialValue: "0 9 * * 1-5",
    label: "Initial Cron Value", description: "Starting cron expression", inspector: "text",
  });
  const [disabled] = Retool.useStateBoolean({
    name: "disabled", initialValue: false, label: "Disabled", inspector: "checkbox",
  });
  const [, setCronValue]     = Retool.useStateString({ name: "cronValue",     initialValue: "0 9 * * 1-5", inspector: "hidden" });
  const [, setHumanReadable] = Retool.useStateString({ name: "humanReadable", initialValue: "",            inspector: "hidden" });
  const [, setModelUpdate]   = Retool.useStateObject({ name: "modelUpdate",   initialValue: {},            inspector: "hidden" });
  const onCronChange = Retool.useEventCallback({ name: "cronChange" });

  const [state, setState] = useState<CronState>(() => parseCron(initialValue || "0 9 * * 1-5"));
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (initialValue) setState(parseCron(initialValue)); }, [initialValue]);

  const cron  = buildCron(state);
  const label = describe(state);

  const update = (patch: Partial<CronState>) => {
    const next = { ...state, ...patch };
    setState(next);
    const c = buildCron(next);
    const h = describe(next);
    setCronValue(c);
    setHumanReadable(h);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setModelUpdate({ cronExpression: c, humanReadable: h } as any);
    onCronChange();
  };

  const handleCopy = () => {
    const doFallback = () => {
      if (inputRef.current) {
        inputRef.current.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
        } catch { /* silent */ }
      }
    };
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cron).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
        () => doFallback()
      );
    } else {
      doFallback();
    }
  };

  const H = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, "0"), value: i }));
  const M = Array.from({ length: 12 }, (_, i) => ({ label: String(i * 5).padStart(2, "0"), value: i * 5 }));
  const needsTime = ["day", "week", "month", "year"].includes(state.period);

  return (
    <div className="cb-root">

      {/* Period tabs */}
      <div className="cb-period-row">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={["cb-period", state.period === p.value ? "active" : ""].filter(Boolean).join(" ")}
            onClick={() => update({ period: p.value })}
            disabled={disabled}
          >{p.label}</button>
        ))}
      </div>

      {/* Controls */}
      <div className="cb-body">

        {state.period === "minute" && (
          <div className="cb-row">
            <span className="cb-lbl">Every</span>
            <NumStepper value={state.everyNMinutes} min={1} max={59} onChange={(v) => update({ everyNMinutes: v })} disabled={disabled} />
            <span className="cb-lbl">minutes</span>
          </div>
        )}

        {state.period === "hour" && (
          <div className="cb-row">
            <span className="cb-lbl">Every</span>
            <NumStepper value={state.everyNHours} min={1} max={23} onChange={(v) => update({ everyNHours: v })} disabled={disabled} />
            <span className="cb-lbl">hours at minute</span>
            <NumStepper value={state.minutes[0] ?? 0} min={0} max={59} onChange={(v) => update({ minutes: [v] })} disabled={disabled} />
          </div>
        )}

        {needsTime && (
          <div className="cb-time-block">
            <div className="cb-time-col">
              <span className="cb-field-lbl">Hour</span>
              <ChipGrid items={H} selected={state.hours} onChange={(v) => update({ hours: v.length ? v : [0] })} disabled={disabled} cols={8} />
            </div>
            <div className="cb-time-col">
              <span className="cb-field-lbl">Minute</span>
              <ChipGrid
                items={M}
                selected={state.minutes}
                onChange={(v) => update({ minutes: v.length ? v : [0] })}
                disabled={disabled}
                cols={6}
                customInput
                onCustomChange={(v) => update({ minutes: v })}
              />
            </div>
          </div>
        )}

        {state.period === "week" && (
          <div className="cb-field-block">
            <span className="cb-field-lbl">
              Days of week
              <em className="cb-drag-hint"> — drag to select a range</em>
            </span>
            <DayPicker selected={state.weekDays} onChange={(d) => update({ weekDays: d })} disabled={disabled} />
          </div>
        )}

        {(state.period === "month" || state.period === "year") && (
          <div className="cb-field-block">
            <span className="cb-field-lbl">Day of month</span>
            <ChipGrid
              items={Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
              selected={state.monthDays}
              onChange={(v) => update({ monthDays: v.length ? v : [1] })}
              disabled={disabled}
              cols={8}
              customInput
              onCustomChange={(v) => update({ monthDays: v })}
            />
          </div>
        )}

        {state.period === "year" && (
          <div className="cb-field-block">
            <span className="cb-field-lbl">Months</span>
            <ChipGrid items={MONTHS} selected={state.months} onChange={(v) => update({ months: v.length ? v : [1] })} disabled={disabled} cols={6} />
          </div>
        )}
      </div>

      {/* Output bar */}
      <div className="cb-output">
        <input ref={inputRef} className="cb-hidden-input" readOnly value={cron} aria-hidden="true" />
        <div className="cb-output-left">
          <code className="cb-code">{cron}</code>
          <span className="cb-desc">{label}</span>
        </div>
        <button
          className={["cb-copy", copied ? "ok" : ""].filter(Boolean).join(" ")}
          onClick={handleCopy}
          title="Copy cron expression"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
