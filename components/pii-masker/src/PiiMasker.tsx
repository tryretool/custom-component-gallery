import { type FC, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'

// ── Masking helpers ───────────────────────────────────────────────────────────

function maskEmail(str: string): string {
    const at = str.indexOf('@')
    if (at > 2) {
        const local = str.slice(0, at)
        const domain = str.slice(at)
        return '•'.repeat(Math.max(local.length - 2, 2)) + local.slice(-2) + domain
    }
    return maskCustom(str)
}

function maskPhone(str: string): string {
    const digits = str.replace(/\D/g, '')
    if (digits.length <= 4) return str
    const maskedDigits = '•'.repeat(digits.length - 4) + digits.slice(-4)
    let out = ''
    let di = 0
    for (let i = 0; i < str.length; i++) {
        out += /\d/.test(str[i]) ? maskedDigits[di++] : str[i]
    }
    return out
}

function maskCard(str: string): string {
    const digits = str.replace(/[\s-]/g, '')
    return '•••• •••• •••• ' + digits.slice(-4)
}

function maskCustom(str: string): string {
    if (str.length <= 4) return str
    return '•'.repeat(str.length - 4) + str.slice(-4)
}

function maskValue(raw: string, fieldType: string): string {
    if (!raw) return '—'
    switch (fieldType) {
        case 'email': return maskEmail(raw)
        case 'phone': return maskPhone(raw)
        case 'card':  return maskCard(raw)
        default:      return maskCustom(raw)
    }
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

const EyeOpen: FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

const EyeSlash: FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
)

// ── CSS Injection ─────────────────────────────────────────────────────────────

const cssVariables = `
.pii-wrapper {
  font-family: inherit;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  padding: 2px 4px;
}

.pii-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.pii-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.3px;
}

.pii-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 3px 8px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.pii-badge.email { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.pii-badge.phone { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.pii-badge.card  { background: #fdf4ff; color: #c026d3; border: 1px solid #f5d0fe; }
.pii-badge.custom{ background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

.pii-input-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.pii-input-box:hover {
  border-color: #9ca3af;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.pii-input-box.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.pii-value {
  flex: 1;
  font-size: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #111827;
  line-height: 1.4;
  word-break: break-all;
  transition: color 0.2s;
  min-width: 0;
}

.pii-value.masked {
  color: #6b7280;
  letter-spacing: 2px;
}

.pii-toggle {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pii-toggle:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.pii-toggle.active {
  color: #6366f1;
  background: #e0e7ff;
}

.pii-toggle:active {
  transform: scale(0.95);
}

.pii-notice {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  animation: piiFadeIn 0.3s ease;
}

.pii-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  animation: piiPulse 2s infinite;
}

@keyframes piiFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes piiPulse {
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}
`

// ── Component ─────────────────────────────────────────────────────────────────

export const PiiMasker: FC = () => {
    Retool.useComponentSettings({
        defaultHeight: 2,
    })

    const [value] = Retool.useStateString({
        name: 'value',
        initialValue: '',
        label: 'PII value to mask',
        inspector: 'text',
    })

    const [label] = Retool.useStateString({
        name: 'label',
        initialValue: 'Field',
        label: 'Field label',
        inspector: 'text',
    })

    const [fieldType] = Retool.useStateEnumeration({
        name: 'fieldType',
        initialValue: 'custom',
        label: 'Field type',
        enumDefinition: ['email', 'phone', 'card', 'custom'],
        inspector: 'select',
    })

    const [logReveal] = Retool.useStateBoolean({
        name: 'logReveal',
        initialValue: true,
        label: 'Show audit notice on reveal',
        inspector: 'checkbox',
    })

    const [, setRevealed] = Retool.useStateBoolean({
        name: 'revealed',
        initialValue: false,
        inspector: 'hidden',
    })

    const [, setTimestamp] = Retool.useStateNumber({
        name: 'timestamp',
        initialValue: 0,
        inspector: 'hidden',
    })

    const emitChange = Retool.useEventCallback({ name: 'change' })
    const [isVisible, setIsVisible] = useState(false)

    function handleToggle(): void {
        const next = !isVisible
        setIsVisible(next)
        setRevealed(next)
        setTimestamp(next ? Date.now() : 0)
        emitChange()
    }

    const displayText = isVisible ? (value || '—') : maskValue(value, fieldType)
    const showBadge = fieldType && fieldType !== 'custom'

    return (
        <div className="pii-wrapper">
            <style>{cssVariables}</style>

            {/* Label */}
            <div className="pii-label-row">
                <span className="pii-label">{label || 'Field'}</span>
                {showBadge && (
                    <span className={`pii-badge ${fieldType}`}>
                        {fieldType}
                    </span>
                )}
            </div>

            {/* Input Box */}
            <div className={`pii-input-box ${isVisible ? 'active' : ''}`}>
                <span className={`pii-value ${!isVisible ? 'masked' : ''}`}>
                    {displayText}
                </span>

                <button
                    className={`pii-toggle ${isVisible ? 'active' : ''}`}
                    onClick={handleToggle}
                    aria-label={isVisible ? 'Hide value' : 'Reveal value'}
                >
                    {isVisible ? <EyeSlash /> : <EyeOpen />}
                </button>
            </div>

            {/* Audit Notice */}
            {isVisible && logReveal && (
                <div className="pii-notice">
                    <span className="pii-dot" />
                    <span>Reveal logged for audit trail</span>
                </div>
            )}
        </div>
    )
}

