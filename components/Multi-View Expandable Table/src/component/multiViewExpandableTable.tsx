import React from "react";
import { type FC } from "@tryretool/custom-component-support";
import { Retool } from "@tryretool/custom-component-support";

type ExpandViewMode = "Table" | "Cards" | "Bar Chart" | "Key Value Pair";

export const ExpandableTable: FC = () => {
  Retool.useComponentSettings({
    defaultHeight: 60,
    defaultWidth: 12,
  });

  const [data] = Retool.useStateArray({
    name: "tableData",
    label: "Table Data",
  });
  const [itemsPerPage] = Retool.useStateString({
    name: "pageSize",
    label: "Page Size",
  });
  const [headerColor] = Retool.useStateString({
    name: "headerColor",
    label: "Header Color",
  });
  const [headerTextColor] = Retool.useStateString({
    name: "headerTextColor",
    label: "Header Text Color",
  });
  const [accentColor] = Retool.useStateString({
    name: "accentColor",
    label: "Accent Color",
  });
  const [showSearchBar] = Retool.useStateBoolean({
    name: "showSearchBar",
    initialValue: true,
    label: "Search Bar",
    inspector: "checkbox",
  });

  const isSearchBarVisible = showSearchBar;
  const [viewMode] = Retool.useStateEnumeration({
    name: "viewMode",
    initialValue: "table",
    inspector: "select",
    label: "View Mode",
    enumDefinition: ["table", "cards", "chart", "keyvalue"],
    enumLabels: {
      table: "Table",
      cards: "Cards",
      chart: "Bar Chart",
      keyvalue: "Key Value Pair",
    },
  });

  const headerBg = headerColor || "#f9fafb";
  const headerTxt = headerTextColor || "#111827";
  const accent = accentColor || "#3b82f6";

  const sampleData = [
    {
      id: 1,
      name: "Aarav Mehta",
      role: "Frontend Developer",
      status: "Active",
      skills: ["React", "TypeScript", "CSS"],
      profile: "https://example.com/profiles/1-aarav-mehta",
      verified: false,
      details: {
        employeeCode: "EMP-1001",
        email: "aarav.mehta@example.com",
        phone: "9876501001",
        location: "Ahmedabad",
        department: "Engineering",
        manager: "Alyssa Martin",
        assignedProject: "DIR Inspection App",
        currentClient: "Cherry River",
        office: "Ahmedabad HQ",
        employeeType: "Contract",
        shift: "General",
        joiningDate: "03-02-2018",
        experienceYears: 1,
        attendance: 83,
        utilization: 69,
        productivityScore: 61,
        completedTasks: 21,
        pendingTasks: 3,
        totalTasks: 24,
        weeklyHours: 35,
        bugsResolved: 5,
        activeTickets: 2,
        sprintVelocity: 19,
        leaveBalance: 7,
        trainingHours: 9,
        csatScore: 76,
        billable: "No",
        workstation: "WS-101",
        lastPerformanceRating: "4/5",
        notes: "Performing as expected",
      },
    },
    {
      id: 2,
      name: "Diya Shah",
      role: "UI/UX Designer",
      status: "On Leave",
      skills: ["Figma", "Wireframing", "Prototyping"],
      profile: "https://example.com/profiles/2-diya-shah",
      verified: false,
      details: {
        employeeCode: "EMP-1002",
        email: "diya.shah@example.com",
        phone: "9876501002",
        location: "Surat",
        department: "Design",
        manager: "Rohan Iyer",
        assignedProject: "COO Cockpit",
        currentClient: "Widle Studio LLP",
        office: "Mumbai Office",
        employeeType: "Full Time",
        shift: "Morning",
        joiningDate: "05-03-2019",
        experienceYears: 2,
        attendance: 84,
        utilization: 70,
        productivityScore: 62,
        completedTasks: 22,
        pendingTasks: 4,
        totalTasks: 26,
        weeklyHours: 36,
        bugsResolved: 6,
        activeTickets: 3,
        sprintVelocity: 20,
        leaveBalance: 8,
        trainingHours: 10,
        csatScore: 77,
        billable: "Yes",
        workstation: "WS-102",
        lastPerformanceRating: "5/5",
        notes: "Performing as expected",
      },
    },
    {
      id: 3,
      name: "Vivaan Patel",
      role: "Backend Engineer",
      status: "Inactive",
      skills: ["Node.js", "PostgreSQL", "APIs"],
      profile: "https://example.com/profiles/3-vivaan-patel",
      verified: true,
      details: {
        employeeCode: "EMP-1003",
        email: "vivaan.patel@example.com",
        phone: "9876501003",
        location: "Vadodara",
        department: "Engineering",
        manager: "Neha Verma",
        assignedProject: "Hotel Finder AI",
        currentClient: "Northwind Retail",
        office: "Bangalore Tech Park",
        employeeType: "Contract",
        shift: "General",
        joiningDate: "07-04-2020",
        experienceYears: 3,
        attendance: 85,
        utilization: 71,
        productivityScore: 63,
        completedTasks: 23,
        pendingTasks: 5,
        totalTasks: 28,
        weeklyHours: 37,
        bugsResolved: 7,
        activeTickets: 4,
        sprintVelocity: 21,
        leaveBalance: 9,
        trainingHours: 11,
        csatScore: 78,
        billable: "No",
        workstation: "WS-103",
        lastPerformanceRating: "3/5",
        notes: "Performing as expected",
      },
    },
    {
      id: 4,
      name: "Anaya Joshi",
      role: "Business Analyst",
      status: "Probation",
      skills: ["Documentation", "Excel", "Reporting"],
      profile: "https://example.com/profiles/4-anaya-joshi",
      verified: false,
      details: {
        employeeCode: "EMP-1004",
        email: "anaya.joshi@example.com",
        phone: "9876501004",
        location: "Mumbai",
        department: "Operations",
        manager: "Daniel Cruz",
        assignedProject: "Vendor Portal",
        currentClient: "Apex Logistics",
        office: "Remote",
        employeeType: "Full Time",
        shift: "Morning",
        joiningDate: "09-05-2021",
        experienceYears: 4,
        attendance: 86,
        utilization: 72,
        productivityScore: 64,
        completedTasks: 24,
        pendingTasks: 6,
        totalTasks: 30,
        weeklyHours: 38,
        bugsResolved: 8,
        activeTickets: 5,
        sprintVelocity: 22,
        leaveBalance: 10,
        trainingHours: 12,
        csatScore: 79,
        billable: "Yes",
        workstation: "WS-104",
        lastPerformanceRating: "4/5",
        notes: "Performing as expected",
      },
    },
    {
      id: 5,
      name: "Krish Trivedi",
      role: "QA Engineer",
      status: "Active",
      skills: ["Manual Testing", "Automation", "Bug Tracking"],
      profile: "https://example.com/profiles/5-krish-trivedi",
      verified: false,
      details: {
        employeeCode: "EMP-1005",
        email: "krish.trivedi@example.com",
        phone: "9876501005",
        location: "Pune",
        department: "Quality",
        manager: "Priya Nair",
        assignedProject: "Inventory Dashboard",
        currentClient: "BluePeak Hospitality",
        office: "Pune Office",
        employeeType: "Contract",
        shift: "General",
        joiningDate: "11-06-2022",
        experienceYears: 5,
        attendance: 87,
        utilization: 73,
        productivityScore: 65,
        completedTasks: 25,
        pendingTasks: 7,
        totalTasks: 32,
        weeklyHours: 39,
        bugsResolved: 9,
        activeTickets: 6,
        sprintVelocity: 23,
        leaveBalance: 11,
        trainingHours: 13,
        csatScore: 80,
        billable: "No",
        workstation: "WS-105",
        lastPerformanceRating: "5/5",
        notes: "Performing as expected",
      },
    },
  ];
  const hasExternalData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((row) => row && typeof row === "object");

  const rows = hasExternalData ? data : sampleData;
  const isUsingSampleData = !hasExternalData;
  const pageSize = Math.max(1, Number(itemsPerPage || 10));

  const [selectedRow, setSelectedRow] = React.useState<number | null>(null);
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageInput, setPageInput] = React.useState("1");
  const [searchTerm, setSearchTerm] = React.useState("");

  const linkCSS = `
    .custom-link {
      color: #2563eb !important;
      text-decoration: none !important;
      font-weight: 500 !important;
      word-break: break-word !important;
    }
    .custom-link:hover {
      text-decoration: underline !important;
    }

    .expanded-table-scroll {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }

    .expanded-table-scroll::-webkit-scrollbar {
      height: 10px;
    }

    .expanded-table-scroll::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 999px;
    }

    .expanded-table-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }
  `;

  const ChevronDownIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 9l6 6 6-6"
        stroke="#374151"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 6l6 6-6 6"
        stroke="#374151"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SortNeutralIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 6L8 3L11 6"
        stroke="#6B7280"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 10L8 13L5 10"
        stroke="#6B7280"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SortAscIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 6L8 3L11 6"
        stroke="#111827"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 10L8 13L5 10"
        stroke="#D1D5DB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SortDescIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 6L8 3L11 6"
        stroke="#D1D5DB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 10L8 13L5 10"
        stroke="#111827"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const formatLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (s) => s.toUpperCase());

  const isEmptyValue = (val: any) =>
    val === "" || val === null || val === undefined;

  const isNumericLike = (val: any) =>
    val !== null && val !== undefined && val !== "" && !isNaN(Number(val));

  const getNumericDetailEntries = (details: Record<string, any>) =>
    Object.entries(details || {}).filter(([, val]) => isNumericLike(val));

  const getSearchableText = (value: any): string => {
    if (value === null || value === undefined) return "";

    if (Array.isArray(value)) {
      return value.map(getSearchableText).join(" ");
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(([k, v]) => `${k} ${getSearchableText(v)}`)
        .join(" ");
    }

    return String(value);
  };

  const formatCellValue = (value: any): string => {
    if (isEmptyValue(value)) return "—";
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const normalizedData = React.useMemo(() => {
    return rows.map((row: any, index: number) => ({
      ...row,
      __originalIndex: index,
    }));
  }, [rows]);

  const mapViewMode = (mode: string): ExpandViewMode => {
    switch (mode) {
      case "cards":
        return "Cards";
      case "chart":
        return "Bar Chart";
      case "keyvalue":
        return "Key Value Pair";
      default:
        return "Table";
    }
  };

  const tableHeaders = React.useMemo(() => {
    if (!normalizedData.length) return [];
    return Object.keys(normalizedData[0]).filter(
      (k) => k !== "details" && k !== "__originalIndex",
    );
  }, [normalizedData]);

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 82%)`;
  };

  const getTextColor = (bg: string) => {
    const lightness = Number(bg.split(",")[2].replace("%)", "").trim());
    return lightness > 70 ? "#1f2937" : "#fff";
  };

  const Tag = ({ text }: { text: string }) => {
    const bg = stringToColor(text);
    return (
      <span
        style={{
          background: bg,
          color: getTextColor(bg),
          padding: "5px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {text}
      </span>
    );
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" as const };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" as const };
      }
      return null;
    });
  };

  const getComparableValue = (value: any) => {
    if (isEmptyValue(value)) return { type: "empty", value: "" };

    if (Array.isArray(value)) {
      return { type: "text", value: value.join(", ").toLowerCase() };
    }

    if (typeof value === "number") {
      return { type: "number", value };
    }

    if (typeof value === "boolean") {
      return { type: "number", value: value ? 1 : 0 };
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "" && !isNaN(Number(trimmed))) {
        return { type: "number", value: Number(trimmed) };
      }
      return { type: "text", value: trimmed.toLowerCase() };
    }

    return { type: "text", value: String(value).toLowerCase() };
  };

  const sortedData = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = normalizedData.filter((row: any) => {
      if (!term) return true;
      return getSearchableText(row).toLowerCase().includes(term);
    });

    const sorted = [...filtered];

    if (sortConfig) {
      sorted.sort((a: any, b: any) => {
        const compA = getComparableValue(a?.[sortConfig.key]);
        const compB = getComparableValue(b?.[sortConfig.key]);

        if (compA.type === "empty" && compB.type === "empty") {
          return a.__originalIndex - b.__originalIndex;
        }
        if (compA.type === "empty") {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        if (compB.type === "empty") {
          return sortConfig.direction === "asc" ? -1 : 1;
        }

        if (compA.type === "number" && compB.type === "number") {
          if (compA.value < compB.value) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (compA.value > compB.value) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
          return a.__originalIndex - b.__originalIndex;
        }

        const aVal = String(compA.value);
        const bVal = String(compB.value);

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return a.__originalIndex - b.__originalIndex;
      });
    } else {
      sorted.sort((a: any, b: any) => a.__originalIndex - b.__originalIndex);
    }

    return sorted;
  }, [normalizedData, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const paginatedData = React.useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, totalPages]);

  const totalRecords = sortedData.length;
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const goToPage = (p: number) => {
    const safe = Math.max(1, Math.min(totalPages, Number(p)));
    setCurrentPage(safe);
    setPageInput(String(safe));
  };

  const handlePageInputChange = (val: string) => {
    if (val === "" || /^\d+$/.test(val)) setPageInput(val);
  };

  const commitPageInput = () => {
    if (pageInput === "") {
      setPageInput(String(currentPage));
      return;
    }
    goToPage(Number(pageInput));
  };

  const getRowId = (item: any, index: number) => {
    return typeof item?.id === "number"
      ? item.id
      : (currentPage - 1) * pageSize + index + 1;
  };

  const toggleRow = (id: number) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  React.useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchTerm, pageSize]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      setPageInput(String(totalPages));
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    if (paginatedData.length === 0) {
      setSelectedRow(null);
      return;
    }

    const pageRowIds = paginatedData.map((row: any, index: number) =>
      getRowId(row, index),
    );

    if (!pageRowIds.includes(selectedRow as number)) {
      setSelectedRow(pageRowIds[0]);
    }
  }, [paginatedData, selectedRow]);

  return (
    <div
      style={{
        padding: 0,
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: 420,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <style>{linkCSS}</style>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#fff",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {isSearchBarVisible && (
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              background: "#fafafa",
            }}
          >
            <div style={{ position: "relative", width: 240 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>

              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  height: 34,
                  padding: "0 12px 0 36px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.border = `1px solid ${accent}`)}
                onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
              />
            </div>
          </div>
        )}

        {isUsingSampleData && (
          <div
            style={{
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 600,
              color: "#92400e",
              background: "#fffbeb",
              borderBottom: "1px solid #fef3c7",
            }}
          >
            Showing sample data.
          </div>
        )}

        <div
          style={{
            width: "100%",
            maxHeight: 720,
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              tableLayout: "auto",
              width: "max-content", // 🔥 allows expansion
              minWidth: "100%", // 🔥 fills full width if small data
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: headerBg,
              }}
            >
              <tr style={{ background: headerBg, color: headerTxt }}>
                <th
                  style={{
                    width: 44,
                    minWidth: 44,
                    background: headerBg,
                    position: "sticky",
                    top: 0,
                    zIndex: 6,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                ></th>

                {tableHeaders.map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{
                      padding: "14px 16px",
                      background: headerBg,
                      position: "sticky",
                      top: 0,
                      zIndex: 6,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid #e5e7eb",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{key.toUpperCase()}</span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sortConfig?.key === key ? (
                          sortConfig.direction === "asc" ? (
                            <SortAscIcon />
                          ) : (
                            <SortDescIcon />
                          )
                        ) : (
                          <SortNeutralIcon />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length + 1}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: any, index: number) => {
                  const rowId = getRowId(item, index);
                  const isSelected = selectedRow === rowId;
                  const isExpanded = expandedRow === rowId;
                  const details =
                    item?.details && typeof item.details === "object"
                      ? item.details
                      : {};
                  const detailEntries = Object.entries(details);
                  const allEmptyValues =
                    detailEntries.length === 0 ||
                    detailEntries.every(([, v]) => isEmptyValue(v));
                  const currentViewMode = mapViewMode(viewMode);

                  const detailColumnCount = Math.max(detailEntries.length, 1);
                  const shouldEnableHorizontalScroll = detailColumnCount > 4;
                  const minExpandedTableWidth = shouldEnableHorizontalScroll
                    ? detailColumnCount * 220
                    : 0;

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        onClick={() => setSelectedRow(rowId)}
                        style={{
                          borderBottom: isExpanded
                            ? "none"
                            : "1px solid #edf0f3",
                          background: isSelected ? `${accent}16` : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "top",
                            borderLeft: isSelected
                              ? `4px solid ${accent}`
                              : "4px solid transparent",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(rowId);
                            toggleRow(rowId);
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDownIcon />
                            ) : (
                              <ChevronRightIcon />
                            )}
                          </div>
                        </td>

                        {tableHeaders.map((key) => {
                          const value = item[key];

                          if (Array.isArray(value)) {
                            return (
                              <td
                                key={key}
                                style={{
                                  padding: "14px 16px",
                                  borderBottom: isExpanded
                                    ? "none"
                                    : "1px solid #edf0f3",
                                  fontSize: 14,
                                  lineHeight: 1.45,
                                  verticalAlign: "top",
                                  wordBreak: "break-word",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    alignItems: "flex-start",
                                  }}
                                >
                                  {value.map((v, i) => (
                                    <Tag key={i} text={String(v)} />
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          if (
                            typeof value === "string" &&
                            /^(https?:\/\/)/.test(value)
                          ) {
                            return (
                              <td
                                key={key}
                                style={{
                                  padding: "14px 16px",
                                  borderBottom: isExpanded
                                    ? "none"
                                    : "1px solid #edf0f3",
                                  fontSize: 14,
                                  lineHeight: 1.45,
                                  verticalAlign: "top",
                                  wordBreak: "break-word",
                                }}
                              >
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="custom-link"
                                >
                                  {value}
                                </a>
                              </td>
                            );
                          }

                          if (typeof value === "boolean") {
                            return (
                              <td
                                key={key}
                                style={{
                                  padding: "14px 16px",
                                  borderBottom: isExpanded
                                    ? "none"
                                    : "1px solid #edf0f3",
                                  fontSize: 14,
                                  lineHeight: 1.45,
                                  verticalAlign: "top",
                                }}
                              >
                                {value ? (
                                  <span
                                    style={{
                                      color: "#2563eb",
                                      fontSize: 18,
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={key}
                              style={{
                                padding: "14px 16px",
                                borderBottom: isExpanded
                                  ? "none"
                                  : "1px solid #edf0f3",
                                fontSize: 14,
                                lineHeight: 1.45,
                                verticalAlign: "top",
                                wordBreak: "break-word",
                              }}
                            >
                              {isEmptyValue(value) ? "—" : String(value)}
                            </td>
                          );
                        })}
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: "#f8fafc" }}>
                          <td
                            colSpan={tableHeaders.length + 1}
                            style={{
                              padding: "0 16px 16px 16px",
                              borderBottom: "1px solid #edf0f3",
                              maxWidth: 0,
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                overflow: "hidden",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                width: "100%",
                                maxWidth: "100%",
                                boxSizing: "border-box",
                                marginTop: "15px",
                              }}
                            >
                              <div
                                style={{
                                  padding: "12px 14px",
                                  borderBottom: "1px solid #e5e7eb",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 12,
                                  flexWrap: "wrap",
                                  background: "#fafafa",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#374151",
                                  }}
                                >
                                  Expanded Details
                                </div>

                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#6b7280",
                                  }}
                                >
                                  View: {currentViewMode}
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: 14,
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                }}
                              >
                                {currentViewMode === "Cards" ? (
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(180px, 1fr))",
                                      gap: 12,
                                    }}
                                  >
                                    {allEmptyValues ? (
                                      <div
                                        style={{
                                          padding: 18,
                                          textAlign: "center",
                                          color: "#888",
                                          gridColumn: "1 / -1",
                                          background: "#fff",
                                          border: "1px dashed #d1d5db",
                                          borderRadius: 10,
                                        }}
                                      >
                                        No rows found
                                      </div>
                                    ) : (
                                      detailEntries.map(([key, val]) => (
                                        <div
                                          key={key}
                                          style={{
                                            background: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 10,
                                            padding: 14,
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: "#6b7280",
                                              marginBottom: 6,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {formatLabel(key)}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 14,
                                              color: "#111827",
                                              lineHeight: 1.45,
                                              wordBreak: "break-word",
                                            }}
                                          >
                                            {formatCellValue(val)}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                ) : currentViewMode === "Bar Chart" ? (
                                  <div
                                    style={{
                                      background: "#fff",
                                      // border: '1px solid #e5e7eb',
                                      borderRadius: 12,
                                      padding: 18,
                                      overflowX: "auto",
                                      overflowY: "hidden",
                                    }}
                                  >
                                    {(() => {
                                      const numericEntries =
                                        getNumericDetailEntries(details)
                                          .filter(([key]) => {
                                            const lower =
                                              String(key).toLowerCase();
                                            return ![
                                              "phone",
                                              "employeecode",
                                              "workstation",
                                            ].includes(lower);
                                          })
                                          .map(
                                            ([key, val]) =>
                                              [key, Number(val)] as [
                                                string,
                                                number,
                                              ],
                                          )
                                          .filter(
                                            ([, val]) =>
                                              !isNaN(val) && isFinite(val),
                                          )
                                          .sort((a, b) => b[1] - a[1])
                                          .slice(0, 8);

                                      if (numericEntries.length === 0) {
                                        return (
                                          <div
                                            style={{
                                              textAlign: "center",
                                              color: "#888",
                                              padding: 18,
                                              border: "1px dashed #d1d5db",
                                              borderRadius: 10,
                                            }}
                                          >
                                            No numeric data available for chart
                                          </div>
                                        );
                                      }

                                      const maxValRaw = Math.max(
                                        ...numericEntries.map(([, v]) => v),
                                        1,
                                      );
                                      const roundedMax =
                                        maxValRaw <= 10
                                          ? 10
                                          : Math.ceil(maxValRaw / 10) * 10;

                                      const yTicks = 5;
                                      const chartHeight = 260;
                                      const labelAreaHeight = 64;
                                      const slotWidth = 110;
                                      const chartWidth = Math.max(
                                        numericEntries.length * slotWidth,
                                        640,
                                      );

                                      return (
                                        <div style={{ minWidth: chartWidth }}>
                                          <div
                                            style={{
                                              display: "grid",
                                              gridTemplateColumns: "56px 1fr",
                                              alignItems: "start",
                                              columnGap: 12,
                                            }}
                                          >
                                            <div
                                              style={{
                                                position: "relative",
                                                height: chartHeight + 24,
                                              }}
                                            >
                                              {Array.from(
                                                { length: yTicks + 1 },
                                                (_, i) => {
                                                  const value = Math.round(
                                                    (roundedMax / yTicks) *
                                                      (yTicks - i),
                                                  );
                                                  const top =
                                                    (chartHeight / yTicks) * i;

                                                  return (
                                                    <div
                                                      key={i}
                                                      style={{
                                                        position: "absolute",
                                                        top,
                                                        right: 0,
                                                        transform:
                                                          "translateY(-50%)",
                                                        fontSize: 12,
                                                        color: "#6b7280",
                                                        fontWeight: 500,
                                                        lineHeight: 1,
                                                      }}
                                                    >
                                                      {value}
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>

                                            <div
                                              style={{
                                                position: "relative",
                                                height: chartHeight,
                                                //  + 24 +
                                                // labelAreaHeight
                                              }}
                                            >
                                              {Array.from(
                                                { length: yTicks + 1 },
                                                (_, i) => {
                                                  const top =
                                                    (chartHeight / yTicks) * i;

                                                  return (
                                                    <div
                                                      key={i}
                                                      style={{
                                                        position: "absolute",
                                                        left: 0,
                                                        right: 0,
                                                        top,
                                                        borderTop:
                                                          "1px solid #e5e7eb",
                                                      }}
                                                    />
                                                  );
                                                },
                                              )}

                                              <div
                                                style={{
                                                  position: "absolute",
                                                  left: 0,
                                                  top: 0,
                                                  bottom: labelAreaHeight,
                                                  width: 1,
                                                  background: "#d1d5db",
                                                }}
                                              />

                                              <div
                                                style={{
                                                  position: "absolute",
                                                  left: 0,
                                                  right: 0,
                                                  top: chartHeight,
                                                  borderTop:
                                                    "1.5px solid #9ca3af",
                                                }}
                                              />

                                              <div
                                                style={{
                                                  position: "absolute",
                                                  left: 16,
                                                  right: 16,
                                                  top: 0,
                                                  height: chartHeight,
                                                  display: "flex",
                                                  alignItems: "flex-end",
                                                  justifyContent:
                                                    "space-around",
                                                  gap: 14,
                                                }}
                                              >
                                                {numericEntries.map(
                                                  ([key, val]) => {
                                                    const barHeight = Math.max(
                                                      (val / roundedMax) *
                                                        chartHeight,
                                                      8,
                                                    );

                                                    return (
                                                      <div
                                                        key={key}
                                                        style={{
                                                          flex: 1,
                                                          minWidth: 72,
                                                          maxWidth: 88,
                                                          display: "flex",
                                                          flexDirection:
                                                            "column",
                                                          alignItems: "center",
                                                          justifyContent:
                                                            "flex-end",
                                                          height: "100%",
                                                        }}
                                                      >
                                                        <div
                                                          style={{
                                                            marginBottom: 8,
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            color: "#111827",
                                                            lineHeight: 1,
                                                            whiteSpace:
                                                              "nowrap",
                                                          }}
                                                        >
                                                          {val}
                                                        </div>

                                                        <div
                                                          style={{
                                                            width: "100%",
                                                            height: barHeight,
                                                            background: accent,
                                                            borderRadius:
                                                              "10px 10px 0 0",
                                                            minHeight: 8,
                                                            transition:
                                                              "height 0.35s ease",
                                                            boxShadow:
                                                              "inset 0 -1px 0 rgba(255,255,255,0.15)",
                                                          }}
                                                        />
                                                      </div>
                                                    );
                                                  },
                                                )}
                                              </div>

                                              <div
                                                style={{
                                                  position: "absolute",
                                                  left: 16,
                                                  right: 16,
                                                  top: chartHeight + 10,
                                                  height: labelAreaHeight - 10,
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-around",
                                                  gap: 14,
                                                }}
                                              >
                                                {numericEntries.map(([key]) => (
                                                  <div
                                                    key={key}
                                                    title={formatLabel(key)}
                                                    style={{
                                                      flex: 1,
                                                      minWidth: 72,
                                                      maxWidth: 88,
                                                      fontSize: 12,
                                                      fontWeight: 600,
                                                      color: "#4b5563",
                                                      textAlign: "center",
                                                      lineHeight: 1.3,
                                                      whiteSpace: "normal",
                                                      wordBreak: "break-word",
                                                      overflowWrap: "anywhere",
                                                      display: "-webkit-box",
                                                      WebkitLineClamp: 3,
                                                      WebkitBoxOrient:
                                                        "vertical",
                                                      overflow: "hidden",
                                                    }}
                                                  >
                                                    {formatLabel(key)}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : currentViewMode === "Key Value Pair" ? (
                                  <div
                                    style={{
                                      width: "100%",
                                      maxWidth: "100%",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 10,
                                      overflow: "hidden",
                                      background: "#fff",
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <table
                                      style={{
                                        width: "100%",
                                        maxWidth: "100%",
                                        borderCollapse: "collapse",
                                        tableLayout: "fixed",
                                      }}
                                    >
                                      <thead
                                        style={{
                                          position: "sticky",
                                          top: 0,
                                          zIndex: 5,
                                          background: headerBg,
                                        }}
                                      >
                                        <tr style={{ background: "#f3f4f6" }}>
                                          <th
                                            style={{
                                              width: "35%",
                                              padding: "12px 14px",
                                              textAlign: "left",
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: "#374151",
                                              borderBottom: "1px solid #e5e7eb",
                                              boxSizing: "border-box",
                                              background: headerBg,
                                              position: "sticky",
                                              top: 0,
                                              zIndex: 6,
                                            }}
                                          >
                                            KEY
                                          </th>
                                          <th
                                            style={{
                                              width: "65%",
                                              padding: "12px 14px",
                                              textAlign: "left",
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: "#374151",
                                              borderBottom: "1px solid #e5e7eb",
                                              boxSizing: "border-box",
                                              background: headerBg,
                                              position: "sticky",
                                              top: 0,
                                              zIndex: 6,
                                            }}
                                          >
                                            VALUE
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {allEmptyValues ? (
                                          <tr>
                                            <td
                                              colSpan={2}
                                              style={{
                                                padding: 18,
                                                textAlign: "center",
                                                color: "#888",
                                              }}
                                            >
                                              No rows found
                                            </td>
                                          </tr>
                                        ) : (
                                          detailEntries.map(([key, value]) => (
                                            <tr key={key}>
                                              <td
                                                style={{
                                                  padding: "12px 14px",
                                                  fontSize: 13,
                                                  fontWeight: 600,
                                                  color: "#374151",
                                                  background: "#fafafa",
                                                  borderBottom:
                                                    "1px solid #e5e7eb",
                                                  verticalAlign: "top",
                                                  wordBreak: "break-word",
                                                  overflowWrap: "anywhere",
                                                  boxSizing: "border-box",
                                                }}
                                              >
                                                {formatLabel(key)}
                                              </td>
                                              <td
                                                style={{
                                                  padding: "12px 14px",
                                                  fontSize: 14,
                                                  color: "#111827",
                                                  lineHeight: 1.5,
                                                  borderBottom:
                                                    "1px solid #e5e7eb",
                                                  verticalAlign: "top",
                                                  wordBreak: "break-word",
                                                  overflowWrap: "anywhere",
                                                  boxSizing: "border-box",
                                                }}
                                              >
                                                {formatCellValue(value)}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 10,
                                      background: "#fff",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div className="expanded-table-scroll">
                                      <table
                                        style={{
                                          borderCollapse: "collapse",
                                          tableLayout:
                                            shouldEnableHorizontalScroll
                                              ? "auto"
                                              : "fixed",
                                          width: shouldEnableHorizontalScroll
                                            ? "max-content"
                                            : "100%",
                                          minWidth: shouldEnableHorizontalScroll
                                            ? minExpandedTableWidth
                                            : "100%",
                                          background: "#fff",
                                        }}
                                      >
                                        <thead
                                          style={{
                                            position: "sticky",
                                            top: 0,
                                            zIndex: 5,
                                            background: headerBg,
                                          }}
                                        >
                                          <tr style={{ background: "#f3f4f6" }}>
                                            {allEmptyValues ? (
                                              <th
                                                style={{
                                                  padding: "12px 14px",
                                                  textAlign: "left",
                                                  fontWeight: 700,
                                                  fontSize: 13,
                                                  whiteSpace: "nowrap",
                                                  borderBottom:
                                                    "1px solid #e5e7eb",
                                                  background: headerBg,
                                                  position: "sticky",
                                                  top: 0,
                                                  zIndex: 6,
                                                }}
                                              >
                                                DETAILS
                                              </th>
                                            ) : (
                                              detailEntries.map(([key]) => (
                                                <th
                                                  key={key}
                                                  style={{
                                                    padding: "12px 14px",
                                                    textAlign: "left",
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    whiteSpace:
                                                      shouldEnableHorizontalScroll
                                                        ? "nowrap"
                                                        : "normal",
                                                    background: headerBg,
                                                    position: "sticky",
                                                    top: 0,
                                                    zIndex: 6,
                                                    borderBottom:
                                                      "1px solid #e5e7eb",
                                                    minWidth:
                                                      shouldEnableHorizontalScroll
                                                        ? 220
                                                        : undefined,
                                                    width:
                                                      shouldEnableHorizontalScroll
                                                        ? undefined
                                                        : `${100 / detailColumnCount}%`,
                                                  }}
                                                >
                                                  {formatLabel(
                                                    key,
                                                  ).toUpperCase()}
                                                </th>
                                              ))
                                            )}
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {allEmptyValues ? (
                                            <tr>
                                              <td
                                                style={{
                                                  padding: "18px",
                                                  textAlign: "center",
                                                  color: "#888",
                                                }}
                                              >
                                                No rows found
                                              </td>
                                            </tr>
                                          ) : (
                                            <tr>
                                              {detailEntries.map(
                                                ([key, value]) => (
                                                  <td
                                                    key={key}
                                                    style={{
                                                      padding: "12px 14px",
                                                      borderBottom:
                                                        "1px solid #e5e7eb",
                                                      fontSize: 14,
                                                      lineHeight: 1.45,
                                                      verticalAlign: "top",
                                                      whiteSpace:
                                                        shouldEnableHorizontalScroll
                                                          ? "nowrap"
                                                          : "normal",
                                                      wordBreak:
                                                        shouldEnableHorizontalScroll
                                                          ? "normal"
                                                          : "break-word",
                                                      width:
                                                        shouldEnableHorizontalScroll
                                                          ? undefined
                                                          : `${100 / detailColumnCount}%`,
                                                    }}
                                                  >
                                                    {formatCellValue(value)}
                                                  </td>
                                                ),
                                              )}
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderTop: "1px solid #e5e7eb",
            gap: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              color: "#555",
              fontSize: 14,
            }}
          >
            Showing {startRecord}–{endRecord} of {totalRecords}
          </div>

          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              width: 30,
              height: 30,
              border: "none",
              background: "transparent",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 18l-6-6 6-6"
                stroke={currentPage === 1 ? "#ccc" : "#000"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <input
            value={pageInput}
            onChange={(e) => handlePageInputChange(e.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(e) => e.key === "Enter" && commitPageInput()}
            style={{
              width: 40,
              height: 26,
              border: "1px solid #ccc",
              borderRadius: 6,
              textAlign: "center",
              fontSize: 14,
              padding: 0,
            }}
          />

          <span style={{ fontSize: 14 }}>of {totalPages}</span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              width: 30,
              height: 30,
              border: "none",
              background: "transparent",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 6l6 6-6 6"
                stroke={currentPage === totalPages ? "#ccc" : "#000"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpandableTable;
