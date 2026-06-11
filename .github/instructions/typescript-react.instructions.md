---
applyTo: "src/**/*.{ts,tsx}"
---

# TypeScript / React Guidelines

## Purpose

Review rules for the React renderer, Redux store, components, and reader utilities under `src/`.

## Type Safety

- Avoid `any`; define interfaces in co-located `interface.tsx` files
- Type Redux `mapStateToProps` with `stateType` from `src/store`
- Type IPC payloads when adding new renderer-side invoke calls

```typescript
// Avoid
function handleBook(book: any) {
  return book.key;
}

// Prefer
interface BookRecord {
  key: string;
  name: string;
}

function handleBook(book: BookRecord): string {
  return book.key;
}
```

## Component Structure

- Follow container pattern: `index.tsx` (Redux connect) → `component.tsx` → `interface.tsx`
- Keep components focused; extract reusable UI into `src/components/`
- Match existing class or function component style in the surrounding folder

## Redux Conventions

- Add actions in `src/store/actions/` and reducers in `src/store/reducers/`
- Avoid mutating state; follow existing reducer patterns in the target slice
- Do not access SQLite or filesystem directly from the renderer

## i18n

- All user-visible strings must use `react-i18next` (`t("key")`), not hardcoded English
- Add keys to locale JSON under `src/assets/locales/` when introducing new UI text
- Do not edit translated locale files for non-English languages unless the PR explicitly updates translations

## Reader Utilities (`src/utils/reader/`)

- Changes affect live book rendering inside iframes—review for layout regressions and XSS
- Coordinate with reader tab (`new-tab`) vs reader window (`open-book`) lifecycle
- Reader close is two-phase: `before-reader-close` → flush data → `reader-close-ready`

## Error Handling

- Surface user-facing errors via existing toast/dialog patterns
- Do not swallow IPC failures silently; log or notify the user

## Testing Guidelines

- Reader utility changes (`src/utils/reader/`) need manual regression testing in both tab and window reader modes
- New Redux actions should have corresponding reducer tests verifying state shape
- IPC failure paths must surface errors via toast/dialog, not silent swallows

## Security Considerations

- Flag new `eval()` in popup or plugin components; existing plugin TTS/dictionary paths are intentional
- Sanitize HTML injected into reader iframes in style/note utilities

## Performance

- Avoid re-rendering heavy components on every Redux state change—use `shouldComponentUpdate` or `React.memo`
- Prefer lazy imports for large reader libraries not needed on initial load
