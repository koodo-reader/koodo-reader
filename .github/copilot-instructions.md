# Koodo Reader – Code Review Standards

## Security Critical Issues

- Validate all IPC arguments from the renderer before filesystem, DB, or shell operations
- Never log tokens, passwords, or full book-file paths at info level (use `electron-log` at debug)
- Flag any new `eval()` call; existing plugin TTS/dictionary paths in the main process are intentional
- Sanitize HTML injected into reader iframes (style/note utilities in `src/utils/reader/`)
- Check for hardcoded credentials, API keys, or secrets in code and config files
- Review authentication and authorization on any new OPDS or cloud-sync endpoints

## Performance Red Flags

- Flag synchronous file I/O on the Electron main thread (`fs.readFileSync` / `fs.writeFileSync`)
- Identify N+1 database query patterns or missing batch operations
- Ensure resize/scroll event handlers are throttled (see existing `RESIZE_THROTTLE_MS` pattern)
- Verify resource cleanup on window close and reader exit (downloads, DB connections, temp files)

## Code Quality Essentials

- All user-visible strings must use `react-i18next` (`t("key")`) — never hardcode English text
- Never open SQLite directly from the renderer — all DB work goes through the `database-command` IPC channel
- Avoid `any` in TypeScript; define interfaces in co-located `interface.tsx` files
- Remove dead code, commented-out blocks, and unused imports before merging

## Review Style

- Be specific and actionable; explain the "why" behind each recommendation
- Prioritize security vulnerabilities and main-thread-blocking issues above style comments
- Ask a clarifying question when intent around IPC channels or window lifecycle is ambiguous
- Acknowledge good patterns when you see them

## Testing Standards

- Changes to `src/utils/reader/` (live iframe rendering) require manual verification for layout regressions
- New IPC handlers must handle error paths; do not silently swallow failures
- New i18n keys in `en.json` must have corresponding `t()` call sites in `src/`

---

## Architecture Context

Koodo Reader is an **Electron + React (CRA) + Redux** cross-platform ebook reader.

| Layer | Location | Role |
| ----- | -------- | ---- |
| Electron main | `main.js` | IPC handlers, SQLite via `better-sqlite3`, cloud sync, native integrations |
| React renderer | `src/` | UI, Redux state, book rendering |
| Reader engine | `src/assets/lib/kookit-extra.min.mjs` | Closed-source ESM — book parsing, SQL statements, sync utilities |
| HTTP server | `httpserver/` | Optional Go server for KOReader / OPDS integration |

**Key IPC channels:** `open-book`, `new-tab`, `exit-tab`, `database-command`, `cloud-upload/download`, `discord-rpc-update`, `prompt-biometric-auth`

**Redux slices:** `book`, `reader`, `manager`, `viewArea`, `backupPage`, `sidebar`, `progressPanel`

**Container pattern:** `index.tsx` (Redux connect) → `component.tsx` → `interface.tsx` in `src/containers/`

**Window modes:** `new-tab` → `WebContentsView` overlay (in-app); `open-book` → separate `BrowserWindow`. Reader close is two-phase: `before-reader-close` → flush data → `reader-close-ready`.

Path-specific review rules are in `.github/instructions/` for `main.js`, `src/**/*.{ts,tsx}`, `httpserver/**`, and `src/assets/locales/**`.
