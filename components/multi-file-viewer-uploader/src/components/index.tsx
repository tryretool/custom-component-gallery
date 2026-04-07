import React, { FC, useMemo, useRef, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";
import * as XLSX from "xlsx";
import "./index.css";

type FileKind =
    | "image"
    | "pdf"
    | "video"
    | "audio"
    | "text"
    | "json"
    | "csv"
    | "excel"
    | "office"
    | "unknown";

type ViewerFile = {
    id: string;
    name: string;
    url: string;
    previewUrl?: string;
    mimeType?: string;
    label: string;
    kind: FileKind;
    objectUrl?: string;
    base64?: string;
};

const KIND_ICONS: Record<FileKind, string> = {
    image: "🖼️",
    pdf: "📄",
    video: "🎬",
    audio: "🎵",
    text: "📝",
    json: "🧩",
    csv: "📊",
    excel: "📗",
    office: "📎",
    unknown: "📁",
};

const MultiFileViewer: FC = () => {
    Retool.useComponentSettings({
        defaultWidth: 9,
        defaultHeight: 28,
    });

    const [files, setFiles] = Retool.useStateArray({
        name: "files",
        initialValue: [],
        inspector: "hidden",
    });

    const [_selectedFile, setSelectedFile] = Retool.useStateObject({
        name: "selectedFile",
        initialValue: {
            id: "",
            name: "",
            url: "",
            previewUrl: "",
            mimeType: "",
            label: "",
            kind: "unknown",
        },
        inspector: "hidden",
    });

    const [_selectedFileData, setSelectedFileData] = Retool.useStateObject({
        name: "selectedFileData",
        initialValue: {
            name: "",
            type: "",
            base64: "",
        },
        inspector: "hidden",
    });

    const [_allFileData, setAllFileData] = Retool.useStateArray({
        name: "allFileData",
        initialValue: [],
        inspector: "hidden",
    });

    const [acceptedKind, setAcceptedKind] = Retool.useStateString({
        name: "acceptedKind",
        initialValue: "",
        inspector: "hidden",
    });

    const [allowMixedFileTypes] = Retool.useStateBoolean({
        name: "allowMixedFileTypes",
        initialValue: false,
        label: "Allow different file types",
        inspector: "checkbox",
    });

    const [selectedFileId, setSelectedFileId] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [textPreview, setTextPreview] = useState("");
    const [jsonPreview, setJsonPreview] = useState("");
    const [sheetPreview, setSheetPreview] = useState<any[][] | null>(null);

    const onFileSelect = Retool.useEventCallback({ name: "fileSelect" });
    const onFilesChange = Retool.useEventCallback({ name: "filesChange" });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const visibleFiles = useMemo(
        () => (Array.isArray(files) ? (files as ViewerFile[]) : []),
        [files]
    );

    const activeFile = useMemo(
        () => visibleFiles.find((f) => f.id === selectedFileId) ?? null,
        [visibleFiles, selectedFileId]
    );

    const showSidebar = visibleFiles.length > 0;

    const truncate = (value: string, max = 40) =>
        value.length > max ? `${value.slice(0, max)}…` : value;

    const detectKind = (file: File): FileKind => {
        const type = (file.type || "").toLowerCase();
        const name = file.name.toLowerCase();

        if (type.startsWith("image/")) return "image";
        if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
        if (type.startsWith("video/")) return "video";
        if (type.startsWith("audio/")) return "audio";
        if (type.includes("json") || name.endsWith(".json")) return "json";
        if (type.includes("csv") || name.endsWith(".csv")) return "csv";

        if (
            type.includes("spreadsheet") ||
            type.includes("excel") ||
            name.endsWith(".xlsx") ||
            name.endsWith(".xls")
        ) {
            return "excel";
        }

        if (
            type.includes("word") ||
            type.includes("presentation") ||
            name.endsWith(".doc") ||
            name.endsWith(".docx") ||
            name.endsWith(".ppt") ||
            name.endsWith(".pptx")
        ) {
            return "office";
        }

        if (
            type.startsWith("text/") ||
            name.endsWith(".txt") ||
            name.endsWith(".md") ||
            name.endsWith(".log")
        ) {
            return "text";
        }

        return "unknown";
    };

    const normalizeLabel = (kind: FileKind) => {
        switch (kind) {
            case "image":
                return "Image";
            case "pdf":
                return "PDF";
            case "video":
                return "Video";
            case "audio":
                return "Audio";
            case "text":
                return "Text";
            case "json":
                return "JSON";
            case "csv":
                return "CSV";
            case "excel":
                return "Excel";
            case "office":
                return "Office";
            default:
                return "File";
        }
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = typeof reader.result === "string" ? reader.result : "";
                const base64 = result.includes(",") ? result.split(",")[1] : result;
                resolve(base64);
            };

            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
        });

    const buildAllFileData = (items: ViewerFile[]) =>
        items.map((file) => ({
            id: file.id,
            name: file.name,
            type: file.mimeType || "",
            kind: file.kind,
            base64: file.base64 || "",
            label: file.label,
        }));

    const decodeBase64Utf8 = (base64: string) => {
        try {
            const binary = atob(base64);
            const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        } catch {
            return "";
        }
    };

    const readPreviewFromSourceFile = async (file: File, kind: FileKind) => {
        setTextPreview("");
        setJsonPreview("");
        setSheetPreview(null);

        if (kind === "text") {
            const text = await file.text();
            setTextPreview(text);
            return;
        }

        if (kind === "json") {
            const text = await file.text();
            try {
                const parsed = JSON.parse(text);
                setJsonPreview(JSON.stringify(parsed, null, 2));
            } catch {
                setJsonPreview(text);
            }
            return;
        }

        if (kind === "csv") {
            const text = await file.text();
            const wb = XLSX.read(text, { type: "string" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            setSheetPreview(rows);
            return;
        }

        if (kind === "excel") {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            setSheetPreview(rows);
        }
    };

    const hydratePreviewFromStoredFile = (file: ViewerFile) => {
        setTextPreview("");
        setJsonPreview("");
        setSheetPreview(null);

        if (!file.base64) return;

        if (file.kind === "text") {
            setTextPreview(decodeBase64Utf8(file.base64));
            return;
        }

        if (file.kind === "json") {
            const decoded = decodeBase64Utf8(file.base64);
            try {
                const parsed = JSON.parse(decoded);
                setJsonPreview(JSON.stringify(parsed, null, 2));
            } catch {
                setJsonPreview(decoded);
            }
            return;
        }

        if (file.kind === "csv") {
            try {
                const decoded = decodeBase64Utf8(file.base64);
                const wb = XLSX.read(decoded, { type: "string" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                setSheetPreview(rows);
            } catch {
                setSheetPreview(null);
            }
            return;
        }

        if (file.kind === "excel") {
            try {
                const binary = atob(file.base64);
                const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
                const wb = XLSX.read(bytes, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                setSheetPreview(rows);
            } catch {
                setSheetPreview(null);
            }
        }
    };

    const selectFile = async (file: ViewerFile) => {
        setSelectedFileId(file.id);

        setSelectedFile({
            id: file.id,
            name: file.name,
            url: file.url,
            previewUrl: file.previewUrl || "",
            mimeType: file.mimeType || "",
            label: file.label,
            kind: file.kind,
        });

        setSelectedFileData({
            name: file.name,
            type: file.mimeType || "",
            base64: file.base64 || "",
        });

        hydratePreviewFromStoredFile(file);
        onFileSelect();
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const incoming = Array.from(fileList);
        const firstIncomingKind = detectKind(incoming[0]);
        const sessionKind = acceptedKind || firstIncomingKind;

        const acceptedFiles = allowMixedFileTypes
            ? incoming
            : incoming.filter((file) => detectKind(file) === sessionKind);

        if (acceptedFiles.length === 0) return;

        if (!acceptedKind && !allowMixedFileTypes) {
            setAcceptedKind(sessionKind);
        }

        const mapped: ViewerFile[] = await Promise.all(
            acceptedFiles.map(async (file) => {
                const kind = detectKind(file);
                const objectUrl = URL.createObjectURL(file);
                const base64 = await fileToBase64(file);

                return {
                    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
                        .toString(36)
                        .slice(2)}`,
                    name: file.name,
                    url: objectUrl,
                    previewUrl: objectUrl,
                    mimeType: file.type,
                    label: normalizeLabel(kind),
                    kind,
                    objectUrl,
                    base64,
                };
            })
        );

        const nextFiles = [...visibleFiles, ...mapped];
        setFiles(nextFiles);
        setAllFileData(buildAllFileData(nextFiles));

        const first = mapped[0];
        const sourceFile = acceptedFiles[0];

        if (first) {
            setSelectedFileId(first.id);

            setSelectedFile({
                id: first.id,
                name: first.name,
                url: first.url,
                previewUrl: first.previewUrl || "",
                mimeType: first.mimeType || "",
                label: first.label,
                kind: first.kind,
            });

            setSelectedFileData({
                name: first.name,
                type: first.mimeType || "",
                base64: first.base64 || "",
            });

            if (sourceFile) {
                await readPreviewFromSourceFile(sourceFile, first.kind);
            }

            onFileSelect();
        }

        onFilesChange();
    };

    const removeLocalFile = (id: string) => {
        const target = visibleFiles.find((f) => f.id === id);
        if (target?.objectUrl) {
            URL.revokeObjectURL(target.objectUrl);
        }

        const nextFiles = visibleFiles.filter((f) => f.id !== id);
        setFiles(nextFiles);
        setAllFileData(buildAllFileData(nextFiles));

        if (selectedFileId === id) {
            const next = nextFiles[0];

            if (next) {
                setSelectedFileId(next.id);
                setSelectedFile({
                    id: next.id,
                    name: next.name,
                    url: next.url,
                    previewUrl: next.previewUrl || "",
                    mimeType: next.mimeType || "",
                    label: next.label,
                    kind: next.kind,
                });
                setSelectedFileData({
                    name: next.name,
                    type: next.mimeType || "",
                    base64: next.base64 || "",
                });
                hydratePreviewFromStoredFile(next);
            } else {
                setSelectedFileId("");
                setSelectedFile({
                    id: "",
                    name: "",
                    url: "",
                    previewUrl: "",
                    mimeType: "",
                    label: "",
                    kind: "unknown",
                });
                setSelectedFileData({
                    name: "",
                    type: "",
                    base64: "",
                });
                setAllFileData([]);
                setAcceptedKind("");
                setTextPreview("");
                setJsonPreview("");
                setSheetPreview(null);
            }
        }

        onFilesChange();
    };

    const clearAll = () => {
        visibleFiles.forEach((file) => {
            if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
        });

        setFiles([]);
        setSelectedFileId("");
        setAcceptedKind("");
        setSelectedFile({
            id: "",
            name: "",
            url: "",
            previewUrl: "",
            mimeType: "",
            label: "",
            kind: "unknown",
        });
        setSelectedFileData({
            name: "",
            type: "",
            base64: "",
        });
        setAllFileData([]);
        setTextPreview("");
        setJsonPreview("");
        setSheetPreview(null);
        onFilesChange();
    };

    const renderSheet = (rows: any[][]) => {
        if (!rows.length) {
            return <EmptyState title="Empty sheet" subtitle="No rows found in this file." />;
        }

        return (
            <div className="mfv-table-wrap">
                <table className="mfv-table">
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                                {row.map((cell, cIdx) =>
                                    rIdx === 0 ? (
                                        <th key={cIdx}>{String(cell ?? "")}</th>
                                    ) : (
                                        <td key={cIdx}>{String(cell ?? "")}</td>
                                    )
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPreview = () => {
        if (!activeFile) {
            return (
                <EmptyState
                    title="No file selected"
                    subtitle="Upload a file above or choose one from the sidebar."
                />
            );
        }

        const previewUrl = activeFile.previewUrl || activeFile.url;
        const kind = activeFile.kind;

        if (kind === "image") {
            return (
                <div className="mfv-hero-image-wrap">
                    <img src={previewUrl} alt={activeFile.name} className="mfv-hero-image" />
                </div>
            );
        }

        if (kind === "pdf") {
            return (
                <div className="mfv-embed-wrap">
                    <iframe title={activeFile.name} src={previewUrl} className="mfv-iframe" />
                </div>
            );
        }

        if (kind === "video") {
            return (
                <div className="mfv-embed-wrap">
                    <video controls src={previewUrl} className="mfv-media" />
                </div>
            );
        }

        if (kind === "audio") {
            return (
                <div className="mfv-center">
                    <div className="mfv-audio-card">
                        <div className="mfv-audio-title" title={activeFile.name}>
                            {activeFile.name}
                        </div>
                        <audio controls src={previewUrl} className="mfv-audio" />
                    </div>
                </div>
            );
        }

        if (kind === "text") {
            return <pre className="mfv-code">{textPreview}</pre>;
        }

        if (kind === "json") {
            return <pre className="mfv-code">{jsonPreview}</pre>;
        }

        if ((kind === "csv" || kind === "excel") && sheetPreview) {
            return renderSheet(sheetPreview);
        }

        if (kind === "office") {
            return (
                <div className="mfv-center">
                    <div className="mfv-fallback-card">
                        <div className="mfv-fallback-title" title={activeFile.name}>
                            {activeFile.name}
                        </div>
                        <div className="mfv-fallback-subtitle">
                            Office files are not previewable directly. Pass a preview URL pointing to a PDF or
                            HTML version for inline preview.
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mfv-center">
                <div className="mfv-fallback-card">
                    <div className="mfv-fallback-title" title={activeFile.name}>
                        {activeFile.name}
                    </div>
                    <div className="mfv-fallback-subtitle">No inline renderer for this file type.</div>
                </div>
            </div>
        );
    };

    return (
        <div className="mfv-root">
            <div className="mfv-topbar">
                <div className="mfv-topbar-text">
                    <div className="mfv-title">Multi File Viewer</div>
                    <div className="mfv-subtitle">
                        Upload images, PDFs, spreadsheets, CSV, text, JSON, audio, video and more.
                    </div>
                </div>

                <div className="mfv-topbar-right">
                    <Pill label={`${visibleFiles.length} files`} />
                    {activeFile ? <Pill label={activeFile.label} /> : null}
                    <Pill label={allowMixedFileTypes ? "Mixed types: on" : "Mixed types: off"} />
                    {visibleFiles.length > 0 ? (
                        <button onClick={clearAll} className="mfv-clear-btn">
                            Clear uploads
                        </button>
                    ) : null}
                </div>
            </div>

            <div
                className={`mfv-upload-zone ${dragOver ? "is-dragover" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="mfv-hidden-input"
                    onChange={(e) => {
                        void handleFiles(e.target.files);
                        e.target.value = "";
                    }}
                />

                <div className="mfv-upload-icon">📂</div>

                <div className="mfv-upload-copy">
                    <div className="mfv-upload-title">
                        {allowMixedFileTypes
                            ? "Drop any files here, or click to browse"
                            : "Drop files here, or click to browse"}
                    </div>
                    <div className="mfv-upload-subtitle">
                        {allowMixedFileTypes
                            ? "Mixed file types are enabled."
                            : "Only one file type per upload session is allowed. Turn on the checkbox in settings to allow mixed types."}
                    </div>
                </div>
            </div>

            <div className={`mfv-body ${showSidebar ? "with-sidebar" : "no-sidebar"}`}>
                {showSidebar ? (
                    <div className="mfv-sidebar">
                        <div className="mfv-sidebar-label">FILES</div>

                        {visibleFiles.map((file) => {
                            const active = file.id === selectedFileId;

                            return (
                                <div key={file.id} className="mfv-file-row-wrap">
                                    <button
                                        onClick={() => {
                                            void selectFile(file);
                                        }}
                                        className={`mfv-file-row ${active ? "active" : ""}`}
                                    >
                                        <div className="mfv-icon-wrap">{KIND_ICONS[file.kind]}</div>

                                        <div className="mfv-file-meta">
                                            <div className="mfv-file-name" title={file.name}>
                                                {truncate(file.name)}
                                            </div>
                                            <div className="mfv-file-label" title={file.label}>
                                                {file.label}
                                            </div>
                                        </div>
                                    </button>

                                    {file.objectUrl ? (
                                        <button
                                            onClick={() => removeLocalFile(file.id)}
                                            className="mfv-remove-btn"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <div className="mfv-viewer">{renderPreview()}</div>
            </div>
        </div>
    );
};

const EmptyState: FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mfv-center">
        <div className="mfv-fallback-card">
            <div className="mfv-fallback-title">{title}</div>
            <div className="mfv-fallback-subtitle">{subtitle}</div>
        </div>
    </div>
);

const Pill: FC<{ label: string }> = ({ label }) => (
    <span className="mfv-pill" title={label}>
        {label}
    </span>
);

export default MultiFileViewer;