import { useState, useMemo, useEffect } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  key: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCrumbs(data: unknown): BreadcrumbItem[] {
  if (!data || !Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, i) => ({
      label: String(item.label || item.name || item.title || item.text || `Item ${i + 1}`),
      key: String(item.key || item.id || item.value || i),
    }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BreadcrumbNavigator() {
  Retool.useComponentSettings({ defaultWidth: 16, defaultHeight: 4 });

  // ── Inputs
  const [crumbsData] = Retool.useStateArray({
    name: "crumbs",
    initialValue: [
      { label: "Home", key: "home" },
      { label: "Customers", key: "customers" },
      { label: "Ahmed", key: "ahmed" },
      { label: "Orders", key: "orders" },
    ],
    label: "Breadcrumbs",
    description: "Array of breadcrumb items: [{ label, key }]. Pass from Retool state or query.",
    inspector: "text",
  });

  const [separator] = Retool.useStateEnumeration({
    name: "separator",
    initialValue: "chevron",
    enumDefinition: ["chevron", "slash", "arrow", "dot"],
    label: "Separator",
    description: "Separator style between breadcrumb items",
    inspector: "select",
  });

  const [homeIcon] = Retool.useStateBoolean({
    name: "homeIcon",
    initialValue: true,
    label: "Home Icon",
    description: "Show a home icon on the first breadcrumb",
    inspector: "checkbox",
  });

  const [maxItems] = Retool.useStateNumber({
    name: "maxItems",
    initialValue: 0,
    label: "Max Visible Items",
    description: "Max items to show (0 = show all). Middle items collapse into '...'",
    inspector: "text",
  });

  // ── Outputs
  const [, setClickedKey] = Retool.useStateString({
    name: "clickedKey",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setClickedLabel] = Retool.useStateString({
    name: "clickedLabel",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setClickedIndex] = Retool.useStateNumber({
    name: "clickedIndex",
    initialValue: -1,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  const onCrumbClick = Retool.useEventCallback({ name: "crumbClick" });

  // ── Parse
  const crumbs = useMemo(() => parseCrumbs(crumbsData), [crumbsData]);

  // ── Collapse logic
  const visibleCrumbs = useMemo(() => {
    if (maxItems <= 0 || crumbs.length <= maxItems) return crumbs.map((c, i) => ({ ...c, collapsed: false, originalIndex: i }));

    // Show first, last (maxItems - 2) items, and collapse the middle
    const first = [{ ...crumbs[0], collapsed: false, originalIndex: 0 }];
    const ellipsis = { label: "…", key: "__ellipsis__", collapsed: true, originalIndex: -1 };
    const tailCount = maxItems - 2;
    const tail = crumbs.slice(-tailCount).map((c, i) => ({
      ...c,
      collapsed: false,
      originalIndex: crumbs.length - tailCount + i,
    }));

    return [first[0], ellipsis, ...tail];
  }, [crumbs, maxItems]);

  // ── Click handler
  const handleClick = (item: typeof visibleCrumbs[0], isLast: boolean) => {
    if (isLast || item.collapsed) return; // Don't fire on current page or ellipsis
    setClickedKey(item.key);
    setClickedLabel(item.label);
    setClickedIndex(item.originalIndex);
    setModelUpdate({
      clickedKey: item.key,
      clickedLabel: item.label,
      clickedIndex: item.originalIndex,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    onCrumbClick();
  };

  // ── Separator renderer
  const renderSeparator = () => {
    switch (separator) {
      case "slash":
        return <span className="bc-sep">/</span>;
      case "arrow":
        return <span className="bc-sep">→</span>;
      case "dot":
        return <span className="bc-sep">·</span>;
      default: // chevron
        return (
          <span className="bc-sep">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        );
    }
  };

  if (crumbs.length === 0) {
    return <div className="bc-root bc-empty">No breadcrumbs configured</div>;
  }

  return (
    <nav className="bc-root" aria-label="Breadcrumb">
      <ol className="bc-list">
        {visibleCrumbs.map((item, i) => {
          const isLast = i === visibleCrumbs.length - 1;
          const isFirst = i === 0;

          return (
            <li key={item.key + i} className="bc-item">
              {i > 0 && renderSeparator()}
              {item.collapsed ? (
                <span className="bc-ellipsis" title="More items">…</span>
              ) : (
                <button
                  className={["bc-crumb", isLast ? "current" : "clickable"].filter(Boolean).join(" ")}
                  onClick={() => handleClick(item, isLast)}
                  aria-current={isLast ? "page" : undefined}
                  disabled={isLast}
                >
                  {isFirst && homeIcon && (
                    <svg className="bc-home-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
