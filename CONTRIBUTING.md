# Contributing to the Retool Custom Component Gallery

Thank you for building something for the Retool community. This guide covers everything you need to do to get your component into the gallery.

---

## Before You Start

You will need:

- A finished custom component built with the [custom-component-collection-template](https://github.com/tryretool/custom-component-collection-template)
- A Retool Community Forum username
- A cover image or screenshot of your component in action

If you have not built your component yet, start with the template linked above and follow the instructions there to get it working locally before submitting.

---

## How Submissions Work

Getting your component accepted requires two steps, both of which must be completed:

1. **Open a pull request** to this repository with your component code and metadata
2. **Submit the gallery form** at https://retoolcustomcomponents.netlify.app/

Your submission will not be reviewed until both are done. When you open a pull request, a bot will post a comment reminding you to complete the form if you have not already.

---

## Step 1 — Add your component to this repository

Fork this repository on GitHub. Then, inside the `components/` folder of your fork, create a new folder using your component name in lowercase with hyphens and add your files:

```
components/
  your-component-name/
    src/
    package.json
    metadata.json
    cover.png
    README.md         ← optional but encouraged
```

The `src/` folder and `package.json` come from your component project. Copy them directly into your component folder.

### metadata.json

```json
{
  "id": "your-component-name",
  "title": "Your Component Title",
  "author": "@your-community-username",
  "shortDescription": "One or two sentences describing what this component does and why it is useful.",
  "tags": ["Tag1", "Tag2"]
}
```

**Field requirements:**

| Field | Requirements |
|---|---|
| `id` | Lowercase, hyphens only, matches your folder name |
| `title` | Descriptive name — a reviewer should understand what it does from the name alone |
| `author` | Your Retool Community Forum username, including the `@` |
| `shortDescription` | 1–2 sentences max. Explain what it does and why it is useful |
| `tags` | At least one. Choose from the list below |

**Available tags:**

`Chat` `AI` `Agents` `Workflows` `Charts` `Gantt` `Maps` `Calendar` `Editors` `Rich Text` `Markdown` `Data Tables` `Export` `PDF` `File Upload` `Carousel` `UI Components` `Navigation` `Tree View` `Drag & Drop` `Kanban` `Forms` `React` `Custom`

### cover.png

A screenshot or GIF showing your component in use. This becomes the thumbnail on your gallery card. Keep it under 2MB.

### Opening the pull request

Once your files are added, commit them to your fork and open a pull request from your fork to the `main` branch of this repository. Use your component name as the PR title.

---

## Step 2 — Submit the gallery form

After your pull request is open, go to the gallery website and click **Submit Component**:

https://retoolcustomcomponents.netlify.app/

You will need to fill in:

- Your name and community username
- The URL of the pull request you just opened
- A short description of your component
- An explanation of how it works and how it was built
- A cover image
- At least one tag

**Save the confirmation email.** It contains your personal edit link, which you will need if you want to update your gallery listing later.

---

## Review Process

Our team reviews every submission within one week. Accepted components must meet the following criteria:

- The component solves a real, practical problem in Retool
- The description and documentation are clear and complete
- The pull request URL is valid and points to this repository
- The cover image accurately represents the component
- The component code is included and builds successfully

**If your submission is accepted**, you will receive a confirmation email and your component will go live in the gallery.

**If your submission needs changes**, you will receive a feedback email with specific notes on what to improve. Use the edit link in that email to update your submission and resubmit. Updated submissions go through review again before going live.

---

## Updating a Component

There are two types of updates, and they work differently:

**Updating your component code**

Open a new pull request to this repository with your changes, following the same process as the original submission. Then use the edit link from your original confirmation email to update your gallery submission with the new pull request URL. Your update will go through review before the changes go live.

**Updating your gallery listing**

If you only want to change what appears on your gallery card — the title, description, tags, or cover image — use the edit link from your original confirmation email. That link pre-fills the form with your current information so you can make changes and resubmit. Updated listings go through review again before the changes go live.

If you have lost your edit link, reach out via the Retool Community Forum.

---

## Questions

Open a GitHub issue in this repository or post on the [Retool Community Forum](https://community.retool.com).
