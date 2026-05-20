# Koodo Reader – Copilot Instructions

## Architecture Overview

Koodo Reader is an **Electron + React (CRA) + Redux** cross-platform ebook reader.

| Layer                 | Location                              | Role                                                                           |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Electron main process | `main.js`                             | Window management, IPC handlers, SQLite via `better-sqlite3`, sync/cloud utils |
| React renderer        | `src/`                                | UI, Redux state, book rendering                                                |
| Reader engine         | `src/assets/lib/kookit-extra.min.mjs` | Closed-source ESM module – book parsing, SQL statements, sync utilities        |
| HTTP server           | `httpserver/`                         | Optional Go server for KOReader/OPDS integration                               |

## IPC Communication Pattern

All renderer↔main communication uses Electron IPC. Main handlers are registered inside `createMainWin()` in `main.js`.

- **Renderer → Main (async):** `ipcRenderer.invoke("channel-name", config)` / `ipcMain.handle(...)`
- **Renderer → Main (sync):** `ipcRenderer.sendSync("channel-name")` / `ipcMain.on(...)` with `event.returnValue`
- **Main → Renderer (push):** `mainWin.webContents.send("event-name", payload)`

Key channels: `open-book`, `new-tab`, `exit-tab`, `database-command`, `cloud-upload/download`, `discord-rpc-update`, `prompt-biometric-auth`.

## Redux State Structure

State slices in `src/store/reducers/` — connected via `src/store/index.tsx`:

- `book` – current book, notes, bookmarks, render functions
- `reader` – reader UI state (mode, scale, theme, nav lock)
- `manager` – library, plugins, auth, dialogs
- `viewArea` – menu open/mode state
- `backupPage` – sync/drive config
- `sidebar`, `progressPanel` – UI panels

Containers follow the `index.tsx` (connect) → `component.tsx` (React class/func) → `interface.tsx` (prop types) pattern in `src/containers/`.

## Database Access

All DB operations go through the main process via the `database-command` IPC channel. SQL statements and schema are defined in `kookit-extra.min.mjs` (`SqlStatement`). Never open SQLite directly from the renderer.

```ts
// Renderer example
ipcRenderer.invoke("database-command", {
  statement: "saveBook",
  statementType: "function",
  executeType: "run",
  dbName: "book",
  data: bookObj,
  storagePath: dirPath,
});
```

## Reader Tab vs. Reader Window

- **`new-tab`** – opens a `WebContentsView` overlaid on `mainWin` (in-app tab, used for book reading within the main window).
- **`open-book`** – opens a separate `BrowserWindow` (`readerWindow`). Supports fullscreen, merge-word (frameless transparent), and always-on-top.
- Reader close is two-phase: main sends `before-reader-close` → renderer flushes reading-time data → renderer replies `reader-close-ready` → main closes window.

## Reader Utilities (`src/utils/reader/`)

| File            | Purpose                                      |
| --------------- | -------------------------------------------- |
| `styleUtil.ts`  | Font, layout, CSS injection into book iframe |
| `themeUtil.ts`  | Background/text color themes                 |
| `noteUtil.ts`   | Highlight/note rendering in book content     |
| `ttsUtil.ts`    | Text-to-speech coordination                  |
| `mouseEvent.ts` | Touch/mouse event handling in reader         |
| `discordRPC.ts` | Discord Rich Presence update calls           |
| `launchUtil.ts` | Book launch/open coordination                |

## Developer Workflows

```bash
npm run dev          # Start React dev server + Electron with hot reload (nodemon)
npm start            # React dev server only (port 3000)
npm run ele          # Electron only (needs built or running React server)
npm run build        # Production React build → build/
npm run release      # Build + package Electron app (electron-builder)
npm run rebuild      # Rebuild native modules (better-sqlite3) for current Electron
```

- Dev mode uses `http://localhost:3000`; production uses `file://build/index.html`.
- `electron-store` persists window positions, user preferences, and encrypted tokens between sessions.
- Logs go to `userData/debug.log` via `electron-log`; accessible via **Settings → Debug Logs**.

## Key Conventions

- **i18n:** All UI strings use `react-i18next`. Translation files are in `src/assets/locales/`. Run `node scripts/i18n-script.js` to manage translations.
- **Plugins:** Loaded as `PluginModel` objects from DB; plugin scripts are `eval()`'d in the main process for TTS (`generate-tts` IPC handler).
- **Cloud sync:** Instantiated lazily via `getSyncUtil(config)` in `main.js`; cached per service in `syncUtilCache`. Services: OneDrive, Google Drive, Dropbox, WebDAV, S3, SFTP, FTP, SMB, MEGA, etc.
- **Biometric auth:** macOS uses Touch ID (`systemPreferences.promptTouchID`); Windows uses Windows Hello via PowerShell WinRT bridging.
- **Book cover/style assets:** Stored under `userData/uploads/`; path exposed to renderer via `user-data` IPC sync channel.
