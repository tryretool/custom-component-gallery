import React, { useEffect, useRef, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";
import { parseNavItems, toSerializableNavItems, type NavItem, type SubItem } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────
// Each item accepts:
//   id        — unique identifier (required)
//   label     — title shown next to the icon when expanded
//   icon      — built-in key ("table","code","database",...) | image URL | data URL
//   page      — Retool page name to navigate to on click (optional)
//   app       — Retool app name to open on click (optional)
//   color     — override icon/text color (optional)
//   badge     — small pill shown after the label (optional)
//   section   — divider label shown above the item (optional)
//   subItems  — array of child items shown in the right contextual panel

const DEFAULT_ITEMS: NavItem[] = [
  { id: "item-1", label: "Item 1", icon: "table", description: "Description for Item 1." },
  { id: "item-2", label: "Item 2", icon: "code",  description: "Description for Item 2." },
  { id: "item-3", label: "Item 3", icon: "database", subItems: [
    { id: "item-3-a", label: "Sub Item A" },
    { id: "item-3-b", label: "Sub Item B" },
    { id: "item-3-c", label: "Sub Item C" },
  ]},
  { id: "item-4", label: "Item 4", icon: "chart", badge: "New", description: "Description for Item 4." },
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
const ROW_HEIGHT   = 36;     // consistent vertical spacing for icons and labels
const ROW_MARGIN_Y = 1;      // matches between rail and slide rows
const VISIBILITY_MEMORY_KEY = "IconRailNav.visibility";

export const IconRailNav: React.FC = () => {
  Retool.useComponentSettings({ defaultWidth: 220, defaultHeight: 420 });

  const [menuEditorVisibility, setMenuEditorVisibility] = Retool.useStateEnumeration({
    name: "menuEditorVisibility",
    label: "Edit menu items",
    description: "Show or hide the visual editor for top-level menu items and sub-items.",
    enumDefinition: ["show", "hide"],
    enumLabels: { show: "Show", hide: "Hide" },
    initialValue: "hide",
    inspector: "segmented",
  });
  const [helpVisibility, setHelpVisibility] = Retool.useStateEnumeration({
    name: "helpVisibility",
    label: "Show help",
    description: "Show or hide the setup help drawer.",
    enumDefinition: ["show", "hide"],
    enumLabels: { show: "Show", hide: "Hide" },
    initialValue: "show",
    inspector: "segmented",
  });
  const [itemsJson, setItemsJson] = Retool.useStateString({
    name: "itemsJson",
    label: "Menu Items JSON",
    description: "JSON array of menu item objects. The visual editor updates this for copy/paste and advanced bindings.",
    initialValue: "",
  });
  const [menuItems, setMenuItems] = Retool.useStateArray({
    name: "menuItems",
    label: "Menu items",
    description: "Visual menu item data. Use the editor to update this, or bind an array of nav item objects.",
    initialValue: [],
    inspector: "hidden",
  });
  const [pageOptions] = Retool.useStateArray({
    name: "pageOptions",
    label: "Page options",
    description: "Optional dropdown options for page fields. Use strings or { label, value } objects.",
    initialValue: [],
  });
  const [appOptions] = Retool.useStateArray({
    name: "appOptions",
    label: "App options",
    description: "Optional dropdown options for app fields. Use strings or { label, value } objects.",
    initialValue: [],
  });

  const [projectName] = Retool.useStateString({
    name: "projectName",
    label: "Project name",
    description: "Header text shown at the top of the contextual panel. Bind this to dynamic Retool data if needed.",
    initialValue: "Main Menu",
  });
  const [projectStatus]    = Retool.useStateString({ name: "projectStatus",    initialValue: "online" });
  const [activeItem, setActiveItem]       = Retool.useStateString({ name: "activeItem",    initialValue: "item-1" });
  const [activeSubItem, setActiveSubItem] = Retool.useStateString({ name: "activeSubItem", initialValue: "" });
  const [activePage, setActivePage]       = Retool.useStateString({ name: "activePage",    initialValue: "" });
  const [activeApp, setActiveApp]         = Retool.useStateString({ name: "activeApp",     initialValue: "" });

  const [, setMenuJsonDraft] = Retool.useStateString({
    name: "menuJsonDraft",
    label: "Menu JSON draft",
    description: "Latest menu editor output as JSON for optional save handlers.",
    initialValue: "",
    inspector: "hidden",
  });
  const [bottomItemsJson] = Retool.useStateString({ name: "bottomItemsJson", initialValue: "" });

  const [theme]       = Retool.useStateString({ name: "theme",       initialValue: "dark" });
  const [railBg]      = Retool.useStateString({ name: "railBg",      initialValue: "" });
  const [panelBg]     = Retool.useStateString({ name: "panelBg",     initialValue: "" });
  const [accentColor] = Retool.useStateString({ name: "accentColor", initialValue: "#3ecf8e" });
  const [padding]     = Retool.useStateNumber({
    name: "padding",
    label: "Padding",
    description: "Outer padding in pixels. Use a negative value to compensate for Retool wrapper inset.",
    initialValue: 0,
  });

  const onItemClick    = Retool.useEventCallback({ name: "itemClick" });
  const onSubItemClick = Retool.useEventCallback({ name: "subItemClick" });
  const onNavigate     = Retool.useEventCallback({ name: "navigate" });
  const onSaveMenu     = Retool.useEventCallback({ name: "saveMenu" });

  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedMenuItemKeys, setExpandedMenuItemKeys] = useState<string[]>(["menu-item-0"]);
  const previousVisibilityRef = useRef<{ menuEditorVisibility: string; helpVisibility: string } | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);

  const isDark      = theme !== "light";
  const accent      = accentColor || "#3ecf8e";
  const showMenuEditor = menuEditorVisibility === "show";
  const showHelp = helpVisibility === "show";
  const displayProjectName = projectName?.trim() || "Main Menu";
  const outerPadding = Number.isFinite(padding) ? padding : 0;

  useEffect(() => {
    let previous = previousVisibilityRef.current;
    if (!previous) {
      try {
        const stored = window.localStorage.getItem(VISIBILITY_MEMORY_KEY);
        previous = stored ? JSON.parse(stored) : null;
      } catch (_) {
        previous = null;
      }
    }

    if (menuEditorVisibility === "show" && previous?.menuEditorVisibility !== "show" && helpVisibility === "show") {
      setHelpVisibility("hide");
    } else if (helpVisibility === "show" && previous?.helpVisibility !== "show" && menuEditorVisibility === "show") {
      setMenuEditorVisibility("hide");
    } else if (menuEditorVisibility === "show" && helpVisibility === "show") {
      setHelpVisibility("hide");
    }

    const current = { menuEditorVisibility, helpVisibility };
    previousVisibilityRef.current = current;
    try {
      window.localStorage.setItem(VISIBILITY_MEMORY_KEY, JSON.stringify(current));
    } catch (_) {}
  }, [helpVisibility, menuEditorVisibility, setHelpVisibility, setMenuEditorVisibility]);

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

  // Contextual right panel
  const panelColor  = panelBg || (isDark ? "#262626" : "#f8f8f7");
  const panelText   = isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)";
  const panelActive = isDark ? "#ffffff" : "#000000";
  const panelHoverBg= isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const panelActiveBg=isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const panelDivider= isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const mutedText   = isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)";

  const hasMenuItems = Array.isArray(menuItems) && menuItems.length > 0;
  const {
    items: navItems,
    error: itemsParseError,
  } = parseNavItems(hasMenuItems ? menuItems : itemsJson, DEFAULT_ITEMS);

  const {
    items: bottomItems,
    error: bottomParseError,
  } = parseNavItems(bottomItemsJson, DEFAULT_BOTTOM);

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

  const activateOnKeyboard = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action();
  };

  const commitNavItems = (items: NavItem[]) => {
    const serializableItems = toSerializableNavItems(items);
    const menuJson = JSON.stringify(serializableItems, null, 2);
    setMenuItems(serializableItems as any);
    setItemsJson(menuJson);
    setMenuJsonDraft(menuJson);
  };

  const handleSaveMenu = () => {
    const menuJson = JSON.stringify(toSerializableNavItems(navItems), null, 2);
    setMenuJsonDraft(menuJson);
    onSaveMenu();
  };

  const updateItem = (index: number, updates: Partial<NavItem>) => {
    commitNavItems(navItems.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const addItem = () => {
    const nextNumber = navItems.length + 1;
    const nextId = `item-${nextNumber}`;
    commitNavItems([
      ...navItems,
      {
        id: nextId,
        label: `Item ${nextNumber}`,
        icon: "info",
        description: `Description for Item ${nextNumber}.`,
      },
    ]);
    setExpandedMenuItemKeys([`menu-item-${navItems.length}`]);
  };

  const deleteItem = (index: number) => {
    setExpandedMenuItemKeys((keys) => keys.filter((key) => key !== `menu-item-${index}`));
    commitNavItems(navItems.filter((_, i) => i !== index));
  };

  const toggleMenuItemExpanded = (key: string) => {
    setExpandedMenuItemKeys((keys) =>
      keys.includes(key) ? keys.filter((itemKey) => itemKey !== key) : [...keys, key],
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= navItems.length) return;
    const next = [...navItems];
    [next[index], next[target]] = [next[target], next[index]];
    commitNavItems(next);
  };

  const updateSubItem = (itemIndex: number, subIndex: number, updates: Partial<SubItem>) => {
    const item = navItems[itemIndex];
    const subItems = [...(item.subItems ?? [])];
    subItems[subIndex] = { ...subItems[subIndex], ...updates };
    updateItem(itemIndex, { subItems });
  };

  const addSubItem = (itemIndex: number) => {
    const item = navItems[itemIndex];
    const subItems = item.subItems ?? [];
    const nextNumber = subItems.length + 1;
    updateItem(itemIndex, {
      subItems: [
        ...subItems,
        { id: `${item.id}-sub-${nextNumber}`, label: `Sub Item ${nextNumber}` },
      ],
    });
  };

  const deleteSubItem = (itemIndex: number, subIndex: number) => {
    const item = navItems[itemIndex];
    updateItem(itemIndex, { subItems: (item.subItems ?? []).filter((_, i) => i !== subIndex) });
  };

  const textInput = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    placeholder = "",
  ) => (
    <label className="menu-editor-field">
      <span>{label}</span>
      <input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );

  const normalizeOptions = (options: unknown[]) => options
    .map((option) => {
      if (typeof option === "string") return { label: option, value: option };
      if (option && typeof option === "object" && "value" in option) {
        const value = String(option.value ?? "");
        const label = "label" in option && option.label != null ? String(option.label) : value;
        return value ? { label, value } : null;
      }
      return null;
    })
    .filter((option): option is { label: string; value: string } => option != null);

  const pageSelectOptions = normalizeOptions(pageOptions);
  const appSelectOptions = normalizeOptions(appOptions);

  const routeInput = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    options: Array<{ label: string; value: string }>,
    placeholder: string,
  ) => {
    if (options.length === 0) return textInput(label, value, onChange, placeholder);

    return (
      <label className="menu-editor-field">
        <span>{label}</span>
        <select value={value ?? ""} onChange={(event) => onChange(event.currentTarget.value)}>
          <option value="">None</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  };

  const css = `
    html,
    body,
    #root,
    body > div {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
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
    .menu-editor-input,
    .menu-editor-field input,
    .menu-editor-field select {
      width: 100%;
      min-width: 0;
      height: 28px;
      border: 1px solid ${panelDivider};
      border-radius: 5px;
      background: ${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.8)"};
      color: ${panelActive};
      padding: 0 8px;
      font: inherit;
      outline: none;
    }
    .menu-editor-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      color: ${mutedText};
      font-size: 10px;
      font-weight: 600;
    }
    .menu-editor-field input:focus,
    .menu-editor-field select:focus {
      border-color: ${accent};
      box-shadow: 0 0 0 2px ${accent}22;
    }
    .menu-editor-btn {
      border: 1px solid ${panelDivider};
      border-radius: 5px;
      background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"};
      color: ${panelActive};
      min-height: 28px;
      padding: 0 8px;
      font: inherit;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .menu-editor-btn:hover {
      background: ${panelHoverBg};
    }
    .menu-editor-btn.primary {
      background: ${accent};
      border-color: ${accent};
      color: #0b1712;
    }
    .menu-editor-btn.danger {
      color: #f87171;
    }
    .menu-editor-btn:disabled {
      cursor: default;
      opacity: 0.35;
    }
    .menu-editor-toolbar {
      flex-shrink: 0;
      padding: 8px 10px;
      border-bottom: 1px solid ${panelDivider};
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .menu-editor-toolbar-copy {
      flex: 1 1 120px;
      min-width: 92px;
    }
    .menu-editor-toolbar .menu-editor-btn {
      flex: 1 1 78px;
      min-width: 72px;
    }
    .menu-editor-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid ${panelDivider};
      flex-wrap: wrap;
    }
    .menu-editor-card-title {
      flex: 1 1 96px;
      min-width: 0;
    }
    .menu-editor-card-header .menu-editor-btn {
      flex: 1 1 58px;
      min-width: 56px;
    }
    .menu-editor-card-toggle {
      flex: 1 1 70px !important;
      min-width: 68px !important;
    }
    .menu-editor-fields {
      padding: 8px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
      gap: 8px;
    }
    .menu-editor-sub-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
      gap: 6px;
      align-items: end;
    }
    .menu-editor-sub-row .menu-editor-btn {
      min-width: 72px;
    }
  `;

  // Slide-panel row — matches rail-row height and margin exactly
  const renderSlideItem = (item: NavItem) => {
    const isActive = activeItem === item.id;
    return (
      <React.Fragment key={item.id}>
        {item.section && (
          <div style={{ padding: `${ROW_MARGIN_Y + 7}px 12px 4px ${RAIL_W + 4}px`, color: "rgba(255,255,255,0.34)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0 }}>
            {item.section}
          </div>
        )}
        <div
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
          role="button"
          tabIndex={0}
          aria-current={isActive ? "page" : undefined}
          onClick={() => handleItemClick(item)}
          onKeyDown={(event) => activateOnKeyboard(event, () => handleItemClick(item))}
        >
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
          {item.badge && (
            <span style={{ background: `${accent}22`, color: accent, fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "10px", flexShrink: 0, marginLeft: "8px" }}>
              {item.badge}
            </span>
          )}
        </div>
      </React.Fragment>
    );
  };

  // Rail row (icon only) — top layer
  const renderRailItem = (item: NavItem) => {
    const isActive = activeItem === item.id;
    return (
      <React.Fragment key={item.id}>
        {item.section && (
          <div style={{ height: "1px", margin: "7px 12px 5px", background: railDivider }} />
        )}
        <div
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
          role="button"
          tabIndex={0}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          onClick={() => handleItemClick(item)}
          onKeyDown={(event) => activateOnKeyboard(event, () => handleItemClick(item))}
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
      </React.Fragment>
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
                onKeyDown={(event) => activateOnKeyboard(event, () => handleSubItemClick(sub))}
                role="button"
                tabIndex={0}
                aria-current={isActiveSub ? "page" : undefined}
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
                onKeyDown={(event) => activateOnKeyboard(event, () => handleItemClick(selectedItem))}
                role="button"
                tabIndex={0}
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

  const copyMenuJson = () => {
    const menuJson = JSON.stringify(toSerializableNavItems(navItems), null, 2);
    try {
      const ta = document.createElement("textarea");
      ta.value = menuJson;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.left = "-1000px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(menuJson).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const handleEditorWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const target = editorScrollRef.current;
    if (!target) return;

    target.scrollTop += event.deltaY;
    event.preventDefault();
    event.stopPropagation();
  };

  const renderMenuEditor = () => (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxHeight: "100%", minHeight: 0, backgroundColor: panelColor, color: panelText, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="menu-editor-toolbar">
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: accent, boxShadow: `0 0 5px ${accent}80`, flexShrink: 0 }} />
        <div className="menu-editor-toolbar-copy">
          <div style={{ color: panelActive, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Menu Items
          </div>
          <div style={{ color: mutedText, fontSize: "10px", lineHeight: 1.2, overflowWrap: "anywhere" }}>
            Visual editor writes to menuItems and itemsJson
          </div>
        </div>
        <button className="menu-editor-btn" onClick={handleSaveMenu}>Save event</button>
        <button className="menu-editor-btn" onClick={copyMenuJson}>{copied ? "Copied" : "Copy JSON"}</button>
        <button className="menu-editor-btn primary" onClick={addItem}>Add item</button>
      </div>

      <div
        ref={editorScrollRef}
        onWheel={handleEditorWheel}
        onWheelCapture={handleEditorWheel}
        style={{ flex: 1, minHeight: 0, overflowY: "scroll", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", touchAction: "pan-y", padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {navItems.map((item, index) => {
          const cardKey = `menu-item-${index}`;
          const isExpanded = expandedMenuItemKeys.includes(cardKey);

          return (
            <div
              key={cardKey}
              style={{
                border: `1px solid ${panelDivider}`,
                borderRadius: "7px",
                background: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.72)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div className="menu-editor-card-header">
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: `${accent}18`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {resolveIcon(item.icon)}
                </div>
                <button
                  className="menu-editor-card-title"
                  onClick={() => toggleMenuItemExpanded(cardKey)}
                  aria-expanded={isExpanded}
                  style={{ appearance: "none", border: 0, background: "transparent", padding: 0, color: "inherit", textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ color: panelActive, fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label || "Untitled item"}
                  </div>
                  <div style={{ color: mutedText, fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.page || item.app || item.description || item.id}
                  </div>
                </button>
                <button className="menu-editor-btn menu-editor-card-toggle" onClick={() => toggleMenuItemExpanded(cardKey)}>
                  {isExpanded ? "Collapse" : "Edit"}
                </button>
                <button className="menu-editor-btn" onClick={() => moveItem(index, -1)} disabled={index === 0} title="Move up">Up</button>
                <button className="menu-editor-btn" onClick={() => moveItem(index, 1)} disabled={index === navItems.length - 1} title="Move down">Down</button>
                <button className="menu-editor-btn danger" onClick={() => deleteItem(index)} title="Delete item">Delete</button>
              </div>

              {isExpanded && (
                <>
                  <div className="menu-editor-fields">
                    {textInput("Label", item.label, (value) => updateItem(index, { label: value }), "Home")}
                    {textInput("ID", item.id, (value) => updateItem(index, { id: value }), "home")}
                    <label className="menu-editor-field">
                      <span>Icon</span>
                      <select value={item.icon || "info"} onChange={(event) => updateItem(index, { icon: event.currentTarget.value })}>
                        {Object.keys(BUILTIN).filter(key => key !== "arrow").map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </label>
                    {routeInput("Page", item.page, (value) => updateItem(index, { page: value || undefined }), pageSelectOptions, "Dashboard")}
                    {routeInput("App", item.app, (value) => updateItem(index, { app: value || undefined }), appSelectOptions, "Admin")}
                    {textInput("Badge", item.badge, (value) => updateItem(index, { badge: value || undefined }), "New")}
                    {textInput("Section", item.section, (value) => updateItem(index, { section: value || undefined }), "Admin")}
                    {textInput("Description", item.description, (value) => updateItem(index, { description: value || undefined }), "Shown in panel")}
                  </div>

                  <div style={{ padding: "0 8px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <div style={{ color: panelActive, fontSize: "11px", fontWeight: 700 }}>Sub-items</div>
                      <button className="menu-editor-btn" onClick={() => addSubItem(index)}>Add sub-item</button>
                    </div>
                    {(item.subItems ?? []).length === 0 ? (
                      <div style={{ color: mutedText, fontSize: "11px", padding: "6px 0" }}>No sub-items</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {(item.subItems ?? []).map((sub, subIndex) => (
                          <div key={`${sub.id}-${subIndex}`} className="menu-editor-sub-row">
                            {textInput("Label", sub.label, (value) => updateSubItem(index, subIndex, { label: value }), "Active")}
                            {textInput("ID", sub.id, (value) => updateSubItem(index, subIndex, { id: value }), `${item.id}-active`)}
                            {routeInput("Page", sub.page, (value) => updateSubItem(index, subIndex, { page: value || undefined }), pageSelectOptions, "ActiveUsers")}
                            {routeInput("App", sub.app, (value) => updateSubItem(index, subIndex, { app: value || undefined }), appSelectOptions, "Admin")}
                            <button className="menu-editor-btn danger" onClick={() => deleteSubItem(index, subIndex)}>Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ position: "fixed", inset: `${outerPadding}px`, display: "flex", flexDirection: "column", minHeight: 0, maxHeight: `calc(100vh - ${outerPadding * 2}px)`, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", userSelect: "none", overflow: "hidden" }}>
        {showMenuEditor ? renderMenuEditor() : (
        <>

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
              {bottomItems.map(i => renderSlideItem(i))}
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
            <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: panelActive, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayProjectName}</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>{renderPanel()}</div>

          {/* Help drawer — controlled from the inspector. */}
          {showHelp && (
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
                  Paste JSON into the <b>Menu Items JSON</b> field in the model panel.
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", fontSize: "11px", color: panelText }}>
                {/* Schema */}
                <div style={{ fontWeight: 600, color: panelActive, marginBottom: "4px" }}>Item fields</div>
                <div style={{ fontFamily: "monospace", fontSize: "10px", lineHeight: 1.7, marginBottom: "10px" }}>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>id</span>         <span style={{ color: mutedText }}>required, unique</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>label</span>      <span style={{ color: mutedText }}>required, display text</span></div>
                  <div><span style={{ color: panelActive, fontWeight: 700 }}>icon</span>       <span style={{ color: mutedText }}>built-in key or image URL</span></div>
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
                  onClick={() => setHelpVisibility("hide")}
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
        </>
        )}
      </div>
    </>
  );
};
