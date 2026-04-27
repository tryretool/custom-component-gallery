# File Editor Notes Component

A Retool Custom Component for creating, editing, grouping, filtering, saving, updating, and deleting notes using dynamic database field mapping.

This component is designed so every user can connect their own database table, even if their column names are different.

---

## Features

- Display notes from a database
- Group notes by group/category
- Create new groups
- Add notes inside groups
- Edit existing notes
- Delete selected notes
- Grid and list view
- Filter/search notes
- Dynamic database field mapping
- Dynamic validation limits from Retool Inspector
- Save and update events for database queries
- Exposes selected/draft note data through `notesMeta`

---

## Inspector Inputs

These inputs are configurable from the Retool Inspector.

### Database Field Mapping

Use these to match your database column names.

| Inspector input | Default value | Purpose |
|---|---:|---|
| `idField` | `id` | Primary key column |
| `titleField` | `title` | Note title column |
| `contentField` | `content` | Note content/body column |
| `dateField` | `date` | Date column |
| `groupField` | `groupName` | Group/category column |

Example:

If your database columns are:

```sql
note_id
note_title
note_body
created_at
category
```

Set the inspector values like this:

```txt
idField = note_id
titleField = note_title
contentField = note_body
dateField = created_at
groupField = category
```

---

## Dynamic Validation Inputs

These values are also configurable from the Retool Inspector.

| Inspector input | Default value | Purpose |
|---|---:|---|
| `maxTitleLength` | `200` | Maximum title characters |
| `maxGroupLength` | `100` | Maximum group name characters |
| `maxContentLength` | `20000` | Maximum note content characters |
| `fontSize` | `14` | Editor font size |

---

## Component State

### `notesList`

Pass your database query result into this state.

Example:

```js
{{ getNotesQuery.data }}
```

The data should be an array of objects.

Example database result:

```json
[
  {
    "id": 1,
    "title": "First note",
    "content": "This is my first note",
    "date": "27 Apr 2026",
    "groupName": "Work"
  },
  {
    "id": 2,
    "title": "Second note",
    "content": "This is another note",
    "date": "27 Apr 2026",
    "groupName": "Personal"
  }
]
```

---

## Output States

### `selectedId`

Stores the currently selected note ID.

### `editorTitle`

Stores the current editor title.

### `editorText`

Stores the current editor content.

### `notesMeta`

Main output object used for save, update, and delete queries.

It includes:

```js
notesMeta.draft
notesMeta.savedNote
notesMeta.pendingSave
notesMeta.removeCandidate
notesMeta.validation
```

---

## Events

The component exposes these Retool events:

| Event | Purpose |
|---|---|
| `saveClick` | Triggered when saving a new note |
| `updateClick` | Triggered when updating an existing note |
| `selectedNoteRemoveConfirmClick` | Triggered when deleting a note |

---

# Database Setup

## Example Table

You can create a notes table like this:

```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  date TEXT,
  groupName TEXT
);
```

You can also use different column names. Just update the inspector field mapping.

---

## Get Notes Query

Create a Retool query named:

```txt
getNotesQuery
```

Example SQL:

```sql
SELECT *
FROM notes
ORDER BY id DESC;
```

Then pass this query data into the component:

```js
{{ getNotesQuery.data }}
```

---

## Save New Note Query

Create a query named:

```txt
saveNoteQuery
```

Example SQL:

```sql
INSERT INTO notes (
  title,
  content,
  date,
  groupName
)
VALUES (
  {{ notesComponent.notesMeta.savedNote.title }},
  {{ notesComponent.notesMeta.savedNote.content }},
  {{ notesComponent.notesMeta.savedNote.date }},
  {{ notesComponent.notesMeta.savedNote.groupName }}
);
```

After success, run:

```txt
getNotesQuery.trigger()
```

Connect this query to the component's `saveClick` event.

---

## Update Existing Note Query

Create a query named:

```txt
updateNoteQuery
```

Example SQL:

```sql
UPDATE notes
SET
  title = {{ notesComponent.notesMeta.savedNote.title }},
  content = {{ notesComponent.notesMeta.savedNote.content }},
  date = {{ notesComponent.notesMeta.savedNote.date }},
  groupName = {{ notesComponent.notesMeta.savedNote.groupName }}
WHERE id = {{ notesComponent.notesMeta.savedNote.id }};
```

After success, run:

```txt
getNotesQuery.trigger()
```

Connect this query to the component's `updateClick` event.

---

## Delete Note Query

Create a query named:

```txt
deleteNoteQuery
```

Example SQL:

```sql
DELETE FROM notes
WHERE id = {{ notesComponent.notesMeta.removeCandidate.id }};
```

After success, run:

```txt
getNotesQuery.trigger()
```

Connect this query to the component's `selectedNoteRemoveConfirmClick` event.

---

# Using Custom Database Columns

If your table uses custom column names, for example:

```sql
CREATE TABLE user_notes (
  note_id SERIAL PRIMARY KEY,
  note_title TEXT,
  note_text TEXT,
  created_date TEXT,
  folder_name TEXT
);
```

Set the inspector values:

```txt
idField = note_id
titleField = note_title
contentField = note_text
dateField = created_date
groupField = folder_name
```

Then your insert query should use those same fields:

```sql
INSERT INTO user_notes (
  note_title,
  note_text,
  created_date,
  folder_name
)
VALUES (
  {{ notesComponent.notesMeta.savedNote.note_title }},
  {{ notesComponent.notesMeta.savedNote.note_text }},
  {{ notesComponent.notesMeta.savedNote.created_date }},
  {{ notesComponent.notesMeta.savedNote.folder_name }}
);
```

Update query:

```sql
UPDATE user_notes
SET
  note_title = {{ notesComponent.notesMeta.savedNote.note_title }},
  note_text = {{ notesComponent.notesMeta.savedNote.note_text }},
  created_date = {{ notesComponent.notesMeta.savedNote.created_date }},
  folder_name = {{ notesComponent.notesMeta.savedNote.folder_name }}
WHERE note_id = {{ notesComponent.notesMeta.savedNote.note_id }};
```

Delete query:

```sql
DELETE FROM user_notes
WHERE note_id = {{ notesComponent.notesMeta.removeCandidate.note_id }};
```

---

# How to Use

1. Add the custom component to Retool.
2. Paste the component code.
3. Create a database table for notes.
4. Create a query to fetch notes.
5. Pass the query result into `notesList`.
6. Configure field names in the inspector.
7. Create insert, update, and delete queries.
8. Connect those queries to the component events.
9. Refresh the notes query after each save, update, or delete.

---

# User Interaction

## Create Group

Enter a group name and click:

```txt
+ New Group
```

This opens the editor for a new note inside that group.

## Add Note

Click the `+` button inside any group.

## Select Note

Single-click a note card.

## Edit Note

Double-click a note card.

## Delete Note

Select a note, then click the `×` button.

## Save Note

Click the `Save` button inside the editor.

---

# Validation

The component validates:

- Group name is required
- Title or content is required
- Title cannot exceed `maxTitleLength`
- Group name cannot exceed `maxGroupLength`
- Content cannot exceed `maxContentLength`

All limits can be changed from the Retool Inspector.

---

# Notes

- New notes use `id: null` before saving.
- Existing notes use their database ID.
- The component does not directly write to the database.
- Retool queries handle insert, update, and delete actions.
- `notesMeta.savedNote` is the main object used for save and update.
- `notesMeta.removeCandidate` is used for delete.
