import { create } from "zustand";
import BookModel from "../models/Book";
import PluginModel from "../models/Plugin";
import NoteModel from "../models/Note";
import BookmarkModel from "../models/Bookmark";
import HtmlBookModel from "../models/HtmlBook";
import Note from "../models/Note";
import Bookmark from "../models/Bookmark";
import {
  ConfigService,
  HighlightUtil,
  KookitConfig,
  CollectionUtil,
} from "../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../utils/storage/databaseService";
import {
  fetchUserInfo,
  getUserRequest,
  resetUserRequest,
} from "../utils/request/user";
import { resetReaderRequest } from "../utils/request/reader";
import { resetThirdpartyRequest } from "../utils/request/thirdparty";
import { officialDictList, officialTranList } from "../constants/settingList";
import BookUtil from "../utils/file/bookUtil";
import ConfigUtil from "../utils/file/configUtil";
import DictUtil from "../utils/file/dictUtil";
import TokenService from "../utils/storage/tokenService";
import { resolveStoredPlugin } from "../utils/plugins/records";
import { handleExitApp } from "../utils/request/common";
import { HighlightValue, langToName } from "../utils/common";
import toast from "react-hot-toast";
import i18n from "../i18n";

const collectionUtil = new CollectionUtil(ConfigService);
const highlightUtil = new HighlightUtil(ConfigService);

const initialManager = {
  books: null as unknown as BookModel[],
  plugins: null as unknown as PluginModel[],
  deletedBooks: [] as BookModel[],
  searchResults: [] as number[],
  isSearch: false,
  isShowPopupNote: false,
  isAboutOpen: false,
  isAuthed: false,
  userInfo: null as any,
  userConfig: null as any,
  isSettingOpen: false,
  viewMode: "card",
  isSortDisplay: false,
  isShowLoading: false,
  isNewWarning: false,
  isDetailDialog: false,
  isLoadMore: false,
  isShowNew: false,
  isShowSupport: false,
  bookSortCode: { sort: 1, order: 2 },
  noteSortCode: { sort: 1, order: 2 },
  isSelectBook: false,
  message: "Addition successful",
  refreshBookKey: "",
  settingMode: "general",
  pluginSettingTab: "",
  settingDrive: "",
  selectedBooks: [] as string[],
};

const initialBook = {
  isOpenEditDialog: false,
  isDetailDialog: false,
  isOpenDeleteDialog: false,
  isOpenAddDialog: false,
  isOpenActionDialog: false,
  isReading: false,
  currentBook: {} as BookModel,
  renderBookFunc: (() => {}) as () => void,
  importBookFunc: (() => {}) as unknown as (file: any) => Promise<void>,
  cloudSyncFunc: (() => {}) as unknown as (userInfo?: any) => Promise<void>,
};

const initialReader = {
  bookmarks: [] as BookmarkModel[],
  notes: [] as NoteModel[],
  highlights: [] as NoteModel[],
  chapters: null as unknown as any[],
  currentChapter: "",
  currentChapterIndex: 0,
  highlight: highlightUtil.getNoteHighlightValue() as HighlightValue,
  backgroundColor:
    ConfigService.getReaderConfig("isMergeWord") === "yes"
      ? "rgba(0,0,0,0)"
      : ConfigService.getReaderConfig("backgroundColor")
        ? ConfigService.getReaderConfig("backgroundColor")
        : ConfigService.getReaderConfig("appSkin") === "night" ||
            (ConfigService.getReaderConfig("appSkin") === "system" &&
              ConfigService.getReaderConfig("isOSNight") === "yes")
          ? "rgba(44,47,49,1)"
          : "rgba(255,255,255,1)",
  noteKey: "",
  originalText: "",
  originalSentence: "",
  quoteText: "",
  htmlBook: null as unknown as HtmlBookModel,
  scale: ConfigService.getReaderConfig("scale") || "1",
  isFitPage: ConfigService.getReaderConfig("isFitPage") === "yes",
  margin: ConfigService.getReaderConfig("margin") || "0",
  section: null as any,
  readerMode: "double",
  isConvertOpen: false,
  isScaleOpen: false,
  isPdfCropOpen: false,
  isStudyLangOpen: false,
  isAssistReadOpen: false,
  isSpeechOpen: false,
  isAnnotationOpen: false,
  speechStartText: "",
  isSpeechAutoStart: false,
  isNavLocked: ConfigService.getReaderConfig("isNavLocked") === "yes",
  isSettingLocked: ConfigService.getReaderConfig("isSettingLocked") === "yes",
  isDockedRight: ConfigService.getReaderConfig("isDockedRight") === "yes",
  isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
  isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
  isHideBackground: ConfigService.getReaderConfig("isHideBackground") === "yes",
  isParagraphMode: ConfigService.getReaderConfig("isParagraphMode") === "yes",
  isReadingRuler: ConfigService.getReaderConfig("isReadingRuler") === "yes",
  isSpeedReading: ConfigService.getReaderConfig("isSpeedReading") === "yes",
  isAutoReading: ConfigService.getReaderConfig("isAutoReading") === "yes",
  isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
  isShowPageBorder: ConfigService.getReaderConfig("isShowPageBorder") === "yes",
  textOrientation: ConfigService.getReaderConfig("textOrientation") || "",
  jumpPosition: null as object | null,
  readerBackgroundImage:
    ConfigService.getReaderConfig("readerBackgroundImage") || "",
};

const initialProgressPanel = {
  percentage: null as unknown as number,
};

const initialViewArea = {
  menuMode: "menu",
  isOpenMenu: false,
  isChangeDirection: false,
  isShowBookmark: false,
};

const initialSidebar = {
  mode: "home",
  shelfTitle: "",
  isCollapsed: ConfigService.getReaderConfig("isCollapsed") === "yes",
};

const initialBackupPage = {
  isBackup: false,
  isOpenLocalFileDialog: false,
  isOpenTokenDialog: false,
  isOpenImportDialog: false,
  isOpenOPDSDialog: false,
  isOpenAutoImportDialog: false,
  isOpenSortShelfDialog: false,
  isOpenPopupOptionDialog: false,
  popupOptionUpdateIndex: 0,
  dataSourceList: [] as string[],
  loginOptionList: [] as { email: string; provider: string }[],
  defaultSyncOption: "",
};

const initialCollection = {
  isOpenCollectionDialog: false,
  collectionDialogBooks: [] as string[],
  collectionDialogKey: "",
  isOpenCollectionDetailDialog: false,
  isOpenAddCollectionDialog: false,
  currentCollectionKey: "",
};

export type stateType = {
  manager: typeof initialManager;
  book: typeof initialBook;
  reader: typeof initialReader;
  progressPanel: typeof initialProgressPanel;
  viewArea: typeof initialViewArea;
  sidebar: typeof initialSidebar;
  backupPage: typeof initialBackupPage;
  collection: typeof initialCollection;
};

export type AppActionName =
  | "handleAbout"
  | "handleActionDialog"
  | "handleAddCollectionDialog"
  | "handleAddDialog"
  | "handleAnnotationDialog"
  | "handleAssistReadDialog"
  | "handleAuthed"
  | "handleAutoImportDialog"
  | "handleAutoReading"
  | "handleBackgroundColor"
  | "handleBookSortCode"
  | "handleBookmarks"
  | "handleBooks"
  | "handleChangeDirection"
  | "handleCloudSyncFunc"
  | "handleCollapse"
  | "handleCollectionDetailDialog"
  | "handleCollectionDialog"
  | "handleCollectionDialogBooks"
  | "handleCollectionDialogKey"
  | "handleConvertDialog"
  | "handleCurrentChapter"
  | "handleCurrentChapterIndex"
  | "handleCurrentCollectionKey"
  | "handleDataSourceList"
  | "handleDefaultSyncOption"
  | "handleDeleteDialog"
  | "handleDeletedBooks"
  | "handleDetailDialog"
  | "handleDockedRight"
  | "handleEditDialog"
  | "handleFetchAuthed"
  | "handleFetchBookSortCode"
  | "handleFetchBookmarks"
  | "handleFetchBooks"
  | "handleFetchDataSourceList"
  | "handleFetchDefaultSyncOption"
  | "handleFetchLoginOptionList"
  | "handleFetchNoteSortCode"
  | "handleFetchNotes"
  | "handleFetchPercentage"
  | "handleFetchPlugins"
  | "handleFetchUserInfo"
  | "handleFetchViewMode"
  | "handleFitPage"
  | "handleHideBackground"
  | "handleHideFooter"
  | "handleHideHeader"
  | "handleHighlight"
  | "handleHighlights"
  | "handleHtmlBook"
  | "handleImportBookFunc"
  | "handleImportDialog"
  | "handleJumpPosition"
  | "handleLoadMore"
  | "handleLoadingDialog"
  | "handleLocalFileDialog"
  | "handleLoginOptionList"
  | "handleMargin"
  | "handleMenuMode"
  | "handleMergeWord"
  | "handleMode"
  | "handleNavLock"
  | "handleNewDialog"
  | "handleNewWarning"
  | "handleNoteKey"
  | "handleNoteSortCode"
  | "handleNotes"
  | "handleOPDSDialog"
  | "handleOpenMenu"
  | "handleOriginalSentence"
  | "handleOriginalText"
  | "handleParagraphMode"
  | "handlePdfCropDialog"
  | "handlePercentage"
  | "handlePluginSettingTab"
  | "handlePlugins"
  | "handlePopupOptionDialog"
  | "handlePopupOptionUpdate"
  | "handleQuoteText"
  | "handleReaderBackgroundImage"
  | "handleReaderMode"
  | "handleReadingBook"
  | "handleReadingRuler"
  | "handleReadingState"
  | "handleRefreshBookCover"
  | "handleRenderBookFunc"
  | "handleScale"
  | "handleScalePageDialog"
  | "handleSearch"
  | "handleSearchResults"
  | "handleSelectBook"
  | "handleSelectedBooks"
  | "handleSetting"
  | "handleSettingDrive"
  | "handleSettingLock"
  | "handleSettingMode"
  | "handleShelf"
  | "handleShowBookmark"
  | "handleShowBorder"
  | "handleShowPopupNote"
  | "handleShowSupport"
  | "handleSortDisplay"
  | "handleSortShelfDialog"
  | "handleSpeechAutoStart"
  | "handleSpeechDialog"
  | "handleSpeechStartText"
  | "handleSpeedReading"
  | "handleStudyLangDialog"
  | "handleTextOrientation"
  | "handleTokenDialog"
  | "handleUserInfo"
  | "handleViewMode";

export type AppState = stateType & {
  [K in AppActionName]: (...args: any[]) => any;
};

export const useAppStore = create<AppState>()((set, get) => {
  const setManager = (patch: Partial<typeof initialManager>) =>
    set((s) => ({ manager: { ...s.manager, ...patch } }));
  const setBook = (patch: Partial<typeof initialBook>) =>
    set((s) => ({ book: { ...s.book, ...patch } }));
  const setReader = (patch: Partial<typeof initialReader>) =>
    set((s) => ({ reader: { ...s.reader, ...patch } }));
  const setProgressPanel = (patch: Partial<typeof initialProgressPanel>) =>
    set((s) => ({ progressPanel: { ...s.progressPanel, ...patch } }));
  const setViewArea = (patch: Partial<typeof initialViewArea>) =>
    set((s) => ({ viewArea: { ...s.viewArea, ...patch } }));
  const setSidebar = (patch: Partial<typeof initialSidebar>) =>
    set((s) => ({ sidebar: { ...s.sidebar, ...patch } }));
  const setBackupPage = (patch: Partial<typeof initialBackupPage>) =>
    set((s) => ({ backupPage: { ...s.backupPage, ...patch } }));
  const setCollection = (patch: Partial<typeof initialCollection>) =>
    set((s) => ({ collection: { ...s.collection, ...patch } }));

  return {
    manager: initialManager,
    book: initialBook,
    reader: initialReader,
    progressPanel: initialProgressPanel,
    viewArea: initialViewArea,
    sidebar: initialSidebar,
    backupPage: initialBackupPage,
    collection: initialCollection,

    // manager
    handleBooks: (books: BookModel[]) => setManager({ books }),
    handlePlugins: (plugins: PluginModel[]) => setManager({ plugins }),
    handleDeletedBooks: (deletedBooks: BookModel[]) =>
      setManager({ deletedBooks }),
    handleSearch: (isSearch: boolean) => setManager({ isSearch }),
    handleRefreshBookCover: (key: string) =>
      setManager({ refreshBookKey: key }),
    handleUserInfo: (userInfo: any) => setManager({ userInfo }),
    handleDetailDialog: (isDetailDialog: boolean) =>
      setManager({ isDetailDialog }),
    handleSetting: (isSettingOpen: boolean) => setManager({ isSettingOpen }),
    handleSettingMode: (settingMode: string) => setManager({ settingMode }),
    handlePluginSettingTab: (pluginSettingTab: string) =>
      setManager({ pluginSettingTab }),
    handleShowPopupNote: (isShowPopupNote: boolean) =>
      setManager({ isShowPopupNote }),
    handleSettingDrive: (settingDrive: string) => setManager({ settingDrive }),
    handleAbout: (isAboutOpen: boolean) => setManager({ isAboutOpen }),
    handleViewMode: (mode: string) => setManager({ viewMode: mode }),
    handleSortDisplay: (isSortDisplay: boolean) =>
      setManager({ isSortDisplay }),
    handleLoadingDialog: (isShowLoading: boolean) =>
      setManager({ isShowLoading }),
    handleNewDialog: (isShowNew: boolean) => setManager({ isShowNew }),
    handleSelectBook: (isSelectBook: boolean) => setManager({ isSelectBook }),
    handleSelectedBooks: (selectedBooks: string[]) =>
      setManager({ selectedBooks }),
    handleNewWarning: (isNewWarning: boolean) => setManager({ isNewWarning }),
    handleShowSupport: (isShowSupport: boolean) =>
      setManager({ isShowSupport }),
    handleLoadMore: (isLoadMore: boolean) => setManager({ isLoadMore }),
    handleAuthed: (isAuthed: boolean) => setManager({ isAuthed }),
    handleBookSortCode: (bookSortCode: { sort: number; order: number }) =>
      setManager({ bookSortCode }),
    handleNoteSortCode: (noteSortCode: { sort: number; order: number }) =>
      setManager({ noteSortCode }),
    handleSearchResults: (searchResults: number[]) =>
      setManager({ searchResults }),
    handleFetchBooks: async () => {
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
        case 7:
          sortField = "size";
          break;
      }
      let orderField = "ASC";
      if (bookSortCode.order === 2) {
        orderField = "DESC";
      }
      let collectionKeys = collectionUtil.getCollectionKeys();
      let collectionList = collectionUtil.getCollectionList();
      let localeCompareName = (a: string, b: string) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      let bookList: { key: string }[] = [];
      if (sortField === "recentRead") {
        let allBookKeys = await DatabaseService.getAllRecordKeys("books");
        let allKeys = [...allBookKeys, ...collectionKeys];
        let recentBookLKeys =
          ConfigService.getAllListConfig("recentBooks") || [];
        let sortedKeys = [
          ...recentBookLKeys.filter((key) => allKeys.includes(key)),
          ...allKeys.filter((key) => !recentBookLKeys.includes(key)),
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
        let sortedCollections = [...collectionList].sort((a, b) => {
          return localeCompareName(a.name, b.name);
        });
        bookList = [
          ...sortedKeys,
          ...sortedCollections.map((item) => item.key),
        ].map((key: string) => {
          return { key };
        });
      } else if (sortField === "percentage") {
        let allBookKeys = await DatabaseService.getAllRecordKeys("books");
        let locationObj = ConfigService.getAllObjectConfig("recordLocation");
        var sortable: any[] = [];
        for (let obj in locationObj) {
          sortable.push([obj, locationObj[obj].percentage || 0]);
        }
        collectionList.forEach((collection) => {
          sortable.push([
            collection.key,
            collectionUtil.getCollectionPercentageNumber(collection),
          ]);
        });
        sortable.sort(function (a, b) {
          return b[1] - a[1];
        });
        let recentBookLKeys = sortable.map((item) => item[0]) || [];
        let sortedKeys = [
          ...recentBookLKeys.filter(
            (key) => allBookKeys.includes(key) || collectionKeys.includes(key)
          ),
          ...allBookKeys.filter((key) => !recentBookLKeys.includes(key)),
        ];
        if (bookSortCode.order === 1) {
          sortedKeys = sortedKeys.reverse();
        }
        sortedKeys = sortedKeys;
        bookList = sortedKeys.map((key: string) => {
          return { key };
        });
      } else if (sortField === "name") {
        let bookKeys = (await BookUtil.getBookKeysWithSort("name", "ASC")).map(
          (item: any) => item.key
        );
        let nameMap = await BookUtil.getBookNamesMapByKeys(bookKeys);
        let nameItems = bookKeys.map((key: string) => {
          return { key, name: nameMap[key] || "" };
        });
        collectionList.forEach((collection) => {
          nameItems.push({ key: collection.key, name: collection.name });
        });
        nameItems.sort((a, b) => {
          return localeCompareName(a.name, b.name);
        });
        if (orderField === "DESC") {
          nameItems = nameItems.reverse();
        }
        bookList = nameItems.map((item) => {
          return { key: item.key };
        });
      } else if (sortField === "key") {
        let bookKeys = (await BookUtil.getBookKeysWithSort("key", "ASC")).map(
          (item: any) => item.key
        );
        let allKeys = [...bookKeys, ...collectionKeys];
        allKeys.sort((a, b) => {
          return Number(a) - Number(b);
        });
        if (orderField === "DESC") {
          allKeys = allKeys.reverse();
        }
        bookList = allKeys.map((key: string) => {
          return { key };
        });
      } else {
        let sortedBookList = await BookUtil.getBookKeysWithSort(
          sortField,
          orderField
        );
        let sortedCollections = [...collectionList].sort((a, b) => {
          return localeCompareName(a.name, b.name);
        });
        bookList = [
          ...sortedBookList,
          ...sortedCollections.map((item) => {
            return { key: item.key };
          }),
        ];
      }

      let deletedBookKeys = ConfigService.getAllListConfig("deletedBooks");
      let books = bookList.filter(
        (item: { key: string }) => !deletedBookKeys.includes(item.key)
      );
      get().handleBooks(books as BookModel[]);
      get().handleDeletedBooks(
        deletedBookKeys.map((key) => ({ key })) as BookModel[]
      );
    },
    handleFetchUserInfo: async () => {
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
        get().handleShowSupport(true);
      }
      if (userInfo && userInfo.valid_until && userInfo.token_valid_until) {
        if (
          userInfo.valid_until > 0 &&
          userInfo.token_valid_until > 0 &&
          userInfo.valid_until > userInfo.token_valid_until
        ) {
          let userRequest = await getUserRequest();
          await userRequest.refreshUserToken();
          resetReaderRequest();
          resetUserRequest();
          resetThirdpartyRequest();
        }
      }

      get().handleUserInfo(userInfo);
      return userInfo;
    },
    handleFetchPlugins: async () => {
      DatabaseService.getAllRecords("plugins").then(async (pluginList) => {
        try {
          const legacyAiPlugins = pluginList.filter(
            (p: PluginModel) => p.type === "ai"
          );
          for (const p of legacyAiPlugins) {
            const existing = ConfigService.getObjectConfig(
              p.key,
              "aiModelConfig",
              null
            );
            if (!existing) {
              ConfigService.setObjectConfig(
                p.key,
                { key: p.key, displayName: p.displayName, config: p.config },
                "aiModelConfig"
              );
            }
            await DatabaseService.deleteRecord(p.key, "plugins");
          }
          pluginList = pluginList.filter((p: PluginModel) => p.type !== "ai");

          const resolvedPlugins = await Promise.all(
            pluginList.map((plugin) => resolveStoredPlugin(plugin))
          );
          pluginList = resolvedPlugins.filter((plugin): plugin is PluginModel =>
            Boolean(plugin)
          );

          const localDictIds = DictUtil.getDictIds();
          for (const dictId of localDictIds) {
            const meta = DictUtil.getDictMeta(dictId);
            if (meta) {
              let localDictPlugin = new PluginModel(
                `dict-${dictId}`,
                "dictionary",
                meta.name,
                "dict",
                "1.0.0",
                "",
                { dictId },
                [],
                [],
                "",
                ""
              );
              pluginList.push(localDictPlugin);
            }
          }

          if (ConfigService.getReaderConfig("aiTranslateModel")) {
            const modelKey = ConfigService.getReaderConfig("aiTranslateModel");
            const entry = ConfigService.getObjectConfig(
              modelKey,
              "aiModelConfig",
              null
            );
            if (entry && entry.key) {
              let transPlugin = new PluginModel(
                "custom-ai-trans-plugin",
                "translation",
                "Custom AI Translation",
                "translation",
                "1.0.0",
                "",
                entry.config || {},
                officialTranList,
                [],
                "",
                ""
              );
              pluginList.push(transPlugin);
            }
          }
          if (ConfigService.getReaderConfig("aiDictModel")) {
            const modelKey = ConfigService.getReaderConfig("aiDictModel");
            const entry = ConfigService.getObjectConfig(
              modelKey,
              "aiModelConfig",
              null
            );
            if (entry && entry.key) {
              let dictPlugin = new PluginModel(
                "custom-ai-dict-plugin",
                "dictionary",
                "Custom AI Dictionary",
                "dict",
                "1.0.0",
                "",
                entry.config || {},
                officialDictList,
                [],
                "",
                ""
              );
              pluginList.push(dictPlugin);
            }
          }
          if (ConfigService.getReaderConfig("aiAssistanceModel")) {
            const modelKey = ConfigService.getReaderConfig("aiAssistanceModel");
            const entry = ConfigService.getObjectConfig(
              modelKey,
              "aiModelConfig",
              null
            );
            if (entry && entry.key) {
              let assistPlugin = new PluginModel(
                "custom-ai-assistant-plugin",
                "assistant",
                "Custom AI Assistance",
                "assistant",
                "1.0.0",
                "",
                entry.config || {},
                officialTranList,
                [],
                "",
                ""
              );
              pluginList.push(assistPlugin);
            }
          }
          if (ConfigService.getReaderConfig("isDisableAI") !== "yes") {
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
          }
          const isAuthed = (await TokenService.getToken("is_authed")) === "yes";
          if (ConfigService.getReaderConfig("isDisableAI") !== "yes") {
            let sortedVoiceList = [
              ...KookitConfig.OfficialVoiceList.map((item) => {
                return {
                  ...item,
                  label:
                    i18n.t("Kokoro") +
                    " - " +
                    (KookitConfig.SelfHostedVoiceList.includes(item.name) &&
                    isAuthed
                      ? i18n.t("Limited free") + " - "
                      : "") +
                    item.displayName +
                    " - " +
                    item.language +
                    " - " +
                    (item.gender === "female"
                      ? i18n.t("Female voice")
                      : i18n.t("Male voice")),
                };
              }),
              ...KookitConfig.AzureTTSVoiceList.map((item) => {
                return {
                  ...item,
                  label:
                    "Azure" +
                    " - " +
                    (KookitConfig.SelfHostedVoiceList.includes(item.name) &&
                    isAuthed
                      ? i18n.t("Limited free") + " - "
                      : "") +
                    item.displayName +
                    " - " +
                    langToName(item.locale) +
                    " - " +
                    (item.gender === "female"
                      ? i18n.t("Female voice")
                      : i18n.t("Male voice")),
                };
              }),
            ];
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
                  ...item,
                  plugin: "official-ai-voice-plugin",
                  config: {},
                  displayName: item.label,
                };
              }),
              "",
              ""
            );
            pluginList.push(voicePlugin);
          }
          TokenService.getToken("is_authed").then((value) => {
            let isAuthed = value === "yes";
            if (isAuthed && !ConfigService.getItem("serverRegion")) {
              ConfigService.setItem("serverRegion", "global");
            }
            get().handlePlugins(pluginList);
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          toast.error(errorMessage);
          console.error(error);
        }
      });
    },
    handleFetchAuthed: () => {
      try {
        TokenService.getToken("is_authed").then((value) => {
          let isAuthed = value === "yes";
          if (isAuthed && !ConfigService.getItem("serverRegion")) {
            ConfigService.setItem("serverRegion", "global");
          }
          get().handleAuthed(isAuthed);
        });
      } catch (error) {
        console.error(error);
      }
    },
    handleFetchBookSortCode: () => {
      let bookSortCode = JSON.parse(
        ConfigService.getReaderConfig("bookSortCode") ||
          '{"sort": 1, "order": 2}'
      );
      get().handleBookSortCode(bookSortCode);
    },
    handleFetchNoteSortCode: () => {
      let noteSortCode = JSON.parse(
        ConfigService.getReaderConfig("noteSortCode") ||
          '{"sort": 1, "order": 2}'
      );
      get().handleNoteSortCode(noteSortCode);
    },
    handleFetchViewMode: () => {
      let viewMode = ConfigService.getReaderConfig("viewMode") || "card";
      get().handleViewMode(viewMode);
    },

    // book
    handleEditDialog: (mode: boolean) => setBook({ isOpenEditDialog: mode }),
    handleDeleteDialog: (mode: boolean) =>
      setBook({ isOpenDeleteDialog: mode }),
    handleAddDialog: (mode: boolean) => setBook({ isOpenAddDialog: mode }),
    handleRenderBookFunc: (renderBookFunc: () => void) =>
      setBook({ renderBookFunc }),
    handleImportBookFunc: (importBookFunc: () => void) =>
      setBook({ importBookFunc: importBookFunc as any }),
    handleCloudSyncFunc: (cloudSyncFunc: (userInfo?: any) => Promise<void>) =>
      setBook({ cloudSyncFunc }),
    handleActionDialog: (mode: boolean) =>
      setBook({ isOpenActionDialog: mode }),
    handleReadingState: (state: boolean) => setBook({ isReading: state }),
    handleReadingBook: (book: BookModel) => setBook({ currentBook: book }),

    // reader
    handleNotes: (notes: NoteModel[]) => setReader({ notes }),
    handleHighlights: (highlights: NoteModel[]) => setReader({ highlights }),
    handleOriginalText: (originalText: string) => setReader({ originalText }),
    handleQuoteText: (quoteText: string) => setReader({ quoteText }),
    handleOriginalSentence: (originalSentence: string) =>
      setReader({ originalSentence }),
    handleHighlight: (highlight: HighlightValue) => setReader({ highlight }),
    handleConvertDialog: (isConvertOpen: boolean) =>
      setReader({ isConvertOpen }),
    handleScalePageDialog: (isScaleOpen: boolean) => setReader({ isScaleOpen }),
    handlePdfCropDialog: (isPdfCropOpen: boolean) =>
      setReader({ isPdfCropOpen }),
    handleStudyLangDialog: (isStudyLangOpen: boolean) =>
      setReader({ isStudyLangOpen }),
    handleAssistReadDialog: (isAssistReadOpen: boolean) =>
      setReader({ isAssistReadOpen }),
    handleSpeechDialog: (isSpeechOpen: boolean) => setReader({ isSpeechOpen }),
    handleAnnotationDialog: (isAnnotationOpen: boolean) =>
      setReader({ isAnnotationOpen }),
    handleSpeechStartText: (speechStartText: string) =>
      setReader({ speechStartText }),
    handleSpeechAutoStart: (isSpeechAutoStart: boolean) =>
      setReader({ isSpeechAutoStart }),
    handleBookmarks: (bookmarks: BookmarkModel[]) => setReader({ bookmarks }),
    handleHtmlBook: (htmlBook: HtmlBookModel) => setReader({ htmlBook }),
    handleCurrentChapter: (currentChapter: string) =>
      setReader({ currentChapter }),
    handleCurrentChapterIndex: (currentChapterIndex: number) =>
      setReader({ currentChapterIndex }),
    handleJumpPosition: (jumpPosition: object | null) =>
      setReader({ jumpPosition }),
    handleNoteKey: (key: string) => setReader({ noteKey: key }),
    handleReaderMode: (readerMode: string) => setReader({ readerMode }),
    handleScale: (scale: string) => setReader({ scale }),
    handleBackgroundColor: (backgroundColor: string) =>
      setReader({ backgroundColor }),
    handleNavLock: (isNavLocked: boolean) => setReader({ isNavLocked }),
    handleDockedRight: (isDockedRight: boolean) => setReader({ isDockedRight }),
    handleHideHeader: (isHideHeader: boolean) => setReader({ isHideHeader }),
    handleHideBackground: (isHideBackground: boolean) =>
      setReader({ isHideBackground }),
    handleParagraphMode: (isParagraphMode: boolean) =>
      setReader({ isParagraphMode }),
    handleReadingRuler: (isReadingRuler: boolean) =>
      setReader({ isReadingRuler }),
    handleSpeedReading: (isSpeedReading: boolean) =>
      setReader({ isSpeedReading }),
    handleAutoReading: (isAutoReading: boolean) => setReader({ isAutoReading }),
    handleMergeWord: (isMergeWord: boolean) => setReader({ isMergeWord }),
    handleShowBorder: (isShowPageBorder: boolean) =>
      setReader({ isShowPageBorder }),
    handleFitPage: (isFitPage: boolean) => setReader({ isFitPage }),
    handleMargin: (margin: string) => setReader({ margin }),
    handleReaderBackgroundImage: (readerBackgroundImage: string) =>
      setReader({ readerBackgroundImage }),
    handleSettingLock: (isSettingLocked: boolean) =>
      setReader({ isSettingLocked }),
    handleHideFooter: (isHideFooter: boolean) => setReader({ isHideFooter }),
    handleTextOrientation: (textOrientation: string) =>
      setReader({ textOrientation }),
    handleFetchNotes: async () => {
      let noteSortCodeStr =
        ConfigService.getReaderConfig("noteSortCode") || '{"sort":1,"order":2}';
      let noteSortCode = JSON.parse(noteSortCodeStr);
      let sortField = noteSortCode.sort === 1 ? "key" : "percentage";
      let sortOrder = noteSortCode.order === 1 ? "ASC" : "DESC";

      let notes: Note[] = await ConfigUtil.getNotesByBookKeyAndTypeWithSort(
        "",
        "note",
        sortField,
        sortOrder
      );
      let highlights: Note[] =
        await ConfigUtil.getNotesByBookKeyAndTypeWithSort(
          "",
          "highlight",
          sortField,
          sortOrder
        );
      let deletedBookKeys = ConfigService.getAllListConfig("deletedBooks");
      notes = notes.filter((note) => !deletedBookKeys.includes(note.bookKey));
      highlights = highlights.filter(
        (highlight) => !deletedBookKeys.includes(highlight.bookKey)
      );
      get().handleHighlights(highlights);
      get().handleNotes(notes);
    },
    handleFetchBookmarks: () => {
      DatabaseService.getAllRecords("bookmarks").then(
        (bookmarks: Bookmark[]) => {
          let deletedBookKeys = ConfigService.getAllListConfig("deletedBooks");
          bookmarks = bookmarks.filter(
            (bookmark) => !deletedBookKeys.includes(bookmark.bookKey)
          );
          get().handleBookmarks(bookmarks);
        }
      );
    },

    // progressPanel
    handlePercentage: (percentage: number) => setProgressPanel({ percentage }),
    handleFetchPercentage: (book: BookModel) => {
      let percentage =
        ConfigService.getObjectConfig(book.key, "recordLocation", {})
          .percentage || 0;
      get().handlePercentage(percentage);
    },

    // viewArea
    handleOpenMenu: (isOpenMenu: boolean) => setViewArea({ isOpenMenu }),
    handleMenuMode: (menuMode: string) => setViewArea({ menuMode }),
    handleChangeDirection: (isChangeDirection: boolean) =>
      setViewArea({ isChangeDirection }),
    handleShowBookmark: (isShowBookmark: boolean) =>
      setViewArea({ isShowBookmark }),

    // sidebar
    handleShelf: (shelfTitle: string) => setSidebar({ shelfTitle }),
    handleCollapse: (isCollapsed: boolean) => setSidebar({ isCollapsed }),
    handleMode: (mode: string) => setSidebar({ mode }),

    // backupPage
    handleLocalFileDialog: (isOpen: boolean) =>
      setBackupPage({ isOpenLocalFileDialog: isOpen }),
    handleImportDialog: (mode: boolean) =>
      setBackupPage({ isOpenImportDialog: mode }),
    handleOPDSDialog: (mode: boolean) =>
      setBackupPage({ isOpenOPDSDialog: mode }),
    handleAutoImportDialog: (mode: boolean) =>
      setBackupPage({ isOpenAutoImportDialog: mode }),
    handleSortShelfDialog: (isOpen: boolean) =>
      setBackupPage({ isOpenSortShelfDialog: isOpen }),
    handlePopupOptionDialog: (isOpen: boolean) =>
      setBackupPage({ isOpenPopupOptionDialog: isOpen }),
    handlePopupOptionUpdate: (popupOptionUpdateIndex: number) =>
      setBackupPage({ popupOptionUpdateIndex }),
    handleTokenDialog: (mode: boolean) =>
      setBackupPage({ isOpenTokenDialog: mode }),
    handleDataSourceList: (dataSource: any) =>
      setBackupPage({ dataSourceList: dataSource }),
    handleLoginOptionList: (loginOptionList: any) =>
      setBackupPage({ loginOptionList }),
    handleDefaultSyncOption: (option: string) =>
      setBackupPage({ defaultSyncOption: option }),
    handleFetchDataSourceList: () => {
      let dataSourceList =
        ConfigService.getAllListConfig("dataSourceList") || [];
      get().handleDataSourceList(dataSourceList);
    },
    handleFetchLoginOptionList: async () => {
      let loginOptionList: { email: string; provider: string }[] = [];
      let userRequest = await getUserRequest();
      let response = await userRequest.getLoginsV2();
      if (response.code === 200) {
        loginOptionList = response.data;
      } else if (response.code === 401) {
        handleExitApp();
      }
      get().handleLoginOptionList(loginOptionList);
    },
    handleFetchDefaultSyncOption: () => {
      let defaultSyncOption = ConfigService.getItem("defaultSyncOption") || "";
      get().handleDefaultSyncOption(defaultSyncOption);
    },

    // collection
    handleCollectionDialog: (isOpen: boolean) =>
      setCollection({ isOpenCollectionDialog: isOpen }),
    handleCollectionDialogBooks: (bookKeys: string[]) =>
      setCollection({ collectionDialogBooks: bookKeys }),
    handleCollectionDialogKey: (key: string) =>
      setCollection({ collectionDialogKey: key }),
    handleCollectionDetailDialog: (isOpen: boolean) =>
      setCollection({ isOpenCollectionDetailDialog: isOpen }),
    handleAddCollectionDialog: (isOpen: boolean) =>
      setCollection({ isOpenAddCollectionDialog: isOpen }),
    handleCurrentCollectionKey: (key: string) =>
      setCollection({ currentCollectionKey: key }),
  };
});
