import React, { FC, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Retool } from "@tryretool/custom-component-support";
import { Document, Page, pdfjs } from "react-pdf";
import * as XLSX from "xlsx";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FileType = "image" | "video" | "pdf" | "word" | "excel" | "csv" | "json" | "text" | "other";

function transformGoogleUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname;

    const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?&#]+)/);
    if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;

    const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&#]+)/);
    if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;

    const docsDoc = url.match(/docs\.google\.com\/document\/d\/([^/?&#]+)/);
    if (docsDoc) return `https://docs.google.com/document/d/${docsDoc[1]}/preview`;

    const docsSheet = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/?&#]+)/);
    if (docsSheet) return `https://docs.google.com/spreadsheets/d/${docsSheet[1]}/preview`;

    const docsSlides = url.match(/docs\.google\.com\/presentation\/d\/([^/?&#]+)/);
    if (docsSlides) return `https://docs.google.com/presentation/d/${docsSlides[1]}/embed`;

    const docsForms = url.match(/docs\.google\.com\/forms\/d\/([^/?&#]+)/);
    if (docsForms) return `https://docs.google.com/forms/d/${docsForms[1]}/viewform?embedded=true`;

    return null;
  } catch {
    return null;
  }
}

function isGoogleUrl(url: string): boolean {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

function detectFileType(input: string): FileType {
  if (!input) return "other";
  const str = input.toLowerCase();
  if (str.startsWith("data:")) {
    if (str.includes("image/")) return "image";
    if (str.includes("video/")) return "video";
    if (str.includes("pdf")) return "pdf";
    if (
      str.includes("word") ||
      str.includes("officedocument.wordprocessingml") ||
      str.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) return "word";
    if (str.includes("excel") || str.includes("spreadsheet")) return "excel";
    if (str.includes("text/csv")) return "csv";
    if (str.includes("application/json")) return "json";
    if (str.includes("text/plain")) return "text";
    return "other";
  }
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(str)) return "image";
  if (/\.(mp4|webm|mov|avi|mkv|m4v|ogg)(\?|$)/i.test(str)) return "video";
  if (/\.pdf(\?|$)/i.test(str)) return "pdf";
  if (/\.(doc|docx)(\?|$)/i.test(str)) return "word";
  if (/\.(ppt|pptx)(\?|$)/i.test(str)) return "word";
  if (/\.(xls|xlsx)(\?|$)/i.test(str)) return "excel";
  if (/\.csv(\?|$)/i.test(str)) return "csv";
  if (/\.json(\?|$)/i.test(str)) return "json";
  if (/\.(txt|log|md)(\?|$)/i.test(str)) return "text";
  if (/\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/i.test(str)) return "other";
  return "other";
}

function ensureBase64Prefix(b64: string, filenameHint?: string): string {
  if (b64.startsWith("data:")) return b64;

  const c = b64.replace(/\s/g, "");

  if (c.startsWith("JVBER")) return `data:application/pdf;base64,${c}`;
  if (c.startsWith("iVBOR")) return `data:image/png;base64,${c}`;
  if (c.startsWith("/9j/")) return `data:image/jpeg;base64,${c}`;
  if (c.startsWith("R0lGOD")) return `data:image/gif;base64,${c}`;

  if (c.startsWith("UEsDB")) {
    if (filenameHint?.toLowerCase().endsWith(".docx")) {
      return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${c}`;
    }
    if (filenameHint?.toLowerCase().endsWith(".xlsx")) {
      return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${c}`;
    }
    if (filenameHint?.toLowerCase().endsWith(".pptx")) {
      return `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${c}`;
    }

    return `data:application/zip;base64,${c}`;
  }

  return `data:application/octet-stream;base64,${c}`;
}

async function toBlobUrl(file: string, type: FileType): Promise<string> {
  if (file.startsWith("data:")) {
    if (type === "video" || type === "image") return file;
    try {
      const res = await fetch(file);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch { return file; }
  }
  if (file.includes("google.com") && (file.includes("/preview") || file.includes("/embed") || file.includes("/viewform"))) {
    return file;
  }
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    throw new Error(`Failed to fetch file: ${e}`);
  }
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const parseRow = (row: string): string[] => {
    const result: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') { if (inQ && row[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim()); return result;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseRow(line);
    return headers.reduce((acc: Record<string, string>, h, i) => { acc[h] = vals[i] ?? ""; return acc; }, {});
  });
}

async function parseFile(file: string, type: FileType): Promise<Record<string, unknown>[] | string | null> {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    if (type === "csv") return parseCSV(new TextDecoder().decode(buffer));
    if (type === "excel") {
      const wb = XLSX.read(buffer, { type: "array" });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    }
    if (type === "json") {
      const parsed = JSON.parse(new TextDecoder().decode(buffer));
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (type === "text") return new TextDecoder().decode(buffer);
    if (type === "word") {
      const mammoth = await import("mammoth");
      return (await mammoth.convertToHtml({ arrayBuffer: buffer })).value;
    }
  } catch (e) { console.error("Parse error:", e); throw e; }
  return null;
}

export const FileViewer: FC = () => {
  Retool.useComponentSettings({ defaultWidth: 6, defaultHeight: 40 });
  const [inputValue, setInputValue] = useState("");
  const [uploadedDataUrl, setUploadedDataUrl] = useState("");
  const [loadedInputValue, setLoadedInputValue] = useState("");
  const [filenameHint, setFilenameHint] = useState("");
  const [file, setFile] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const [data, setData] = useState<Record<string, unknown>[] | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const type = useMemo(() => {
    const fromDataUrl = detectFileType(file);
    if (fromDataUrl !== "other") return fromDataUrl;
    if (filenameHint) return detectFileType(filenameHint);
    return "other";
  }, [file, filenameHint]);

  const isUploaded = uploadedDataUrl !== "" && file === uploadedDataUrl;
  const isViewLoaded = loadedInputValue !== "" && loadedInputValue === inputValue.trim() && !isUploaded;
  const isLoaded = isUploaded || isViewLoaded;
  const canClickView = inputValue.trim() !== "" && !isLoaded;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w - 48);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => { if (blobUrl?.startsWith("blob:")) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  useEffect(() => {
    if (!file) { setBlobUrl(""); setData(null); setEmbedUrl(""); return; }

    let cancelled = false;
    let currentBlobUrl = "";

    const load = async () => {
      setLoading(true); setError(""); setPage(1); setPages(0); setData(null); setEmbedUrl("");

      try {
        if (file.startsWith("http") && isGoogleUrl(file)) {
          const preview = transformGoogleUrl(file);
          if (preview) {
            if (!cancelled) { setEmbedUrl(preview); setBlobUrl(preview); }
            return;
          }
          if (!cancelled) { setEmbedUrl(file); setBlobUrl(file); }
          return;
        }

        const url = await toBlobUrl(file, type);
        if (cancelled) { if (url.startsWith("blob:")) URL.revokeObjectURL(url); return; }
        currentBlobUrl = url;
        setBlobUrl(url);

        if (["csv", "excel", "json", "text", "word"].includes(type)) {
          const parsed = await parseFile(url, type);
          if (!cancelled) setData(parsed);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load file");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (currentBlobUrl?.startsWith("blob:")) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [file, type]);

  const handleView = useCallback(() => {
    let value = inputValue.trim();
    if (!value) return;
    if (!value.startsWith("http") && !value.startsWith("data:")) {
      value = ensureBase64Prefix(value, filenameHint);
    }
    setUploadedDataUrl("");
    setLoadedInputValue(inputValue.trim());
    setFile(value);
  }, [inputValue]);

  const handleUpload = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;
        setInputValue(f.name);
        setFilenameHint(f.name);
        setUploadedDataUrl(dataUrl);
        setFile(dataUrl);
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(f);
  }, []);

  const handleDownload = useCallback(() => {
    if (embedUrl) { window.open(file, "_blank"); return; }
    const url = blobUrl || file;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = inputValue || "download";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [blobUrl, file, inputValue, embedUrl]);

  const handlePrint = useCallback(() => {
    if (type === "word" && typeof data === "string") {
      const win = window.open("", "_blank");
      if (win) { win.document.write(`<html><body>${data}</body></html>`); win.document.close(); win.print(); }
      return;
    }
    const url = blobUrl || file;
    if (!url) return;
    const win = window.open(url, "_blank");
    if (win) win.onload = () => win.print();
  }, [blobUrl, file, type, data]);

  const handleClear = useCallback(() => {
    if (blobUrl?.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
    setFile(""); setInputValue(""); setUploadedDataUrl(""); setLoadedInputValue(""); setFilenameHint("");
    setBlobUrl(""); setData(null); setError("");
    setPage(1); setPages(0); setEmbedUrl("");
  }, [blobUrl]);

  const C = {
    primary: "#4F46E5", surface: "#FFFFFF", bg: "#F8FAFC",
    border: "#E2E8F0", muted: "#64748B", danger: "#EF4444",
    dangerBg: "#FEF2F2", text: "#1E293B", tableHead: "#F1F5F9",
  };

  const typeTag: Record<string, { bg: string; color: string }> = {
    pdf: { bg: "#FEE2E2", color: "#EF4444" },
    image: { bg: "#EDE9FE", color: "#7C3AED" },
    video: { bg: "#DBEAFE", color: "#2563EB" },
    word: { bg: "#DBEAFE", color: "#1D4ED8" },
    excel: { bg: "#DCFCE7", color: "#16A34A" },
    csv: { bg: "#E0F2FE", color: "#0284C7" },
    json: { bg: "#FEF3C7", color: "#D97706" },
    text: { bg: "#F1F5F9", color: "#475569" },
    other: { bg: "#F1F5F9", color: "#475569" },
  };
  const tag = typeTag[type] ?? typeTag.other;

  const btnBase: React.CSSProperties = {
    padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
    cursor: "pointer", border: `1px solid ${C.border}`, background: C.surface, color: C.text,
  };
  const thSt: React.CSSProperties = {
    padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: C.tableHead,
    textAlign: "left", position: "sticky", top: 0, fontSize: 11, fontWeight: 700,
    color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const tdSt: React.CSSProperties = { padding: "10px 14px", borderBottom: `1px solid #F1F5F9`, fontSize: 13 };

  const renderContent = () => {
    if (!file) return (
      <div style={{ textAlign: "center", color: C.muted, padding: "60px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>No file loaded</div>
        <div style={{ fontSize: 13, marginTop: 6, color: "#94A3B8" }}>
          Upload a file or paste a URL / Base64 string above
        </div>
      </div>
    );

    if (loading) return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", margin: "0 auto 16px",
          border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading file…</div>
      </div>
    );

    if (error) return (
      <div style={{
        maxWidth: 480, width: "100%", textAlign: "center", padding: "36px 24px",
        background: C.dangerBg, borderRadius: 12, border: "1px solid #FECACA", color: C.danger,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Failed to load file</div>
        <div style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.6 }}>{error}</div>
      </div>
    );

    if (embedUrl) return (
      <iframe
        src={embedUrl}
        title="Google file preview"
        style={{ width: "100%", height: "100%", minHeight: 560, border: "none", borderRadius: 10 }}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );

    if (type === "image") return (
      <img src={blobUrl} alt="Preview"
        style={{ maxWidth: "100%", maxHeight: 640, objectFit: "contain", borderRadius: 10 }} />
    );

    if (type === "video") return (
      <div style={{ width: "100%", background: "#0F172A", borderRadius: 12, overflow: "hidden" }}>
        <video controls style={{ width: "100%", maxHeight: 540, display: "block" }}
          onError={(e) => {
            const code = (e.currentTarget as HTMLVideoElement).error?.code;
            setError(code === 3 || code === 4
              ? "Video codec not supported. Try MP4 (H.264) or WebM format."
              : "Video failed to load. File may be corrupted or format unsupported."
            );
          }}
        >
          <source src={blobUrl} type="video/mp4" />
          <source src={blobUrl} type="video/webm" />
          <source src={blobUrl} type="video/ogg" />
        </video>
      </div>
    );

    if (type === "pdf") return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "8px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ ...btnBase, opacity: page <= 1 ? 0.35 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
            ← Prev
          </button>
          <div style={{ background: C.bg, borderRadius: 7, padding: "4px 14px", minWidth: 80, textAlign: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{page}</span>
            <span style={{ color: C.muted, fontSize: 12 }}> / {pages || "?"}</span>
          </div>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            style={{ ...btnBase, opacity: page >= pages ? 0.35 : 1, cursor: page >= pages ? "not-allowed" : "pointer" }}>
            Next →
          </button>
          {pages > 0 && (
            <span style={{ fontSize: 12, color: C.muted, paddingLeft: 10, borderLeft: `1px solid ${C.border}` }}>
              {pages} pages
            </span>
          )}
          {pages > 4 && (
            <>
              <span style={{ fontSize: 12, color: C.muted, paddingLeft: 10, borderLeft: `1px solid ${C.border}` }}>Jump:</span>
              <input type="number" min={1} max={pages} defaultValue={page}
                onBlur={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= pages) setPage(v); }}
                style={{ width: 52, padding: "4px 6px", borderRadius: 6, fontSize: 13, border: `1px solid ${C.border}`, textAlign: "center" }} />
            </>
          )}
        </div>
        <div style={{ background: C.surface, borderRadius: 12, boxShadow: "0 6px 32px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          <Document file={blobUrl}
            onLoadSuccess={(d) => setPages(d.numPages)}
            onLoadError={(e) => setError(`PDF load error: ${e.message}`)}
            loading={<div style={{ padding: 48, color: C.muted, textAlign: "center" }}>Rendering PDF…</div>}
          >
            <Page pageNumber={page} width={Math.min(containerWidth, 860)} renderTextLayer renderAnnotationLayer />
          </Document>
        </div>
      </div>
    );

    if (type === "word") {
      if (typeof data === "string") return (
        <div style={{
          width: "100%", maxWidth: 820, margin: "0 auto", background: C.surface,
          borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "44px 60px", fontFamily: "Georgia, serif", lineHeight: 1.85, fontSize: 15, color: C.text,
        }} dangerouslySetInnerHTML={{ __html: data }} />
      );
      if (file.startsWith("http")) return (
        <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(file)}&embedded=true`}
          title="Doc preview" style={{ width: "100%", height: 600, border: "none", borderRadius: 10 }} />
      );
      return <div style={{ color: C.muted }}>Loading document…</div>;
    }

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      return (
        <div style={{ width: "100%", overflow: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{headers.map(k => <th key={k} style={thSt}>{k}</th>)}</tr></thead>
            <tbody>
              {(data as Record<string, unknown>[]).slice(0, 500).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                  {headers.map(k => <td key={k} style={tdSt}>{String(row[k] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 500 && (
            <div style={{ padding: "10px 14px", textAlign: "center", color: C.muted, fontSize: 12 }}>
              Showing 500 of {data.length} rows
            </div>
          )}
        </div>
      );
    }

    if (typeof data === "string") return (
      <pre style={{
        width: "100%", overflow: "auto", margin: 0, padding: 20,
        background: "#1E293B", color: "#E2E8F0", borderRadius: 10,
        fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word",
        fontFamily: "ui-monospace, 'Cascadia Code', monospace", lineHeight: 1.65,
      }}>{data}</pre>
    );

    if (blobUrl) return (
      <iframe src={blobUrl} title="File preview"
        style={{ width: "100%", height: 600, border: "none", borderRadius: 10 }} />
    );

    return null;
  };

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`,
      overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setLoadedInputValue("");
              if (isUploaded) { setUploadedDataUrl(""); setFilenameHint(""); }
            }}
            onKeyDown={e => { if (e.key === "Enter" && canClickView) handleView(); }}
            placeholder="Paste a URL, Google Drive / Docs link, or Base64 string…"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, outline: "none", color: C.text,
            }}
            onFocus={e => (e.target.style.borderColor = C.primary)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />

          <input type="file" hidden id="file-upload"
            onChange={e => { if (e.target.files?.[0]) { handleUpload(e.target.files[0]); e.target.value = ""; } }} />

          <label htmlFor="file-upload" style={{
            padding: "10px 16px", borderRadius: 8, background: "#EEF2FF",
            color: C.primary, cursor: "pointer", fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", gap: 5, border: "1px solid #C7D2FE",
            userSelect: "none",
          }}>
            📁 Upload
          </label>

          <button
            onClick={handleView}
            disabled={!canClickView}
            title={isLoaded ? "Already loaded — edit the input to load a new file" : "Load the URL or Base64 string"}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: canClickView ? C.primary : isLoaded ? "#10B981" : "#CBD5E1",
              color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: canClickView ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            {isLoaded ? "✓ Loaded" : "View"}
          </button>
        </div>

        {file && !loading && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                background: tag.bg, color: tag.color, letterSpacing: "0.05em", textTransform: "uppercase",
              }}>{type}</span>
              <span style={{ fontSize: 12, color: C.muted }}>
                {isUploaded ? `uploaded — ${inputValue}` : isViewLoaded ? "loaded from URL" : "file loaded"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleDownload} style={btnBase}>⬇ Download</button>
              <button onClick={handlePrint} style={btnBase}>🖨 Print</button>
              <button onClick={handleClear} style={{
                ...btnBase, background: C.dangerBg, color: C.danger, borderColor: "#FECACA",
              }}>✕ Clear</button>
            </div>
          </div>
        )}
      </div>

      <div ref={containerRef} style={{
        flex: 1, overflow: "auto", padding: 20,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
      }}>
        {renderContent()}
      </div>
    </div>
  );
};