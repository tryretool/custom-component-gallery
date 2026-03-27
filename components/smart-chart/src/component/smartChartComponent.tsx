import React, { FC, useMemo, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

import * as Charts from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

const BarChart = Charts.Bar;
const LineChart = Charts.Line;
const PieChart = Charts.Pie;
const DoughnutChart = Charts.Doughnut;

const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

const TYPE_LABELS: Record<string, string> = {
    bar: "Bar",
    groupedbar: "Grouped Bar",
    line: "Line",
    multiline: "Multi Line",
    pie: "Pie",
    donut: "Donut"
};

const isDateKey = (k: string = "") =>
    ["date", "day", "month", "year", "time"].includes(k.toLowerCase());

const getNumericKeys = (o: any = {}) =>
    Object.keys(o).filter(k => typeof o[k] === "number");

const getCategoryKey = (o: any = {}) => {
    const nums = new Set(getNumericKeys(o));
    return Object.keys(o).find(k => !nums.has(k)) || Object.keys(o)[0];
};

const normalizeObject = (o: any = {}) =>
    Object.entries(o).map(([k, v]) => ({
        name: k,
        value: Number(v) || 0
    }));

function analyzeData(data: any) {

    if (!data) return { auto: "bar", allowed: ["bar"] };

    if (!Array.isArray(data) && typeof data === "object") {
        return { auto: "pie", allowed: ["pie", "donut"] };
    }

    if (Array.isArray(data) && data.length) {

        const first = data[0];
        const keys = Object.keys(first);
        const numeric = getNumericKeys(first);
        const hasDate = keys.some(isDateKey);

        const isNameValue =
            keys.length === 2 &&
            keys.includes("name") &&
            keys.includes("value");

        if (isNameValue)
            return { auto: "pie", allowed: ["pie", "donut"] };

        if (hasDate && numeric.length === 1)
            return { auto: "line", allowed: ["line", "bar"] };

        if (hasDate && numeric.length > 1)
            return { auto: "multiline", allowed: ["multiline", "groupedbar"] };

        if (numeric.length === 1)
            return { auto: "bar", allowed: ["bar", "line"] };

        if (numeric.length > 1)
            return { auto: "groupedbar", allowed: ["groupedbar", "multiline"] };
    }

    return { auto: "bar", allowed: ["bar"] };
}

const OPTIONS: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
        legend: {
            position: "top",
            labels: {
                usePointStyle: true,
                boxWidth: 12
            }
        },
        tooltip: {
            enabled: true
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.06)" }
        },
        x: {
            grid: { display: false }
        }
    }
};

export const SmartAutoChart: FC = () => {

    const [data] = Retool.useStateArray({ name: "chartData", initialValue: [] });
    const [title] = Retool.useStateString({ name: "title", initialValue: "" });

    const meta = useMemo(() => analyzeData(data), [data]);

    const [userType, setUserType] = useState("");

    const type = (userType || meta.auto).toLowerCase();

    const normalized = useMemo(
        () => (!Array.isArray(data) ? normalizeObject(data) : data),
        [data]
    );

    const chartData = useMemo(() => {

        if (type === "pie" || type === "donut") {
            return {
                labels: normalized.map((d: any) => d.name),
                datasets: [{
                    data: normalized.map((d: any) => d.value),
                    backgroundColor: COLORS,
                    borderWidth: 1
                }]
            };
        }

        if (!Array.isArray(data) || !data.length) return null;

        const first = data[0];
        const numeric = getNumericKeys(first);
        const category = getCategoryKey(first);

        return {
            labels: data.map((r: any) => String(r[category])),
            datasets: numeric.map((k: string, i: number) => ({

                label: k,
                data: data.map((r: any) => Number(r[k] ?? 0)),

                backgroundColor:
                    type.includes("bar")
                        ? COLORS[i % COLORS.length]
                        : undefined,

                borderColor: COLORS[i % COLORS.length],
                borderWidth: 2,

                pointRadius: type.includes("line") ? 3 : 0,
                pointHoverRadius: 5,

                tension: 0.35,
                fill: false,
                borderRadius: 6
            }))
        };

    }, [data, normalized, type]);

    if (!chartData) return <div>No data</div>;

    let ChartComponent: any = null;

    if (type.includes("bar")) ChartComponent = BarChart;
    if (type.includes("line")) ChartComponent = LineChart;
    if (type === "pie") ChartComponent = PieChart;
    if (type === "donut") ChartComponent = DoughnutChart;

    if (!ChartComponent) return <div>Unsupported</div>;

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 12,
            boxSizing: "border-box",
            overflow: "hidden"
        }}>

            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8
            }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {title}
                </div>

                <select
                    value={userType}
                    onChange={e => setUserType(e.target.value)}
                    style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #E5E7EB",
                        fontSize: 13
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

            {/* Chart Area */}
            <div style={{
                flex: 1,
                minHeight: 260,
                position: "relative"
            }}>
                <ChartComponent data={chartData} options={OPTIONS} />
            </div>

        </div>
    );
};

export default SmartAutoChart;
