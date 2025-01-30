import { Dispatch } from "redux";
import ConfigService from "../../utils/storage/configService";

export function handleBackupDialog(mode: boolean) {
  return { type: "HANDLE_BACKUP", payload: mode };
}
export function handleTokenDialog(mode: boolean) {
  return { type: "HANDLE_TOKEN_DIALOG", payload: mode };
}
export function handleDataSourceList(dataSource: any) {
  return { type: "SET_DATA_SOURCE", payload: dataSource };
}
export function handleFetchDataSourceList() {
  return (dispatch: Dispatch) => {
    let dataSourceList = ConfigService.getAllListConfig("dataSourceList") || [];
    dispatch(handleDataSourceList(dataSourceList));
  };
}
export function handleDefaultSyncOption(option: string) {
  return { type: "HANDLE_DEFAULT_SYNC_OPTION", payload: option };
}
export function handleFetchDefaultSyncOption() {
  return (dispatch: Dispatch) => {
    let defaultSyncOption =
      ConfigService.getReaderConfig("defaultSyncOption") || "local";
    dispatch(handleDefaultSyncOption(defaultSyncOption));
  };
}
