# Layer8FileUpload

**Global object:** `window.Layer8FileUpload` (shared between desktop and mobile)

Uploads and downloads files via the backend `FileStore` protobuf service. Files are sent as base64-encoded bytes within standard JSON requests. Maximum file size: 5MB.

```js
// Upload a file
const result = await Layer8FileUpload.upload(file, documentId, version)
// Returns: { storagePath, fileName, fileSize, mimeType, checksum }

// Download a file
await Layer8FileUpload.download(storagePath, fileName)

// Format bytes to human-readable
Layer8FileUpload.formatSize(bytes)    // e.g., "1.5 MB"
```

**Form field type:** `f.file(key, label, required)` creates a file upload field.
- Desktop: drag-and-drop area with "Drop file here or click to browse (max 5MB)"
- Mobile: native `<input type="file">` (triggers camera/gallery picker)
- Data collection spreads `storagePath`, `fileName`, `fileSize`, `mimeType`, and `checksum` onto the form data object.
