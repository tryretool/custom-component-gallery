import { useState, useMemo, useRef } from "react";
import { Retool } from "@tryretool/custom-component-support";
import Papa from "papaparse";
import "./styles.css";

// ─── Main Component ───────────────────────────────────────────────────────────

export function PasteToTable() {
  Retool.useComponentSettings({ defaultWidth: 20, defaultHeight: 40 });

  // ── Inputs
  const [placeholder] = Retool.useStateString({
    name: "placeholder",
    initialValue: "Paste CSV data here...\n\nExample:\nName, Email, Role\nJohn, john@example.com, Admin\nJane, jane@example.com, Editor",
    label: "Placeholder Text",
    inspector: "text",
  });

  const [maxPreviewRows] = Retool.useStateNumber({
    name: "maxPreviewRows",
    initialValue: 100,
    label: "Max Preview Rows",
    description: "Maximum number of rows to show in the preview table",
    inspector: "text",
  });

  const [delimiter] = Retool.useStateEnumeration({
    name: "delimiter",
    initialValue: "auto",
    enumDefinition: ["auto", ",", ";", "\\t", "|"],
    label: "Delimiter",
    description: "CSV delimiter — auto-detect or pick one",
    inspector: "select",
  });

  // ── Outputs
  const [, setParsedData] = Retool.useStateArray({
    name: "parsedData",
    initialValue: [],
    inspector: "hidden",
  });

  const [, setHeaders] = Retool.useStateArray({
    name: "headers",
    initialValue: [],
    inspector: "hidden",
  });

  const [, setRowCount] = Retool.useStateNumber({
    name: "rowCount",
    initialValue: 0,
    inspector: "hidden",
  });

  const [, setColumnCount] = Retool.useStateNumber({
    name: "columnCount",
    initialValue: 0,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  // ── Events
  const onParse = Retool.useEventCallback({ name: "dataParsed" });

  // ── Local state
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Parse CSV
  const parsed = useMemo(() => {
    if (!rawText.trim()) return { headers: [] as string[], rows: [] as Record<string, string>[] };

    const delim = delimiter === "auto" ? undefined : delimiter === "\\t" ? "\t" : delimiter;

    const result = Papa.parse<Record<string, string>>(rawText.trim(), {
      header: true,
      skipEmptyLines: true,
      delimiter: delim,
      transformHeader: (h: string) => h.trim(),
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      setError(result.errors[0].message);
      return { headers: [] as string[], rows: [] as Record<string, string>[] };
    }

    setError("");
    const headers = result.meta.fields || [];
    const rows = result.data;
    return { headers, rows };
  }, [rawText, delimiter]);

  // ── Fire outputs
  const fireOutputs = (headers: string[], rows: Record<string, string>[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setParsedData(rows as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHeaders(headers as any);
    setRowCount(rows.length);
    setColumnCount(headers.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setModelUpdate({ headers, rowCount: rows.length, columnCount: headers.length, data: rows } as any);
    onParse();
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    // Parse inline and fire
    if (!text.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setParsedData([] as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHeaders([] as any);
      setRowCount(0);
      setColumnCount(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setModelUpdate({} as any);
      return;
    }

    const delim = delimiter === "auto" ? undefined : delimiter === "\\t" ? "\t" : delimiter;
    const result = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
      skipEmptyLines: true,
      delimiter: delim,
      transformHeader: (h: string) => h.trim(),
    });

    if (result.data.length > 0) {
      const h = result.meta.fields || [];
      fireOutputs(h, result.data);
    }
  };

  const handleClear = () => {
    setRawText("");
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setParsedData([] as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHeaders([] as any);
    setRowCount(0);
    setColumnCount(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setModelUpdate({} as any);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const displayRows = parsed.rows.slice(0, maxPreviewRows);
  const hasData = parsed.headers.length > 0 && parsed.rows.length > 0;
  const isTruncated = parsed.rows.length > maxPreviewRows;

  return (
    <div className="pt-root">

      {/* Input area */}
      <div className="pt-input-section">
        <div className="pt-input-header">
          <div className="pt-input-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Paste CSV
          </div>
          {rawText && (
            <button className="pt-clear-btn" onClick={handleClear}>Clear</button>
          )}
        </div>
        <textarea
          ref={textareaRef}
          className="pt-textarea"
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />
        {error && <div className="pt-error">{error}</div>}
      </div>

      {/* Preview table */}
      {hasData && (
        <div className="pt-table-section">
          <div className="pt-table-header">
            <span className="pt-table-title">Preview</span>
            <span className="pt-table-stats">
              {parsed.rows.length} row{parsed.rows.length !== 1 ? "s" : ""} × {parsed.headers.length} col{parsed.headers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead>
                <tr>
                  <th className="pt-row-num">#</th>
                  {parsed.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="pt-row-num">{ri + 1}</td>
                    {parsed.headers.map((h, ci) => (
                      <td key={ci}>{row[h] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isTruncated && (
            <div className="pt-truncated">
              Showing {maxPreviewRows} of {parsed.rows.length} rows
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasData && !error && rawText.trim() === "" && (
        <div className="pt-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Paste CSV data above to preview</span>
        </div>
      )}
    </div>
  );
}
