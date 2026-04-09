import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./index.css";

type Task = {
    id: string;
    key: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string;
    type: string;
    dueDate: string;
    imageUrl: string;
    raw?: Record<string, unknown>;
};

type FieldMappings = {
    idField: string;
    keyField: string;
    titleField: string;
    descriptionField: string;
    statusField: string;
    priorityField: string;
    assigneeField: string;
    typeField: string;
    dueDateField: string;
    imageUrlField: string;
};

type DragState = {
    taskId: string;
    fromColumn: string;
};

const makeEmptyOutput = (): Task => ({
    id: "",
    key: "",
    title: "",
    description: "",
    status: "",
    priority: "",
    assignee: "",
    type: "",
    dueDate: "",
    imageUrl: "",
    raw: {},
});

const ARRAY_CONTAINER_KEYS = [
    "tasks",
    "items",
    "records",
    "rows",
    "data",
    "results",
    "tickets",
    "issues",
    "cards",
    "list",
];

const TITLE_KEYS = [
    "title",
    "name",
    "task",
    "summary",
    "subject",
    "label",
    "heading",
    "cardTitle",
];

const DESCRIPTION_KEYS = [
    "description",
    "desc",
    "details",
    "body",
    "content",
    "notes",
    "note",
    "text",
    "comment",
    "message",
];

const STATUS_KEYS = [
    "status",
    "column",
    "stage",
    "list",
    "lane",
    "state",
    "bucket",
    "group",
    "section",
    "category",
    "progress",
    "timing",
];

const ID_KEYS = ["id", "_id", "uuid", "taskId", "itemId", "recordId"];
const KEY_KEYS = ["key", "ticketKey", "issueKey", "code", "issueId", "jiraKey"];
const PRIORITY_KEYS = ["priority", "severity", "importance", "level"];
const ASSIGNEE_KEYS = ["assignee", "owner", "assignedTo", "user", "agent", "member"];
const TYPE_KEYS = ["type", "issueType", "ticketType", "kind", "categoryType"];
const DUE_DATE_KEYS = ["dueDate", "due_date", "due", "deadline", "targetDate", "endDate"];
const IMAGE_URL_KEYS = [
    "imageUrl",
    "image_url",
    "avatar",
    "avatarUrl",
    "avatar_url",
    "photo",
    "photoUrl",
    "photo_url",
    "profileImage",
    "profile_image",
    "profileImageUrl",
    "profile_image_url",
    "picture",
    "pictureUrl",
    "picture_url",
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value);

const toWords = (value: string) =>
    String(value || "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();

const normalizeKey = (key: string) => toWords(key).replace(/\s+/g, "");

const titleCase = (value: string) =>
    String(value || "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
};

const chooseKeyByPriority = (
    item: Record<string, unknown>,
    preferredKeys: string[]
): string | null => {
    const keys = Object.keys(item);

    for (const preferred of preferredKeys) {
        const found = keys.find((key) => normalizeKey(key) === normalizeKey(preferred));
        if (found) return found;
    }

    return null;
};

const getValueByConfiguredField = (
    item: Record<string, unknown>,
    fieldName: string
): unknown => {
    if (!fieldName.trim()) return undefined;

    const exact = Object.keys(item).find(
        (key) => normalizeKey(key) === normalizeKey(fieldName)
    );
    if (exact) return item[exact];

    return item[fieldName];
};

const inferIdKey = (item: Record<string, unknown>): string | null => {
    const exact = chooseKeyByPriority(item, ID_KEYS);
    if (exact) return exact;

    for (const key of Object.keys(item)) {
        if (normalizeKey(key).endsWith("id")) return key;
    }

    return null;
};

const inferStatusKey = (item: Record<string, unknown>): string | null => {
    const exact = chooseKeyByPriority(item, STATUS_KEYS);
    if (exact) return exact;

    for (const key of Object.keys(item)) {
        if (STATUS_KEYS.some((candidate) => normalizeKey(key).includes(normalizeKey(candidate)))) {
            return key;
        }
    }

    return null;
};

const inferTitleKey = (
    item: Record<string, unknown>,
    excluded: string[]
): string | null => {
    const exact = chooseKeyByPriority(item, TITLE_KEYS);
    if (exact && !excluded.includes(exact)) return exact;

    for (const key of Object.keys(item)) {
        if (excluded.includes(key)) continue;
        const value = item[key];
        if (typeof value === "string" && value.trim().length > 0 && value.trim().length <= 160) {
            return key;
        }
    }

    return null;
};

const inferDescriptionKey = (
    item: Record<string, unknown>,
    excluded: string[]
): string | null => {
    const exact = chooseKeyByPriority(item, DESCRIPTION_KEYS);
    if (exact && !excluded.includes(exact)) return exact;

    for (const key of Object.keys(item)) {
        if (excluded.includes(key)) continue;
        const value = item[key];
        if (typeof value === "string" && value.trim().length > 24) {
            return key;
        }
    }

    return null;
};

const inferDueDateKey = (item: Record<string, unknown>): string | null => {
    const exact = chooseKeyByPriority(item, DUE_DATE_KEYS);
    if (exact) return exact;

    for (const key of Object.keys(item)) {
        const normalized = normalizeKey(key);
        if (
            normalized.includes("duedate") ||
            normalized.includes("deadline") ||
            normalized.includes("targetdate") ||
            normalized === "due"
        ) {
            return key;
        }
    }

    return null;
};

const inferImageUrlKey = (item: Record<string, unknown>): string | null => {
    const exact = chooseKeyByPriority(item, IMAGE_URL_KEYS);
    if (exact) return exact;

    for (const key of Object.keys(item)) {
        const normalized = normalizeKey(key);
        if (
            normalized.includes("imageurl") ||
            normalized.includes("avatarurl") ||
            normalized.includes("photourl") ||
            normalized.includes("pictureurl") ||
            normalized.includes("profileimage") ||
            normalized === "avatar" ||
            normalized === "photo" ||
            normalized === "picture" ||
            normalized === "image"
        ) {
            return key;
        }
    }

    return null;
};

const looksLikeTaskObject = (item: Record<string, unknown>): boolean => {
    const keys = Object.keys(item);
    const normalized = keys.map(normalizeKey);

    const hasCommonKey = normalized.some((key) =>
        [
            ...TITLE_KEYS,
            ...DESCRIPTION_KEYS,
            ...STATUS_KEYS,
            ...PRIORITY_KEYS,
            ...ASSIGNEE_KEYS,
            ...TYPE_KEYS,
            ...ID_KEYS,
            ...KEY_KEYS,
            ...DUE_DATE_KEYS,
            ...IMAGE_URL_KEYS,
        ].some((candidate) => normalizeKey(candidate) === key)
    );

    const hasSomePrimitiveValue = Object.values(item).some(
        (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean"
    );

    return hasCommonKey || hasSomePrimitiveValue;
};

const findArrayOfObjects = (input: unknown): Record<string, unknown>[] | null => {
    if (Array.isArray(input)) {
        const objects = input.filter((item) => isPlainObject(item)) as Record<string, unknown>[];
        if (objects.length > 0) return objects;
    }

    if (isPlainObject(input)) {
        for (const preferredKey of ARRAY_CONTAINER_KEYS) {
            const found = Object.keys(input).find(
                (key) => normalizeKey(key) === normalizeKey(preferredKey)
            );

            if (found && Array.isArray(input[found])) {
                const objects = (input[found] as unknown[]).filter((item) =>
                    isPlainObject(item)
                ) as Record<string, unknown>[];

                if (objects.length > 0) return objects;
            }
        }

        for (const key of Object.keys(input)) {
            const value = input[key];
            if (Array.isArray(value)) {
                const objects = value.filter((item) => isPlainObject(item)) as Record<string, unknown>[];
                if (objects.length > 0) return objects;
            }
        }

        for (const key of Object.keys(input)) {
            const nested = findArrayOfObjects(input[key]);
            if (nested && nested.length > 0) return nested;
        }
    }

    return null;
};

const makeTicketKey = (
    item: Record<string, unknown>,
    index: number,
    mappings: FieldMappings
): string => {
    const configuredValue = getStringValue(getValueByConfiguredField(item, mappings.keyField));
    if (configuredValue) return configuredValue;

    const keyField = chooseKeyByPriority(item, KEY_KEYS);
    const existing = keyField ? getStringValue(item[keyField]) : "";
    if (existing) return existing;

    return String(index + 1);
};

const normalizeDueDate = (value: unknown): string => getStringValue(value);

const formatDueDate = (value: string): string => {
    if (!value) return "";
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const makeTask = (
    item: Record<string, unknown>,
    index: number,
    mappings: FieldMappings
): Task => {
    const idKey = inferIdKey(item);
    const statusKey = inferStatusKey(item);
    const titleKey = inferTitleKey(item, [idKey || "", statusKey || ""]);
    const descriptionKey = inferDescriptionKey(item, [
        idKey || "",
        statusKey || "",
        titleKey || "",
    ]);

    const priorityKey = chooseKeyByPriority(item, PRIORITY_KEYS);
    const assigneeKey = chooseKeyByPriority(item, ASSIGNEE_KEYS);
    const typeKey = chooseKeyByPriority(item, TYPE_KEYS);
    const dueDateKey = inferDueDateKey(item);
    const imageUrlKey = inferImageUrlKey(item);

    const configuredId = getStringValue(getValueByConfiguredField(item, mappings.idField));
    const configuredTitle = getStringValue(getValueByConfiguredField(item, mappings.titleField));
    const configuredDescription = getStringValue(
        getValueByConfiguredField(item, mappings.descriptionField)
    );
    const configuredStatus = getStringValue(getValueByConfiguredField(item, mappings.statusField));
    const configuredPriority = getStringValue(
        getValueByConfiguredField(item, mappings.priorityField)
    );
    const configuredAssignee = getStringValue(
        getValueByConfiguredField(item, mappings.assigneeField)
    );
    const configuredType = getStringValue(getValueByConfiguredField(item, mappings.typeField));
    const configuredDueDate = getStringValue(
        getValueByConfiguredField(item, mappings.dueDateField)
    );
    const configuredImageUrl = getStringValue(
        getValueByConfiguredField(item, mappings.imageUrlField)
    );

    const fallbackTitle = titleKey ? getStringValue(item[titleKey]) : "";
    const fallbackDescription = descriptionKey ? getStringValue(item[descriptionKey]) : "";
    const fallbackId = idKey ? getStringValue(item[idKey]) : "";
    const fallbackStatus = statusKey ? getStringValue(item[statusKey]) : "";
    const fallbackPriority = priorityKey ? getStringValue(item[priorityKey]) : "";
    const fallbackAssignee = assigneeKey ? getStringValue(item[assigneeKey]) : "";
    const fallbackType = typeKey ? getStringValue(item[typeKey]) : "";
    const fallbackDueDate = dueDateKey ? getStringValue(item[dueDateKey]) : "";
    const fallbackImageUrl = imageUrlKey ? getStringValue(item[imageUrlKey]) : "";

    return {
        id:
            configuredId ||
            fallbackId ||
            `row-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        key: makeTicketKey(item, index, mappings),
        title: configuredTitle || fallbackTitle || "",
        description: configuredDescription || fallbackDescription || "",
        status: configuredStatus || fallbackStatus || "",
        priority: configuredPriority || fallbackPriority || "",
        assignee: configuredAssignee || fallbackAssignee || "",
        type: configuredType || fallbackType || "",
        dueDate: normalizeDueDate(configuredDueDate || fallbackDueDate || ""),
        imageUrl: configuredImageUrl || fallbackImageUrl || "",
        raw: item,
    };
};

const parseTasksFromAnyJson = (
    input: unknown,
    mappings: FieldMappings
): { tasks: Task[]; error: string } => {
    if (input == null || input === "") {
        return { tasks: [], error: "" };
    }

    let parsed: unknown = input;

    if (typeof input === "string") {
        try {
            parsed = JSON.parse(input);
        } catch {
            return {
                tasks: [],
                error: "Invalid JSON string in dataJson",
            };
        }
    }

    if (isPlainObject(parsed) && looksLikeTaskObject(parsed)) {
        return {
            tasks: [makeTask(parsed, 0, mappings)],
            error: "",
        };
    }

    const rows = findArrayOfObjects(parsed);
    if (rows && rows.length > 0) {
        return {
            tasks: rows.map((row, index) => makeTask(row, index, mappings)),
            error: "",
        };
    }

    if (Array.isArray(parsed) && parsed.length === 0) {
        return { tasks: [], error: "" };
    }

    return {
        tasks: [],
        error: "Could not detect task rows from the provided JSON",
    };
};

const cloneTask = (task: Task): Task => ({
    ...task,
    raw: task.raw ? { ...task.raw } : undefined,
});

const syncRawStatusField = (
    task: Task,
    nextStatus: string,
    mappings: FieldMappings
): Task => {
    const updatedTask: Task = {
        ...task,
        status: nextStatus,
    };

    if (!task.raw) return updatedTask;

    const rawCopy: Record<string, unknown> = { ...task.raw };

    if (mappings.statusField.trim()) {
        const exactKey = Object.keys(rawCopy).find(
            (key) => normalizeKey(key) === normalizeKey(mappings.statusField)
        );

        if (exactKey) {
            rawCopy[exactKey] = nextStatus;
        } else {
            rawCopy[mappings.statusField] = nextStatus;
        }
    } else {
        const inferredStatusKey = inferStatusKey(rawCopy);
        if (inferredStatusKey) {
            rawCopy[inferredStatusKey] = nextStatus;
        } else {
            rawCopy.status = nextStatus;
        }
    }

    updatedTask.raw = rawCopy;
    return updatedTask;
};

const getInitials = (name: string): string => {
    const parts = String(name || "")
        .split(" ")
        .filter(Boolean);

    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Avatar: FC<{ name: string; imageUrl?: string }> = ({ name, imageUrl }) => {
    const [hasError, setHasError] = useState(false);
    const showImage = !!imageUrl && !hasError;

    if (showImage) {
        return (
            <img
                src={imageUrl}
                alt={name || "Avatar"}
                className="kanban-avatar-image"
                onError={() => setHasError(true)}
            />
        );
    }

    return <span className="kanban-avatar">{getInitials(name)}</span>;
};

const Kanban: FC = () => {
    Retool.useComponentSettings({
        defaultWidth: 12,
        defaultHeight: 10,
    });

    const [dataJson, setDataJson] = Retool.useStateString({
        name: "dataJson",
        initialValue: "",
        label: "Data JSON",
        inspector: "text",
    });

    const [idField] = Retool.useStateString({
        name: "idField",
        initialValue: "",
        label: "ID Field",
        inspector: "text",
    });

    const [keyField] = Retool.useStateString({
        name: "keyField",
        initialValue: "",
        label: "Key Field",
        inspector: "text",
    });

    const [titleField] = Retool.useStateString({
        name: "titleField",
        initialValue: "",
        label: "Title Field",
        inspector: "text",
    });

    const [descriptionField] = Retool.useStateString({
        name: "descriptionField",
        initialValue: "",
        label: "Description Field",
        inspector: "text",
    });

    const [statusField] = Retool.useStateString({
        name: "statusField",
        initialValue: "",
        label: "Status Field",
        inspector: "text",
    });

    const [priorityField] = Retool.useStateString({
        name: "priorityField",
        initialValue: "",
        label: "Priority Field",
        inspector: "text",
    });

    const [assigneeField] = Retool.useStateString({
        name: "assigneeField",
        initialValue: "",
        label: "Assignee Field",
        inspector: "text",
    });

    const [typeField] = Retool.useStateString({
        name: "typeField",
        initialValue: "",
        label: "Type Field",
        inspector: "text",
    });

    const [dueDateField] = Retool.useStateString({
        name: "dueDateField",
        initialValue: "",
        label: "Due Date Field Name",
        inspector: "text",
    });

    const [imageUrlField] = Retool.useStateString({
        name: "imageUrlField",
        initialValue: "",
        label: "Image URL Field",
        inspector: "text",
    });

    const [statusOrder] = Retool.useStateString({
        name: "statusOrder",
        initialValue: "",
        label: "Status Order (comma separated)",
        inspector: "text",
    });

    const [tasks, setTasks] = Retool.useStateArray({
        name: "tasks",
        initialValue: [],
        inspector: "hidden",
    });

    const [, setSelectedData] = Retool.useStateObject({
        name: "selectedData",
        initialValue: {
            id: "",
            key: "",
            title: "",
            description: "",
            status: "",
            priority: "",
            assignee: "",
            type: "",
            dueDate: "",
            imageUrl: "",
            raw: {},
        },
        inspector: "hidden",
    });

    const [selectedDataId, setSelectedDataId] = Retool.useStateString({
        name: "selectedDataId",
        initialValue: "",
        inspector: "hidden",
    });

    const [, setDeletedData] = Retool.useStateObject({
        name: "deletedData",
        initialValue: {
            id: "",
            key: "",
            title: "",
            description: "",
            status: "",
            priority: "",
            assignee: "",
            type: "",
            dueDate: "",
            imageUrl: "",
            raw: {},
        },
        inspector: "hidden",
    });

    const [, setDeletedDataId] = Retool.useStateString({
        name: "deletedDataId",
        initialValue: "",
        inspector: "hidden",
    });

    const [jsonError, setJsonError] = Retool.useStateString({
        name: "jsonError",
        initialValue: "",
        inspector: "hidden",
    });

    const [lastAction, setLastAction] = Retool.useStateString({
        name: "lastAction",
        initialValue: "",
        inspector: "hidden",
    });

    const [dragState, setDragState] = useState<DragState | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState("");
    const isInternalJsonUpdate = useRef(false);

    const onDataSelect = Retool.useEventCallback({ name: "dataSelect" });

    const mappings = useMemo<FieldMappings>(
        () => ({
            idField,
            keyField,
            titleField,
            descriptionField,
            statusField,
            priorityField,
            assigneeField,
            typeField,
            dueDateField,
            imageUrlField,
        }),
        [
            idField,
            keyField,
            titleField,
            descriptionField,
            statusField,
            priorityField,
            assigneeField,
            typeField,
            dueDateField,
            imageUrlField,
        ]
    );

    const visibleTasks = useMemo(() => {
        return Array.isArray(tasks) ? (tasks as Task[]) : [];
    }, [tasks]);

    const columns = useMemo(() => {
        const configuredOrder = statusOrder
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const dataOrder: string[] = [];
        const seen = new Set<string>();

        visibleTasks.forEach((task) => {
            const value = task.status || "";
            if (!seen.has(value)) {
                seen.add(value);
                dataOrder.push(value);
            }
        });

        if (configuredOrder.length === 0) {
            return dataOrder.length > 0 ? dataOrder : [""];
        }

        const ordered: string[] = [];
        const added = new Set<string>();

        configuredOrder.forEach((value) => {
            if (!added.has(value)) {
                ordered.push(value);
                added.add(value);
            }
        });

        dataOrder.forEach((value) => {
            if (!added.has(value)) {
                ordered.push(value);
                added.add(value);
            }
        });

        return ordered.length > 0 ? ordered : [""];
    }, [visibleTasks, statusOrder]);

    const tasksByColumn = useMemo(() => {
        const grouped: Record<string, Task[]> = {};

        columns.forEach((column) => {
            grouped[column] = [];
        });

        visibleTasks.forEach((task) => {
            const column = task.status || "";
            if (!grouped[column]) grouped[column] = [];
            grouped[column].push(task);
        });

        return grouped;
    }, [visibleTasks, columns]);

    useEffect(() => {
        if (isInternalJsonUpdate.current) {
            isInternalJsonUpdate.current = false;
            return;
        }

        const result = parseTasksFromAnyJson(dataJson, mappings);

        setTasks(result.tasks);
        setJsonError(result.error);
        setLastAction("jsonLoad");

        if (result.tasks.length > 0) {
            const first = cloneTask(result.tasks[0]);
            setSelectedDataId(first.id);
            setSelectedData(first);
        } else {
            setSelectedDataId("");
            setSelectedData(makeEmptyOutput());
        }
    }, [dataJson, mappings, setJsonError, setLastAction, setSelectedData, setSelectedDataId, setTasks]);

    const writeTasksBackToJson = (nextTasks: Task[]) => {
        const nextPayload = nextTasks.map((task) => {
            if (task.raw && Object.keys(task.raw).length > 0) {
                return task.raw;
            }

            return {
                id: task.id,
                key: task.key,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                type: task.type,
                dueDate: task.dueDate,
                imageUrl: task.imageUrl,
            };
        });

        isInternalJsonUpdate.current = true;
        setDataJson(JSON.stringify(nextPayload, null, 2));
    };

    const selectTask = (task: Task) => {
        const cleanTask = cloneTask(task);
        setSelectedDataId(cleanTask.id);
        setSelectedData(cleanTask);
        setLastAction("select");
        onDataSelect();
    };

    const moveTaskToColumn = (taskId: string, targetColumn: string) => {
        const draggedTask = visibleTasks.find((task) => task.id === taskId);
        if (!draggedTask) return;

        const nextTasks = visibleTasks.map((task) => {
            if (task.id !== taskId) return task;
            return syncRawStatusField(task, targetColumn, mappings);
        });

        setTasks(nextTasks);
        writeTasksBackToJson(nextTasks);
        setLastAction("move");

        const updatedSelected = nextTasks.find((task) => task.id === selectedDataId);
        if (updatedSelected) {
            setSelectedData(cloneTask(updatedSelected));
        }

        setDragState(null);
        setDragOverColumn("");
    };

    return (
        <div className="kanban-root">
            {jsonError ? <div className="kanban-error-banner">{jsonError}</div> : null}

            {!jsonError && visibleTasks.length === 0 ? (
                <div className="kanban-empty-state">
                    <div className="kanban-empty-state-title">No data found</div>
                    <div className="kanban-empty-state-text">
                        Bind <strong>dataJson</strong> and map your fields.
                    </div>
                </div>
            ) : null}

            <div className="kanban-board">
                {columns.map((column) => (
                    <div
                        key={column || "__empty_column__"}
                        className={`kanban-column ${dragOverColumn === column ? "dragover" : ""}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverColumn(column);
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setDragOverColumn(column);
                        }}
                        onDragLeave={(e) => {
                            const related = e.relatedTarget as Node | null;
                            if (!e.currentTarget.contains(related)) {
                                setDragOverColumn((current) => (current === column ? "" : current));
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const droppedTaskId =
                                dragState?.taskId || e.dataTransfer.getData("text/plain");

                            if (droppedTaskId) {
                                moveTaskToColumn(droppedTaskId, column);
                            } else {
                                setDragState(null);
                                setDragOverColumn("");
                            }
                        }}
                    >
                        <div className="kanban-column-header">
                            <div className="kanban-column-left">
                                <span className="kanban-column-dot" />
                                <span className="kanban-column-name">{column || " "}</span>
                            </div>
                            <span className="kanban-column-count">{tasksByColumn[column]?.length || 0}</span>
                        </div>

                        <div className="kanban-column-list">
                            {(tasksByColumn[column] || []).map((task) => {
                                const isSelected = task.id === selectedDataId;

                                return (
                                    <div
                                        key={task.id}
                                        className={`kanban-card ${isSelected ? "active" : ""} ${dragState?.taskId === task.id ? "dragging" : ""
                                            }`}
                                        draggable
                                        onDragStart={(e) => {
                                            setDragState({
                                                taskId: task.id,
                                                fromColumn: task.status,
                                            });
                                            e.dataTransfer.effectAllowed = "move";
                                            e.dataTransfer.setData("text/plain", task.id);
                                        }}
                                        onDragEnd={() => {
                                            setDragState(null);
                                            setDragOverColumn("");
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectTask(task);
                                        }}
                                    >
                                        <div className="kanban-card-top">
                                            <span className="kanban-card-key">{task.key}</span>

                                            <button
                                                className="kanban-icon-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectTask(task);
                                                }}
                                                title="Select"
                                                type="button"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {task.title ? <div className="kanban-card-title">{task.title}</div> : null}

                                        {task.description ? (
                                            <div className="kanban-card-description">{task.description}</div>
                                        ) : null}

                                        {task.dueDate ? (
                                            <div className="kanban-date-chip" title={task.dueDate}>
                                                {formatDueDate(task.dueDate)}
                                            </div>
                                        ) : null}

                                        <div className="kanban-card-footer">
                                            <div className="kanban-pill-row">
                                                {task.priority ? (
                                                    <span className="kanban-meta-pill">{titleCase(task.priority)}</span>
                                                ) : null}

                                                {task.type ? (
                                                    <span className="kanban-meta-pill">{titleCase(task.type)}</span>
                                                ) : null}
                                            </div>

                                            {(task.assignee || task.imageUrl) && (
                                                <div className="kanban-assignee">
                                                    <Avatar name={task.assignee} imageUrl={task.imageUrl} />
                                                    <span className="kanban-assignee-name">{task.assignee}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {(tasksByColumn[column] || []).length === 0 ? (
                                <div className="kanban-empty-column">Drop item here</div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Kanban;