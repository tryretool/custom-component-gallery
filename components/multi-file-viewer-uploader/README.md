# Multi File Viewer

A Retool custom component for uploading and previewing multiple files, including images, PDFs, video, audio, text, JSON, CSV, and Excel files.

## What `{{ multiFileViewer1 }}` returns

When you reference the component directly in Retool:

```js
{{ multiFileViewer1 }}
```

it returns the component state object, which looks like this shape:

```js
{
  pluginType: "DynamicWidget_MultiFileUploaderAndViewer_MultiFileViewer",
  heightType: "auto",
  files: [],
  selectedFile: {
    id: "",
    name: "",
    url: "",
    previewUrl: "",
    mimeType: "",
    label: "",
    kind: "unknown"
  },
  acceptedKind: "",
  collectionUuid: "...",
  allowMixedFileTypes: true,
  id: "multiFileViewer1"
}
```

Depending on uploads and selection, `files` and `selectedFile` will contain real values.

## Recommended Retool usage

### Get the full component object

```js
{{ multiFileViewer1 }}
```

### Get all uploaded files

```js
{{ multiFileViewer1.files }}
```

### Get the currently selected file

```js
{{ multiFileViewer1.selectedFile }}
```

### Get the selected file name

```js
{{ multiFileViewer1.selectedFile.name }}
```

### Get the selected file MIME type

```js
{{ multiFileViewer1.selectedFile.mimeType }}
```

### Get the selected file preview URL

```js
{{ multiFileViewer1.selectedFile.previewUrl }}
```

### Get the selected file kind

```js
{{ multiFileViewer1.selectedFile.kind }}
```

### Check whether mixed file types are enabled

```js
{{ multiFileViewer1.allowMixedFileTypes }}
```

### Get the accepted upload kind for single-type mode

```js
{{ multiFileViewer1.acceptedKind }}
```

## File object structure

Each item inside `multiFileViewer1.files` follows this shape:

```js
{
  id: "file-id",
  name: "example.pdf",
  url: "blob:...",
  previewUrl: "blob:...",
  mimeType: "application/pdf",
  label: "PDF",
  kind: "pdf",
  objectUrl: "blob:...",
  base64: "..."
}
```

## Selected file object structure

`multiFileViewer1.selectedFile` follows this shape:

```js
{
  id: "file-id",
  name: "example.pdf",
  url: "blob:...",
  previewUrl: "blob:...",
  mimeType: "application/pdf",
  label: "PDF",
  kind: "pdf"
}
```

## Common examples

### Send the selected file to a query

```js
{{
  {
    name: multiFileViewer1.selectedFile.name,
    type: multiFileViewer1.selectedFile.mimeType,
    kind: multiFileViewer1.selectedFile.kind,
    previewUrl: multiFileViewer1.selectedFile.previewUrl
  }
}}
```

### Send all files to a query

```js
{{ multiFileViewer1.files }}
```

### Get only file names

```js
{{ multiFileViewer1.files.map(file => file.name) }}
```

### Get only base64 values

```js
{{ multiFileViewer1.files.map(file => file.base64) }}
```

### Get the first uploaded file

```js
{{ multiFileViewer1.files[0] }}
```

## Notes

- `files` is an array of uploaded files.
- `selectedFile` is the file currently chosen in the sidebar.
- `acceptedKind` is used when mixed file uploads are turned off.
- `allowMixedFileTypes` is the checkbox-controlled setting for mixed uploads.
- `heightType: "auto"` means the component is configured to work with auto height in Retool.
- `previewUrl` and `url` are usually blob URLs for local uploaded files.

## Best practice

In most Retool queries and transformers, use nested access instead of the whole object when possible.

Good:

```js
{{ multiFileViewer1.selectedFile }}
{{ multiFileViewer1.files }}
{{ multiFileViewer1.allowMixedFileTypes }}
```

Less useful on its own:

```js
{{ multiFileViewer1 }}
```

because that returns the entire component state wrapper, not just the selected file.
