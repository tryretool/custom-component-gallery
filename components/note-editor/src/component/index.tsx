import React, { FC, useEffect, useMemo, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";

type Note = {
    id: string;
    title: string;
    content: string;
    date: string;
    groupName: string;
};

type ViewMode = "grid" | "list";

const TEMP_NOTE_ID = "__new__";

function formatDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function safeText(value: any, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
}

function getSafeLimit(value: number, fallback: number) {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const FileEditorNotes: FC = () => {
    Retool.useComponentSettings({
        defaultHeight: 10,
        defaultWidth: 14,
    });

    const [notesList] = Retool.useStateArray({
        name: "notesList",
        initialValue: [],
    });

    const [idField] = Retool.useStateString({
        name: "idField",
        initialValue: "id",
        inspector: "text",
        label: "ID field",
    });

    const [titleField] = Retool.useStateString({
        name: "titleField",
        initialValue: "title",
        inspector: "text",
        label: "Title field",
    });

    const [contentField] = Retool.useStateString({
        name: "contentField",
        initialValue: "content",
        inspector: "text",
        label: "Content field",
    });

    const [dateField] = Retool.useStateString({
        name: "dateField",
        initialValue: "date",
        inspector: "text",
        label: "Date field",
    });

    const [groupField] = Retool.useStateString({
        name: "groupField",
        initialValue: "groupName",
        inspector: "text",
        label: "Group field",
    });

    const [fontSize] = Retool.useStateNumber({
        name: "fontSize",
        initialValue: 14,
        inspector: "text",
        label: "Font size",
    });

    const [maxTitleLengthInput] = Retool.useStateNumber({
        name: "maxTitleLength",
        initialValue: 200,
        inspector: "text",
        label: "Maximum title characters",
    });

    const [maxGroupLengthInput] = Retool.useStateNumber({
        name: "maxGroupLength",
        initialValue: 100,
        inspector: "text",
        label: "Maximum group characters",
    });

    const [maxContentLengthInput] = Retool.useStateNumber({
        name: "maxContentLength",
        initialValue: 20000,
        inspector: "text",
        label: "Maximum content characters",
    });

    const maxTitleLength = getSafeLimit(maxTitleLengthInput, 200);
    const maxGroupLength = getSafeLimit(maxGroupLengthInput, 100);
    const maxContentLength = getSafeLimit(maxContentLengthInput, 20000);

    const [selectedId, setSelectedId] = Retool.useStateString({
        name: "selectedId",
        initialValue: "",
        inspector: "hidden",
    });

    const [, setEditorTitle] = Retool.useStateString({
        name: "editorTitle",
        initialValue: "",
        inspector: "hidden",
    });

    const [, setEditorText] = Retool.useStateString({
        name: "editorText",
        initialValue: "",
        inspector: "hidden",
    });

    const [, setNotesMeta] = Retool.useStateObject({
        name: "notesMeta",
        initialValue: {},
        inspector: "hidden",
    });

    const saveClick = Retool.useEventCallback({ name: "saveClick" });
    const updateClick = Retool.useEventCallback({ name: "updateClick" });

    const selectedNoteRemoveConfirmClick = Retool.useEventCallback({
        name: "selectedNoteRemoveConfirmClick",
    });

    const [selectedGroupName, setSelectedGroupName] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [newGroupName, setNewGroupName] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [filterText, setFilterText] = useState("");

    const [newGroupError, setNewGroupError] = useState("");
    const [editorGroupError, setEditorGroupError] = useState("");
    const [noteError, setNoteError] = useState("");

    const dbNotes = useMemo<Note[]>(() => {
        const rows = Array.isArray(notesList) ? notesList : [];

        return rows
            .map((row: any, index: number) => ({
                id: String(
                    row?.[idField || "id"] ?? row?.id ?? row?.ID ?? `note-${index}`
                ),
                title: String(
                    row?.[titleField || "title"] ?? row?.title ?? row?.TITLE ?? ""
                ),
                content: String(
                    row?.[contentField || "content"] ??
                    row?.content ??
                    row?.CONTENT ??
                    ""
                ),
                date: String(
                    row?.[dateField || "date"] ?? row?.date ?? row?.DATE ?? formatDate()
                ),
                groupName: safeText(
                    row?.[groupField || "groupName"] ??
                    row?.groupName ??
                    row?.GROUPNAME ??
                    row?.groupname,
                    ""
                ),
            }))
            .filter((note) => note.groupName);
    }, [notesList, idField, titleField, contentField, dateField, groupField]);

    const filteredDbNotes = useMemo(() => {
        const q = filterText.trim().toLowerCase();
        if (!q) return dbNotes;

        return dbNotes.filter((note) => {
            return (
                note.title.toLowerCase().includes(q) ||
                note.content.toLowerCase().includes(q) ||
                note.groupName.toLowerCase().includes(q) ||
                note.date.toLowerCase().includes(q)
            );
        });
    }, [dbNotes, filterText]);

    const groupNames = useMemo(() => {
        const set = new Set<string>();

        filteredDbNotes.forEach((note) => {
            if (note.groupName) set.add(note.groupName);
        });

        return Array.from(set);
    }, [filteredDbNotes]);

    const selectedNote = useMemo<Note | null>(() => {
        if (selectedId === TEMP_NOTE_ID) {
            return {
                id: TEMP_NOTE_ID,
                title,
                content,
                date: formatDate(),
                groupName: selectedGroupName,
            };
        }

        return dbNotes.find((note) => note.id === selectedId) || null;
    }, [selectedId, dbNotes, title, content, selectedGroupName]);

    const groupedNotes = useMemo(() => {
        const map = new Map<string, Note[]>();

        groupNames.forEach((group) => {
            if (group) map.set(group, []);
        });

        filteredDbNotes.forEach((note) => {
            if (!note.groupName) return;

            if (!map.has(note.groupName)) {
                map.set(note.groupName, []);
            }

            map.get(note.groupName)!.push(note);
        });

        if (selectedId === TEMP_NOTE_ID && selectedGroupName.trim()) {
            const group = selectedGroupName.trim();

            if (!map.has(group)) {
                map.set(group, []);
            }

            map.get(group)!.unshift({
                id: TEMP_NOTE_ID,
                title,
                content,
                date: formatDate(),
                groupName: group,
            });
        }

        return Array.from(map.entries()).map(([groupName, notes]) => ({
            groupName,
            notes,
        }));
    }, [
        filteredDbNotes,
        groupNames,
        selectedId,
        selectedGroupName,
        title,
        content,
    ]);

    useEffect(() => {
        setEditorTitle(title);
    }, [title, setEditorTitle]);

    useEffect(() => {
        setEditorText(content);
    }, [content, setEditorText]);

    useEffect(() => {
        setNotesMeta({
            selectedId,
            selectedGroupName: selectedGroupName.trim(),
            viewMode,
            filterText,
            draft: {
                [idField || "id"]: selectedId,
                [titleField || "title"]: title,
                [contentField || "content"]: content,
                [dateField || "date"]: selectedNote?.date || formatDate(),
                [groupField || "groupName"]: selectedGroupName.trim(),

                id: selectedId,
                title,
                content,
                date: selectedNote?.date || formatDate(),
                groupName: selectedGroupName.trim(),
                isNew: selectedId === TEMP_NOTE_ID,
            },
            validation: {
                maxTitleLength,
                maxGroupLength,
                maxContentLength,
                titleLength: title.length,
                groupLength: selectedGroupName.length,
                contentLength: content.length,
            },
            totalNotes: dbNotes.length,
            filteredNotes: filteredDbNotes.length,
            updatedAt: new Date().toISOString(),
        });
    }, [
        selectedId,
        selectedGroupName,
        title,
        content,
        selectedNote,
        dbNotes.length,
        filteredDbNotes.length,
        viewMode,
        filterText,
        idField,
        titleField,
        contentField,
        dateField,
        groupField,
        setNotesMeta,
        maxTitleLength,
        maxGroupLength,
        maxContentLength,
    ]);

    const validateNote = () => {
        const cleanTitle = title.trim();
        const cleanGroup = selectedGroupName.trim();
        const cleanContent = content.trim();

        let hasError = false;

        if (!cleanGroup) {
            setEditorGroupError("Group name is required");
            hasError = true;
        } else if (cleanGroup.length > maxGroupLength) {
            setEditorGroupError(
                `Group name cannot exceed ${maxGroupLength} characters`
            );
            hasError = true;
        } else {
            setEditorGroupError("");
        }

        if (cleanTitle.length > maxTitleLength) {
            setNoteError(`Title cannot exceed ${maxTitleLength} characters`);
            hasError = true;
        } else if (content.length > maxContentLength) {
            setNoteError(
                `Note is too large. Maximum ${maxContentLength.toLocaleString()} characters allowed.`
            );
            hasError = true;
        } else if (!cleanTitle && !cleanContent) {
            setNoteError("Add a title or note content");
            hasError = true;
        } else {
            setNoteError("");
        }

        return !hasError;
    };

    const handleCreateGroup = () => {
        const group = newGroupName.trim();

        if (!group) {
            setNewGroupError("Group name is required");
            return;
        }

        if (group.length > maxGroupLength) {
            setNewGroupError(
                `Group name cannot exceed ${maxGroupLength} characters`
            );
            return;
        }

        setNewGroupError("");
        setEditorGroupError("");
        setNoteError("");

        setSelectedId(TEMP_NOTE_ID);
        setSelectedGroupName(group);
        setTitle("");
        setContent("");
        setNewGroupName("");
        setIsEditorOpen(true);
    };

    const handleAddNewNote = (groupName: string) => {
        const group = groupName.trim();

        if (!group) return;

        setEditorGroupError("");
        setNoteError("");

        setSelectedId(TEMP_NOTE_ID);
        setSelectedGroupName(group);
        setTitle("");
        setContent("");
        setIsEditorOpen(true);
    };

    const handleSelectOnly = (note: Note) => {
        setSelectedId(note.id);
        setSelectedGroupName(note.groupName);
    };

    const handleOpenNote = (note: Note) => {
        setEditorGroupError("");
        setNoteError("");

        setSelectedId(note.id);
        setSelectedGroupName(note.groupName);
        setTitle(note.title);
        setContent(note.content);
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        if (!validateNote()) return;

        const cleanTitle = title.trim();
        const groupName = selectedGroupName.trim();

        const isNew = selectedId === TEMP_NOTE_ID || !selectedId;
        const noteId = isNew ? null : selectedId;
        const noteDate = selectedNote?.date || formatDate();

        const savedNote = {
            [idField || "id"]: noteId,
            [titleField || "title"]: cleanTitle || "Untitled",
            [contentField || "content"]: content,
            [dateField || "date"]: noteDate,
            [groupField || "groupName"]: groupName,

            id: noteId,
            title: cleanTitle || "Untitled",
            content,
            date: noteDate,
            groupName,
        };

        setEditorTitle(cleanTitle || "Untitled");
        setEditorText(content);

        setNotesMeta({
            savedNote,
            pendingSave: {
                ...savedNote,
                isNew,
                isUpdate: !isNew,
            },
            validation: {
                isValid: true,
                maxTitleLength,
                maxGroupLength,
                maxContentLength,
                contentLength: content.length,
                titleLength: cleanTitle.length,
                groupLength: groupName.length,
            },
            updatedAt: new Date().toISOString(),
        });

        window.setTimeout(() => {
            if (isNew) {
                saveClick();

                setSelectedId("");
                setTitle("");
                setContent("");
                setIsEditorOpen(false);
            } else {
                updateClick();

                setIsEditorOpen(false);
            }
        }, 150);
    };

    const handleRemoveCard = (note: Note) => {
        if (note.id === TEMP_NOTE_ID) {
            setSelectedId("");
            setTitle("");
            setContent("");
            setSelectedGroupName("");
            setIsEditorOpen(false);
            return;
        }

        setNotesMeta({
            removeCandidate: {
                [idField || "id"]: note.id,
                [titleField || "title"]: note.title,
                [contentField || "content"]: note.content,
                [dateField || "date"]: note.date,
                [groupField || "groupName"]: note.groupName,

                ...note,
            },
            updatedAt: new Date().toISOString(),
        });

        selectedNoteRemoveConfirmClick();

        if (selectedId === note.id) {
            setSelectedId("");
            setTitle("");
            setContent("");
            setSelectedGroupName("");
            setIsEditorOpen(false);
        }
    };

    const handleCloseModal = () => {
        setEditorGroupError("");
        setNoteError("");
        setIsEditorOpen(false);
    };

    const renderNoteCard = (note: Note) => {
        const isSelected = note.id === selectedId;

        return (
            <div
                key={note.id}
                style={{
                    position: "relative",
                    width: 180,
                    minWidth: 180,
                    height: 120,
                }}
            >
                {isSelected && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(note);
                        }}
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(255,255,255,0.15)",
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            zIndex: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => handleSelectOnly(note)}
                    onDoubleClick={() => handleOpenNote(note)}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                        border: isSelected ? "2px solid #f4b400" : "1px solid #233045",
                        background: "#111826",
                        color: "#fff",
                        cursor: "pointer",
                        padding: 12,
                        paddingRight: isSelected ? 34 : 12,
                        textAlign: "left",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 800,
                            marginBottom: 8,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {note.title || "Untitled"}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            lineHeight: 1.4,
                            height: 46,
                            overflow: "hidden",
                        }}
                    >
                        {(note.content || "").slice(0, 90)}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            marginTop: 8,
                        }}
                    >
                        {note.date}
                    </div>
                </button>
            </div>
        );
    };

    const renderNoteListItem = (note: Note) => {
        const isSelected = note.id === selectedId;

        return (
            <div key={note.id} style={{ position: "relative", width: "100%" }}>
                {isSelected && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(note);
                        }}
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(255,255,255,0.15)",
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            zIndex: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => handleSelectOnly(note)}
                    onDoubleClick={() => handleOpenNote(note)}
                    style={{
                        width: "100%",
                        borderRadius: 14,
                        border: isSelected ? "2px solid #f4b400" : "1px solid #233045",
                        background: "#111826",
                        color: "#fff",
                        cursor: "pointer",
                        padding: "12px 42px 12px 14px",
                        textAlign: "left",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 12,
                        alignItems: "center",
                    }}
                >
                    <div style={{ overflow: "hidden" }}>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 800,
                                marginBottom: 5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {note.title || "Untitled"}
                        </div>

                        <div
                            style={{
                                fontSize: 12,
                                color: "#9ca3af",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {(note.content || "").slice(0, 160)}
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {note.date}
                    </div>
                </button>
            </div>
        );
    };

    return (
        <div
            style={{
                width: "100%",
                minHeight: 520,
                padding: 10,
                boxSizing: "border-box",
                background: "#0b111a",
                color: "#f3f4f6",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                position: "relative",
            }}
        >
            <div
                style={{
                    border: "1px solid #233045",
                    borderRadius: 18,
                    padding: 14,
                    background: "#0d131d",
                    minHeight: 420,
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        marginBottom: 18,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                                value={newGroupName}
                                maxLength={maxGroupLength}
                                onChange={(e) => {
                                    setNewGroupName(e.target.value);

                                    if (e.target.value.trim()) {
                                        setNewGroupError("");
                                    }
                                }}
                                placeholder="New group name"
                                style={{
                                    width: 220,
                                    background: "#111826",
                                    border: `1px solid ${newGroupError ? "#ef4444" : "#233045"
                                        }`,
                                    borderRadius: 10,
                                    color: "#f3f4f6",
                                    padding: "9px 10px",
                                    outline: "none",
                                    fontSize: 14,
                                }}
                            />

                            <button
                                type="button"
                                onClick={handleCreateGroup}
                                style={{
                                    border: "1px solid #f4b400",
                                    background: "#f4b400",
                                    color: "#111827",
                                    borderRadius: 10,
                                    padding: "9px 14px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                }}
                            >
                                + New Group
                            </button>
                        </div>

                        {newGroupError && (
                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    color: "#f87171",
                                }}
                            >
                                {newGroupError}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder="Filter notes..."
                            style={{
                                width: 220,
                                background: "#111826",
                                border: "1px solid #233045",
                                borderRadius: 10,
                                color: "#f3f4f6",
                                padding: "9px 10px",
                                outline: "none",
                                fontSize: 14,
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                background: "#111826",
                                border: "1px solid #233045",
                                borderRadius: 10,
                                overflow: "hidden",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setViewMode("list")}
                                title="List view"
                                style={{
                                    width: 38,
                                    height: 36,
                                    border: "none",
                                    background: viewMode === "list" ? "#374151" : "transparent",
                                    color: "#f3f4f6",
                                    cursor: "pointer",
                                    fontSize: 18,
                                    fontWeight: 800,
                                }}
                            >
                                ☰
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                title="Grid view"
                                style={{
                                    width: 38,
                                    height: 36,
                                    border: "none",
                                    background: viewMode === "grid" ? "#374151" : "transparent",
                                    color: "#f3f4f6",
                                    cursor: "pointer",
                                    fontSize: 18,
                                    fontWeight: 800,
                                }}
                            >
                                ▦
                            </button>
                        </div>
                    </div>
                </div>

                {groupedNotes.length === 0 && (
                    <div
                        style={{
                            border: "1px dashed #334155",
                            borderRadius: 14,
                            padding: 18,
                            color: "#9ca3af",
                            fontSize: 14,
                        }}
                    >
                        {filterText.trim()
                            ? "No notes match your filter."
                            : "Create a group first, then add notes inside it."}
                    </div>
                )}

                {groupedNotes.map((group) => (
                    <div key={group.groupName} style={{ marginBottom: 20 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                marginBottom: 10,
                            }}
                        >
                            <div style={{ fontSize: 15, fontWeight: 800 }}>
                                {group.groupName}
                            </div>

                            {viewMode === "list" && !filterText.trim() && (
                                <button
                                    type="button"
                                    onClick={() => handleAddNewNote(group.groupName)}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 8,
                                        border: "1px dashed #f4b400",
                                        background: "#111826",
                                        color: "#f4b400",
                                        cursor: "pointer",
                                        fontSize: 18,
                                        fontWeight: 900,
                                        lineHeight: 1,
                                    }}
                                >
                                    +
                                </button>
                            )}
                        </div>

                        {viewMode === "grid" ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    overflowX: "auto",
                                    paddingBottom: 4,
                                }}
                            >
                                {group.notes.map(renderNoteCard)}

                                {!filterText.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddNewNote(group.groupName)}
                                        style={{
                                            width: 72,
                                            minWidth: 72,
                                            height: 120,
                                            borderRadius: 16,
                                            border: "1px dashed #f4b400",
                                            background: "#111826",
                                            color: "#f4b400",
                                            cursor: "pointer",
                                            fontSize: 30,
                                            fontWeight: 900,
                                        }}
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {group.notes.map(renderNoteListItem)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isEditorOpen && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "#0b111a",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        padding: 0,
                    }}
                >
                    <div
                        style={{
                            height: 42,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontSize: 13,
                            fontWeight: 700,
                            position: "relative",
                            borderBottom: "1px solid #233045",
                            background: "#0d131d",
                        }}
                    >
                        {selectedNote?.date || formatDate()}

                        <button
                            type="button"
                            onClick={handleCloseModal}
                            style={{
                                position: "absolute",
                                right: 14,
                                top: 8,
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                                fontWeight: 800,
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <div
                        style={{
                            padding: "18px 22px",
                            borderBottom: "1px solid #233045",
                            background: "#0b111a",
                        }}
                    >
                        <input
                            value={selectedGroupName}
                            maxLength={maxGroupLength}
                            onChange={(e) => {
                                setSelectedGroupName(e.target.value);

                                if (e.target.value.trim()) {
                                    setEditorGroupError("");
                                }
                            }}
                            placeholder="Group name"
                            style={{
                                width: "100%",
                                marginBottom: editorGroupError ? 6 : 14,
                                background: "#111826",
                                border: `1px solid ${editorGroupError ? "#ef4444" : "#233045"
                                    }`,
                                borderRadius: 10,
                                color: "#f3f4f6",
                                padding: "9px 10px",
                                outline: "none",
                                fontSize: 14,
                                boxSizing: "border-box",
                            }}
                        />

                        {editorGroupError && (
                            <div
                                style={{
                                    marginBottom: 10,
                                    fontSize: 12,
                                    color: "#f87171",
                                }}
                            >
                                {editorGroupError}
                            </div>
                        )}

                        <input
                            value={title}
                            maxLength={maxTitleLength}
                            onChange={(e) => {
                                setTitle(e.target.value);

                                if (e.target.value.trim() || content.trim()) {
                                    setNoteError("");
                                }
                            }}
                            placeholder="Title"
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "#f3f4f6",
                                fontSize: 28,
                                fontWeight: 800,
                            }}
                        />
                    </div>

                    <textarea
                        value={content}
                        maxLength={maxContentLength}
                        onChange={(e) => {
                            setContent(e.target.value);

                            if (title.trim() || e.target.value.trim()) {
                                setNoteError("");
                            }
                        }}
                        placeholder="Start writing..."
                        style={{
                            flex: 1,
                            width: "100%",
                            resize: "none",
                            padding: 22,
                            boxSizing: "border-box",
                            background: "#0b111a",
                            color: "#f3f4f6",
                            border: "none",
                            outline: "none",
                            fontSize,
                            lineHeight: 1.8,
                        }}
                    />

                    {noteError && (
                        <div
                            style={{
                                padding: "0 18px 8px",
                                color: "#f87171",
                                fontSize: 12,
                                background: "#0b111a",
                            }}
                        >
                            {noteError}
                        </div>
                    )}

                    <div
                        style={{
                            height: 58,
                            borderTop: "1px solid #233045",
                            background: "#0a0f17",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 18px",
                        }}
                    >
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                            {content.trim() ? content.trim().split(/\s+/).length : 0} words ·{" "}
                            {content.length.toLocaleString()} /{" "}
                            {maxContentLength.toLocaleString()} characters
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            style={{
                                border: "1px solid #f4b400",
                                background: "#f4b400",
                                color: "#111827",
                                borderRadius: 10,
                                padding: "9px 22px",
                                fontWeight: 900,
                                cursor: "pointer",
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileEditorNotes;