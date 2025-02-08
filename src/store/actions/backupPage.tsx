import { Dispatch } from "redux";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { getUserRequest } from "../../utils/request/user";
import { handleExitApp } from "../../utils/request/common";

export function handleBackupDialog(mode: boolean) {
  return { type: "HANDLE_BACKUP", payload: mode };
}
export function handleTokenDialog(mode: boolean) {
  return { type: "HANDLE_TOKEN_DIALOG", payload: mode };
}
export function handleDataSourceList(dataSource: any) {
  return { type: "SET_DATA_SOURCE", payload: dataSource };
}
export function handleLoginOptionList(loginOptionList: any) {
  return { type: "HANDLE_LOGIN_OPTION", payload: loginOptionList };
}
export function handleFetchDataSourceList() {
  return (dispatch: Dispatch) => {
    let dataSourceList = ConfigService.getAllListConfig("dataSourceList") || [];
    dispatch(handleDataSourceList(dataSourceList));
  };
}
export function handleFetchLoginOptionList() {
  return async (dispatch: Dispatch) => {
    let loginOptionList: string[] = [];
    let userRequest = await getUserRequest();
    let response = await userRequest.getLogins();
    if (response.code === 200) {
      loginOptionList = response.data;
    } else if (response.code === 401) {
      handleExitApp();
    }
    dispatch(handleLoginOptionList(loginOptionList));
  };
}
export function handleDefaultSyncOption(option: string) {
  return { type: "HANDLE_DEFAULT_SYNC_OPTION", payload: option };
}
export function handleFetchDefaultSyncOption() {
  return (dispatch: Dispatch) => {
    let defaultSyncOption = localStorage.getItem("defaultSyncOption") || "";
    dispatch(handleDefaultSyncOption(defaultSyncOption));
  };
}
