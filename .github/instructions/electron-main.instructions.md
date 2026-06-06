---
applyTo: "main.js"
---

# Electron Main Process Guidelines

## Purpose

Review rules for `main.js`—IPC handlers, windows, SQLite, cloud sync, and native integrations.

## IPC Handler Safety

- Validate all arguments from the renderer before filesystem, shell, or DB operations
- Prefer `ipcMain.handle` (async) over sync handlers unless sync is already established for that channel
- Return structured errors; avoid leaking stack traces or token values to the renderer

```javascript
// Avoid
ipcMain.handle("save-path", (_, userPath) => {
  fs.writeFileSync(userPath, data);
});

// Prefer
ipcMain.handle("save-path", (_, userPath) => {
  if (typeof userPath !== "string" || userPath.includes("..")) {
    throw new Error("Invalid path");
  }
  fs.writeFileSync(userPath, data);
});
```

## Database Access

- Route all SQLite work through existing `database-command` handler patterns
- SQL schema and statements live in `kookit-extra.min.mjs`—do not duplicate schema in `main.js`
- Reuse `dbConnection` lifecycle; close connections on app quit

## Window Lifecycle

- **`new-tab`**: `WebContentsView` overlay on `mainWin` for in-app reading
- **`open-book`**: separate `BrowserWindow` (`readerWindow`); supports fullscreen and frameless modes
- Honor two-phase reader close: wait for `reader-close-ready` before destroying reader windows
- Throttle resize handlers (see existing `RESIZE_THROTTLE_MS` pattern)

## Cloud Sync and Credentials

- Use cached sync utils (`syncUtilCache`); avoid creating duplicate service instances
- Store tokens via `electron-store`; review new fields for encryption or sensitivity
- Ensure download/upload cancellation cleans up `downloadRequest` and temp files

## Native and Platform Code

- macOS biometric: `systemPreferences.promptTouchID`
- Windows Hello: existing PowerShell WinRT bridge—keep timeouts and error parsing
- Plugin TTS uses `eval(voiceFunc)` in main process—flag untrusted plugin source changes

## Logging

- Use `electron-log`; never log tokens, passwords, or full book file paths at info level
- Debug logs go to `userData/debug.log`

## Testing Guidelines

- New IPC handlers must handle error paths (invalid args, missing files, DB failures)
- Test cancel paths for cloud sync operations (`downloadRequest` cleanup)
- Biometric auth fallback paths must be exercised when hardware is unavailable

## Performance

- Avoid blocking the main thread with large synchronous file I/O
- Batch database operations where possible
- Reuse cached sync utils (`syncUtilCache`); creating duplicate instances wastes memory
