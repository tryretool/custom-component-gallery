import { useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
// @ts-ignore — react-gauge-chart has no type declarations
import GaugeChart from "react-gauge-chart";
import "./styles.css";

// ─── Main Component ───────────────────────────────────────────────────────────

export function GaugeChartComponent() {
  Retool.useComponentSettings({ defaultWidth: 10, defaultHeight: 24 });

  // ── Inputs
  const [value] = Retool.useStateNumber({
    name: "value",
    initialValue: 72,
    label: "Value",
    description: "The current metric value (0–100 scale by default)",
    inspector: "text",
  });

  const [minValue] = Retool.useStateNumber({
    name: "minValue",
    initialValue: 0,
    label: "Min Value",
    description: "Minimum value of the gauge range",
    inspector: "text",
  });

  const [maxValue] = Retool.useStateNumber({
    name: "maxValue",
    initialValue: 100,
    label: "Max Value",
    description: "Maximum value of the gauge range",
    inspector: "text",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "CPU Usage",
    label: "Title",
    description: "Label shown below the gauge",
    inspector: "text",
  });

  const [unit] = Retool.useStateString({
    name: "unit",
    initialValue: "%",
    label: "Unit",
    description: "Unit suffix shown after the value (e.g. %, pts, $)",
    inspector: "text",
  });

  const [greenZone] = Retool.useStateNumber({
    name: "greenZone",
    initialValue: 50,
    label: "Green Zone (%)",
    description: "Percentage of the arc that is green (from left)",
    inspector: "text",
  });

  const [yellowZone] = Retool.useStateNumber({
    name: "yellowZone",
    initialValue: 30,
    label: "Yellow Zone (%)",
    description: "Percentage of the arc that is yellow (middle)",
    inspector: "text",
  });

  const [showNeedle] = Retool.useStateBoolean({
    name: "showNeedle",
    initialValue: true,
    label: "Show Needle",
    inspector: "checkbox",
  });

  const [animateNeedle] = Retool.useStateBoolean({
    name: "animateNeedle",
    initialValue: true,
    label: "Animate Needle",
    inspector: "checkbox",
  });

  // ── Outputs
  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  // ── Compute
  const range = maxValue - minValue;
  const percent = range > 0 ? Math.max(0, Math.min(1, (value - minValue) / range)) : 0;

  // Normalize zone percentages
  const gPct = Math.max(0, Math.min(100, greenZone)) / 100;
  const yPct = Math.max(0, Math.min(100, yellowZone)) / 100;
  const rPct = Math.max(0, 1 - gPct - yPct);

  const zoneLabel = percent <= gPct ? "Good" : percent <= gPct + yPct ? "Warning" : "Critical";
  const zoneColor = percent <= gPct ? "#16a34a" : percent <= gPct + yPct ? "#eab308" : "#dc2626";

  // Fire outputs
  useMemo(() => {
    setModelUpdate({
      value,
      percent: Math.round(percent * 100),
      zone: zoneLabel,
      title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, percent, zoneLabel, title]);

  return (
    <div className="gc-root">
      <div className="gc-chart-wrap">
        <GaugeChart
          id="retool-gauge"
          nrOfLevels={3}
          arcsLength={[gPct, yPct, rPct]}
          colors={["#22c55e", "#eab308", "#ef4444"]}
          percent={percent}
          arcPadding={0.02}
          arcWidth={0.25}
          cornerRadius={4}
          animate={animateNeedle}
          animDelay={0}
          animateDuration={800}
          needleColor="#475569"
          needleBaseColor="#1e293b"
          hideText
          style={{ width: "100%", maxWidth: 280 }}
        />
      </div>

      {/* Value display */}
      <div className="gc-value-row">
        <span className="gc-value" style={{ color: zoneColor }}>
          {typeof value === "number" ? value.toLocaleString() : value}
          <span className="gc-unit">{unit}</span>
        </span>
        <span className="gc-zone-badge" style={{ background: zoneColor }}>
          {zoneLabel}
        </span>
      </div>

      {/* Title */}
      {title && <div className="gc-title">{title}</div>}

      {/* Range labels */}
      <div className="gc-range-row">
        <span className="gc-range-label">{minValue}</span>
        <span className="gc-range-label">{maxValue}</span>
      </div>
    </div>
  );
}
