import { useState, useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrickState = "filled" | "partial" | "empty";

interface BrickData {
  index: number;
  state: BrickState;
  fillPercent: number; // 0–100, for partial bricks
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(val: number, unit: string, compact: boolean): string {
  if (compact && val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M${unit}`;
  if (compact && val >= 1_000) return `${(val / 1_000).toFixed(1)}K${unit}`;
  return `${val.toLocaleString()}${unit}`;
}

function buildBricks(total: number, allocated: number, brickCount: number): BrickData[] {
  const pct = Math.max(0, Math.min(1, total > 0 ? allocated / total : 0));
  const filledFloat = pct * brickCount;
  const fullBricks = Math.floor(filledFloat);
  const partialFill = (filledFloat - fullBricks) * 100;

  return Array.from({ length: brickCount }, (_, i): BrickData => {
    if (i < fullBricks) return { index: i, state: "filled", fillPercent: 100 };
    if (i === fullBricks && partialFill > 0) return { index: i, state: "partial", fillPercent: partialFill };
    return { index: i, state: "empty", fillPercent: 0 };
  });
}

// ─── Single Brick ─────────────────────────────────────────────────────────────

function Brick({ data, filledColor, emptyColor, brickWidth, brickHeight, gap, onClick }: {
  data: BrickData;
  filledColor: string;
  emptyColor: string;
  brickWidth: number;
  brickHeight: number;
  gap: number;
  onClick: (index: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="bb-brick"
      style={{
        width: brickWidth,
        height: brickHeight,
        margin: gap / 2,
        background: emptyColor,
        cursor: "pointer",
        transform: hovered ? "scale(1.08)" : "scale(1)",
        boxShadow: hovered ? `0 2px 8px rgba(0,0,0,0.18)` : "none",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onClick={() => onClick(data.index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Fill layer */}
      {data.state !== "empty" && (
        <div
          className={["bb-brick-fill", data.state === "filled" ? "full" : "partial"].join(" ")}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: data.state === "filled" ? "100%" : `${data.fillPercent}%`,
            background: filledColor,
            borderRadius: 4,
            transition: "height 0.4s ease",
          }}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrickBudgetVisualizer() {
  Retool.useComponentSettings({ defaultWidth: 14, defaultHeight: 28 });

  // ── Inputs
  const [total] = Retool.useStateNumber({
    name: "total",
    initialValue: 100000,
    label: "Total Budget",
    description: "Total budget or resource amount",
    inspector: "text",
  });

  const [allocated] = Retool.useStateNumber({
    name: "allocated",
    initialValue: 67500,
    label: "Allocated Amount",
    description: "Amount already allocated or used",
    inspector: "text",
  });

  const [brickCount] = Retool.useStateNumber({
    name: "brickCount",
    initialValue: 20,
    label: "Number of Bricks",
    description: "Total number of bricks in the wall (5–100)",
    inspector: "text",
  });

  const [brickWidth] = Retool.useStateNumber({
    name: "brickWidth",
    initialValue: 36,
    label: "Brick Width (px)",
    inspector: "text",
  });

  const [brickHeight] = Retool.useStateNumber({
    name: "brickHeight",
    initialValue: 28,
    label: "Brick Height (px)",
    inspector: "text",
  });

  const [filledColor] = Retool.useStateString({
    name: "filledColor",
    initialValue: "#f59e0b",
    label: "Filled Color",
    inspector: "text",
  });

  const [emptyColor] = Retool.useStateString({
    name: "emptyColor",
    initialValue: "#fef3c7",
    label: "Empty Color",
    inspector: "text",
  });

  const [unit] = Retool.useStateString({
    name: "unit",
    initialValue: "$",
    label: "Unit Prefix/Suffix",
    description: "Currency or unit symbol (e.g. $, €, hrs)",
    inspector: "text",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "Budget Allocation",
    label: "Title",
    inspector: "text",
  });

  const [showLegend] = Retool.useStateBoolean({
    name: "showLegend",
    initialValue: true,
    label: "Show Legend",
    inspector: "checkbox",
  });

  // ── Outputs
  const [, setClickedBrick] = Retool.useStateNumber({
    name: "clickedBrick",
    initialValue: -1,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onBrickClick = Retool.useEventCallback({ name: "brickClick" });

  // ── Compute
  const safeCount = Math.max(5, Math.min(100, brickCount));
  const bricks = useMemo(() => buildBricks(total, allocated, safeCount), [total, allocated, safeCount]);
  const pct = total > 0 ? Math.round((allocated / total) * 100) : 0;
  const remaining = total - allocated;
  const isOverBudget = allocated > total;

  // ── Fire outputs
  useMemo(() => {
    setModelUpdate({
      total,
      allocated,
      remaining,
      percent: pct,
      isOverBudget,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, allocated, pct]);

  const handleBrickClick = (index: number) => {
    setClickedBrick(index);
    onBrickClick();
  };

  const accentColor = isOverBudget ? "#ef4444" : filledColor;

  return (
    <div className="bb-root">
      {/* Header */}
      <div className="bb-header">
        <div className="bb-header-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="bb-title">{title}</span>
        </div>
        <span
          className="bb-pct-badge"
          style={{ background: isOverBudget ? "#fef2f2" : "#fffbeb", color: isOverBudget ? "#dc2626" : "#d97706", borderColor: isOverBudget ? "#fecaca" : "#fde68a" }}
        >
          {pct}% used
        </span>
      </div>

      {/* Brick wall */}
      <div className="bb-wall">
        {bricks.map((brick) => (
          <Brick
            key={brick.index}
            data={brick}
            filledColor={accentColor}
            emptyColor={emptyColor}
            brickWidth={brickWidth}
            brickHeight={brickHeight}
            gap={4}
            onClick={handleBrickClick}
          />
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="bb-legend">
          <div className="bb-legend-row">
            <div className="bb-legend-item">
              <span className="bb-legend-dot" style={{ background: accentColor }} />
              <span className="bb-legend-label">Allocated</span>
              <span className="bb-legend-val" style={{ color: accentColor }}>
                {formatValue(allocated, unit, true)}
              </span>
            </div>
            <div className="bb-legend-item">
              <span className="bb-legend-dot" style={{ background: emptyColor, border: "1px solid #cbd5e1" }} />
              <span className="bb-legend-label">Remaining</span>
              <span className="bb-legend-val" style={{ color: isOverBudget ? "#dc2626" : "#374151" }}>
                {isOverBudget ? `−${formatValue(Math.abs(remaining), unit, true)}` : formatValue(remaining, unit, true)}
              </span>
            </div>
          </div>
          <div className="bb-total-row">
            <span className="bb-total-label">Total</span>
            <span className="bb-total-val">{formatValue(total, unit, true)}</span>
          </div>
          {isOverBudget && (
            <div className="bb-over-budget">
              ⚠ Over budget by {formatValue(Math.abs(remaining), unit, true)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
