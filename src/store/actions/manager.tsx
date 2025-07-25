import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import { Dispatch } from "redux";
import DatabaseService from "../../utils/storage/databaseService";
import { fetchUserInfo } from "../../utils/request/user";
import {
  officialDictList,
  officialTranList,
} from "../../constants/settingList";
import toast from "react-hot-toast";
import i18n from "../../i18n";

export function handleBooks(books: BookModel[]) {
  return { type: "HANDLE_BOOKS", payload: books };
}
export function handlePlugins(plugins: PluginModel[]) {
  return { type: "HANDLE_PLUGINS", payload: plugins };
}
export function handleDeletedBooks(deletedBooks: BookModel[]) {
  return { type: "HANDLE_DELETED_BOOKS", payload: deletedBooks };
}
export function handleSearchResults(searchResults: number[]) {
  return { type: "HANDLE_SEARCH_BOOKS", payload: searchResults };
}
export function handleSearch(isSearch: boolean) {
  return { type: "HANDLE_SEARCH", payload: isSearch };
}
export function handleUserInfo(userInfo: any) {
  return { type: "HANDLE_USER_INFO", payload: userInfo };
}
export function handleDetailDialog(isDetailDialog: boolean) {
  return { type: "HANDLE_DETAIL_DIALOG", payload: isDetailDialog };
}
export function handleSetting(isSettingOpen: boolean) {
  return { type: "HANDLE_SETTING", payload: isSettingOpen };
}
export function handleSettingMode(settingMode: string) {
  return { type: "HANDLE_SETTING_MODE", payload: settingMode };
}
export function handleShowPopupNote(isShowPopupNote: boolean) {
  return { type: "HANDLE_SHOW_POPUP_NOTE", payload: isShowPopupNote };
}
export function handleSettingDrive(settingDrive: string) {
  return { type: "HANDLE_SETTING_DRIVE", payload: settingDrive };
}
export function handleAbout(isAboutOpen: boolean) {
  return { type: "HANDLE_ABOUT", payload: isAboutOpen };
}

export function handleViewMode(mode: string) {
  return { type: "HANDLE_VIEW_MODE", payload: mode };
}

export function handleSortDisplay(isSortDisplay: boolean) {
  return { type: "HANDLE_SORT_DISPLAY", payload: isSortDisplay };
}
export function handleLoadingDialog(isShowLoading: boolean) {
  return { type: "HANDLE_SHOW_LOADING", payload: isShowLoading };
}
export function handleNewDialog(isShowNew: boolean) {
  return { type: "HANDLE_SHOW_NEW", payload: isShowNew };
}
export function handleSelectBook(isSelectBook: boolean) {
  return { type: "HANDLE_SELECT_BOOK", payload: isSelectBook };
}
export function handleSelectedBooks(selectedBooks: string[]) {
  return { type: "HANDLE_SELECTED_BOOKS", payload: selectedBooks };
}
export function handleNewWarning(isNewWarning: boolean) {
  return { type: "HANDLE_NEW_WARNING", payload: isNewWarning };
}
export function handleShowSupport(isShowSupport: boolean) {
  return { type: "HANDLE_SHOW_SUPPORT", payload: isShowSupport };
}
export function handleBookSort(isBookSort: boolean) {
  return { type: "HANDLE_BOOK_SORT", payload: isBookSort };
}
export function handleNoteSort(isNoteSort: boolean) {
  return { type: "HANDLE_NOTE_SORT", payload: isNoteSort };
}
export function handleFeedbackDialog(mode: boolean) {
  return { type: "HANDLE_FEEDBACK_DIALOG", payload: mode };
}
export function handleAuthed(isAuthed: boolean) {
  return { type: "HANDLE_AUTHED", payload: isAuthed };
}
export function handleBookSortCode(bookSortCode: {
  sort: number;
  order: number;
}) {
  return { type: "HANDLE_SORT_CODE", payload: bookSortCode };
}

export function handleNoteSortCode(noteSortCode: {
  sort: number;
  order: number;
}) {
  return { type: "HANDLE_NOTE_SORT_CODE", payload: noteSortCode };
}

export function handleFetchBooks() {
  return (dispatch: Dispatch) => {
    DatabaseService.getAllRecords("books").then((value) => {
      let bookArr: any = value;
      let keyArr = ConfigService.getAllListConfig("deletedBooks");
      dispatch(handleDeletedBooks(handleKeyFilter(bookArr, keyArr)));
      dispatch(handleBooks(handleKeyRemove(bookArr, keyArr)));
    });
  };
}
export function handleFetchUserInfo() {
  return async (dispatch: Dispatch) => {
    let response = await fetchUserInfo();
    let userInfo: any = null;
    if (response.code === 200) {
      userInfo = response.data;
      ConfigService.setReaderConfig(
        "isEnableKoodoSync",
        userInfo.is_enable_koodo_sync || "no"
      );
    }
    if (
      userInfo &&
      userInfo.valid_until < parseInt(new Date().getTime() / 1000 + "")
    ) {
      dispatch(handleShowSupport(true));
    }
    dispatch(handleUserInfo(userInfo));
  };
}
export function handleFetchPlugins() {
  return async (dispatch: Dispatch) => {
    DatabaseService.getAllRecords("plugins").then((pluginList) => {
      try {
        TokenService.getToken("is_authed").then((value) => {
          let isAuthed = value === "yes";
          if (isAuthed) {
            let dictPlugin = new PluginModel(
              "official-ai-dict-plugin",
              "dictionary",
              "Official AI Dictionary",
              "dict",
              "1.0.0",
              "",
              {},
              officialDictList,
              [],
              "",
              ""
            );
            pluginList.push(dictPlugin);
            let transPlugin = new PluginModel(
              "official-ai-trans-plugin",
              "translation",
              "Official AI Translation",
              "translation",
              "1.0.0",
              "",
              {},
              officialTranList,
              [],
              "",
              ""
            );
            pluginList.push(transPlugin);
            let sumPlugin = new PluginModel(
              "official-ai-assistant-plugin",
              "assistant",
              "Official AI Assistant",
              "assistant",
              "1.0.0",
              "",
              {},
              officialTranList,
              [],
              "",
              ""
            );
            pluginList.push(sumPlugin);
            dispatch(handlePlugins(pluginList));
          } else {
            dispatch(handlePlugins(pluginList));
          }
        });
      } catch (error) {
        console.error(error);
      }
    });
  };
}
export function handleFetchAuthed() {
  return (dispatch: Dispatch) => {
    try {
      TokenService.getToken("is_authed").then((value) => {
        let isAuthed = value === "yes";
        dispatch(handleAuthed(isAuthed));
      });
    } catch (error) {
      console.error(error);
    }
  };
}
export function handleFetchBookSortCode() {
  return (dispatch: Dispatch) => {
    let bookSortCode = JSON.parse(
      ConfigService.getReaderConfig("bookSortCode") || '{"sort": 1, "order": 2}'
    );
    dispatch(handleBookSortCode(bookSortCode));
  };
}
export function handleFetchNoteSortCode() {
  return (dispatch: Dispatch) => {
    let noteSortCode = JSON.parse(
      ConfigService.getReaderConfig("noteSortCode") || '{"sort": 2, "order": 2}'
    );
    dispatch(handleNoteSortCode(noteSortCode));
  };
}
export function handleFetchList() {
  return (dispatch: Dispatch) => {
    let viewMode = ConfigService.getReaderConfig("viewMode") || "card";
    dispatch(handleViewMode(viewMode));
  };
}
const handleKeyRemove = (items: any[], arr: string[]) => {
  if (!items) return [];
  let itemArr: any[] = [];
  if (!arr[0]) {
    return items;
  }
  for (let item of items) {
    if (arr.indexOf(item.key) === -1) {
      itemArr.push(item);
    }
  }

  return itemArr;
};
const handleKeyFilter = (items: any[], arr: string[]) => {
  if (!items) {
    return [];
  }
  let itemArr: any[] = [];
  for (let item of items) {
    if (arr.indexOf(item.key) > -1) {
      itemArr.push(item);
    }
  }
  return itemArr;
};
