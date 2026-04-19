# PII Masker

Mask sensitive PII values with a one-click reveal toggle and built-in audit trail support. Supports email, phone, card numbers, and custom strings.

## Model Inputs

| Key | Type | Example | Description |
|---|---|---|---|
| `value` | string | `"john.doe@example.com"` | The raw PII value |
| `label` | string | `"Email"` | Label shown above the field |
| `fieldType` | string | `"email"` | `email` / `phone` / `card` / `custom` |
| `logReveal` | boolean | `true` | Show amber audit notice on reveal |

## Model Outputs

| Key | Type | Description |
|---|---|---|
| `revealed` | boolean | `true` while value is visible |
| `timestamp` | number | Epoch ms of last reveal; `0` when hidden |

## Events

| Event | When | Usage |
|---|---|---|
| `change` | Every toggle | Trigger an audit-log query via `triggerQuery` |

## Masking Examples

| `fieldType` | Raw | Masked |
|---|---|---|
| `email` | `john.doe@example.com` | `••••••oe@example.com` |
| `phone` | `+1-555-123-4567` | `+•-•••-•••-4567` |
| `card` | `4532 1234 5678 9012` | `•••• •••• •••• 9012` |
| `custom` | `secrettoken123` | `•••••••••••n123` |

## Audit Trail

In the component's **Events** panel, attach a handler to the `change` event:

```js
// fires on every reveal / hide toggle
triggerQuery('insertAuditLog')
// then read: {{piiMasker.model.revealed}}, {{piiMasker.model.timestamp}}
```
