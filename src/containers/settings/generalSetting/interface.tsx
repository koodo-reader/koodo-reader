import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {










  t: (title: string) => string;








}
export interface SettingInfoState {


  isMergeWord: boolean;

  isImportPath: boolean;


  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isAlwaysOnTop: boolean;
  isAutoMaximizeWin: boolean;
  isAutoLaunch: boolean;
  isMinimizeToTray: boolean;
  isOpenInMain: boolean;
  isDisableUpdate: boolean;
  isExportOriginalName: boolean;
  isDisableAI: boolean;
  isUseOriginalName: boolean;
  isAIAnalyzeTitle: boolean;
  isPrecacheBook: boolean;
  isUseBuiltIn: boolean;
  isDeleteOriginal: boolean;

  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  startupShelf: string;
}
