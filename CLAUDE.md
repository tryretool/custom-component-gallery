# Retool Custom Component Gallery

## What this repo is

This is the **community gallery repository** — the central collection of community-built Retool custom components. Each component lives in its own folder under `components/`. The gallery website reads from this repo and displays accepted components as cards.

- **Repo:** https://github.com/tryretool/custom-component-gallery
- **Gallery website:** https://customcomponents.retool.com
- **Template repo (how to build components):** https://github.com/tryretool/custom-component-collection-template

---

## Directory structure

```
components/
  your-component-name/     # One folder per component, named with hyphens
    src/                   # Component source code
    package.json
    metadata.json          # Required — describes the component for the gallery
    cover.png              # Required — screenshot or GIF, under 2MB
    README.md              # Required — installation and usage instructions
README.md
CONTRIBUTING.md
```

---

## metadata.json format

Every component folder must include a `metadata.json`:

```json
{
  "id": "your-component-name",
  "title": "Your Component Name",
  "author": "@yourRetoolCommunityHandle",
  "shortDescription": "One to two sentences describing what the component does.",
  "tags": ["UI Components"]
}
```

**Rules:**
- `id` must be lowercase with hyphens and match the folder name exactly
- `author` must be your real Retool Community Forum handle with `@`
- `tags` must include at least one from the approved list below

**Approved tags:**
`Chat`, `AI`, `Agents`, `Workflows`, `Charts`, `Gantt`, `Maps`, `Calendar`, `Editors`, `Rich Text`, `Markdown`, `Data Tables`, `Export`, `PDF`, `File Upload`, `Carousel`, `UI Components`, `Navigation`, `Tree View`, `Drag & Drop`, `Kanban`, `Forms`, `React`, `Custom`

---

## How to contribute a component

### Prerequisites
- A finished component built with the [template](https://github.com/tryretool/custom-component-collection-template)
- A Retool Community Forum username (community.retool.com)
- A cover image or screenshot (`cover.png`, under 2MB)

### Step 1 — Open a pull request to this repo

Fork this repo, add your component folder under `components/your-component-name/`, and open a PR to `main`. Use the component name as the PR title.

Your folder must include:
- `src/` — source code
- `package.json`
- `metadata.json` — see format above
- `cover.png` — screenshot or GIF of the component in action
- `README.md` — installation and usage instructions

### Step 2 — Submit the gallery form

Go to the gallery website and click **Submit Component**. Fill in:
- Your name and Retool Community username
- The PR URL from Step 1
- About, how it works, build process
- Cover image
- At least one tag

> Save the confirmation email — it contains your personal edit link for future updates.

### Review process
- Submissions are reviewed by an AI agent and the Retool team
- **Accepted:** PR is merged automatically, card goes live on the gallery
- **Flagged:** You receive feedback with a personal edit link to fix and resubmit
- Never accepted without a valid GitHub PR URL pointing to a specific pull request

---

## Updating a component

| What you're updating | What to do |
|----------------------|-----------|
| Component code | Open a new PR with the changes, then update your gallery submission URL |
| Gallery listing (title, description, tags) | Use the edit link from your confirmation email — no new PR needed |

---

## Component quality bar

To pass review, a component must:
- Solve a practical problem for Retool users
- Have clear documentation in `README.md`
- Include a valid, working PR URL
- Have an accurate cover image that reflects the actual component
- Contain buildable, runnable code
