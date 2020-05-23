export function handleOpenMenu(isOpenMenu: boolean) {
  return { type: "HANDLE_OPEN_MENU", payload: isOpenMenu };
}
export function handleMenuMode(menuMode: string) {
  return { type: "HANDLE_MENU_MODE", payload: menuMode };
}
export function handleOpenHighlight(isOpenHighlight: boolean) {
  return { type: "HANDLE_OPEN_HIGHLIGHT", payload: isOpenHighlight };
}
export function handleChangeDirection(isChangeDirection: boolean) {
  console.log(isChangeDirection, "isChangeDirection");
  return { type: "HANDLE_CHANGE_DIRECTION", payload: isChangeDirection };
}
export function handleSelection(selection: string) {
  return { type: "HANDLE_SELECTION", payload: selection };
}
