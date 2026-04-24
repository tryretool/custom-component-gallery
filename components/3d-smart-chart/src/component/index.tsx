import React, { FC, useMemo, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
    Plugin,
    ChartDataset
} from "chart.js";

import * as Charts from "react-chartjs-2";

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316"
];

const TYPE_LABELS: Record<string, string> = {
    bar: "3D Bar",
    groupedbar: "3D Grouped Bar",
    line: "Line",
    multiline: "Multi Line",
    area: "Area",
    radar: "Radar",
    polararea: "Polar Area",
    pie: "3D Pie",
    donut: "3D Donut"
};

const clamp = (n: number, min = 0, max = 255) => Math.max(min, Math.min(max, n));

const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const hexToRgb = (input: string) => {
    const fallback = { r: 59, g: 130, b: 246 };
    if (!input) return fallback;

    let hex = input.trim();

    if (hex.startsWith("rgb")) {
        const vals = hex.match(/\d+/g)?.map(Number) || [];
        if (vals.length >= 3) {
            return { r: vals[0], g: vals[1], b: vals[2] };
        }
        return fallback;
    }

    hex = hex.replace("#", "");

    if (hex.length === 3) {
        hex = hex
            .split("")
            .map(c => c + c)
            .join("");
    }

    if (hex.length !== 6) return fallback;

    const num = Number.parseInt(hex, 16);
    if (Number.isNaN(num)) return fallback;

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
};

const shiftColor = (input: string, amount: number) => {
    const { r, g, b } = hexToRgb(input);
    return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
};

const lighten = (input: string, amount: number) => shiftColor(input, amount);
const darken = (input: string, amount: number) => shiftColor(input, -amount);

const withAlpha = (input: string, alpha: number) => {
    const { r, g, b } = hexToRgb(input);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDatasetColor = (dataset: ChartDataset<"bar", number[]>, index: number) => {
    const bg = dataset.backgroundColor;
    if (Array.isArray(bg)) return String(bg[index % bg.length] || COLORS[0]);
    if (typeof bg === "string") return bg;
    return COLORS[index % COLORS.length];
};

const ThreeDBarPlugin: Plugin<"bar"> = {
    id: "threeDBarPlugin",
    afterDatasetsDraw(chart) {
        if (chart.config.type !== "bar") return;

        const { ctx } = chart;
        const depthX = 14;
        const depthY = 10;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (meta.hidden || meta.type !== "bar") return;

            meta.data.forEach((bar, index) => {
                const props = (bar as any).getProps(["x", "y", "base", "width"], true);

                const x = props.x as number;
                const y = props.y as number;
                const base = props.base as number;
                const width = props.width as number;

                const left = x - width / 2;
                const right = x + width / 2;
                const top = Math.min(y, base);
                const bottom = Math.max(y, base);
                const isPositive = y <= base;

                const frontColor = getDatasetColor(dataset as ChartDataset<"bar", number[]>, index);
                const topColor = lighten(frontColor, 35);
                const sideColor = darken(frontColor, 35);
                const bevelColor = lighten(frontColor, 55);
                const shadowColor = "rgba(0,0,0,0.12)";

                ctx.save();

                ctx.fillStyle = shadowColor;
                ctx.beginPath();
                ctx.rect(left + depthX * 0.45, top + 6, width, bottom - top);
                ctx.fill();

                if (isPositive) {
                    ctx.beginPath();
                    ctx.moveTo(left, top);
                    ctx.lineTo(right, top);
                    ctx.lineTo(right + depthX, top - depthY);
                    ctx.lineTo(left + depthX, top - depthY);
                    ctx.closePath();
                    ctx.fillStyle = topColor;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(right, top);
                    ctx.lineTo(right, bottom);
                    ctx.lineTo(right + depthX, bottom - depthY);
                    ctx.lineTo(right + depthX, top - depthY);
                    ctx.closePath();
                    ctx.fillStyle = sideColor;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(left + 1, top + 1);
                    ctx.lineTo(right - 1, top + 1);
                    ctx.lineTo(right + depthX - 2, top - depthY + 2);
                    ctx.strokeStyle = bevelColor;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(left, bottom);
                    ctx.lineTo(right, bottom);
                    ctx.lineTo(right + depthX, bottom - depthY);
                    ctx.lineTo(left + depthX, bottom - depthY);
                    ctx.closePath();
                    ctx.fillStyle = darken(frontColor, 10);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(right, top);
                    ctx.lineTo(right, bottom);
                    ctx.lineTo(right + depthX, bottom - depthY);
                    ctx.lineTo(right + depthX, top - depthY);
                    ctx.closePath();
                    ctx.fillStyle = sideColor;
                    ctx.fill();
                }

                ctx.restore();
            });
        });
    }
};

const ThreeDArcPlugin: Plugin<"pie" | "doughnut"> = {
    id: "threeDArcPlugin",
    beforeDatasetDraw(chart, args) {
        const type = chart.config.type;
        if (type !== "pie" && type !== "doughnut") return;

        const meta = chart.getDatasetMeta(args.index);
        const dataset = chart.data.datasets[args.index];
        const { ctx } = chart;
        const depth = 18;

        ctx.save();

        meta.data.forEach((arc: any, index: number) => {
            const props = arc.getProps(
                ["x", "y", "startAngle", "endAngle", "outerRadius", "innerRadius"],
                true
            );

            const x = props.x;
            const y = props.y;
            const startAngle = props.startAngle;
            const endAngle = props.endAngle;
            const outerRadius = props.outerRadius;
            const innerRadius = props.innerRadius;

            const bg = dataset.backgroundColor;
            let color = COLORS[index % COLORS.length];
            if (Array.isArray(bg)) color = String(bg[index % bg.length] || color);
            else if (typeof bg === "string") color = bg;

            const sideColor = darken(color, 35);

            for (let d = depth; d > 0; d--) {
                ctx.beginPath();
                ctx.arc(x, y + d, outerRadius, startAngle, endAngle);
                if (innerRadius > 0) {
                    ctx.arc(x, y + d, innerRadius, endAngle, startAngle, true);
                } else {
                    ctx.lineTo(x, y + d);
                }
                ctx.closePath();
                ctx.fillStyle = sideColor;
                ctx.fill();
            }
        });

        ctx.restore();
    }
};

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
    ThreeDBarPlugin,
    ThreeDArcPlugin
);

const BarChart = Charts.Bar;
const LineChart = Charts.Line;
const PieChart = Charts.Pie;
const DoughnutChart = Charts.Doughnut;
const RadarChart = Charts.Radar;
const PolarAreaChart = Charts.PolarArea;

const isDateKey = (k = "") =>
    ["date", "day", "month", "year", "time"].includes(k.toLowerCase());

const getNumericKeys = (o: Record<string, unknown> = {}) =>
    Object.keys(o).filter(k => typeof o[k] === "number");

const getCategoryKey = (o: Record<string, unknown> = {}) => {
    const nums = new Set(getNumericKeys(o));
    return Object.keys(o).find(k => !nums.has(k)) || Object.keys(o)[0];
};

const normalizeObject = (o: Record<string, unknown> = {}) =>
    Object.entries(o).map(([k, v]) => ({
        name: k,
        value: Number(v) || 0
    }));

function analyzeData(data: unknown): { auto: string; allowed: string[] } {
    if (!data) return { auto: "bar", allowed: ["bar"] };

    if (!Array.isArray(data) && typeof data === "object") {
        return { auto: "pie", allowed: ["pie", "donut", "polararea"] };
    }

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        const first = data[0] as Record<string, unknown>;
        const keys = Object.keys(first);
        const numeric = getNumericKeys(first);
        const hasDate = keys.some(isDateKey);

        const isNameValue = keys.length === 2 && keys.includes("name") && keys.includes("value");

        if (isNameValue) return { auto: "pie", allowed: ["pie", "donut", "polararea"] };
        if (hasDate && numeric.length === 1) return { auto: "line", allowed: ["line", "area", "bar"] };
        if (hasDate && numeric.length > 1) {
            return { auto: "multiline", allowed: ["multiline", "area", "groupedbar", "radar"] };
        }
        if (numeric.length === 1) return { auto: "bar", allowed: ["bar", "line", "area", "radar"] };
        if (numeric.length > 1) {
            return { auto: "groupedbar", allowed: ["groupedbar", "multiline", "radar"] };
        }
    }

    return { auto: "bar", allowed: ["bar"] };
}

const buildOptions = (type: string) => {
    const isBar = type.includes("bar");
    const isCircular = type === "pie" || type === "donut" || type === "polararea";
    const isLine = type.includes("line") || type === "area";
    const isRadar = type === "radar";

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
            padding: isBar
                ? { top: 28, right: 26, bottom: 10, left: 10 }
                : isCircular
                    ? { top: 16, right: 16, bottom: 24, left: 16 }
                    : 8
        },
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 12,
                    generateLabels: (chart: any) => {
                        const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                        return original.map((label: any) => ({
                            ...label,
                            text: capitalizeFirst(String(label.text))
                        }));
                    }
                }
            },
            tooltip: {
                enabled: true
            }
        },
        ...(isCircular
            ? {}
            : isRadar
                ? {
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: { color: "rgba(0,0,0,0.08)" },
                            angleLines: { color: "rgba(0,0,0,0.08)" },
                            pointLabels: {
                                font: { size: 12 },
                                callback: (value: string) => capitalizeFirst(String(value))
                            }
                        }
                    }
                }
                : {
                    scales: {
                        y: {
                            beginAtZero: true,
                            grace: isBar ? "12%" : 0,
                            grid: { color: "rgba(0,0,0,0.06)" }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                callback: function (value: any) {
                                    return capitalizeFirst(String(this.getLabelForValue(value)));
                                }
                            }
                        }
                    }
                }),
        elements: isLine
            ? {
                line: {
                    tension: 0.35,
                    borderWidth: 3
                },
                point: {
                    radius: 5,
                    hoverRadius: 7
                }
            }
            : {}
    };
};

export const SmartThreeDChart: FC = () => {
    const [data] = Retool.useStateArray({ name: "chartData", initialValue: [] });
    const [title] = Retool.useStateString({ name: "title", initialValue: "" });

    const meta = useMemo(() => analyzeData(data), [data]);
    const [userType, setUserType] = useState("");
    const type = (userType || meta.auto).toLowerCase();

    const normalized = useMemo(
        () =>
            !Array.isArray(data) && data && typeof data === "object"
                ? normalizeObject(data as Record<string, unknown>)
                : data,
        [data]
    );

    const chartData = useMemo(() => {
        if (type === "pie" || type === "donut" || type === "polararea") {
            const pieData = Array.isArray(normalized) ? normalized : [];
            return {
                labels: pieData.map((d: any) => capitalizeFirst(String(d.name))),
                datasets: [
                    {
                        label: capitalizeFirst(title || "Values"),
                        data: pieData.map((d: any) => d.value),
                        backgroundColor: pieData.map((_: any, i: number) => COLORS[i % COLORS.length]),
                        borderColor: "#ffffff",
                        borderWidth: 2
                    }
                ]
            };
        }

        if (!Array.isArray(data) || !data.length || typeof data[0] !== "object" || data[0] == null) {
            return null;
        }

        const first = data[0] as Record<string, unknown>;
        const numeric = getNumericKeys(first);
        const category = getCategoryKey(first);

        return {
            labels: data.map((r: any) => capitalizeFirst(String(r[category]))),
            datasets: numeric.map((k, i) => {
                const baseColor = COLORS[i % COLORS.length];
                const isLineLike = type.includes("line") || type === "area";
                const isArea = type === "area";
                const isRadar = type === "radar";

                return {
                    label: capitalizeFirst(k),
                    data: data.map((r: any) => Number(r[k] ?? 0)),
                    backgroundColor: isArea || isRadar ? withAlpha(baseColor, 0.22) : baseColor,
                    borderColor: darken(baseColor, 18),
                    borderWidth: isLineLike || isRadar ? 3 : 1,
                    pointRadius: isLineLike || isRadar ? 5 : 0,
                    pointHoverRadius: isLineLike || isRadar ? 7 : 0,
                    pointBackgroundColor: isLineLike || isRadar ? baseColor : undefined,
                    pointBorderColor: isLineLike || isRadar ? "#ffffff" : undefined,
                    pointBorderWidth: isLineLike || isRadar ? 2 : 0,
                    pointStyle: "circle" as const,
                    hoverRadius: isLineLike || isRadar ? 8 : 0,
                    hoverBorderWidth: isLineLike || isRadar ? 3 : 0,
                    tension: 0.35,
                    fill: isArea,
                    borderRadius: type.includes("bar") ? 2 : 0,
                    barPercentage: 0.72,
                    categoryPercentage: 0.72
                };
            })
        };
    }, [data, normalized, type, title]);

    if (!chartData) return <div>No data</div>;

    let ChartComponent: React.ComponentType<any> | null = null;

    if (type.includes("bar")) ChartComponent = BarChart;
    else if (type.includes("line") || type === "area") ChartComponent = LineChart;
    else if (type === "radar") ChartComponent = RadarChart;
    else if (type === "polararea") ChartComponent = PolarAreaChart;
    else if (type === "pie") ChartComponent = PieChart;
    else if (type === "donut") ChartComponent = DoughnutChart;

    if (!ChartComponent) return <div>Unsupported</div>;

    const options = buildOptions(type);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 12,
                boxSizing: "border-box",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 8
                }}
            >
                <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>

                <select
                    value={userType}
                    onChange={e => setUserType(e.target.value)}
                    style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #E5E7EB",
                        fontSize: 13,
                        background: "#fff"
                    }}
                >
                    <option value="">Auto</option>
                    {meta.allowed.map(t => (
                        <option key={t} value={t}>
                            {TYPE_LABELS[t] || t}
                        </option>
                    ))}
                </select>
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 260,
                    position: "relative"
                }}
            >
                <ChartComponent data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SmartThreeDChart;