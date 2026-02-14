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
  officialVoiceList,
} from "../../constants/settingList";
import toast from "react-hot-toast";
import BookUtil from "../../utils/file/bookUtil";
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
export function handleLoadMore(isLoadMore: boolean) {
  return { type: "HANDLE_LOAD_MORE", payload: isLoadMore };
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
  return async (dispatch: Dispatch) => {
    let bookSortCodeStr =
      ConfigService.getReaderConfig("bookSortCode") || '{"sort":1,"order":2}';
    let bookSortCode = JSON.parse(bookSortCodeStr);
    let sortField = "key";
    switch (bookSortCode.sort) {
      case 1:
        sortField = "recentRead";
        break;
      case 2:
        sortField = "name";
        break;
      case 3:
        sortField = "key";
        break;
      case 4:
        sortField = "readingTime";
        break;
      case 5:
        sortField = "author";
        break;
      case 6:
        sortField = "percentage";
        break;
    }
    let orderField = "ASC";
    if (bookSortCode.order === 2) {
      orderField = "DESC";
    }
    let bookList: { key: string }[] = [];
    if (sortField === "recentRead") {
      let allBookKeys = await DatabaseService.getAllRecordKeys("books");
      let recentBookLKeys = ConfigService.getAllListConfig("recentBooks") || [];
      let sortedKeys = [
        ...recentBookLKeys.filter((key) => allBookKeys.includes(key)),
        ...allBookKeys.filter((key) => !recentBookLKeys.includes(key)),
      ];
      if (bookSortCode.order === 1) {
        sortedKeys = sortedKeys.reverse();
      }
      sortedKeys = sortedKeys;
      bookList = sortedKeys.map((key: string) => {
        return { key };
      });
    } else if (sortField === "readingTime") {
      let allBookKeys = await DatabaseService.getAllRecordKeys("books");
      let durationObj = ConfigService.getAllObjectConfig("readingTime");
      var sortable: any[] = [];
      for (let obj in durationObj) {
        sortable.push([obj, durationObj[obj]]);
      }
      sortable.sort(function (a, b) {
        return a[1] - b[1];
      });
      let recentBookLKeys = Object.keys(durationObj) || [];
      let sortedKeys = [
        ...recentBookLKeys.filter((key) => allBookKeys.includes(key)),
        ...allBookKeys.filter((key) => !recentBookLKeys.includes(key)),
      ];
      if (bookSortCode.order === 1) {
        sortedKeys = sortedKeys.reverse();
      }
      sortedKeys = sortedKeys;
      bookList = sortedKeys.map((key: string) => {
        return { key };
      });
    } else if (sortField === "percentage") {
      let allBookKeys = await DatabaseService.getAllRecordKeys("books");
      let locationObj = ConfigService.getAllObjectConfig("recordLocation");
      var sortable: any[] = [];
      for (let obj in locationObj) {
        sortable.push([obj, locationObj[obj].percentage || 0]);
      }
      sortable.sort(function (a, b) {
        return b[1] - a[1];
      });
      let recentBookLKeys = sortable.map((item) => item[0]) || [];
      let sortedKeys = [
        ...recentBookLKeys.filter((key) => allBookKeys.includes(key)),
        ...allBookKeys.filter((key) => !recentBookLKeys.includes(key)),
      ];
      if (bookSortCode.order === 1) {
        sortedKeys = sortedKeys.reverse();
      }
      sortedKeys = sortedKeys;
      bookList = sortedKeys.map((key: string) => {
        return { key };
      });
    } else {
      bookList = await BookUtil.getBookKeysWithSort(sortField, orderField);
    }

    let deletedBookKeys = ConfigService.getAllListConfig("deletedBooks");
    let books = bookList.filter(
      (item: { key: string }) => !deletedBookKeys.includes(item.key)
    );
    dispatch(handleBooks(books as BookModel[]));
    dispatch(
      handleDeletedBooks(deletedBookKeys.map((key) => ({ key })) as BookModel[])
    );
    // DatabaseService.getAllRecords("books").then((value) => {
    //   let bookArr: any = value;
    //   let keyArr = ConfigService.getAllListConfig("deletedBooks");
    //   dispatch(handleDeletedBooks(handleKeyFilter(bookArr, keyArr)));
    //   dispatch(handleBooks(handleKeyRemove(bookArr, keyArr)));
    // });
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
      if (
        userInfo.is_enable_koodo_sync === "yes" &&
        userInfo.default_sync_option &&
        userInfo.default_sync_token
      ) {
        if (
          ConfigService.getItem("defaultSyncOption") ===
          userInfo.default_sync_option
        ) {
          let encryptedToken = await TokenService.getToken(
            userInfo.default_sync_option + "_token"
          );
          if (encryptedToken !== userInfo.default_sync_token) {
            await TokenService.setToken(
              userInfo.default_sync_option + "_token",
              userInfo.default_sync_token
            );
          }
        }
      }
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
            let sortedVoiceList = [...officialVoiceList];
            if (
              ConfigService.getReaderConfig("lang") &&
              ConfigService.getReaderConfig("lang").startsWith("zh")
            ) {
              //move zh-CN to first
              sortedVoiceList.sort((a: any, b: any) => {
                if (a.locale === "zh-CN") {
                  return -1;
                } else if (b.locale === "zh-CN") {
                  return 1;
                } else {
                  return 0;
                }
              });
            }
            let voicePlugin = new PluginModel(
              "official-ai-voice-plugin",
              "voice",
              "Official AI Voice",
              "speaker",
              "1.0.0",
              "",
              {},
              {},
              sortedVoiceList.map((item: any) => {
                return {
                  ...item, // 创建新对象
                  plugin: "official-ai-voice-plugin",
                  config: {},
                  displayName:
                    i18n.t("Official AI Voice") +
                    " - " +
                    item.displayName +
                    " - " +
                    item.language +
                    " - " +
                    (item.gender === "female"
                      ? i18n.t("Female voice")
                      : i18n.t("Male voice")),
                };
              }),
              "",
              ""
            );
            pluginList.push(voicePlugin);
            dispatch(handlePlugins(pluginList));
          } else {
            dispatch(handlePlugins(pluginList));
          }
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage);
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
        if (isAuthed && !ConfigService.getItem("serverRegion")) {
          ConfigService.setItem("serverRegion", "global");
        }
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
      ConfigService.getReaderConfig("noteSortCode") || '{"sort": 1, "order": 2}'
    );
    dispatch(handleNoteSortCode(noteSortCode));
  };
}
export function handleFetchViewMode() {
  return (dispatch: Dispatch) => {
    let viewMode = ConfigService.getReaderConfig("viewMode") || "card";
    dispatch(handleViewMode(viewMode));
  };
}
