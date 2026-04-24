import { useState, useMemo, useRef, useEffect } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Safe Expression Evaluator ────────────────────────────────────────────────

// Built-in functions available in formulas
const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  SUM:     (...args) => args.reduce((a, b) => a + b, 0),
  AVG:     (...args) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0,
  AVERAGE: (...args) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0,
  MIN:     (...args) => Math.min(...args),
  MAX:     (...args) => Math.max(...args),
  COUNT:   (...args) => args.length,
  ABS:     (a) => Math.abs(a),
  ROUND:   (a, d = 0) => { const f = Math.pow(10, d); return Math.round(a * f) / f; },
  FLOOR:   (a) => Math.floor(a),
  CEIL:    (a) => Math.ceil(a),
  POWER:   (a, b) => Math.pow(a, b),
  SQRT:    (a) => Math.sqrt(a),
  IF:      (cond, t, f) => cond ? t : f,
};

interface EvalResult {
  value: number | string | null;
  error: string;
}

function evaluateFormula(
  formula: string,
  rowData: Record<string, unknown>
): EvalResult {
  if (!formula) return { value: null, error: "" };

  // Strip leading = if present
  let expr = formula.trim();
  if (expr.startsWith("=")) expr = expr.slice(1).trim();
  if (!expr) return { value: null, error: "" };

  try {
    // Replace field names with their numeric values
    // Sort by length descending so longer names match first
    const fields = Object.keys(rowData).sort((a, b) => b.length - a.length);
    let processed = expr;

    for (const field of fields) {
      const val = rowData[field];
      const numVal = typeof val === "number" ? val : parseFloat(String(val));
      if (!isNaN(numVal)) {
        // Replace field name (case-insensitive, word boundary)
        const regex = new RegExp(`\\b${escapeRegex(field)}\\b`, "gi");
        processed = processed.replace(regex, String(numVal));
      }
    }

    // Replace function names with internal references
    let withFuncs = processed;
    for (const fname of Object.keys(FUNCTIONS)) {
      const regex = new RegExp(`\\b${fname}\\s*\\(`, "gi");
      withFuncs = withFuncs.replace(regex, `__fn_${fname}(`);
    }

    // Validate: only allow numbers, operators, parens, commas, dots, spaces, and function refs
    const sanitized = withFuncs.replace(/__fn_\w+/g, "0");
    if (!/^[\d\s+\-*/().,%<>=!&|?:]+$/.test(sanitized)) {
      return { value: null, error: "Invalid characters in formula" };
    }

    // Build function context
    const fnContext: Record<string, (...args: number[]) => number> = {};
    for (const [name, fn] of Object.entries(FUNCTIONS)) {
      fnContext[`__fn_${name}`] = fn;
    }

    // Evaluate using Function constructor with function context
    const fnKeys = Object.keys(fnContext);
    const fnVals = Object.values(fnContext);
    const evalFn = new Function(...fnKeys, `"use strict"; return (${withFuncs});`);
    const result = evalFn(...fnVals);

    if (typeof result === "number") {
      if (!isFinite(result)) return { value: null, error: "Result is not finite" };
      return { value: Math.round(result * 1e10) / 1e10, error: "" };
    }

    return { value: result, error: "" };
  } catch (e) {
    return { value: null, error: (e as Error).message };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FormulaBar() {
  Retool.useComponentSettings({ defaultWidth: 16, defaultHeight: 12 });

  // ── Inputs
  const [rowDataRaw] = Retool.useStateObject({
    name: "rowData",
    initialValue: { price: 25, qty: 4, tax: 0.1, discount: 5 },
    label: "Row Data",
    description: "JSON object with field names and values — e.g. { price: 25, qty: 4 }",
    inspector: "text",
  });

  const [initialFormula] = Retool.useStateString({
    name: "initialFormula",
    initialValue: "=price * qty * (1 + tax) - discount",
    label: "Initial Formula",
    description: "Pre-fill formula (optional)",
    inspector: "text",
  });

  // ── Outputs
  const [, setResult] = Retool.useStateString({
    name: "result",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setIsValid] = Retool.useStateBoolean({
    name: "isValid",
    initialValue: false,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onEvaluate = Retool.useEventCallback({ name: "evaluate" });

  // ── Local state
  const [formula, setFormula] = useState(initialFormula || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFormula) setFormula(initialFormula);
  }, [initialFormula]);

  // ── Evaluate
  const rowData = (rowDataRaw || {}) as Record<string, unknown>;
  const { value, error } = useMemo(() => evaluateFormula(formula, rowData), [formula, rowData]);
  const isValid = error === "" && value !== null;

  // ── Fire outputs
  useMemo(() => {
    setResult(value !== null ? String(value) : "");
    setIsValid(isValid);
    setModelUpdate({
      formula,
      result: value,
      isValid,
      error: error || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (isValid) onEvaluate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isValid, error]);

  // Available fields for hints
  const fieldNames = Object.keys(rowData);
  const funcNames = Object.keys(FUNCTIONS);

  return (
    <div className="fb-root">

      {/* ── Formula input ── */}
      <div className="fb-input-row">
        <div className="fb-fx-badge">fx</div>
        <input
          ref={inputRef}
          className={["fb-input", error ? "has-error" : isValid ? "is-valid" : ""].filter(Boolean).join(" ")}
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="=SUM(price * qty)"
          spellCheck={false}
        />
        {isValid && value !== null && (
          <div className="fb-result-badge">
            = {typeof value === "number" ? value.toLocaleString() : String(value)}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fb-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Field hints ── */}
      <div className="fb-hints">
        <div className="fb-hint-group">
          <span className="fb-hint-label">Fields</span>
          <div className="fb-hint-chips">
            {fieldNames.length > 0 ? fieldNames.map((f) => (
              <span
                key={f}
                className="fb-hint-chip field"
                onClick={() => {
                  setFormula((prev) => prev + f);
                  inputRef.current?.focus();
                }}
              >
                {f}
                <em className="fb-hint-val">{String(rowData[f])}</em>
              </span>
            )) : (
              <span className="fb-hint-empty">Pass rowData from Retool</span>
            )}
          </div>
        </div>
        <div className="fb-hint-group">
          <span className="fb-hint-label">Functions</span>
          <div className="fb-hint-chips">
            {funcNames.map((f) => (
              <span
                key={f}
                className="fb-hint-chip func"
                onClick={() => {
                  setFormula((prev) => prev + f + "(");
                  inputRef.current?.focus();
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
