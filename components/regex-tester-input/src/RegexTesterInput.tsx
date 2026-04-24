import { useState, useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchResult {
  match: string;
  index: number;
  groups: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRegex(pattern: string, flags: string): { regex: RegExp | null; error: string } {
  if (!pattern) return { regex: null, error: "" };
  try {
    // Always add 'g' flag so we can find all matches
    const allFlags = flags.includes("g") ? flags : flags + "g";
    return { regex: new RegExp(pattern, allFlags), error: "" };
  } catch (e) {
    return { regex: null, error: (e as Error).message };
  }
}

function findMatches(regex: RegExp | null, text: string): MatchResult[] {
  if (!regex || !text) return [];
  const results: MatchResult[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex to avoid infinite loops
  regex.lastIndex = 0;
  while ((m = regex.exec(text)) !== null) {
    results.push({
      match: m[0],
      index: m.index,
      groups: m.groups ? { ...m.groups } : {},
    });
    // Prevent infinite loop on zero-length matches
    if (m[0].length === 0) regex.lastIndex++;
  }
  return results;
}

// Build highlighted HTML from text + matches
function buildHighlightedParts(text: string, matches: MatchResult[]): { text: string; highlighted: boolean }[] {
  if (!matches.length) return [{ text, highlighted: false }];

  const parts: { text: string; highlighted: boolean }[] = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.index > cursor) {
      parts.push({ text: text.slice(cursor, m.index), highlighted: false });
    }
    parts.push({ text: m.match, highlighted: true });
    cursor = m.index + m.match.length;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlighted: false });
  }

  return parts;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RegexTesterInput() {
  Retool.useComponentSettings({ defaultWidth: 14, defaultHeight: 28 });

  // ── Inputs
  const [initialPattern] = Retool.useStateString({
    name: "initialPattern",
    initialValue: "",
    label: "Initial Pattern",
    description: "Pre-fill the regex pattern (without slashes)",
    inspector: "text",
  });

  const [initialTestString] = Retool.useStateString({
    name: "initialTestString",
    initialValue: "",
    label: "Initial Test String",
    description: "Pre-fill the test string",
    inspector: "text",
  });

  // ── Outputs
  const [, setMatchesOut] = Retool.useStateArray({
    name: "matches",
    initialValue: [],
    inspector: "hidden",
  });

  const [, setIsValid] = Retool.useStateBoolean({
    name: "isValid",
    initialValue: false,
    inspector: "hidden",
  });

  const [, setMatchCount] = Retool.useStateNumber({
    name: "matchCount",
    initialValue: 0,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  // ── Events
  const onMatch = Retool.useEventCallback({ name: "onMatch" });

  // ── Local state
  const [pattern, setPattern] = useState(initialPattern || "");
  const [testString, setTestString] = useState(initialTestString || "");
  const [flags, setFlags] = useState("gi");

  // ── Compute
  const { regex, error: regexError } = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);
  const matches = useMemo(() => findMatches(regex, testString), [regex, testString]);
  const highlightedParts = useMemo(() => buildHighlightedParts(testString, matches), [testString, matches]);
  const isValid = pattern !== "" && regexError === "";

  // Fire outputs whenever matches change
  useMemo(() => {
    const matchStrings = matches.map((m) => m.match);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMatchesOut(matchStrings as any);
    setIsValid(isValid);
    setMatchCount(matches.length);
    setModelUpdate({
      matches: matchStrings,
      matchDetails: matches,
      isValid,
      matchCount: matches.length,
      pattern,
      flags,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (matches.length > 0) onMatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, isValid]);

  const toggleFlag = (f: string) => {
    setFlags((prev) =>
      prev.includes(f) ? prev.replace(f, "") : prev + f
    );
  };

  return (
    <div className="rt-root">

      {/* ── Pattern input ── */}
      <div className="rt-section">
        <div className="rt-section-header">
          <span className="rt-section-label">
            <span className="rt-slash">/</span>
            Pattern
            <span className="rt-slash">/</span>
          </span>
          <div className="rt-flags">
            {["g", "i", "m", "s"].map((f) => (
              <button
                key={f}
                className={["rt-flag-btn", flags.includes(f) ? "active" : ""].filter(Boolean).join(" ")}
                onClick={() => toggleFlag(f)}
                title={f === "g" ? "Global" : f === "i" ? "Case insensitive" : f === "m" ? "Multiline" : "Dot all"}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className={["rt-pattern-wrap", regexError ? "has-error" : isValid && pattern ? "is-valid" : ""].filter(Boolean).join(" ")}>
          <span className="rt-pattern-slash">/</span>
          <input
            className="rt-pattern-input"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. \b\w+@\w+\.\w+\b"
            spellCheck={false}
          />
          <span className="rt-pattern-slash">/{flags}</span>
        </div>
        {regexError && <div className="rt-error">{regexError}</div>}
      </div>

      {/* ── Test string ── */}
      <div className="rt-section">
        <div className="rt-section-header">
          <span className="rt-section-label">Test String</span>
          {matches.length > 0 && (
            <span className="rt-match-badge">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
          )}
          {pattern && !regexError && matches.length === 0 && testString && (
            <span className="rt-no-match-badge">No matches</span>
          )}
        </div>
        <textarea
          className="rt-test-input"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Paste your test string here..."
          spellCheck={false}
          rows={4}
        />
      </div>

      {/* ── Highlighted preview ── */}
      {testString && (
        <div className="rt-section">
          <div className="rt-section-header">
            <span className="rt-section-label">Match Preview</span>
          </div>
          <div className="rt-preview">
            {highlightedParts.map((part, i) =>
              part.highlighted ? (
                <mark key={i} className="rt-highlight">{part.text}</mark>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Match list ── */}
      {matches.length > 0 && (
        <div className="rt-section">
          <div className="rt-section-header">
            <span className="rt-section-label">Matches</span>
          </div>
          <div className="rt-match-list">
            {matches.map((m, i) => (
              <div key={i} className="rt-match-item">
                <span className="rt-match-index">#{i + 1}</span>
                <code className="rt-match-value">{m.match}</code>
                <span className="rt-match-pos">at {m.index}</span>
                {Object.keys(m.groups).length > 0 && (
                  <span className="rt-match-groups">
                    {Object.entries(m.groups).map(([k, v]) => (
                      <span key={k} className="rt-group">{k}: <em>{v}</em></span>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
