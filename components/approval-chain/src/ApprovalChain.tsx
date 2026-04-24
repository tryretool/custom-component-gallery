import { useState, useMemo, Fragment } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = "pending" | "approved" | "rejected" | "skipped";

interface ApprovalStep {
  id: string;
  approverName: string;
  role?: string;
  approverEmail?: string;
  avatarUrl?: string;
  status: ApprovalStatus;
  timestamp?: string;
  comment?: string;
  order?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMENT_CHAR_LIMIT = 40;

const COLORS = {
  approved: "#16a34a",
  approvedBg: "#dcfce7",
  rejected: "#dc2626",
  rejectedBg: "#fee2e2",
  pending: "#f59e0b",
  pendingBg: "#fef3c7",
  skipped: "#6b7280",
  skippedBg: "#f3f4f6",
  lineDefault: "#e5e7eb",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  background: "#ffffff",
  border: "#d1d5db",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

const normalizeStatus = (value: unknown): ApprovalStatus => {
  const str = String(value || "").toLowerCase();
  if (["approved", "accept", "accepted", "yes", "complete", "done"].includes(str)) return "approved";
  if (["rejected", "reject", "declined", "deny", "denied", "no"].includes(str)) return "rejected";
  if (["skipped", "skip", "bypassed", "n/a", "na"].includes(str)) return "skipped";
  return "pending";
};

const parseApprovalSteps = (data: unknown): ApprovalStep[] => {
  if (!data || !Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index): ApprovalStep => ({
      id: String(item.id || item._id || item.stepId || `step-${index}`),
      approverName: String(item.approverName || item.name || item.approver || item.user || `Approver ${index + 1}`),
      role: item.role || item.title || item.position ? String(item.role || item.title || item.position) : undefined,
      status: normalizeStatus(item.status || item.approvalStatus || item.state),
      timestamp: item.timestamp || item.date || item.approvedAt ? String(item.timestamp || item.date || item.approvedAt) : undefined,
      avatarUrl: item.avatarUrl || item.avatar || item.photo ? String(item.avatarUrl || item.avatar || item.photo) : undefined,
      comment: item.comment || item.note || item.message ? String(item.comment || item.note || item.message) : undefined,
      order: typeof item.order === "number" ? item.order : index,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const getStatusColors = (status: ApprovalStatus) => {
  switch (status) {
    case "approved": return { bg: COLORS.approvedBg, border: COLORS.approved, text: COLORS.approved };
    case "rejected": return { bg: COLORS.rejectedBg, border: COLORS.rejected, text: COLORS.rejected };
    case "skipped":  return { bg: COLORS.skippedBg,  border: COLORS.skipped,  text: COLORS.skipped  };
    default:         return { bg: COLORS.pendingBg,  border: COLORS.pending,  text: COLORS.pending  };
  }
};

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status, color }: { status: ApprovalStatus; color: string }) {
  switch (status) {
    case "approved":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "rejected":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "skipped":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
  }
}

// ─── Comment Component ────────────────────────────────────────────────────────

function CommentText({ comment }: { comment: string }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = comment.length > COMMENT_CHAR_LIMIT;
  const displayText = isTruncated && !expanded
    ? comment.slice(0, COMMENT_CHAR_LIMIT) + "..."
    : comment;

  return (
    <div
      className="step-comment"
      onClick={(e) => { e.stopPropagation(); if (isTruncated) setExpanded((v) => !v); }}
      title={isTruncated && !expanded ? comment : undefined}
      style={{ cursor: isTruncated ? "pointer" : "default" }}
    >
      {displayText}
      {isTruncated && (
        <span className="step-comment-toggle">
          {expanded ? " less" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Step Node ────────────────────────────────────────────────────────────────

function StepNode({
  step,
  showTimestamp,
  isClickable,
  onClick,
}: {
  step: ApprovalStep;
  showTimestamp: boolean;
  isClickable: boolean;
  onClick: (step: ApprovalStep) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const statusColors = getStatusColors(step.status);

  return (
    <div
      className="step-node clickable"
      onClick={() => onClick(step)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
    >
      {/* Avatar */}
      <div
        className="avatar-container"
        style={{
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
          boxShadow: isHovered && isClickable ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {step.avatarUrl ? (
          <img src={step.avatarUrl} alt={step.approverName} className="avatar-image" />
        ) : (
          <span className="avatar-initials" style={{ color: statusColors.text }}>
            {getInitials(step.approverName)}
          </span>
        )}
        <div className="status-badge" style={{ borderColor: statusColors.border }}>
          <StatusIcon status={step.status} color={statusColors.text} />
        </div>
      </div>

      {/* Name */}
      <div className="step-name" title={step.approverName}>
        {step.approverName}
      </div>

      {/* Role */}
      {step.role && (
        <div className="step-role">{step.role}</div>
      )}

      {/* Timestamp */}
      {showTimestamp && step.timestamp && (
        <div className="step-timestamp">{formatTimestamp(step.timestamp)}</div>
      )}

      {/* Status label */}
      <div className="step-status" style={{ color: statusColors.text }}>
        {step.status}
      </div>

      {/* Comment */}
      {step.comment && <CommentText comment={step.comment} />}
    </div>
  );
}

// ─── Connector Line ───────────────────────────────────────────────────────────

function ConnectorLine({
  status,
  orientation,
  length,
}: {
  status: ApprovalStatus;
  orientation: "horizontal" | "vertical";
  length: number;
}) {
  const color =
    status === "approved" ? COLORS.approved :
    status === "rejected" ? COLORS.rejected :
    status === "skipped"  ? COLORS.skipped  :
    COLORS.lineDefault;

  return (
    <div
      className="connector-line"
      style={{
        width:  orientation === "horizontal" ? length : 3,
        height: orientation === "horizontal" ? 3 : length,
        backgroundColor: color,
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApprovalChain() {
  Retool.useComponentSettings({ defaultWidth: 20, defaultHeight: 20 });

  // Input: Steps data
  const [stepsData] = Retool.useStateArray({
    name: "steps",
    initialValue: [
      { id: "1", approverName: "John Smith",    role: "Engineering Manager", status: "approved",  timestamp: "2024-01-15T10:30:00Z", comment: "Looks good to me, approved without reservations." },
      { id: "2", approverName: "Sarah Johnson", role: "Product Lead",        status: "approved",  timestamp: "2024-01-16T14:20:00Z", comment: "OK" },
      { id: "3", approverName: "Mike Davis",    role: "Finance Director",    status: "rejected",  timestamp: "2024-01-17T09:00:00Z", comment: "Budget exceeded. Please revise the cost breakdown before resubmitting." },
      { id: "4", approverName: "Emily Chen",    role: "CEO",                 status: "pending" },
    ],
    label: "Approval Steps",
    description: "Array of steps: [{ id, approverName, role?, status, timestamp?, avatarUrl?, comment? }]",
    inspector: "text",
  });

  // Configuration
  const [orientation] = Retool.useStateEnumeration({
    name: "orientation",
    initialValue: "horizontal",
    enumDefinition: ["horizontal", "vertical"],
    label: "Orientation",
    inspector: "select",
  });

  const [showTimestamps] = Retool.useStateBoolean({
    name: "showTimestamps",
    initialValue: true,
    label: "Show Timestamps",
    inspector: "checkbox",
  });

  const [enableClick] = Retool.useStateBoolean({
    name: "enableClick",
    initialValue: true,
    label: "Enable Click",
    inspector: "checkbox",
  });

  const [connectorLength] = Retool.useStateNumber({
    name: "connectorLength",
    initialValue: 60,
    label: "Connector Length",
    inspector: "text",
  });

  // Outputs
  const [, setSelectedStep] = Retool.useStateObject({
    name: "selectedStep",
    initialValue: {},
    inspector: "hidden",
  });

  const [, setClickedId] = Retool.useStateString({
    name: "clickedId",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setClickedName] = Retool.useStateString({
    name: "clickedName",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setClickedStatus] = Retool.useStateString({
    name: "clickedStatus",
    initialValue: "",
    inspector: "hidden",
  });

  const [, setClickedRole] = Retool.useStateString({
    name: "clickedRole",
    initialValue: "",
    inspector: "hidden",
  });

  // Events
  const onStepClick = Retool.useEventCallback({ name: "stepClick" });

  // Parse steps
  const steps = useMemo(() => parseApprovalSteps(stepsData), [stepsData]);

  // Handle click — set all outputs then fire event
  const handleClick = (step: ApprovalStep) => {
    setClickedId(step.id);
    setClickedName(step.approverName);
    setClickedStatus(step.status);
    setClickedRole(step.role ?? "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSelectedStep(step as any);
    onStepClick();
  };

  if (steps.length === 0) {
    return (
      <div className="empty-state">
        No approval steps configured. Pass an array of steps to the component.
      </div>
    );
  }

  return (
    <div className={`approval-chain-container ${orientation}`}>
      {steps.map((step: ApprovalStep, index: number) => (
        <Fragment key={step.id}>
          <StepNode
            step={step}
            showTimestamp={showTimestamps}
            isClickable={enableClick}
            onClick={handleClick}
          />
          {index < steps.length - 1 && (
            <ConnectorLine
              status={step.status}
              orientation={orientation as "horizontal" | "vertical"}
              length={connectorLength}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
