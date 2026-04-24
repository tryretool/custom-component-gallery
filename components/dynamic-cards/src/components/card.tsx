import React, { FC, useEffect, useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";

type GenericRow = Record<string, unknown>;

type FieldMeta = {
  allFields: string[];
  numericFields: string[];
  textFields: string[];
};

type CardsPerRowOption = "one" | "two" | "three" | "four" | "five" | "six";
type FontFamilyOption =
  | "inter"
  | "roboto"
  | "openSans"
  | "lato"
  | "poppins"
  | "montserrat"
  | "playfairDisplay";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatCompactNumber(value: number, decimals = 1) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  }).format(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cardsPerRowFromOption(option: CardsPerRowOption): number {
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
    default:
      return 4;
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

export const DynamicKpiCards: FC = () => {
  Retool.useComponentSettings({
    defaultHeight: 24,
    defaultWidth: 8,
  });

  const [data] = Retool.useStateArray({
    name: "data",
    initialValue: [],
    inspector: "text",
    label: "Data",
    description: "Array of objects used to generate the KPI cards.",
  });

  const [selectedLabelField, setSelectedLabelField] = Retool.useStateString({
    name: "selectedLabelField",
    initialValue: "",
    inspector: "text",
    label: "Label field",
    description: "Field used as the card title or label. Leave blank to auto-detect.",
  });

  const [selectedValueField, setSelectedValueField] = Retool.useStateString({
    name: "selectedValueField",
    initialValue: "",
    inspector: "text",
    label: "Value field",
    description: "Numeric field used as the main KPI value. Leave blank to auto-detect.",
  });

  const [selectedSecondaryField, setSelectedSecondaryField] = Retool.useStateString({
    name: "selectedSecondaryField",
    initialValue: "",
    inspector: "text",
    label: "Secondary field",
    description: "Optional numeric field shown below the primary row.",
  });

  const [selectedTrendField, setSelectedTrendField] = Retool.useStateString({
    name: "selectedTrendField",
    initialValue: "",
    inspector: "text",
    label: "Trend field",
    description: "Optional numeric field shown beside the main value.",
  });

  const [title] = Retool.useStateString({
    name: "title",
    initialValue: "Dynamic KPI Cards",
    inspector: "text",
    label: "Title",
    description: "Main heading displayed above the KPI cards.",
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

  const [showSecondaryValue] = Retool.useStateBoolean({
    name: "showSecondaryValue",
    initialValue: true,
    inspector: "checkbox",
    label: "Show secondary value",
    description: "Controls whether the secondary metric is displayed on each card.",
  });

  const [showTrend] = Retool.useStateBoolean({
    name: "showTrend",
    initialValue: true,
    inspector: "checkbox",
    label: "Show trend",
    description: "Controls whether the trend indicator is displayed beside the main value.",
  });

  const [cardsPerRowSelect] = Retool.useStateEnumeration<
    ["one", "two", "three", "four", "five", "six"]
  >({
    name: "cardsPerRowSelect",
    initialValue: "four",
    enumDefinition: ["one", "two", "three", "four", "five", "six"],
    enumLabels: {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
    },
    inspector: "select",
    label: "Cards per row",
    description: "Select the number of cards per row.",
  });

  const [roundDecimals] = Retool.useStateNumber({
    name: "roundDecimals",
    initialValue: 1,
    inspector: "text",
    label: "Decimals",
    description: "Maximum number of decimal places used when formatting values.",
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
    description: "Select a predefined font family.",
  });

  const [titleColor] = Retool.useStateString({
    name: "titleColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Title color",
    description: "Color used for the component title.",
  });

  const [mutedTextColor] = Retool.useStateString({
    name: "mutedTextColor",
    initialValue: "#6b7280",
    inspector: "text",
    label: "Muted text color",
    description: "Color used for labels and helper text.",
  });

  const [backgroundColor] = Retool.useStateString({
    name: "backgroundColor",
    initialValue: "#ffffff",
    inspector: "text",
    label: "Background color",
    description: "Background color of the overall component container.",
  });

  const [borderColor] = Retool.useStateString({
    name: "borderColor",
    initialValue: "#e5e7eb",
    inspector: "text",
    label: "Border color",
    description: "Border color for the component and unselected cards.",
  });

  const [cardBg] = Retool.useStateString({
    name: "cardBg",
    initialValue: "#ffffff",
    inspector: "text",
    label: "Card background",
    description: "Background color of each KPI card.",
  });

  const [cardShadow] = Retool.useStateString({
    name: "cardShadow",
    initialValue: "0 1px 2px rgba(0,0,0,0.06)",
    inspector: "text",
    label: "Card shadow",
    description: "CSS box-shadow applied to unselected cards.",
  });

  const [valueColor] = Retool.useStateString({
    name: "valueColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Primary value color",
    description: "Color used for the main KPI value.",
  });

  const [secondaryValueColor] = Retool.useStateString({
    name: "secondaryValueColor",
    initialValue: "#6b7280",
    inspector: "text",
    label: "Secondary value color",
    description: "Color used for the optional secondary value.",
  });

  const [positiveTrendColor] = Retool.useStateString({
    name: "positiveTrendColor",
    initialValue: "#15803d",
    inspector: "text",
    label: "Positive trend color",
    description: "Color used when the trend value is positive.",
  });

  const [negativeTrendColor] = Retool.useStateString({
    name: "negativeTrendColor",
    initialValue: "#dc2626",
    inspector: "text",
    label: "Negative trend color",
    description: "Color used when the trend value is negative.",
  });

  const [neutralTrendColor] = Retool.useStateString({
    name: "neutralTrendColor",
    initialValue: "#6b7280",
    inspector: "text",
    label: "Neutral trend color",
    description: "Color used when the trend value is zero or unavailable.",
  });

  const [selectedCardBorderColor] = Retool.useStateString({
    name: "selectedCardBorderColor",
    initialValue: "#111827",
    inspector: "text",
    label: "Selected card border",
    description: "Border color used for the selected card.",
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

  const [selectedCard, setSelectedCard] = Retool.useStateObject({
    name: "selectedCard",
    initialValue: {},
    inspector: "hidden",
    label: "Selected card",
  });

  const cardClick = Retool.useEventCallback({ name: "cardClick" });

  const safeRows: GenericRow[] = useMemo(() => {
    return Array.isArray(data)
      ? (data.filter((row) => row && typeof row === "object") as GenericRow[])
      : [];
  }, [data]);

  const fieldMeta: FieldMeta = useMemo(() => {
    const keyOrder: string[] = [];
    const keySet = new Set<string>();
    const numeric = new Set<string>();
    const text = new Set<string>();

    for (const row of safeRows) {
      for (const key of Object.keys(row)) {
        if (!keySet.has(key)) {
          keySet.add(key);
          keyOrder.push(key);
        }
      }

      for (const [k, value] of Object.entries(row)) {
        if (isFiniteNumber(value)) numeric.add(k);
        if (typeof value === "string" && value.trim() !== "") text.add(k);
      }
    }

    return {
      allFields: keyOrder,
      numericFields: keyOrder.filter((k) => numeric.has(k)),
      textFields: keyOrder.filter((k) => text.has(k)),
    };
  }, [safeRows]);

  const autoDetectedFields = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "");

    const pickByPriority = (candidates: string[], priorities: string[]) => {
      if (!candidates.length) return "";

      const normalizedCandidates = candidates.map((c) => ({
        raw: c,
        normalized: normalize(c),
      }));

      for (const priority of priorities) {
        const exact = normalizedCandidates.find((c) => c.normalized === normalize(priority));
        if (exact) return exact.raw;
      }

      for (const priority of priorities) {
        const partial = normalizedCandidates.find((c) => c.normalized.includes(normalize(priority)));
        if (partial) return partial.raw;
      }

      return candidates[0] || "";
    };

    const labelCandidates = fieldMeta.textFields.length
      ? fieldMeta.textFields
      : fieldMeta.allFields.filter((f) => !fieldMeta.numericFields.includes(f));

    const value = pickByPriority(fieldMeta.numericFields, [
      "value",
      "amount",
      "count",
      "total",
      "revenue",
      "sales",
      "users",
      "score",
      "metricValue",
      "ret",
      "step",
      "emp",
    ]);

    const label = pickByPriority(
      labelCandidates.length ? labelCandidates : fieldMeta.allFields,
      ["label", "name", "title", "metric", "kpi", "category", "segment", "date", "cohort", "type"]
    );

    const secondary = pickByPriority(
      fieldMeta.numericFields.filter((f) => f !== value),
      ["secondaryValue", "previous", "target", "baseline", "benchmark", "users", "count"]
    );

    const trend = pickByPriority(
      fieldMeta.numericFields.filter((f) => f !== value && f !== secondary),
      ["trend", "change", "delta", "percentChange", "growth", "increase", "decrease"]
    );

    return { label, value, secondary, trend };
  }, [fieldMeta]);

  useEffect(() => {
    if (!selectedLabelField && autoDetectedFields.label) {
      setSelectedLabelField(autoDetectedFields.label);
    }
  }, [selectedLabelField, autoDetectedFields.label, setSelectedLabelField]);

  useEffect(() => {
    if (!selectedValueField && autoDetectedFields.value) {
      setSelectedValueField(autoDetectedFields.value);
    }
  }, [selectedValueField, autoDetectedFields.value, setSelectedValueField]);

  useEffect(() => {
    if (!selectedSecondaryField && autoDetectedFields.secondary) {
      setSelectedSecondaryField(autoDetectedFields.secondary);
    }
  }, [selectedSecondaryField, autoDetectedFields.secondary, setSelectedSecondaryField]);

  useEffect(() => {
    if (!selectedTrendField && autoDetectedFields.trend) {
      setSelectedTrendField(autoDetectedFields.trend);
    }
  }, [selectedTrendField, autoDetectedFields.trend, setSelectedTrendField]);

  useEffect(() => {
    if (selectedLabelField && !fieldMeta.allFields.includes(selectedLabelField)) {
      setSelectedLabelField(autoDetectedFields.label || "");
    }
  }, [selectedLabelField, fieldMeta.allFields, autoDetectedFields.label, setSelectedLabelField]);

  useEffect(() => {
    if (selectedValueField && !fieldMeta.numericFields.includes(selectedValueField)) {
      setSelectedValueField(autoDetectedFields.value || "");
    }
  }, [selectedValueField, fieldMeta.numericFields, autoDetectedFields.value, setSelectedValueField]);

  useEffect(() => {
    if (selectedSecondaryField && !fieldMeta.numericFields.includes(selectedSecondaryField)) {
      setSelectedSecondaryField(autoDetectedFields.secondary || "");
    }
  }, [selectedSecondaryField, fieldMeta.numericFields, autoDetectedFields.secondary, setSelectedSecondaryField]);

  useEffect(() => {
    if (selectedTrendField && !fieldMeta.numericFields.includes(selectedTrendField)) {
      setSelectedTrendField(autoDetectedFields.trend || "");
    }
  }, [selectedTrendField, fieldMeta.numericFields, autoDetectedFields.trend, setSelectedTrendField]);

  const resolveFields = (
    meta: FieldMeta,
    rawLabel: string,
    rawValue: string,
    rawSecondary: string,
    rawTrend: string,
    autoLabel: string,
    autoValue: string,
    autoSecondary: string,
    autoTrend: string
  ) => {
    const allFields = meta.allFields;
    const numericFields = meta.numericFields;

    let resolvedLabel = rawLabel || autoLabel;
    let resolvedValue = rawValue || autoValue;
    let resolvedSecondary = rawSecondary || autoSecondary;
    let resolvedTrend = rawTrend || autoTrend;

    if (!resolvedLabel || !allFields.includes(resolvedLabel)) resolvedLabel = autoLabel;
    if (!resolvedValue || !numericFields.includes(resolvedValue)) resolvedValue = autoValue;
    if (resolvedSecondary && !numericFields.includes(resolvedSecondary)) resolvedSecondary = autoSecondary;
    if (resolvedTrend && !numericFields.includes(resolvedTrend)) resolvedTrend = autoTrend;

    if (resolvedSecondary === resolvedValue) {
      resolvedSecondary = numericFields.find((f) => f !== resolvedValue) || "";
    }

    if (resolvedTrend === resolvedValue || resolvedTrend === resolvedSecondary) {
      resolvedTrend = numericFields.find((f) => f !== resolvedValue && f !== resolvedSecondary) || "";
    }

    return {
      resolvedLabel,
      resolvedValue,
      resolvedSecondary,
      resolvedTrend,
    };
  };

  const resolvedFields = useMemo(() => {
    return resolveFields(
      fieldMeta,
      selectedLabelField,
      selectedValueField,
      selectedSecondaryField,
      selectedTrendField,
      autoDetectedFields.label,
      autoDetectedFields.value,
      autoDetectedFields.secondary,
      autoDetectedFields.trend
    );
  }, [
    fieldMeta,
    selectedLabelField,
    selectedValueField,
    selectedSecondaryField,
    selectedTrendField,
    autoDetectedFields,
  ]);

  const resolvedLabelField = resolvedFields.resolvedLabel;
  const resolvedValueField = resolvedFields.resolvedValue;
  const resolvedSecondaryField = resolvedFields.resolvedSecondary;
  const resolvedTrendField = resolvedFields.resolvedTrend;

  const normalizedCardsPerRow = cardsPerRowFromOption(cardsPerRowSelect);

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

    if (!resolvedLabelField) {
      return { ok: false, message: "Could not resolve label field." };
    }

    if (!resolvedValueField) {
      return { ok: false, message: "Could not resolve value field." };
    }

    if (!fieldMeta.allFields.includes(resolvedLabelField)) {
      return { ok: false, message: `Label field "${resolvedLabelField}" is not present in data.` };
    }

    if (!fieldMeta.numericFields.includes(resolvedValueField)) {
      return { ok: false, message: `Value field "${resolvedValueField}" is not numeric.` };
    }

    return { ok: true, message: "" };
  }, [data, safeRows, resolvedLabelField, resolvedValueField, fieldMeta]);

  useEffect(() => {
    setValidationMessage(validation.message);
  }, [validation.message, setValidationMessage]);

  useEffect(() => {
    setResolvedConfig({
      selectedLabelField,
      selectedValueField,
      selectedSecondaryField,
      selectedTrendField,
      resolvedLabelField,
      resolvedValueField,
      resolvedSecondaryField,
      resolvedTrendField,
      availableFields: fieldMeta.allFields,
      numericFields: fieldMeta.numericFields,
      textFields: fieldMeta.textFields,
      autoDetectedFields,
      cardsPerRowSelect,
      normalizedCardsPerRow,
      safeRoundDecimals,
      fontFamilySelect,
      resolvedFontFamily,
    });
  }, [
    selectedLabelField,
    selectedValueField,
    selectedSecondaryField,
    selectedTrendField,
    resolvedLabelField,
    resolvedValueField,
    resolvedSecondaryField,
    resolvedTrendField,
    fieldMeta,
    autoDetectedFields,
    cardsPerRowSelect,
    normalizedCardsPerRow,
    safeRoundDecimals,
    fontFamilySelect,
    resolvedFontFamily,
    setResolvedConfig,
  ]);

  const cards = useMemo(() => {
    if (!validation.ok) {
      return [];
    }

    return safeRows.map((row, index) => {
      const label = row[resolvedLabelField];
      const value = row[resolvedValueField];
      const secondary = resolvedSecondaryField ? row[resolvedSecondaryField] : null;
      const trend = resolvedTrendField ? row[resolvedTrendField] : null;

      return {
        key: `${String(label ?? index)}__${index}`,
        label: label == null || String(label).trim() === "" ? `Item ${index + 1}` : String(label),
        value: isFiniteNumber(value) ? value : null,
        secondary: isFiniteNumber(secondary) ? secondary : null,
        trend: isFiniteNumber(trend) ? trend : null,
        row,
      };
    });
  }, [
    validation.ok,
    safeRows,
    resolvedLabelField,
    resolvedValueField,
    resolvedSecondaryField,
    resolvedTrendField,
  ]);

  const validCardCount = useMemo(() => {
    return cards.filter((card) => card.value != null).length;
  }, [cards]);

  const hasRenderableData = validation.ok && cards.length > 0 && validCardCount > 0;

  const selectedCardKey = useMemo(() => {
    if (!selectedCard || typeof selectedCard !== "object") return "";
    const k = (selectedCard as Record<string, unknown>).key;
    return typeof k === "string" ? k : "";
  }, [selectedCard]);

  const trendColor = (trend: number | null) => {
    if (trend == null) return neutralTrendColor;
    if (trend > 0) return positiveTrendColor;
    if (trend < 0) return negativeTrendColor;
    return neutralTrendColor;
  };

  const trendPrefix = (trend: number | null) => {
    if (trend == null) return "";
    if (trend > 0) return "+";
    return "";
  };

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
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700;900&family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        `}
      </style>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
          fontFamily: "inherit",
        }}
      >
        <div style={{ marginBottom: 12, flexShrink: 0, fontFamily: "inherit" }}>
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
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            <div>
              <strong>Fields:</strong> {fieldMeta.allFields.join(", ") || "None"}
            </div>
            <div>
              <strong>Numeric:</strong> {fieldMeta.numericFields.join(", ") || "None"}
            </div>
            <div>
              <strong>Resolved:</strong> Label = {resolvedLabelField || "-"}, Value = {resolvedValueField || "-"},
              Secondary = {resolvedSecondaryField || "-"}, Trend = {resolvedTrendField || "-"}
            </div>
            <div>
              <strong>Cards/row:</strong> {normalizedCardsPerRow}
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
              background: "#f9fafb",
              borderRadius: 10,
              padding: 16,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "inherit" }}>Invalid data</div>
            <div style={{ color: mutedTextColor, fontFamily: "inherit" }}>{validation.message}</div>
          </div>
        ) : !hasRenderableData ? (
          <div
            style={{
              border: `1px solid ${borderColor}`,
              background: "#f9fafb",
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
              <div style={{ fontWeight: 700, fontSize: 16, color: titleColor, fontFamily: "inherit" }}>
                No data
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: mutedTextColor, fontFamily: "inherit" }}>
                Rows are present, but no valid numeric values were found for the selected value field.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: "auto",
              padding: 4,
              fontFamily: "inherit",
            }}
          >
            <div
              key={`grid-${cardsPerRowSelect}`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${normalizedCardsPerRow}, minmax(0, 1fr))`,
                gap: 12,
                width: "100%",
                minWidth: 0,
                alignItems: "stretch",
                paddingBottom: 8,
                fontFamily: "inherit",
              }}
            >
              {cards.map((card) => {
                const isSelected = card.key === selectedCardKey;

                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      const payload = {
                        key: card.key,
                        label: card.label,
                        value: card.value,
                        secondary: card.secondary,
                        trend: card.trend,
                        row: card.row,
                      };

                      setSelectedCard(payload);
                      cardClick();
                    }}
                    title={
                      card.value == null
                        ? `${card.label}\nNo data`
                        : `${card.label}\nValue: ${formatCompactNumber(card.value, safeRoundDecimals)}`
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      minWidth: 0,
                      maxWidth: "100%",
                      textAlign: "left",
                      border: `1px solid ${isSelected ? selectedCardBorderColor : borderColor}`,
                      boxShadow: isSelected
                        ? `inset 0 0 0 1px ${selectedCardBorderColor}`
                        : cardShadow,
                      background: cardBg,
                      borderRadius: 14,
                      padding: 16,
                      cursor: "pointer",
                      appearance: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: mutedTextColor,
                        marginBottom: 10,
                        fontFamily: "inherit",
                        fontWeight: 400,
                      }}
                    >
                      {card.label}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "flex-start",
                        gap: 12,
                        marginBottom: 10,
                        fontFamily: "inherit",
                        flexWrap: "nowrap",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          lineHeight: 1.1,
                          fontWeight: 700,
                          color: valueColor,
                          fontFamily: "inherit",
                        }}
                      >
                        {card.value == null ? "No data" : formatCompactNumber(card.value, safeRoundDecimals)}
                      </div>

                      {showTrend ? (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: trendColor(card.trend),
                            fontFamily: "inherit",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {card.trend == null
                            ? "No data"
                            : `${trendPrefix(card.trend)}${card.trend.toFixed(safeRoundDecimals)}`}
                        </div>
                      ) : null}
                    </div>

                    {showSecondaryValue ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: secondaryValueColor,
                          fontFamily: "inherit",
                          fontWeight: 400,
                        }}
                      >
                        Secondary:{" "}
                        {card.secondary == null
                          ? "No data"
                          : formatCompactNumber(card.secondary, safeRoundDecimals)}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicKpiCards;