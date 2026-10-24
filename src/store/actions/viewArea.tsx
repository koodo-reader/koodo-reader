export function handleOpenMenu(isOpenMenu: boolean) {
  return { type: "HANDLE_OPEN_MENU", payload: isOpenMenu };
}
export function handleMenuMode(menuMode: string) {
  return { type: "HANDLE_MENU_MODE", payload: menuMode };
}
export function handleChangeDirection(isChangeDirection: boolean) {
  return { type: "HANDLE_CHANGE_DIRECTION", payload: isChangeDirection };
}
export function handleShowBookmark(isShowBookmark: boolean) {
  return { type: "HANDLE_SHOW_BOOKMARK", payload: isShowBookmark };
}
