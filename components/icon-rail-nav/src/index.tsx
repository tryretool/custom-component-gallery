import React, { useState } from "react";
import { Retool } from "@tryretool/custom-component-support";

// ─── Types ────────────────────────────────────────────────────────────────────
// Each item accepts:
//   id        — unique identifier (required)
//   label     — title shown next to the icon when expanded
//   icon      — built-in key ("table","code","database",...) | <svg>...</svg> string | image URL
//   page      — Retool page name to navigate to on click (optional)
//   app       — Retool app name to open on click (optional)
//   color     — override icon/text color (optional)
//   badge     — small pill shown after the label (optional)
//   section   — divider label shown above the item (optional)
//   subItems  — array of child items shown in the right contextual panel

type SubItem = { id: string; label: string; page?: string; app?: string; };
type NavItem = {
  id: string; label: string; description?: string; icon: string;
  color?: string; badge?: string; page?: string; app?: string;
  section?: string; subItems?: SubItem[];
};

const DEFAULT_ITEMS: NavItem[] = [
  { id: "item-1", label: "Item 1", icon: "table", description: "Description for Item 1." },
  { id: "item-2", label: "Item 2", icon: "code",  description: "Description for Item 2." },
  { id: "item-3", label: "Item 3", icon: "database", subItems: [
    { id: "item-3-a", label: "Sub Item A" },
    { id: "item-3-b", label: "Sub Item B" },
    { id: "item-3-c", label: "Sub Item C" },
  ]},
];
const DEFAULT_BOTTOM: NavItem[] = [
  { id: "settings", label: "Settings", icon: "settings", description: "Configure your project settings." },
];

const BUILTIN: Record<string, JSX.Element> = {
  table:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.25"/><line x1="1.5" y1="5.5" x2="14.5" y2="5.5" stroke="currentColor" strokeWidth="1.25"/><line x1="1.5" y1="10.5" x2="14.5" y2="10.5" stroke="currentColor" strokeWidth="1.25"/><line x1="6" y1="5.5" x2="6" y2="14.5" stroke="currentColor" strokeWidth="1.25"/></svg>,
  code:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="3,5 1,8 3,11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><polyline points="13,5 15,8 13,11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><line x1="9.5" y1="3" x2="6.5" y2="13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  database: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4.5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.25"/><path d="M2.5 4.5V8C2.5 9.1 5 10 8 10C11 10 13.5 9.1 13.5 8V4.5" stroke="currentColor" strokeWidth="1.25"/><path d="M2.5 8V11.5C2.5 12.6 5 13.5 8 13.5C11 13.5 13.5 12.6 13.5 11.5V8" stroke="currentColor" strokeWidth="1.25"/></svg>,
  lock:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><circle cx="8" cy="11" r="1" fill="currentColor"/></svg>,
  storage:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4.5C2 3.67 2.67 3 3.5 3H12.5C13.33 3 14 3.67 14 4.5V5.5C14 6.33 13.33 7 12.5 7H3.5C2.67 7 2 6.33 2 5.5V4.5Z" stroke="currentColor" strokeWidth="1.25"/><path d="M2 10.5C2 9.67 2.67 9 3.5 9H12.5C13.33 9 14 9.67 14 10.5V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V10.5Z" stroke="currentColor" strokeWidth="1.25"/><circle cx="4.5" cy="5" r="0.75" fill="currentColor"/><circle cx="4.5" cy="11" r="0.75" fill="currentColor"/></svg>,
  function: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 14,5 14,11 8,15 2,11 2,5" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinejoin="round"/><path d="M9 6L7 8L9 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  realtime: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8C3 5.23858 5.23858 3 8 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><path d="M13 8C13 10.7614 10.7614 13 8 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  clock:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/><path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/><path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.75" fill="currentColor"/></svg>,
  logs:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><line x1="5" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><line x1="5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="2,12 5,8 8,10 11,5 14,7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25"/><path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M3.4 12.6L4.5 11.5M11.5 4.5L12.6 3.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  arrow:    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function resolveIcon(icon: string | undefined | null): JSX.Element {
  if (!icon || typeof icon !== "string") return BUILTIN["info"];
  if (BUILTIN[icon]) return BUILTIN[icon];
  const trimmed = icon.trim();
  if (trimmed.startsWith("<svg")) return <span style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: trimmed }} />;
  if (trimmed.startsWith("http") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return (
      <img
        src={trimmed}
        width={16}
        height={16}
        style={{ objectFit: "contain", display: "block" }}
        alt=""
        onError={(e) => {
          // Fallback: replace with the default info icon if the image fails to load
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
        }}
      />
    );
  }
  return BUILTIN["info"];
}

// Shared dimensions — keep icon rows and slide rows identical so they align
const RAIL_W       = 48;
const SLIDE_W      = 160;
const PANEL_W      = 172;
const TOTAL_W      = RAIL_W + PANEL_W;
const ROW_HEIGHT   = 36;     // consistent vertical spacing for icons and labels
const ROW_MARGIN_Y = 1;      // matches between rail and slide rows

export const IconRailNav: React.FC = () => {
  const [projectName]      = Retool.useStateString({ name: "projectName",      initialValue: "production-db" });
  const [projectStatus]    = Retool.useStateString({ name: "projectStatus",    initialValue: "online" });
  const [activeItem, setActiveItem]       = Retool.useStateString({ name: "activeItem",    initialValue: "item-1" });
  const [activeSubItem, setActiveSubItem] = Retool.useStateString({ name: "activeSubItem", initialValue: "" });
  const [activePage, setActivePage]       = Retool.useStateString({ name: "activePage",    initialValue: "" });
  const [activeApp, setActiveApp]         = Retool.useStateString({ name: "activeApp",     initialValue: "" });

  const [itemsJson]       = Retool.useStateString({ name: "ItemsJSON",       initialValue: "" });
  const [bottomItemsJson] = Retool.useStateString({ name: "BottomItemsJSON", initialValue: "" });

  const [theme]       = Retool.useStateString({ name: "theme",       initialValue: "dark" });
  const [railBg]      = Retool.useStateString({ name: "railBg",      initialValue: "" });
  const [panelBg]     = Retool.useStateString({ name: "panelBg",     initialValue: "" });
  const [accentColor] = Retool.useStateString({ name: "accentColor", initialValue: "#3ecf8e" });

  // ShowHelp: developer-only toggle. Turn ON during setup, OFF before shipping.
  const [showHelp] = Retool.useStateBoolean({
    name: "ShowHelp",
    initialValue: true,
    inspector: "checkbox",
    label: "Show help panel (hide before shipping)",
  });

  const onItemClick    = Retool.useEventCallback({ name: "itemClick" });
  const onSubItemClick = Retool.useEventCallback({ name: "subItemClick" });
  const onNavigate     = Retool.useEventCallback({ name: "navigate" });

  const [hovered, setHovered] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDark      = theme !== "light";
  const accent      = accentColor || "#3ecf8e";

  // Rail (top layer) — always dark
  const railBgColor = railBg || (isDark ? "#1c1c1c" : "#18181b");
  const railDivider = "rgba(255,255,255,0.08)";

  // Slide panel (bottom layer)
  const slideBg     = isDark ? "#252525" : "#222222";
  const slideText   = "rgba(255,255,255,0.65)";
  const slideActive = "#ffffff";
  const slideHoverBg= "rgba(255,255,255,0.07)";
  const slideActiveBg="rgba(255,255,255,0.12)";
  const slideDivider= "rgba(255,255,255,0.08)";
  const slideMuted  = "rgba(255,255,255,0.28)";

  // Contextual right panel
  const panelColor  = panelBg || (isDark ? "#262626" : "#f8f8f7");
  const panelText   = isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)";
  const panelActive = isDark ? "#ffffff" : "#000000";
  const panelHoverBg= isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const panelActiveBg=isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const panelDivider= isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const mutedText   = isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)";

  let navItems    = DEFAULT_ITEMS;
  let bottomItems = DEFAULT_BOTTOM;
  let itemsParseError:  string | null = null;
  let bottomParseError: string | null = null;

  const validateItems = (arr: any[]): string | null => {
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      if (!it || typeof it !== "object") return `Item ${i} is not an object`;
      if (!it.id || typeof it.id !== "string") return `Item ${i} is missing a string "id"`;
      if (!it.label || typeof it.label !== "string") return `Item ${i} is missing a string "label"`;
    }
    return null;
  };

  // Coerce to a usable value: accept string, array, or nullish
  const resolveJsonInput = (raw: any): any => {
    if (raw == null) return null;
    if (Array.isArray(raw)) return raw;       // already an array, use directly
    if (typeof raw === "object") return raw;  // some object, let parser decide
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try { return JSON.parse(trimmed); } catch (_) { throw _; }
  };

  try {
    const parsed = resolveJsonInput(itemsJson);
    if (parsed !== null) {
      if (!Array.isArray(parsed)) throw new Error("Expected an array of items");
      const validationError = validateItems(parsed);
      if (validationError) throw new Error(validationError);
      navItems = parsed;
    }
  } catch (e: any) {
    itemsParseError = e?.message || "Invalid JSON";
  }

  try {
    const parsed = resolveJsonInput(bottomItemsJson);
    if (parsed !== null) {
      if (!Array.isArray(parsed)) throw new Error("Expected an array of items");
      const validationError = validateItems(parsed);
      if (validationError) throw new Error(validationError);
      bottomItems = parsed;
    }
  } catch (e: any) {
    bottomParseError = e?.message || "Invalid JSON";
  }

  const usingDefaults = !itemsJson || typeof itemsJson !== "string" || !itemsJson.trim();

  const allItems     = [...navItems, ...bottomItems];
  const selectedItem = allItems.find(i => i.id === activeItem) ?? navItems[0];
  const dotColor     = projectStatus === "offline" ? "#555" : projectStatus === "paused" ? "#f59e0b" : accent;

  const handleItemClick = (item: NavItem) => {
    setActiveItem(item.id);
    setActiveSubItem("");
    setActivePage(item.page || "");
    setActiveApp(item.app || "");
    // Defer event firing so model state updates flush first
    requestAnimationFrame(() => {
      onItemClick();
      if (item.page || item.app) onNavigate();
    });
  };

  const handleSubItemClick = (sub: SubItem) => {
    setActiveSubItem(sub.id);
    setActivePage(sub.page || "");
    setActiveApp(sub.app || "");
    requestAnimationFrame(() => {
      onSubItemClick();
      if (sub.page || sub.app) onNavigate();
    });
  };

  const css = `
    * { box-sizing: border-box; }
    .rail-icon { color: rgba(255,255,255,0.55); transition: color 0.12s, filter 0.12s; }
    .rail-icon img {
      /* Desaturate + dim image icons to match built-in SVG appearance */
      filter: grayscale(1) brightness(1.5) opacity(0.7);
      transition: filter 0.12s;
    }
    .rail-item:hover .rail-icon { color: #ffffff; }
    .rail-item:hover .rail-icon img {
      /* Make image icons fully white-ish on hover */
      filter: grayscale(1) brightness(3) opacity(1);
    }
    .rail-item.active .rail-icon { color: ${accent}; }
    .rail-item.active .rail-icon img {
      /* Don't tint active icons — show them full color */
      filter: none;
    }
    .slide-item:hover { background: ${slideHoverBg} !important; color: ${slideActive} !important; }
    .sub-item:hover { background: ${panelHoverBg} !important; color: ${panelActive} !important; }
  `;

  // Slide-panel row — matches rail-row height and margin exactly
  const renderSlideItem = (item: NavItem, pinned = false) => {
    const isActive = activeItem === item.id;
    return (
      <div
        key={item.id}
        className="slide-item"
        style={{
          display:       "flex",
          alignItems:    "center",
          height:        `${ROW_HEIGHT}px`,
          margin:        `${ROW_MARGIN_Y}px 6px ${ROW_MARGIN_Y}px 0`,
          // Reserve exactly RAIL_W of blank space, so label aligns just after the icon column
          paddingLeft:   `${RAIL_W + 4}px`,
          paddingRight:  "12px",
          borderRadius:  "0 6px 6px 0",
          cursor:        "pointer",
          color:         isActive ? slideActive : slideText,
          background:    isActive ? slideActiveBg : "transparent",
          fontWeight:    isActive ? 500 : 400,
          fontSize:      "13px",
          whiteSpace:    "nowrap",
          position:      "relative",
        }}
        onClick={() => handleItemClick(item)}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
        {item.badge && (
          <span style={{ background: `${accent}22`, color: accent, fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "10px", flexShrink: 0, marginLeft: "8px" }}>
            {item.badge}
          </span>
        )}
      </div>
    );
  };

  // Rail row (icon only) — top layer
  const renderRailItem = (item: NavItem) => {
    const isActive = activeItem === item.id;
    return (
      <div
        key={item.id}
        className={`rail-item${isActive ? " active" : ""}`}
        style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          height: `${ROW_HEIGHT}px`,
          margin: `${ROW_MARGIN_Y}px 4px`,
          borderRadius: "6px",
          cursor: "pointer",
          background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
          transition: "background 0.12s",
        }}
        onClick={() => handleItemClick(item)}
      >
        {isActive && (
          <div style={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            width: "3px", height: "18px", background: accent, borderRadius: "0 2px 2px 0",
          }} />
        )}
        <div className="rail-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {resolveIcon(item.icon)}
        </div>
      </div>
    );
  };

  const renderPanel = () => {
    if (!selectedItem) return null;
    const hasSubItems = selectedItem.subItems && selectedItem.subItems.length > 0;
    return (
      <div style={{ width: "100%", height: "100%", backgroundColor: panelColor, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${panelDivider}`, flexShrink: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: panelActive }}>{selectedItem.label}</div>
          {!hasSubItems && selectedItem.description && (
            <div style={{ fontSize: "11px", color: mutedText, lineHeight: 1.5, marginTop: "3px" }}>{selectedItem.description}</div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {hasSubItems ? selectedItem.subItems!.map(sub => {
            const isActiveSub = activeSubItem === sub.id;
            return (
              <div key={sub.id}
                className={`sub-item${isActiveSub ? " active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 14px", margin: "1px 6px", borderRadius: "5px",
                  cursor: "pointer", fontSize: "13px",
                  color: isActiveSub ? panelActive : panelText,
                  background: isActiveSub ? panelActiveBg : "transparent",
                  fontWeight: isActiveSub ? 500 : 400,
                }}
                onClick={() => handleSubItemClick(sub)}
              >
                {isActiveSub && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: accent, flexShrink: 0 }} />}
                <span>{sub.label}</span>
              </div>
            );
          }) : (
            <div style={{ padding: "12px 14px" }}>
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "6px", background: `${accent}18`, color: accent, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                onClick={() => handleItemClick(selectedItem)}
              >
                {BUILTIN.arrow} Open {selectedItem.label}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Starter JSON template ──────────────────────────────────────────────
  const STARTER_JSON = JSON.stringify([
    {
      id: "home",
      label: "Home",
      icon: "table",
      page: "Dashboard"
    },
    {
      id: "users",
      label: "Users",
      icon: "lock",
      subItems: [
        { id: "users-active",  label: "Active",  page: "ActiveUsers" },
        { id: "users-pending", label: "Pending", page: "PendingUsers" }
      ]
    },
    {
      id: "reports",
      label: "Reports",
      icon: "chart",
      badge: "New",
      description: "View analytics and reports"
    }
  ], null, 2);

  const copyStarter = () => {
    // navigator.clipboard often blocked in iframes — use a fallback textarea
    try {
      const ta = document.createElement("textarea");
      ta.value = STARTER_JSON;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.left = "-1000px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
      // Also try modern API as a bonus
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(STARTER_JSON).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ width: `${TOTAL_W}px`, height: "100%", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", userSelect: "none", overflow: "hidden" }}>

        {/* Parse error banner */}
        {(itemsParseError || bottomParseError) && (
          <div style={{
            background:   "#b91c1c",
            color:        "#ffffff",
            padding:      "6px 10px",
            fontSize:     "11px",
            lineHeight:   1.4,
            borderBottom: "1px solid #7f1d1d",
            flexShrink:   0,
          }}>
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>
              {itemsParseError ? "Items JSON error:" : "Bottom Items JSON error:"}
            </div>
            <div style={{ opacity: 0.95, wordBreak: "break-word" }}>
              {itemsParseError || bottomParseError}
            </div>
            {showHelp && (
              <button
                onClick={() => setHelpOpen(true)}
                style={{
                  marginTop:   "4px",
                  background:  "rgba(255,255,255,0.18)",
                  color:       "#fff",
                  border:      "none",
                  borderRadius:"4px",
                  padding:     "2px 8px",
                  fontSize:    "10px",
                  fontWeight:  600,
                  cursor:      "pointer",
                }}
              >
                Show starter template
              </button>
            )}
          </div>
        )}

        {/* Main nav row */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div
          style={{ width: `${RAIL_W}px`, flexShrink: 0, height: "100%", position: "relative" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* BOTTOM LAYER — label slide panel, sits behind rail */}
          <div style={{
            position:        "absolute",
            top:             0,
            left:            0,
            width:           `${RAIL_W + SLIDE_W}px`,
            height:          "100%",
            backgroundColor: slideBg,
            display:         "flex",
            flexDirection:   "column",
            zIndex:          1,
            transform:       hovered ? "translateX(0)" : `translateX(-${SLIDE_W}px)`,
            transition:      "transform 0.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow:       hovered ? "4px 0 16px rgba(0,0,0,0.25)" : "none",
            overflow:        "hidden",
          }}>
            {/* Main labels — identical height/margin to rail items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {navItems.map(i => renderSlideItem(i))}
            </div>
            <div style={{ borderTop: `1px solid ${slideDivider}`, padding: "6px 0" }}>
              {bottomItems.map(i => renderSlideItem(i, true))}
            </div>
          </div>

          {/* TOP LAYER — icon rail, always on top */}
          <div style={{
            position:        "absolute",
            top:             0,
            left:            0,
            width:           `${RAIL_W}px`,
            height:          "100%",
            backgroundColor: railBgColor,
            display:         "flex",
            flexDirection:   "column",
            zIndex:          2,
          }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {navItems.map(i => renderRailItem(i))}
            </div>
            <div style={{ borderTop: `1px solid ${railDivider}`, padding: "6px 0" }}>
              {bottomItems.map(i => renderRailItem(i))}
            </div>
          </div>
        </div>

        {/* ── Contextual Panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 14px", backgroundColor: panelColor, borderBottom: `1px solid ${panelDivider}`, flexShrink: 0 }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: dotColor === accent ? `0 0 5px ${dotColor}80` : "none" }} />
            <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: panelActive, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName}</span>
            {showHelp && (
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                title="Show JSON help (hide with ShowHelp=false)"
                style={{
                  width: "20px", height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  background: helpOpen ? accent : "transparent",
                  color: helpOpen ? "#fff" : mutedText,
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                ?
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>{renderPanel()}</div>

          {/* Help drawer — slides over the panel when ? is clicked. Visible only when ShowHelp is true. */}
          {showHelp && helpOpen && (
            <div style={{
              position:        "absolute",
              top:             "48px",
              left:            0,
              right:           0,
              bottom:          0,
              backgroundColor: panelColor,
              borderTop:       `1px solid ${panelDivider}`,
              display:         "flex",
              flexDirection:   "column",
              zIndex:          50,
              overflow:        "hidden",
            }}>
              <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${panelDivider}` }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: panelActive, marginBottom: "2px" }}>
                  Items JSON Help
                </div>
                <div style={{ fontSize: "10px", color: mutedText, lineHeight: 1.5 }}>
                  Paste JSON into the <b>ItemsJSON</b> field in the model panel.
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", fontSize: "11px", color: panelText }}>
                {/* Schema */}
                <div style={{ fontWeight: 600, color: panelActive, marginBottom: "4px" }}>Item fields</div>
                <div style={{ fontFamily: "monospace", fontSize: "10px", lineHeight: 1.7, marginBottom: "10px" }}>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>id</span>         <span style={{ color: mutedText }}>required, unique</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>label</span>      <span style={{ color: mutedText }}>required, display text</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>icon</span>       <span style={{ color: mutedText }}>built-in key, SVG, or URL</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>page</span>       <span style={{ color: mutedText }}>Retool page name</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>app</span>        <span style={{ color: mutedText }}>Retool app name</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>badge</span>      <span style={{ color: mutedText }}>pill text, e.g. "New"</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>color</span>      <span style={{ color: mutedText }}>hex color override</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>description</span> <span style={{ color: mutedText }}>shown in panel</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>subItems</span>   <span style={{ color: mutedText }}>nested array</span></div>
                </div>

                {/* Icons */}
                <div style={{ fontWeight: 600, color: panelActive, marginBottom: "4px" }}>Built-in icons</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                  {Object.keys(BUILTIN).filter(k => k !== "arrow").map(key => (
                    <div key={key} style={{
                      display:      "flex",
                      alignItems:   "center",
                      gap:          "4px",
                      padding:      "3px 6px",
                      background:   isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      borderRadius: "4px",
                      fontSize:     "10px",
                      fontFamily:   "monospace",
                      color:        panelActive,
                    }}>
                      <span style={{ color: panelText }}>{BUILTIN[key]}</span>
                      <span>{key}</span>
                    </div>
                  ))}
                </div>

                {/* Starter template */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: panelActive }}>Starter template</span>
                  <button
                    onClick={copyStarter}
                    style={{
                      background:  copied ? "#10b981" : accent,
                      color:       "#fff",
                      border:      "none",
                      borderRadius:"4px",
                      padding:     "3px 8px",
                      fontSize:    "10px",
                      fontWeight:  600,
                      cursor:      "pointer",
                      minWidth:    "52px",
                      transition:  "background 0.15s",
                    }}
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <pre style={{
                  background:   isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
                  color:        panelText,
                  padding:      "8px 10px",
                  borderRadius: "4px",
                  fontSize:     "10px",
                  lineHeight:   1.5,
                  overflow:     "auto",
                  margin:       0,
                  whiteSpace:   "pre",
                }}>
                  {STARTER_JSON}
                </pre>
              </div>

              {/* Close button */}
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${panelDivider}` }}>
                <button
                  onClick={() => setHelpOpen(false)}
                  style={{
                    width:       "100%",
                    background:  isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    color:       panelActive,
                    border:      "none",
                    borderRadius:"4px",
                    padding:     "6px",
                    fontSize:    "11px",
                    fontWeight:  500,
                    cursor:      "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>
    </>
  );
};
