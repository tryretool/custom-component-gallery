import { describe, expect, it } from "vitest";
import { parseNavItems, validateNavItems, type NavItem } from "./utils";

const defaults: NavItem[] = [
  { id: "default", label: "Default", icon: "info" },
];

describe("parseNavItems", () => {
  it("uses defaults for blank input", () => {
    expect(parseNavItems("", defaults)).toEqual({
      items: defaults,
      error: null,
      usingDefaults: true,
    });
  });

  it("parses valid JSON strings", () => {
    const result = parseNavItems(
      '[{"id":"home","label":"Home","icon":"table","page":"Dashboard"}]',
      defaults,
    );

    expect(result.error).toBeNull();
    expect(result.usingDefaults).toBe(false);
    expect(result.items).toEqual([
      { id: "home", label: "Home", icon: "table", page: "Dashboard" },
    ]);
  });

  it("accepts arrays that Retool passes through directly", () => {
    const raw = [{ id: "reports", label: "Reports", icon: "chart" }];

    expect(parseNavItems(raw, defaults)).toEqual({
      items: raw,
      error: null,
      usingDefaults: false,
    });
  });

  it("returns defaults and an error for malformed JSON", () => {
    const result = parseNavItems("[", defaults);

    expect(result.items).toBe(defaults);
    expect(result.error).toBeTruthy();
    expect(result.usingDefaults).toBe(true);
  });

  it("returns defaults and an error for invalid item shape", () => {
    const result = parseNavItems('[{"id":"home"}]', defaults);

    expect(result.items).toBe(defaults);
    expect(result.error).toBe('Item 0 is missing a string "label"');
  });
});

describe("validateNavItems", () => {
  it("validates nested sub-items", () => {
    const error = validateNavItems([
      {
        id: "users",
        label: "Users",
        icon: "lock",
        subItems: [{ id: "users-active" }],
      },
    ]);

    expect(error).toBe('Item 0 subItem 0 is missing a string "label"');
  });
});
