export function handleShelfIndex(shelfIndex: number) {
  return { type: "HANDLE_SHELF_INDEX", payload: shelfIndex };
}

export function handleMode(mode: string) {
  return { type: "HANDLE_MODE", payload: mode };
}
