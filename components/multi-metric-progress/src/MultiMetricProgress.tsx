import { useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metric {
  label: string;
  value: number;
  max: number;
  color?: string;
  unit?: string;
}

// ─── Default colors ───────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#fb923c", // orange
  "#a3e635", // lime
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMetrics(data: unknown): Metric[] {
  if (!data || !Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, i): Metric => {
      const value = typeof item.value === "number" ? item.value : parseFloat(String(item.value ?? 0)) || 0;
      const max   = typeof item.max   === "number" ? item.max   : parseFloat(String(item.max   ?? 100)) || 100;
      return {
        label: String(item.label || item.name || item.title || `Metric ${i + 1}`),
        value,
        max: max > 0 ? max : 100,
        color: item.color ? String(item.color) : DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        unit: item.unit ? String(item.unit) : "",
      };
    });
}

// ─── Single Bar ───────────────────────────────────────────────────────────────

function ProgressBar({ metric, showValues, barHeight, animate }: {
  metric: Metric;
  showValues: boolean;
  barHeight: number;
  animate: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (metric.value / metric.max) * 100));
  const displayVal = Number.isInteger(metric.value) ? metric.value : metric.value.toFixed(1);
  const displayMax = Number.isInteger(metric.max) ? metric.max : metric.max.toFixed(1);

  return (
    <div className="mp-bar-row">
      <div className="mp-bar-header">
        <div className="mp-bar-label-wrap">
          <span className="mp-color-dot" style={{ background: metric.color }} />
          <span className="mp-bar-label">{metric.label}</span>
        </div>
        {showValues && (
          <span className="mp-bar-value">
            {displayVal}{metric.unit}
            <span className="mp-bar-max"> / {displayMax}{metric.unit}</span>
          </span>
        )}
      </div>
      <div className="mp-track" style={{ height: barHeight }}>
        <div
          className={["mp-fill", animate ? "animate" : ""].filter(Boolean).join(" ")}
          style={{
            width: `${pct}%`,
            background: metric.color,
          }}
        />
      </div>
      <div className="mp-pct-label">{Math.round(pct)}%</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MultiMetricProgress() {
  Retool.useComponentSettings({ defaultWidth: 12, defaultHeight: 28 });

  // ── Inputs
  const [metricsData] = Retool.useStateArray({
    name: "metrics",
    initialValue: [
      { label: "CPU Usage",    value: 72,  max: 100, color: "#0ea5e9", unit: "%" },
      { label: "Memory",       value: 5.4, max: 16,  color: "#10b981", unit: " GB" },
      { label: "Disk I/O",     value: 340, max: 500, color: "#f59e0b", unit: " MB/s" },
      { label: "Network",      value: 88,  max: 100, color: "#f43f5e", unit: "%" },
      { label: "Battery",      value: 61,  max: 100, color: "#6366f1", unit: "%" },
    ],
    label: "Metrics",
    description: "Array of metrics: [{ label, value, max, color?, unit? }]",
    inspector: "text",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "System Metrics",
    label: "Title",
    inspector: "text",
  });

  const [showValues] = Retool.useStateBoolean({
    name: "showValues",
    initialValue: true,
    label: "Show Values",
    inspector: "checkbox",
  });

  const [barHeight] = Retool.useStateNumber({
    name: "barHeight",
    initialValue: 10,
    label: "Bar Height (px)",
    inspector: "text",
  });

  const [animate] = Retool.useStateBoolean({
    name: "animate",
    initialValue: true,
    label: "Animate Bars",
    inspector: "checkbox",
  });

  // ── Outputs
  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onMetricClick = Retool.useEventCallback({ name: "metricClick" });
  const [, setClickedMetric] = Retool.useStateObject({
    name: "clickedMetric",
    initialValue: {},
    inspector: "hidden",
  });

  // ── Parse
  const metrics = useMemo(() => parseMetrics(metricsData), [metricsData]);

  // ── Fire outputs
  useMemo(() => {
    setModelUpdate({
      metrics: metrics.map((m) => ({
        label: m.label,
        value: m.value,
        max: m.max,
        percent: Math.round((m.value / m.max) * 100),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  const handleClick = (metric: Metric) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setClickedMetric(metric as any);
    onMetricClick();
  };

  return (
    <div className="mp-root">
      {/* Header */}
      <div className="mp-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6"  y1="20" x2="6"  y2="14" />
        </svg>
        <span className="mp-title">{title}</span>
        <span className="mp-count">{metrics.length} metrics</span>
      </div>

      {/* Bars */}
      <div className="mp-body">
        {metrics.length === 0 ? (
          <div className="mp-empty">No metrics configured. Pass an array of metrics.</div>
        ) : (
          metrics.map((metric, i) => (
            <div
              key={i}
              className="mp-bar-wrap"
              onClick={() => handleClick(metric)}
            >
              <ProgressBar
                metric={metric}
                showValues={showValues}
                barHeight={barHeight}
                animate={animate}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
