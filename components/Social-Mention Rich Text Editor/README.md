# 📝 Custom Rich Text Editor (Retool + TipTap)

A fully-featured rich text editor built using **React**, **TipTap**, and **Retool Custom Components**.
Supports mentions, formatting, images, links, and seamless Retool integration.

---

## 🚀 Features

* ✍️ Rich text editing (bold, italic, underline, highlight, etc.)
* 🔗 Link insertion with dialog
* 🖼 Image upload support
* 📌 @Mention system with dropdown + keyboard navigation
* 📋 Lists (bullet + ordered) with nesting
* ↩️ Undo / Redo support
* 📏 Auto-resizing editor
* ⚡ Debounced updates for performance
* 🔄 Full Retool state sync

---

## 📦 Dependencies

### Core

* `react`
* `react-dom`

### Retool

* `@tryretool/custom-component-support`

### TipTap Core

* `@tiptap/react`
* `@tiptap/starter-kit`

### TipTap Extensions

* `@tiptap/extension-mention`
* `@tiptap/extension-underline`
* `@tiptap/extension-highlight`
* `@tiptap/extension-link`
* `@tiptap/extension-superscript`
* `@tiptap/extension-subscript`
* `@tiptap/extension-text-align`
* `@tiptap/extension-image`

### Utilities

* `@tiptap/suggestion`
* `tippy.js` (CSS only)

---

## 📥 Installation

```bash
npm install react react-dom @tryretool/custom-component-support \
@tiptap/react @tiptap/starter-kit \
@tiptap/extension-mention \
@tiptap/extension-underline \
@tiptap/extension-highlight \
@tiptap/extension-link \
@tiptap/extension-superscript \
@tiptap/extension-subscript \
@tiptap/extension-text-align \
@tiptap/extension-image \
@tiptap/suggestion \
tippy.js
```

---

## ⚙️ Retool State Configuration

### `value` (string)

* Stores editor HTML content

### `users` (array)

Used for @mentions

**Format:**

```json
[
  { "label": "John Doe", "email": "john@test.com" }
]
```

**Fields:**

* `label` (required) → display name
* `email` (optional) → used for handle
* `id` (optional) → unique identifier

---

## 💡 Example Users Data

```json
[
  { "id": 1, "label": "Aarav Mehta", "email": "aarav@company.com" },
  { "id": 2, "label": "Diya Patel", "email": "diya@company.com" }
]
```

---

## 🧠 How Mentions Work

* Triggered using `@`
* Supports multi-word names (e.g. "John Doe")
* Smart matching against user list
* Keyboard navigation (↑ ↓ Enter)
* Automatically inserts formatted mention node

---

## 🧹 Key Internal Features

* Debounced updates to Retool state
* HTML normalization:

  * Converts plain text mentions → structured nodes
  * Converts Quill-style indentation → nested lists
* Prevents unnecessary re-renders
* Maintains cursor position and undo stack integrity

---

## 🧪 Testing Tips

* Use large user lists (50–100 users) to test dropdown performance
* Test edge cases:

  * Similar names (John / John Doe)
  * Multi-word mentions
  * Rapid typing + selection

---

## ⚠️ Important Notes

* Do NOT modify Retool state bindings directly
* Avoid changing mention logic unless necessary
* Keep TipTap extensions intact to prevent feature breakage

---

