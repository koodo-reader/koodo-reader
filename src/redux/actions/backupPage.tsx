export function handleBackupDialog(mode: boolean) {
  return { type: "HANDLE_BACKUP", payload: mode };
}
export function handleTokenDialog(mode: boolean) {
  return { type: "HANDLE_TOKEN_DIALOG", payload: mode };
}
