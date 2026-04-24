import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";

type FunnelRow = {
  name: string;
  value: number;
};

type FunnelType =
  | "auto"
  | "compact"
  | "flat"
  | "classic"
  | "smooth"
  | "pinched"
  | "reverse";

const TYPE_LABELS: Record<FunnelType, string> = {
  auto: "Auto",
  compact: "Compact",
  flat: "Flat",
  classic: "Classic",
  smooth: "Smooth",
  pinched: "Pinched",
  reverse: "Reverse",
};

const COLORS = [
  "#9FD42E",
  "#41BE82",
  "#2EA39A",
  "#3C759E",
  "#4F3A8A",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
];

const clamp = (n: number, min = 0, max = 255) =>
  Math.max(min, Math.min(max, n));

const hexToRgb = (input: string) => {
  const fallback = { r: 159, g: 212, b: 46 };
  if (!input) return fallback;

  let hex = input.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return fallback;

  const num = parseInt(hex, 16);
  if (Number.isNaN(num)) return fallback;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const lighten = (input: string, amount: number) => {
  const { r, g, b } = hexToRgb(input);
  return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
};

const darken = (input: string, amount: number) => {
  const { r, g, b } = hexToRgb(input);
  return `rgb(${clamp(r - amount)}, ${clamp(g - amount)}, ${clamp(b - amount)})`;
};

const normalizeObject = (o: Record<string, unknown>): FunnelRow[] =>
  Object.entries(o).map(([k, v]) => ({
    name: String(k),
    value: Number(v) || 0,
  }));

const getNumericKeys = (o: Record<string, unknown>) =>
  Object.keys(o).filter((k) => typeof o[k] === "number");

const getCategoryKey = (o: Record<string, unknown>) => {
  const nums = new Set(getNumericKeys(o));
  return Object.keys(o).find((k) => !nums.has(k)) || Object.keys(o)[0];
};

const formatNumber = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
};

const sortDescending = (rows: FunnelRow[]) =>
  [...rows].sort((a, b) => b.value - a.value);

const sortAscending = (rows: FunnelRow[]) =>
  [...rows].sort((a, b) => a.value - b.value);

const chooseAutoType = (rows: FunnelRow[], isSmall: boolean): FunnelType => {
  if (!rows.length) return "compact";
  if (isSmall) return "compact";

  const desc = sortDescending(rows);
  const values = desc.map((r) => r.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const ratio = min / max;

  if (rows.length >= 7) return "compact";
  if (ratio < 0.18) return "pinched";
  if (ratio < 0.35) return "classic";
  if (ratio < 0.6) return "smooth";
  return "flat";
};

export const SmartFunnelChart: FC = () => {
  Retool.useComponentSettings({
    defaultWidth: 6,
    defaultHeight: 18,
  });

  const [data] = Retool.useStateArray({
    name: "chartData",
    initialValue: [],
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "",
  });

  const [selectedType, setSelectedType] = useState<FunnelType>("auto");

  const [is3D] = Retool.useStateBoolean({
    name: "threeD",
    label: "3D",
    initialValue: false,
    inspector: "checkbox",
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(460);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setWidth(Math.max(220, rect.width || 460));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const normalized = useMemo<FunnelRow[]>(() => {
    if (!data) return [];

    if (!Array.isArray(data) && typeof data === "object") {
      return normalizeObject(data as Record<string, unknown>);
    }

    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      data[0] !== null
    ) {
      const first = data[0] as Record<string, unknown>;

      if ("name" in first && "value" in first) {
        return (data as Record<string, unknown>[]).map((item) => ({
          name: String(item.name ?? ""),
          value: Number(item.value ?? 0),
        }));
      }

      const numKeys = getNumericKeys(first);
      const catKey = getCategoryKey(first);

      if (numKeys.length > 0) {
        return (data as Record<string, unknown>[]).map((row) => ({
          name: String(row[catKey] ?? ""),
          value: Number(row[numKeys[0]] ?? 0),
        }));
      }
    }

    return [];
  }, [data]);

  const cleaned = useMemo(
    () => normalized.filter((d) => Number.isFinite(d.value) && d.value >= 0),
    [normalized]
  );

  const stageCount = Math.max(cleaned.length, 1);

  const isTiny = width <= 420;
  const isSmall = width <= 620;

  const resolvedType = useMemo<FunnelType>(() => {
    if (selectedType !== "auto") return selectedType;
    return chooseAutoType(cleaned, isSmall);
  }, [selectedType, cleaned, isSmall]);

  const displayData = useMemo(() => {
    if (resolvedType === "reverse") return sortAscending(cleaned);
    return sortDescending(cleaned);
  }, [cleaned, resolvedType]);

  const topValue = Math.max(...displayData.map((d) => d.value), 1);
  const percentBase =
    resolvedType === "reverse"
      ? Math.max(displayData[0]?.value || 1, 1)
      : topValue;

  const outerPad = isTiny ? 6 : 10;
  const headerHeight = isTiny ? 30 : 38;
  const showDropdown = width > 290;

  const gap =
    resolvedType === "smooth"
      ? isTiny
        ? 2
        : 4
      : resolvedType === "compact" || isSmall
        ? isTiny
          ? 6
          : 8
        : 12;

  const stageHeightPx =
    stageCount <= 4
      ? isTiny
        ? 48
        : 58
      : stageCount <= 6
        ? isTiny
          ? 40
          : 50
        : isTiny
          ? 34
          : 42;

  const depthX = is3D ? (isTiny ? 5 : 8) : 0;
  const depthY = is3D ? (isTiny ? 4 : 6) : 0;

  const chartTopPad = is3D ? depthY + 4 : 0;
  const chartBottomPad = is3D ? 4 : 0;

  const chartHeight =
    chartTopPad +
    chartBottomPad +
    stageCount * stageHeightPx +
    (stageCount - 1) * gap +
    (isTiny ? 10 : 18);

  const componentHeight = chartHeight + headerHeight + outerPad * 2;

  const chartWidth = Math.max(120, width - outerPad * 2);
  const maxStageWidth =
    chartWidth *
    (resolvedType === "compact" || isSmall
      ? 0.78
      : resolvedType === "flat"
        ? 0.82
        : 0.72);

  const minStageWidth =
    resolvedType === "pinched"
      ? Math.max(44, chartWidth * 0.12)
      : Math.max(56, chartWidth * 0.16);

  const widths = useMemo(() => {
    return displayData.map((d, i) => {
      let w = (d.value / topValue) * maxStageWidth;

      if (resolvedType === "compact") w *= 0.96;
      if (resolvedType === "pinched" && i === displayData.length - 1) w *= 0.72;

      return Math.max(w, minStageWidth);
    });
  }, [displayData, maxStageWidth, minStageWidth, resolvedType, topValue]);

  const labelFontSize = isTiny ? 8 : isSmall ? 12 : 16;
  const valueFontSize = isTiny ? 7 : isSmall ? 10 : 13;

  if (!displayData.length) {
    return (
      <div
        ref={rootRef}
        style={{
          width: "100%",
          minHeight: 220,
          boxSizing: "border-box",
          border: "1px solid #CFCFCF",
          background: "#E6E6E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 14,
          fontFamily: "Inter, Arial, sans-serif",
          padding: outerPad,
        }}
      >
        No data
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        minHeight: componentHeight,
        boxSizing: "border-box",
        border: "1px solid #CFCFCF",
        // background: "#E6E6E6",
        padding: outerPad,
        overflow: "hidden",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          height: headerHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: title ? "space-between" : "flex-end",
          marginBottom: isTiny ? 2 : 6,
          gap: 8,
        }}
      >
        {title ? (
          <div
            title={title}
            style={{
              fontSize: isTiny ? 13 : 15,
              fontWeight: 600,
              color: "#222",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "55%",
            }}
          >
            {title}
          </div>
        ) : (
          <div />
        )}

        {showDropdown && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as FunnelType)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                height: isTiny ? 28 : 34,
                minWidth: isTiny ? 78 : 96,
                padding: `0 ${isTiny ? 26 : 30}px 0 10px`,
                border: "1px solid #BDBDBD",
                borderRadius: 10,
                background: "#F5F5F5",
                color: "#111",
                fontSize: isTiny ? 11 : 12,
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <span
              style={{
                position: "absolute",
                right: 9,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#666",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg
                width={isTiny ? "10" : "12"}
                height={isTiny ? "10" : "12"}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        )}
      </div>

      <svg
        width={chartWidth + depthX + 2}
        height={chartHeight + depthY + 2}
        style={{ display: "block" }}
      >
        {displayData.map((item, i) => {
          const y = chartTopPad + i * (stageHeightPx + gap);
          const wTop = widths[i];
          const wBottom =
            i < widths.length - 1
              ? widths[i + 1]
              : resolvedType === "pinched"
                ? Math.max(widths[i] * 0.72, minStageWidth)
                : widths[i];

          const xTopLeft = chartWidth / 2 - wTop / 2;
          const xTopRight = chartWidth / 2 + wTop / 2;
          const xBottomLeft = chartWidth / 2 - wBottom / 2;
          const xBottomRight = chartWidth / 2 + wBottom / 2;

          const color = COLORS[i % COLORS.length];
          const topFace = lighten(color, 22);
          const sideFace = darken(color, 18);
          const pct = ((item.value / percentBase) * 100).toFixed(1);

          const centerY = y + stageHeightPx / 2;
          const showValue = stageHeightPx >= (isTiny ? 34 : 42);

          const labelY = showValue ? centerY - (isTiny ? 6 : 8) : centerY + 1;
          const valueY = centerY + (isTiny ? 9 : 13);

          const labelProps = {
            x: chartWidth / 2,
            textAnchor: "middle" as const,
            fill: "#FFFFFF",
            fontSize: labelFontSize,
            fontWeight: 600,
          };

          const valueProps = {
            x: chartWidth / 2,
            textAnchor: "middle" as const,
            fill: "#FFFFFF",
            fontSize: valueFontSize,
            fontWeight: 500,
          };

          const frontPoints = [
            `${xTopLeft},${y}`,
            `${xTopRight},${y}`,
            `${xBottomRight},${y + stageHeightPx}`,
            `${xBottomLeft},${y + stageHeightPx}`,
          ].join(" ");

          const topPoints = [
            `${xTopLeft},${y}`,
            `${xTopRight},${y}`,
            `${xTopRight + depthX},${y - depthY}`,
            `${xTopLeft + depthX},${y - depthY}`,
          ].join(" ");

          const sidePoints = [
            `${xTopRight},${y}`,
            `${xBottomRight},${y + stageHeightPx}`,
            `${xBottomRight + depthX},${y + stageHeightPx - depthY}`,
            `${xTopRight + depthX},${y - depthY}`,
          ].join(" ");

          if (!is3D) {
            if (resolvedType === "flat" || resolvedType === "compact") {
              return (
                <g key={`${item.name}-${i}`}>
                  <rect
                    x={xTopLeft}
                    y={y}
                    width={wTop}
                    height={stageHeightPx}
                    fill={color}
                  />
                  <text {...labelProps} y={labelY} dominantBaseline="middle">
                    {item.name}
                  </text>
                  {showValue && (
                    <text {...valueProps} y={valueY}>
                      {formatNumber(item.value)} ({pct}%)
                    </text>
                  )}
                </g>
              );
            }

            if (resolvedType === "smooth") {
              const path = `
                M ${xTopLeft} ${y}
                L ${xTopRight} ${y}
                Q ${chartWidth / 2 + wTop * 0.42} ${y + stageHeightPx / 2}, ${xBottomRight} ${y + stageHeightPx}
                L ${xBottomLeft} ${y + stageHeightPx}
                Q ${chartWidth / 2 - wTop * 0.42} ${y + stageHeightPx / 2}, ${xTopLeft} ${y}
                Z
              `;

              return (
                <g key={`${item.name}-${i}`}>
                  <path d={path} fill={color} />
                  <text {...labelProps} y={labelY} dominantBaseline="middle">
                    {item.name}
                  </text>
                  {showValue && (
                    <text {...valueProps} y={valueY}>
                      {formatNumber(item.value)} ({pct}%)
                    </text>
                  )}
                </g>
              );
            }

            return (
              <g key={`${item.name}-${i}`}>
                <polygon points={frontPoints} fill={color} />
                <text {...labelProps} y={labelY} dominantBaseline="middle">
                  {item.name}
                </text>
                {showValue && (
                  <text {...valueProps} y={valueY}>
                    {formatNumber(item.value)} ({pct}%)
                  </text>
                )}
              </g>
            );
          }

          if (resolvedType === "flat" || resolvedType === "compact") {
            return (
              <g key={`${item.name}-${i}`}>
                <polygon points={topPoints} fill={topFace} />
                <polygon
                  points={[
                    `${xTopRight},${y}`,
                    `${xTopRight},${y + stageHeightPx}`,
                    `${xTopRight + depthX},${y + stageHeightPx - depthY}`,
                    `${xTopRight + depthX},${y - depthY}`,
                  ].join(" ")}
                  fill={sideFace}
                />
                <rect
                  x={xTopLeft}
                  y={y}
                  width={wTop}
                  height={stageHeightPx}
                  fill={color}
                />
                <text {...labelProps} y={labelY} dominantBaseline="middle">
                  {item.name}
                </text>
                {showValue && (
                  <text {...valueProps} y={valueY}>
                    {formatNumber(item.value)} ({pct}%)
                  </text>
                )}
              </g>
            );
          }

          if (resolvedType === "smooth") {
            const pathFront = `
              M ${xTopLeft} ${y}
              L ${xTopRight} ${y}
              Q ${chartWidth / 2 + wTop * 0.42} ${y + stageHeightPx / 2}, ${xBottomRight} ${y + stageHeightPx}
              L ${xBottomLeft} ${y + stageHeightPx}
              Q ${chartWidth / 2 - wTop * 0.42} ${y + stageHeightPx / 2}, ${xTopLeft} ${y}
              Z
            `;

            return (
              <g key={`${item.name}-${i}`}>
                <path
                  d={`M ${xTopLeft} ${y} L ${xTopRight} ${y} L ${xTopRight + depthX} ${y - depthY} L ${xTopLeft + depthX} ${y - depthY} Z`}
                  fill={topFace}
                />
                <path
                  d={`M ${xTopRight} ${y} Q ${chartWidth / 2 + wTop * 0.42} ${y + stageHeightPx / 2}, ${xBottomRight} ${y + stageHeightPx} L ${xBottomRight + depthX} ${y + stageHeightPx - depthY} Q ${chartWidth / 2 + wTop * 0.42 + depthX} ${y + stageHeightPx / 2 - depthY}, ${xTopRight + depthX} ${y - depthY} Z`}
                  fill={sideFace}
                />
                <path d={pathFront} fill={color} />
                <text {...labelProps} y={labelY} dominantBaseline="middle">
                  {item.name}
                </text>
                {showValue && (
                  <text {...valueProps} y={valueY}>
                    {formatNumber(item.value)} ({pct}%)
                  </text>
                )}
              </g>
            );
          }

          return (
            <g key={`${item.name}-${i}`}>
              <polygon points={topPoints} fill={topFace} />
              <polygon points={sidePoints} fill={sideFace} />
              <polygon points={frontPoints} fill={color} />
              <text {...labelProps} y={labelY} dominantBaseline="middle">
                {item.name}
              </text>
              {showValue && (
                <text {...valueProps} y={valueY}>
                  {formatNumber(item.value)} ({pct}%)
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default SmartFunnelChart;