export type SubItem = {
  id: string;
  label: string;
  page?: string;
  app?: string;
};

export type NavItem = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  color?: string;
  badge?: string;
  page?: string;
  app?: string;
  section?: string;
  subItems?: SubItem[];
};

type ParseResult = {
  items: NavItem[];
  error: string | null;
  usingDefaults: boolean;
};

function isBlankInput(raw: unknown): boolean {
  return raw == null || (typeof raw === "string" && raw.trim() === "");
}

function resolveJsonInput(raw: unknown): unknown {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  return JSON.parse(trimmed);
}

function validateSubItems(subItems: unknown, itemIndex: number): string | null {
  if (subItems == null) return null;
  if (!Array.isArray(subItems)) return `Item ${itemIndex} has non-array "subItems"`;

  for (let i = 0; i < subItems.length; i++) {
    const sub = subItems[i];
    if (!sub || typeof sub !== "object") return `Item ${itemIndex} subItem ${i} is not an object`;
    if (!("id" in sub) || typeof sub.id !== "string") return `Item ${itemIndex} subItem ${i} is missing a string "id"`;
    if (!("label" in sub) || typeof sub.label !== "string") return `Item ${itemIndex} subItem ${i} is missing a string "label"`;
  }

  return null;
}

export function validateNavItems(items: unknown): string | null {
  if (!Array.isArray(items)) return "Expected an array of items";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") return `Item ${i} is not an object`;
    if (!("id" in item) || typeof item.id !== "string") return `Item ${i} is missing a string "id"`;
    if (!("label" in item) || typeof item.label !== "string") return `Item ${i} is missing a string "label"`;
    if ("icon" in item && item.icon != null && typeof item.icon !== "string") return `Item ${i} has non-string "icon"`;

    const subItemError = validateSubItems("subItems" in item ? item.subItems : undefined, i);
    if (subItemError) return subItemError;
  }

  return null;
}

export function parseNavItems(raw: unknown, defaults: NavItem[]): ParseResult {
  const usingDefaults = isBlankInput(raw);

  try {
    const parsed = resolveJsonInput(raw);
    if (parsed === null) return { items: defaults, error: null, usingDefaults: true };

    const validationError = validateNavItems(parsed);
    if (validationError) throw new Error(validationError);

    return { items: parsed as NavItem[], error: null, usingDefaults };
  } catch (error) {
    return {
      items: defaults,
      error: error instanceof Error ? error.message : "Invalid JSON",
      usingDefaults: true,
    };
  }
}

export function toSerializableNavItems(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    const next: NavItem = {
      id: item.id,
      label: item.label,
      icon: item.icon || "info",
    };

    if (item.description) next.description = item.description;
    if (item.color) next.color = item.color;
    if (item.badge) next.badge = item.badge;
    if (item.page) next.page = item.page;
    if (item.app) next.app = item.app;
    if (item.section) next.section = item.section;
    if (item.subItems && item.subItems.length > 0) {
      next.subItems = item.subItems.map((sub) => {
        const nextSub: SubItem = {
          id: sub.id,
          label: sub.label,
        };
        if (sub.page) nextSub.page = sub.page;
        if (sub.app) nextSub.app = sub.app;
        return nextSub;
      });
    }

    return next;
  });
}
