export function handleShelf(shelfTitle: string) {
  return { type: "HANDLE_SHELF", payload: shelfTitle };
}
export function handleCollapse(isCollapsed: boolean) {
  return { type: "HANDLE_COLLAPSE", payload: isCollapsed };
}
export function handleMode(mode: string) {
  return { type: "HANDLE_MODE", payload: mode };
}
