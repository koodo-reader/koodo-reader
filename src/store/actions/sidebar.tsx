export function handleShelfIndex(shelfIndex: number) {
  return { type: "HANDLE_SHELF_INDEX", payload: shelfIndex };
}
export function handleCollapse(isCollapsed: boolean) {
  return { type: "HANDLE_COLLAPSE", payload: isCollapsed };
}
export function handleMode(mode: string) {
  return { type: "HANDLE_MODE", payload: mode };
}
