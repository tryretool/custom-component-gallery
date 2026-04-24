import React, { FC, useEffect, useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";

type GenericRow = Record<string, unknown>;

type CohortCell = {
  raw: GenericRow;
  value: number | null;
};

type FieldMeta = {
  allFields: string[];
  numericFields: string[];
  dimensionFields: string[];
};

type MaxColumnsOption =
  | "one"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "eleven"
  | "twelve";

type FontFamilyOption =
  | "inter"
  | "roboto"
  | "openSans"
  | "lato"
  | "poppins"
  | "montserrat"
  | "playfairDisplay";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function maxColumnsFromOption(option: MaxColumnsOption): number {
  switch (option) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    case "four":
      return 4;
    case "five":
      return 5;
    case "six":
      return 6;
    case "seven":
      return 7;
    case "eight":
      return 8;
    case "nine":
      return 9;
    case "ten":
      return 10;
    case "eleven":
      return 11;
    case "twelve":
      return 12;
    default:
      return 12;
  }
}

function fontFamilyFromOption(option: FontFamilyOption): string {
  switch (option) {
    case "inter":
      return "'Inter', sans-serif";
    case "roboto":
      return "'Roboto', sans-serif";
    case "openSans":
      return "'Open Sans', sans-serif";
    case "lato":
      return "'Lato', sans-serif";
    case "poppins":
      return "'Poppins', sans-serif";
    case "montserrat":
      return "'Montserrat', sans-serif";
    case "playfairDisplay":
      return "'Playfair Display', serif";
    default:
      return "'Inter', sans-serif";
  }
}

function toStartCaseLabel(value: string): string {
  if (!value) return "";
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const CohortAnalysisChart: FC = () => {
  Retool.useComponentSettings({
    defaultHeight: 28,
    defaultWidth: 8,
  });

  const [data] = Retool.useStateArray({
    name: "data",
    initialValue: [],
    inspector: "text",
    label: "Data",
    description: "Array of objects used to generate the cohort heatmap.",
  });

  const [selectedXAxisField, setSelectedXAxisField] = Retool.useStateString({
    name: "selectedXAxisField",
    initialValue: "",
    inspector: "text",
    label: "X axis field",
    description: "Field used for cohort columns. Leave empty to auto-detect from data.",
  });

  const [selectedYAxisField, setSelectedYAxisField] = Retool.useStateString({
    name: "selectedYAxisField",
    initialValue: "",
    inspector: "text",
    label: "Y axis field",
    description: "Field used for cohort rows. Leave empty to auto-detect from data.",
  });

  const [selectedValueField, setSelectedValueField] = Retool.useStateString({
    name: "selectedValueField",
    initialValue: "",
    inspector: "text",
    label: "Value field",
    description: "Numeric field used for the heatmap cell values. Leave empty to auto-detect.",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "Cohort Analysis",
    inspector: "text",
    label: "Title",
    description: "Main heading displayed above the cohort chart.",
  });

  const [subtitle] = Retool.useStateString({
    name: "subtitle",
    initialValue: "",
    inspector: "text",
    label: "Subtitle",
    description: "Optional helper text displayed below the title.",
  });

  const [showDetectedKeys] = Retool.useStateBoolean({
    name: "showDetectedKeys",
    initialValue: true,
    inspector: "checkbox",
    label: "Show detected keys",
    description: "Shows available fields and resolved field mappings for debugging or setup.",
  });

  const [showCellValues] = Retool.useStateBoolean({
    name: "showCellValues",
    initialValue: true,
    inspector: "checkbox",
    label: "Show cell values",
    description: "Controls whether the value is shown inside each heatmap cell.",
  });

  const [maxColumnsSelect] = Retool.useStateEnumeration<
    [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve"
    ]
  >({
    name: "maxColumnsSelect",
    initialValue: "twelve",
    enumDefinition: [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
    ],
    enumLabels: {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      eight: "8",
      nine: "9",
      ten: "10",
      eleven: "11",
      twelve: "12",
    },
    inspector: "select",
    label: "Max columns",
    description: "Select the maximum number of cohort columns to display.",
  });

  const [roundDecimals] = Retool.useStateNumber({
    name: "roundDecimals",
    initialValue: 1,
    inspector: "text",
    label: "Decimals",
    description: "Maximum number of decimal places used when formatting cell values.",
  });

  const [fontFamilySelect] = Retool.useStateEnumeration<
    ["inter", "roboto", "openSans", "lato", "poppins", "montserrat", "playfairDisplay"]
  >({
    name: "fontFamilySelect",
    initialValue: "inter",
    enumDefinition: ["inter", "roboto", "openSans", "lato", "poppins", "montserrat", "playfairDisplay"],
    enumLabels: {
      inter: "Inter",
      roboto: "Roboto",
      openSans: "Open Sans",
      lato: "Lato",
      poppins: "Poppins",
      montserrat: "Montserrat",
      playfairDisplay: "Playfair Display",
    },
    inspector: "select",
    label: "Font family",
    description: "Select a predefined font family for the component.",
  });

  const [titleColor] = Retool.useStateString({
    name: "titleColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Title color",
    description: "Color used for the chart title and stronger heading text.",
  });

  const [mutedTextColor] = Retool.useStateString({
    name: "mutedTextColor",
    initialValue: "#6b7280",
    inspector: "text",
    label: "Muted text color",
    description: "Color used for helper text, subtitles, and lower emphasis text.",
  });

  const [backgroundColor] = Retool.useStateString({
    name: "backgroundColor",
    initialValue: "#ffffff",
    inspector: "text",
    label: "Background color",
    description: "Background color of the overall component container.",
  });

  const [tableHeaderBg] = Retool.useStateString({
    name: "tableHeaderBg",
    initialValue: "#f9fafb",
    inspector: "text",
    label: "Header background",
    description: "Background color used for the table header row.",
  });

  const [borderColor] = Retool.useStateString({
    name: "borderColor",
    initialValue: "#e5e7eb",
    inspector: "text",
    label: "Border color",
    description: "Border color used throughout the table and surrounding panels.",
  });

  const [emptyCellColor] = Retool.useStateString({
    name: "emptyCellColor",
    initialValue: "#f3f4f6",
    inspector: "text",
    label: "Empty cell color",
    description: "Background color used when a cohort cell has no value.",
  });

  const [heatmapBaseColor] = Retool.useStateString({
    name: "heatmapBaseColor",
    initialValue: "#2563eb",
    inspector: "text",
    label: "Heatmap base color",
    description: "Base color used to generate the heatmap intensity scale.",
  });

  const [cellTextLightColor] = Retool.useStateString({
    name: "cellTextLightColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Cell text light color",
    description: "Text color used on lighter heatmap cells.",
  });

  const [cellTextDarkColor] = Retool.useStateString({
    name: "cellTextDarkColor",
    initialValue: "#ffffff",
    inspector: "text",
    label: "Cell text dark color",
    description: "Text color used on darker heatmap cells.",
  });

  const [rowLabelBg] = Retool.useStateString({
    name: "rowLabelBg",
    initialValue: "#ffffff",
    inspector: "text",
    label: "Row label background",
    description: "Background color used for the sticky row label column.",
  });

  const [selectedBorderColor] = Retool.useStateString({
    name: "selectedBorderColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Selected cell border",
    description: "Border and highlight color used for the selected heatmap cell.",
  });

  const [selectedPanelBg] = Retool.useStateString({
    name: "selectedPanelBg",
    initialValue: "#f8fafc",
    inspector: "text",
    label: "Selected panel bg",
    description: "Background color of the selected cell summary panel.",
  });

  const [selectedPanelTextColor] = Retool.useStateString({
    name: "selectedPanelTextColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Selected panel text",
    description: "Text color used inside the selected cell summary panel.",
  });

  const [validationMessage, setValidationMessage] = Retool.useStateString({
    name: "validationMessage",
    initialValue: "",
    inspector: "hidden",
    label: "Validation message",
  });

  const [resolvedConfig, setResolvedConfig] = Retool.useStateObject({
    name: "resolvedConfig",
    initialValue: {},
    inspector: "hidden",
    label: "Resolved config",
  });

  const [selectedCell, setSelectedCell] = Retool.useStateObject({
    name: "selectedCell",
    initialValue: {},
    inspector: "hidden",
    label: "Selected cell",
  });

  const [selectedValue, setSelectedValue] = Retool.useStateString({
    name: "selectedValue",
    initialValue: "",
    inspector: "hidden",
    label: "Selected value",
  });

  const safeRows: GenericRow[] = useMemo(() => {
    return Array.isArray(data)
      ? (data.filter((row) => row && typeof row === "object") as GenericRow[])
      : [];
  }, [data]);

  const fieldMeta: FieldMeta = useMemo(() => {
    const keyOrder: string[] = [];
    const keySet = new Set<string>();
    const numeric = new Set<string>();
    const dimension = new Set<string>();

    for (const row of safeRows) {
      for (const key of Object.keys(row)) {
        if (!keySet.has(key)) {
          keySet.add(key);
          keyOrder.push(key);
        }
      }

      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "number" && Number.isFinite(value)) {
          numeric.add(key);
          dimension.add(key);
        } else if (typeof value === "string" || typeof value === "boolean") {
          dimension.add(key);
        }
      }
    }

    return {
      allFields: keyOrder,
      numericFields: keyOrder.filter((k) => numeric.has(k)),
      dimensionFields: keyOrder.filter((k) => dimension.has(k)),
    };
  }, [safeRows]);

  const autoDetectedFields = useMemo(() => {
    const allFields = fieldMeta.allFields;
    const numericFields = fieldMeta.numericFields;
    const dimensionFields = fieldMeta.dimensionFields;

    const nonNumericDimensionFields = dimensionFields.filter(
      (field) => !numericFields.includes(field)
    );

    const detectedValue = numericFields[0] || "";
    const detectedY =
      nonNumericDimensionFields[0] ||
      dimensionFields[0] ||
      allFields[0] ||
      "";
    const detectedX =
      allFields.find((field) => field !== detectedY && field !== detectedValue) ||
      allFields.find((field) => field !== detectedY) ||
      allFields[1] ||
      "";

    return {
      detectedX,
      detectedY,
      detectedValue,
    };
  }, [fieldMeta]);

  useEffect(() => {
    if (!selectedYAxisField && autoDetectedFields.detectedY) {
      setSelectedYAxisField(autoDetectedFields.detectedY);
    }
  }, [selectedYAxisField, autoDetectedFields.detectedY, setSelectedYAxisField]);

  useEffect(() => {
    if (!selectedXAxisField && autoDetectedFields.detectedX) {
      setSelectedXAxisField(autoDetectedFields.detectedX);
    }
  }, [selectedXAxisField, autoDetectedFields.detectedX, setSelectedXAxisField]);

  useEffect(() => {
    if (!selectedValueField && autoDetectedFields.detectedValue) {
      setSelectedValueField(autoDetectedFields.detectedValue);
    }
  }, [selectedValueField, autoDetectedFields.detectedValue, setSelectedValueField]);

  useEffect(() => {
    if (selectedXAxisField && !fieldMeta.allFields.includes(selectedXAxisField)) {
      setSelectedXAxisField(autoDetectedFields.detectedX || "");
    }
  }, [selectedXAxisField, fieldMeta.allFields, autoDetectedFields.detectedX, setSelectedXAxisField]);

  useEffect(() => {
    if (selectedYAxisField && !fieldMeta.allFields.includes(selectedYAxisField)) {
      setSelectedYAxisField(autoDetectedFields.detectedY || "");
    }
  }, [selectedYAxisField, fieldMeta.allFields, autoDetectedFields.detectedY, setSelectedYAxisField]);

  useEffect(() => {
    if (selectedValueField && !fieldMeta.numericFields.includes(selectedValueField)) {
      setSelectedValueField(autoDetectedFields.detectedValue || "");
    }
  }, [selectedValueField, fieldMeta.numericFields, autoDetectedFields.detectedValue, setSelectedValueField]);

  const resolveAxisFields = (
    meta: FieldMeta,
    rawX: string,
    rawY: string,
    rawValue: string,
    autoX: string,
    autoY: string,
    autoValue: string
  ) => {
    let resolvedX = rawX || autoX;
    let resolvedY = rawY || autoY;
    let resolvedValue = rawValue || autoValue;

    const numericFields = meta.numericFields;
    const dimensionFields = meta.dimensionFields;
    const allFields = meta.allFields;

    if (!resolvedY || !allFields.includes(resolvedY)) resolvedY = autoY;
    if (!resolvedX || !allFields.includes(resolvedX)) resolvedX = autoX;
    if (!resolvedValue || !numericFields.includes(resolvedValue)) resolvedValue = autoValue;

    if (resolvedY === resolvedValue) {
      resolvedY =
        dimensionFields.find((f) => f !== resolvedValue) ||
        allFields.find((f) => f !== resolvedValue) ||
        "";
    }

    if (resolvedX === resolvedY || !resolvedX) {
      resolvedX =
        allFields.find((f) => f !== resolvedY && f !== resolvedValue) ||
        allFields.find((f) => f !== resolvedY) ||
        "";
    }

    if (resolvedValue === resolvedX || resolvedValue === resolvedY) {
      resolvedValue =
        numericFields.find((f) => f !== resolvedX && f !== resolvedY) || "";
    }

    if (resolvedX === resolvedY) {
      const alternativeY =
        allFields.find((f) => f !== resolvedX && f !== resolvedValue) || "";
      if (alternativeY) resolvedY = alternativeY;
    }

    return { resolvedX, resolvedY, resolvedValue };
  };

  const resolvedFields = useMemo(() => {
    return resolveAxisFields(
      fieldMeta,
      selectedXAxisField,
      selectedYAxisField,
      selectedValueField,
      autoDetectedFields.detectedX,
      autoDetectedFields.detectedY,
      autoDetectedFields.detectedValue
    );
  }, [
    fieldMeta,
    selectedXAxisField,
    selectedYAxisField,
    selectedValueField,
    autoDetectedFields,
  ]);

  const resolvedXAxisField = resolvedFields.resolvedX;
  const resolvedYAxisField = resolvedFields.resolvedY;
  const resolvedValueField = resolvedFields.resolvedValue;

  const normalizedMaxColumns = useMemo(() => {
    return maxColumnsFromOption(maxColumnsSelect);
  }, [maxColumnsSelect]);

  const safeRoundDecimals = useMemo(() => {
    if (!Number.isFinite(roundDecimals)) return 1;
    return clampNumber(Math.round(roundDecimals), 0, 6);
  }, [roundDecimals]);

  const resolvedFontFamily = useMemo(() => {
    return fontFamilyFromOption(fontFamilySelect);
  }, [fontFamilySelect]);

  const validation = useMemo(() => {
    if (!Array.isArray(data)) {
      return { ok: false, message: "Data must be an array of objects." };
    }

    if (safeRows.length === 0) {
      return { ok: false, message: "No rows found. Pass an array of objects." };
    }

    if (!resolvedXAxisField) {
      return { ok: false, message: "Could not resolve X axis field." };
    }

    if (!resolvedYAxisField) {
      return { ok: false, message: "Could not resolve Y axis field." };
    }

    if (!resolvedValueField) {
      return { ok: false, message: "Could not resolve value field." };
    }

    if (resolvedXAxisField === resolvedYAxisField) {
      return {
        ok: false,
        message: "Could not resolve different X and Y axis fields from the data.",
      };
    }

    if (!fieldMeta.allFields.includes(resolvedXAxisField)) {
      return {
        ok: false,
        message: `X axis field "${resolvedXAxisField}" is not present in the data.`,
      };
    }

    if (!fieldMeta.allFields.includes(resolvedYAxisField)) {
      return {
        ok: false,
        message: `Y axis field "${resolvedYAxisField}" is not present in the data.`,
      };
    }

    if (!fieldMeta.numericFields.includes(resolvedValueField)) {
      return {
        ok: false,
        message: `Value field "${resolvedValueField}" is not present as a numeric field in the data.`,
      };
    }

    return { ok: true, message: "" };
  }, [
    data,
    safeRows,
    resolvedXAxisField,
    resolvedYAxisField,
    resolvedValueField,
    fieldMeta,
  ]);

  useEffect(() => {
    setValidationMessage(validation.message);
  }, [validation.message, setValidationMessage]);

  useEffect(() => {
    setResolvedConfig({
      selectedXAxisField,
      selectedYAxisField,
      selectedValueField,
      resolvedXAxisField,
      resolvedYAxisField,
      resolvedValueField,
      availableFields: fieldMeta.allFields,
      numericFields: fieldMeta.numericFields,
      dimensionFields: fieldMeta.dimensionFields,
      autoDetectedFields,
      maxColumnsSelect,
      normalizedMaxColumns,
      roundDecimals: safeRoundDecimals,
      fontFamilySelect,
      resolvedFontFamily,
    });
  }, [
    selectedXAxisField,
    selectedYAxisField,
    selectedValueField,
    resolvedXAxisField,
    resolvedYAxisField,
    resolvedValueField,
    fieldMeta,
    autoDetectedFields,
    maxColumnsSelect,
    normalizedMaxColumns,
    safeRoundDecimals,
    fontFamilySelect,
    resolvedFontFamily,
    setResolvedConfig,
  ]);

  const chartData = useMemo(() => {
    if (!validation.ok) {
      return {
        xValues: [] as (string | number)[],
        yValues: [] as (string | number)[],
        matrix: {} as Record<string, Record<string, CohortCell>>,
        maxValue: 0,
        validRowCount: 0,
      };
    }

    const xValueSet = new Set<string | number>();
    const yValueSet = new Set<string | number>();
    const matrix: Record<string, Record<string, CohortCell>> = {};
    let maxValue = 0;
    let validRowCount = 0;

    for (const row of safeRows) {
      const xRaw = row[resolvedXAxisField];
      const yRaw = row[resolvedYAxisField];
      const vRaw = row[resolvedValueField];

      if (xRaw == null || yRaw == null || vRaw == null) continue;
      if (!(typeof vRaw === "number" && Number.isFinite(vRaw))) continue;

      validRowCount += 1;

      const xKey = String(xRaw);
      const yKey = String(yRaw);

      xValueSet.add(xRaw as string | number);
      yValueSet.add(yRaw as string | number);

      if (!matrix[yKey]) matrix[yKey] = {};
      matrix[yKey][xKey] = {
        raw: row,
        value: vRaw,
      };

      if (vRaw > maxValue) maxValue = vRaw;
    }

    const sortMixed = (a: string | number, b: string | number) => {
      const aNum = Number(a);
      const bNum = Number(b);
      const aIsNum = !Number.isNaN(aNum);
      const bIsNum = !Number.isNaN(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      return String(a).localeCompare(String(b));
    };

    return {
      xValues: [...xValueSet].sort(sortMixed).slice(0, normalizedMaxColumns),
      yValues: [...yValueSet].sort(sortMixed),
      matrix,
      maxValue,
      validRowCount,
    };
  }, [
    validation.ok,
    safeRows,
    resolvedXAxisField,
    resolvedYAxisField,
    resolvedValueField,
    normalizedMaxColumns,
  ]);

  const hasRenderableData =
    validation.ok &&
    chartData.validRowCount > 0 &&
    chartData.xValues.length > 0 &&
    chartData.yValues.length > 0;

  const selectedCellKey = useMemo(() => {
    if (!selectedCell || typeof selectedCell !== "object") return "";
    const xValue = (selectedCell as Record<string, unknown>).xValue;
    const yValue = (selectedCell as Record<string, unknown>).yValue;
    if (xValue == null || yValue == null) return "";
    return `${String(yValue)}__${String(xValue)}`;
  }, [selectedCell]);

  const parseHexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.trim().replace("#", "");
    if (!/^[0-9a-fA-F]{3,8}$/.test(clean)) return [37, 99, 235];

    let r = 37;
    let g = 99;
    let b = 235;

    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else {
      r = parseInt(clean.slice(0, 2), 16);
      g = parseInt(clean.slice(2, 4), 16);
      b = parseInt(clean.slice(4, 6), 16);
    }

    return [r, g, b];
  };

  const getCellBackground = (value: number | null) => {
    if (value == null || chartData.maxValue <= 0) return emptyCellColor;
    const [r, g, b] = parseHexToRgb(heatmapBaseColor);
    const ratio = value / chartData.maxValue;
    const alpha = 0.18 + ratio * 0.82;
    return `rgba(${r}, ${g}, ${b}, ${Math.min(alpha, 1)})`;
  };

  const getCellTextColor = (value: number | null) => {
    if (value == null || chartData.maxValue <= 0) return mutedTextColor;
    const ratio = value / chartData.maxValue;
    return ratio >= 0.35 ? cellTextDarkColor : cellTextLightColor;
  };

  const getCellTextShadow = (value: number | null) => {
    if (value == null || chartData.maxValue <= 0) return "none";
    const ratio = value / chartData.maxValue;
    return ratio >= 0.35 ? "0 1px 1px rgba(0,0,0,0.18)" : "none";
  };

  const formatValue = (value: number | null) => {
    if (value == null) return "No data";
    return Number(value).toFixed(safeRoundDecimals);
  };

  const selectedCellSummary = useMemo(() => {
    if (!selectedCell || typeof selectedCell !== "object") return null;
    const cell = selectedCell as Record<string, unknown>;
    if (cell.xValue == null || cell.yValue == null) return null;
    return {
      xValue: cell.xValue,
      yValue: cell.yValue,
      value: cell.value,
    };
  }, [selectedCell]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: 16,
        fontFamily: resolvedFontFamily,
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700;900&family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');

        .cohort-cc-root * {
          box-sizing: border-box;
        }

        .cohort-cc-table-wrap::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }

        .cohort-cc-table-wrap::-webkit-scrollbar-thumb {
          background: ${borderColor};
          border-radius: 999px;
        }
      `}</style>

      <div
        className="cohort-cc-root"
        style={{
          width: "100%",
          height: "100%",
          fontFamily: "inherit",
        }}
      >
        <div style={{ marginBottom: 12, fontFamily: "inherit" }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: titleColor,
              lineHeight: 1.2,
              marginBottom: 4,
              fontFamily: "inherit",
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div style={{ fontSize: 12, color: mutedTextColor, fontFamily: "inherit" }}>{subtitle}</div>
          ) : null}
        </div>

        {showDetectedKeys ? (
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              color: mutedTextColor,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              fontFamily: "inherit",
            }}
          >
            <div>
              <strong>Fields:</strong>{" "}
              {fieldMeta.allFields.length
                ? fieldMeta.allFields.map((field) => toStartCaseLabel(field)).join(", ")
                : "None"}
            </div>
            <div>
              <strong>Numeric:</strong>{" "}
              {fieldMeta.numericFields.length
                ? fieldMeta.numericFields.map((field) => toStartCaseLabel(field)).join(", ")
                : "None"}
            </div>
            <div>
              <strong>Resolved:</strong> Y = {toStartCaseLabel(resolvedYAxisField || "-")}, X ={" "}
              {toStartCaseLabel(resolvedXAxisField || "-")}, Value = {toStartCaseLabel(resolvedValueField || "-")}
            </div>
            <div>
              <strong>Max columns:</strong> {normalizedMaxColumns}
            </div>
            <div>
              <strong>Font:</strong> {fontFamilySelect}
            </div>
          </div>
        ) : null}

        {!validation.ok ? (
          <div
            style={{
              border: `1px solid ${borderColor}`,
              background: tableHeaderBg,
              borderRadius: 10,
              padding: 16,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, color: titleColor, fontFamily: "inherit" }}>
              Invalid data
            </div>
            <div style={{ color: mutedTextColor, marginBottom: 10, fontFamily: "inherit" }}>
              {validation.message}
            </div>
          </div>
        ) : !hasRenderableData ? (
          <div
            style={{
              border: `1px solid ${borderColor}`,
              background: tableHeaderBg,
              borderRadius: 10,
              padding: 24,
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontFamily: "inherit" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: titleColor, fontFamily: "inherit" }}>
                No data
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: mutedTextColor, fontFamily: "inherit" }}>
                Rows are present, but no valid values were found for the selected X, Y, and Value fields.
              </div>
            </div>
          </div>
        ) : (
          <>
            {selectedCellSummary ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  background: selectedPanelBg,
                  color: selectedPanelTextColor,
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 12, color: mutedTextColor, fontFamily: "inherit" }}>Selected</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                  {toStartCaseLabel(resolvedYAxisField)}: {String(selectedCellSummary.yValue)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                  {toStartCaseLabel(resolvedXAxisField)}: {String(selectedCellSummary.xValue)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
                  {toStartCaseLabel(resolvedValueField)}: {formatValue(selectedCellSummary.value as number | null)}
                </div>
              </div>
            ) : null}

            <div
              className="cohort-cc-table-wrap"
              style={{
                overflow: "auto",
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                height: "calc(100% - 140px)",
                minHeight: 220,
                fontFamily: "inherit",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: 700,
                  tableLayout: "fixed",
                  fontFamily: "inherit",
                }}
              >
                <thead>
                  <tr>
                    <th
                      title={toStartCaseLabel(resolvedYAxisField)}
                      style={{
                        position: "sticky",
                        top: 0,
                        left: 0,
                        zIndex: 3,
                        textAlign: "left",
                        padding: "10px 12px",
                        background: tableHeaderBg,
                        borderBottom: `1px solid ${borderColor}`,
                        borderRight: `1px solid ${borderColor}`,
                        color: titleColor,
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 160,
                        fontFamily: "inherit",
                      }}
                    >
                      {toStartCaseLabel(resolvedYAxisField)}
                    </th>

                    {chartData.xValues.map((xVal) => (
                      <th
                        key={String(xVal)}
                        title={`${toStartCaseLabel(resolvedXAxisField)}: ${String(xVal)}`}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          textAlign: "center",
                          padding: "10px 12px",
                          background: tableHeaderBg,
                          borderBottom: `1px solid ${borderColor}`,
                          color: titleColor,
                          fontSize: 13,
                          fontWeight: 700,
                          minWidth: 84,
                          fontFamily: "inherit",
                        }}
                      >
                        {String(xVal)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {chartData.yValues.map((yVal) => {
                    const yKey = String(yVal);

                    return (
                      <tr key={yKey}>
                        <td
                          title={`${toStartCaseLabel(resolvedYAxisField)}: ${yKey}`}
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            background: rowLabelBg,
                            borderRight: `1px solid ${borderColor}`,
                            borderBottom: `1px solid ${borderColor}`,
                            padding: "12px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: titleColor,
                            whiteSpace: "nowrap",
                            fontFamily: "inherit",
                          }}
                        >
                          {yKey}
                        </td>

                        {chartData.xValues.map((xVal) => {
                          const xKey = String(xVal);
                          const cell = chartData.matrix[yKey]?.[xKey];
                          const value = cell?.value ?? null;
                          const key = `${yKey}__${xKey}`;
                          const isSelected = key === selectedCellKey;

                          const tooltipText =
                            value == null
                              ? `${toStartCaseLabel(resolvedYAxisField)}: ${yKey}\n${toStartCaseLabel(
                                  resolvedXAxisField
                                )}: ${xKey}\nNo data`
                              : `${toStartCaseLabel(resolvedYAxisField)}: ${yKey}\n${toStartCaseLabel(
                                  resolvedXAxisField
                                )}: ${xKey}\n${toStartCaseLabel(resolvedValueField)}: ${formatValue(value)}`;

                          return (
                            <td
                              key={`${yKey}-${xKey}`}
                              title={tooltipText}
                              onClick={() => {
                                const payload = {
                                  xField: resolvedXAxisField,
                                  yField: resolvedYAxisField,
                                  valueField: resolvedValueField,
                                  xValue: xVal,
                                  yValue: yVal,
                                  value,
                                  row: cell?.raw ?? null,
                                };
                                setSelectedCell(payload);
                                setSelectedValue(value == null ? "No data" : formatValue(value));
                              }}
                              style={{
                                padding: "14px 12px",
                                textAlign: "center",
                                verticalAlign: "middle",
                                borderBottom: `1px solid ${borderColor}`,
                                background: getCellBackground(value),
                                color: getCellTextColor(value),
                                fontSize: 15,
                                fontWeight: 700,
                                lineHeight: 1.2,
                                letterSpacing: "0.01em",
                                textShadow: getCellTextShadow(value),
                                cursor: "pointer",
                                outline: isSelected ? `2px solid ${selectedBorderColor}` : "none",
                                outlineOffset: isSelected ? "-2px" : undefined,
                                boxShadow: isSelected
                                  ? `inset 0 0 0 2px ${selectedBorderColor}`
                                  : "none",
                                fontFamily: "inherit",
                              }}
                            >
                              {showCellValues ? formatValue(value) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                fontSize: 12,
                color: mutedTextColor,
                fontFamily: "inherit",
              }}
            >
              <span title="Lower heatmap intensity">Low</span>
              <div
                title="Heatmap legend from lower intensity to higher intensity."
                style={{
                  width: 180,
                  height: 12,
                  borderRadius: 999,
                  background: `linear-gradient(to right, rgba(${parseHexToRgb(
                    heatmapBaseColor
                  ).join(",")}, 0.08), rgba(${parseHexToRgb(heatmapBaseColor).join(",")}, 1))`,
                  border: `1px solid ${borderColor}`,
                }}
              />
              <span title="Higher heatmap intensity">High</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CohortAnalysisChart;