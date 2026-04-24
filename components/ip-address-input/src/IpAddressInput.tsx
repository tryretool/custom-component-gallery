import { useState, useRef, useEffect, useCallback } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (val: string): string => {
  const stripped = val.replace(/[^0-9]/g, "");
  if (stripped === "") return "";
  const num = parseInt(stripped, 10);
  if (num > 255) return "255";
  return String(num);
};

const isComplete = (segs: string[]): boolean =>
  segs.length === 4 && segs.every((s) => s !== "" && parseInt(s, 10) >= 0 && parseInt(s, 10) <= 255);

const toIpString = (segs: string[]): string => segs.join(".");

const parseIp = (ip: string): string[] => {
  const parts = ip.split(".");
  if (parts.length !== 4) return ["", "", "", ""];
  return parts.map((p) => clamp(p));
};

// ─── Segment Input ────────────────────────────────────────────────────────────

function SegmentInput({
  value,
  index,
  disabled,
  hasError,
  inputRef,
  onChange,
  onNext,
  onPrev,
  onPaste,
}: {
  value: string;
  index: number;
  disabled: boolean;
  hasError: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (index: number, val: string) => void;
  onNext: (index: number) => void;
  onPrev: (index: number) => void;
  onPaste: (index: number, text: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // If user types a dot or period, jump to next
    if (raw.includes(".")) {
      const before = raw.replace(/\./g, "");
      if (before) onChange(index, clamp(before));
      onNext(index);
      return;
    }

    const clamped = clamp(raw);
    onChange(index, clamped);

    // Auto-jump: if 3 digits entered, or value is >= 26 (can't become valid with more digits)
    if (clamped.length === 3 || (clamped.length === 2 && parseInt(clamped, 10) >= 26)) {
      onNext(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "." || e.key === "ArrowRight") {
      if (e.key === "." || (e.currentTarget.selectionStart === e.currentTarget.value.length)) {
        e.preventDefault();
        onNext(index);
      }
    } else if (e.key === "ArrowLeft") {
      if (e.currentTarget.selectionStart === 0) {
        e.preventDefault();
        onPrev(index);
      }
    } else if (e.key === "Backspace" && value === "") {
      e.preventDefault();
      onPrev(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text/plain").trim();
    if (text.includes(".")) {
      e.preventDefault();
      onPaste(index, text);
    }
  };

  return (
    <input
      ref={inputRef}
      className={["ip-segment", hasError ? "error" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ")}
      type="text"
      inputMode="numeric"
      maxLength={3}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      disabled={disabled}
      placeholder="0"
      aria-label={`IP segment ${index + 1}`}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IpAddressInput() {
  Retool.useComponentSettings({ defaultWidth: 8, defaultHeight: 6 });

  // ── Inputs
  const [initialValue] = Retool.useStateString({
    name: "initialValue",
    initialValue: "",
    label: "Initial Value",
    description: "Pre-fill with an IPv4 address (e.g. 192.168.1.1)",
    inspector: "text",
  });

  const [labelText] = Retool.useStateString({
    name: "label",
    initialValue: "IP Address",
    label: "Label",
    inspector: "text",
  });

  const [disabled] = Retool.useStateBoolean({
    name: "disabled",
    initialValue: false,
    label: "Disabled",
    inspector: "checkbox",
  });

  // ── Outputs
  const [, setIpValue] = Retool.useStateString({
    name: "ipValue",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setIsValid] = Retool.useStateBoolean({
    name: "isValid",
    initialValue: false,
    inspector: "hidden",
  });

  const [, setModelUpdate] = Retool.useStateObject({
    name: "modelUpdate",
    initialValue: {},
    inspector: "hidden",
  });

  // ── Events
  const onIpChange = Retool.useEventCallback({ name: "ipChange" });
  const onIpComplete = Retool.useEventCallback({ name: "ipComplete" });

  // ── Local state
  const [segments, setSegments] = useState<string[]>(() =>
    initialValue ? parseIp(initialValue) : ["", "", "", ""]
  );
  const refs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // Sync initial value from Retool
  useEffect(() => {
    if (initialValue) setSegments(parseIp(initialValue));
  }, [initialValue]);

  // Fire outputs
  const fireOutputs = useCallback((segs: string[]) => {
    const ip = toIpString(segs);
    const valid = isComplete(segs);
    setIpValue(ip);
    setIsValid(valid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setModelUpdate({ ipAddress: ip, isValid: valid, segments: segs } as any);
    onIpChange();
    if (valid) onIpComplete();
  }, [setIpValue, setIsValid, setModelUpdate, onIpChange, onIpComplete]);

  const handleChange = (index: number, val: string) => {
    const next = [...segments];
    next[index] = val;
    setSegments(next);
    fireOutputs(next);
  };

  const focusSegment = (index: number) => {
    if (index >= 0 && index <= 3 && refs.current[index]) {
      refs.current[index]!.focus();
      refs.current[index]!.select();
    }
  };

  const handleNext = (index: number) => {
    if (index < 3) focusSegment(index + 1);
  };

  const handlePrev = (index: number) => {
    if (index > 0) focusSegment(index - 1);
  };

  const handlePaste = (startIndex: number, text: string) => {
    const parts = text.split(".").slice(0, 4 - startIndex);
    const next = [...segments];
    parts.forEach((p, i) => {
      const idx = startIndex + i;
      if (idx <= 3) next[idx] = clamp(p);
    });
    setSegments(next);
    fireOutputs(next);
    // Focus the last filled segment
    const lastIdx = Math.min(startIndex + parts.length - 1, 3);
    setTimeout(() => focusSegment(lastIdx), 0);
  };

  const segErrors = segments.map((s) => {
    if (s === "") return false;
    const n = parseInt(s, 10);
    return isNaN(n) || n < 0 || n > 255;
  });

  const valid = isComplete(segments);

  return (
    <div className="ip-root">
      {labelText && <label className="ip-label">{labelText}</label>}
      <div className={["ip-box", valid ? "valid" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ")}>
        {segments.map((seg, i) => (
          <div key={i} className="ip-seg-wrap">
            <SegmentInput
              value={seg}
              index={i}
              disabled={disabled}
              hasError={segErrors[i]}
              inputRef={(el) => { refs.current[i] = el; }}
              onChange={handleChange}
              onNext={handleNext}
              onPrev={handlePrev}
              onPaste={handlePaste}
            />
            {i < 3 && <span className="ip-dot">.</span>}
          </div>
        ))}
        {valid && (
          <div className="ip-valid-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
