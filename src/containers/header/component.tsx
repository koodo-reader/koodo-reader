import React, { useEffect, useRef, useState } from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import {
  ConfigService,
  KookitConfig,
  KOReaderUtil,
  CollectionUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import UpdateInfo from "../../components/dialogs/updateDialog";
import { generateSnapshot } from "../../utils/file/backup";
import chatWidget from "../../assets/images/chat-widget.png";
import { isElectron } from "react-device-detect";
import {
  getCloudConfig,
  upgradeConfig,
  upgradeStorage,
} from "../../utils/file/common";
import toast from "react-hot-toast";
import { Trans } from "react-i18next";
import { SyncHelper } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import BookUtil from "../../utils/file/bookUtil";
import {
  checkBrokenDatabase,
  checkMissingBook,
  generateSyncRecord,
  getBookPartialMd5,
  getTaskStats,
  getWebsiteLang,
  getWebsiteUrl,
  openInBrowser,
  scanFolderForNewBooks,
  showTaskProgress,
  vexComfirmAsync,
  AUTO_IMPORT_FOLDERS_KEY,
} from "../../utils/common";
import { driveList } from "../../constants/driveList";
import SupportDialog from "../../components/dialogs/supportDialog";
import { LocalFileManager } from "../../utils/file/localFile";
import packageJson from "../../../package.json";
import { getTempToken, updateUserConfig } from "../../utils/request/user";
import i18n from "../../i18n";
import { getNotification } from "../../utils/request/common";
import TokenService from "../../utils/storage/tokenService";

const collectionUtil = new CollectionUtil(ConfigService);
declare var window: any;

const Header = (props: HeaderProps) => {
  const [state, setState] = useState<HeaderState>({
    isHidePro: false,
    isSync: false,
    notificationCount: 0,
  });

  const timerRef = useRef<any>(null);
  const scheduledSyncTimerRef = useRef<any>(null);
  const isSyncingRef = useRef<boolean>(false);
  const isSyncRef = useRef<boolean>(false);
  const hasRunAutoImportRef = useRef<boolean>(false);
  const readingFinishedHandlerRef = useRef<((config?: any) => void) | null>(
    null
  );
  const handleCloudSyncRef = useRef<
    (userInfo: any) => Promise<false | undefined>
  >(async () => undefined);
  const handleFinishReadingRef = useRef<() => Promise<void>>(
    async () => undefined
  );
  const prevIsAuthedRef = useRef<boolean>(props.isAuthed);

  const setPartialState = (partial: Partial<HeaderState>) => {
    setState((prevState) => ({ ...prevState, ...partial }));
  };

  const setIsSync = (value: boolean) => {
    isSyncRef.current = value;
    setState((prevState) => ({ ...prevState, isSync: value }));
  };

  const startScheduledSync = () => {
    if (scheduledSyncTimerRef.current) {
      clearInterval(scheduledSyncTimerRef.current);
      scheduledSyncTimerRef.current = null;
    }
    const intervalMinutes = parseInt(
      ConfigService.getReaderConfig("scheduledSyncInterval") || "0"
    );
    if (!intervalMinutes || intervalMinutes <= 0) {
      return;
    }
    const intervalMs = intervalMinutes * 60 * 1000;
    scheduledSyncTimerRef.current = setInterval(async () => {
      const currentInterval = parseInt(
        ConfigService.getReaderConfig("scheduledSyncInterval") || "0"
      );
      if (!currentInterval || currentInterval <= 0) {
        clearInterval(scheduledSyncTimerRef.current);
        scheduledSyncTimerRef.current = null;
        return;
      }
      const defaultSyncOption = ConfigService.getItem("defaultSyncOption");
      if (
        !defaultSyncOption ||
        ConfigService.getReaderConfig("isDisableAutoSync") === "yes"
      ) {
        return;
      }
      if (!isSyncRef.current && !isSyncingRef.current) {
        const userInfo = await props.handleFetchUserInfo();
        await handleCloudSyncRef.current(userInfo);
      }
    }, intervalMs);
  };

  const autoScanFoldersOnStart = async () => {
    if (!isElectron || hasRunAutoImportRef.current) return;
    hasRunAutoImportRef.current = true;
    try {
      const folders =
        ConfigService.getAllListConfig(AUTO_IMPORT_FOLDERS_KEY) || [];
      if (folders.length === 0) return;
      const importBookFunc = props.importBookFunc;
      if (!importBookFunc) {
        console.error("Auto import: no import function available");
        return;
      }
      for (const folderPath of folders) {
        await scanFolderForNewBooks(folderPath, importBookFunc);
      }
    } catch (error) {
      console.error("Auto import folder scan error:", error);
    }
  };

  const handleOpenLastReadBook = async () => {
    let filePath = "";
    //open book when app start
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      filePath = ipcRenderer.sendSync("check-file-data");
    }
    if (
      ConfigService.getReaderConfig("isOpenBook") === "yes" &&
      !props.currentBook.key &&
      !filePath
    ) {
      let lastReadBookKey = ConfigService.getAllListConfig("recentBooks")[0];
      if (lastReadBookKey) {
        let collectionKey = collectionUtil.isCollection(lastReadBookKey)
          ? lastReadBookKey
          : collectionUtil.getActiveCollectionByBook(lastReadBookKey)?.key;
        if (collectionKey) {
          let collection = collectionUtil.getCollection(collectionKey);
          if (collection) {
            props.handleReadingBook(
              collectionUtil.getCollectionAsBook(collection)
            );
            props.handleCurrentCollectionKey(collectionKey);
            props.handleCollectionDetailDialog(true);
            return;
          }
        }
        let fullBook = await DatabaseService.getRecord(
          lastReadBookKey,
          "books"
        );
        if (fullBook) {
          props.handleReadingBook(fullBook);
          BookUtil.redirectBook(fullBook);
        }
      }
    }
  };

  const handleFinishReading = async () => {
    if (
      ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
      ConfigService.getItem("defaultSyncOption") &&
      !isSyncRef.current
    ) {
      ConfigService.setItem("isFinshReading", "yes");
      let userInfo = await props.handleFetchUserInfo();
      setIsSync(true);
      await handleCloudSync(userInfo);
      ConfigService.setItem("isFinshReading", "no");
    }
  };

  const handleFinishUpgrade = () => {
    props.handleFetchBooks();
    setTimeout(() => {
      if (props.mode === "home") {
        props.history.push("/manager/home");
      }
    }, 2000);
  };

  const handleKOReaderSync = async () => {
    if (ConfigService.getReaderConfig("isEnableKoReaderSync") !== "yes") {
      return;
    }

    toast.loading(props.t("Start syncing") + " (KOReader)", {
      id: "koreader-sync",
      position: "bottom-center",
    });
    try {
      const koReaderUtil = new KOReaderUtil(
        ConfigService,
        TokenService,
        DatabaseService
      );
      const summary =
        await koReaderUtil.syncKOReaderProgress(getBookPartialMd5);
      if (summary.pulledBooks > 0 || summary.pushedBooks > 0) {
        props.handleFetchBooks();
      }
      toast.success(props.t("Synchronisation successful") + " (KOReader)", {
        id: "koreader-sync",
      });
    } catch (error) {
      console.error(error);
      toast.error(
        props.t("Sync failed") +
          " (KOReader): " +
          (error instanceof Error ? error.message : String(error)),
        {
          id: "koreader-sync",
          duration: 6000,
        }
      );
    }
  };

  const beforeSync = async (userInfo: any) => {
    if (!ConfigService.getItem("defaultSyncOption")) {
      toast.error(
        props.t("Please add data source in the setting-Sync and backup first")
      );
      props.handleSetting(true);
      props.handleSettingMode("sync");
      return false;
    }
    if (
      ConfigService.getReaderConfig("isEnableKoodoSync") === "yes" &&
      userInfo &&
      userInfo.default_sync_option &&
      userInfo.default_sync_option !== props.defaultSyncOption
    ) {
      toast.error(
        props.t(
          "The default sync options in the local and cloud are inconsistent, please set the local default sync option to "
        ) +
          props.t(
            driveList.find(
              (item) => item.value === userInfo.default_sync_option
            )?.label || ""
          ),
        {
          duration: 4000,
        }
      );
      return false;
    }
    let config = await getCloudConfig(
      ConfigService.getItem("defaultSyncOption") || ""
    );
    if (Object.keys(config).length === 0) {
      toast.error(props.t("Cannot get sync config"));
      return false;
    }
    await checkMissingBook();
    let checkResult = await checkBrokenDatabase();
    if (checkResult) {
      toast.error(
        props.t(
          "Broken data detected, please click the setting button to reset the sync records"
        )
      );
      return false;
    }
    if (ConfigService.getReaderConfig("isEnableKoodoSync") !== "yes") {
      if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
        toast.loading(
          props.t("Start syncing") +
            " (" +
            props.t(
              driveList.find(
                (item) =>
                  item.value === ConfigService.getItem("defaultSyncOption")
              )?.label || ""
            ) +
            ")",
          { id: "syncing", position: "bottom-center" }
        );
      }
    }

    return true;
  };

  const getCompareResult = async () => {
    let localSyncRecords = ConfigService.getAllSyncRecord();
    let cloudSyncRecords = await ConfigUtil.getCloudConfig("sync");
    return await SyncHelper.compareAll(
      localSyncRecords,
      cloudSyncRecords,
      ConfigService,
      TokenService,
      ConfigUtil
    );
  };

  const handleSyncStateChange = (isSyncing: boolean) => {
    setIsSync(isSyncing);
  };

  const handleCloudSync = async (userInfo: any): Promise<false | undefined> => {
    if (isSyncingRef.current) {
      console.info("Sync already in progress, skipping...");
      return false;
    }
    isSyncingRef.current = true;

    try {
      timerRef.current = await showTaskProgress(handleSyncStateChange);
      if (!timerRef.current) {
        setIsSync(false);
        handleKOReaderSync();
        return false;
      }

      let res = await beforeSync(userInfo);
      if (!res) {
        clearInterval(timerRef.current);
        setIsSync(false);
        handleKOReaderSync();
        return false;
      }
      let compareResult = await getCompareResult();
      await handleSync(compareResult);
      clearInterval(timerRef.current);
      setIsSync(false);
      handleKOReaderSync();
    } catch (error) {
      console.error(error);
      toast.error(
        props.t("Sync failed") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      clearInterval(timerRef.current);
      setIsSync(false);
      handleKOReaderSync();
      return false;
    } finally {
      isSyncingRef.current = false;
    }
    setTimeout(() => {
      toast.dismiss("syncing");
    }, 3000);
    return;
  };

  const handleSuccess = async () => {
    if (ConfigService.getItem("isFinshReading") !== "yes" || !isElectron) {
      props.handleFetchBooks();
    }

    props.handleFetchBookmarks();
    props.handleFetchNotes();

    if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
      toast.success(props.t("Synchronisation successful"), {
        id: "syncing",
      });
    }

    if (
      ConfigService.getItem("defaultSyncOption") === "adrive" &&
      ConfigService.getReaderConfig("hasShowAliyunWarning") !== "yes"
    ) {
      ConfigService.setReaderConfig("hasShowAliyunWarning", "yes");
      toast.success(
        props.t(
          "We have bypassed the synchronization of book cover for Aliyun Drive, covers will be downloaded automatically when you open the book next time."
        ),
        {
          duration: 4000,
        }
      );
    }
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      ConfigUtil.updateSyncData();
    }
    //when book is empty, need to refresh the book list
    setTimeout(async () => {
      if (props.mode === "home") {
        props.history.push("/manager/home");
        if (
          ConfigService.getReaderConfig("isFirstSync") !== "no" &&
          ConfigService.getReaderConfig("isEnableKoodoSync") !== "yes"
        ) {
          ConfigService.setReaderConfig("isFirstSync", "no");
          let config = await getCloudConfig(
            ConfigService.getItem("defaultSyncOption") || ""
          );
          if (
            config.url &&
            (config.url.includes("192.168.") ||
              config.url.includes("127.0.0.1") ||
              config.url.includes("localhost"))
          ) {
            return;
          }
          if (
            props.userInfo &&
            props.userInfo.time_created &&
            props.userInfo.time_created < 1769875200
          ) {
            return;
          }
          let result = await vexComfirmAsync(
            `<h3>${props.t("Enable Koodo Sync")}</h3><p>${
              props.t(
                "To enjoy a faster and seamless synchronization experience."
              ) +
              " " +
              props.t(
                "Your reading progress, notes, highlights, bookmarks, and other data will be stored and synced through our cloud service. Your books and covers will still be synced by your added data sources. All your data will be encrypted and stored securely in our cloud. You can disable this feature anytime in the settings."
              )
            }</p>`
          );
          if (result) {
            ConfigService.setReaderConfig("isEnableKoodoSync", "yes");
            let encryptedToken = await TokenService.getToken(
              props.defaultSyncOption + "_token"
            );
            await updateUserConfig({
              is_enable_koodo_sync: "yes",
              default_sync_option: props.defaultSyncOption,
              default_sync_token: encryptedToken || "",
            });
            let userInfo = await props.handleFetchUserInfo();
            toast.success(props.t("Setup successful"));
            handleCloudSync(userInfo);
          }
        }
      }
    }, 1000);
  };

  const handleSync = async (compareResult) => {
    try {
      let tasks = await SyncHelper.startSync(
        compareResult,
        ConfigService,
        DatabaseService,
        ConfigUtil,
        BookUtil,
        CoverUtil
      );
      await SyncHelper.runTasksWithLimit(
        tasks,
        99,
        ConfigService.getItem("defaultSyncOption")
      );

      clearInterval(timerRef.current);
      setIsSync(false);
      let stats = await getTaskStats();
      if (stats.hasFailedTasks) {
        toast.error(
          props.t(
            "Tasks failed after multiple retries, please check the network connection or reauthorize the data source in the settings"
          ),
          {
            id: "syncing",
            duration: 6000,
          }
        );
        return;
      }
      if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
        toast.loading(props.t("Almost finished"), {
          id: "syncing",
          position: "bottom-center",
        });
      }
      await handleSuccess();
    } catch (error) {
      console.error(error);
      clearInterval(timerRef.current);
      setIsSync(false);
      toast.error(
        props.t("Sync failed") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );

      return;
    }
  };

  handleCloudSyncRef.current = handleCloudSync;
  handleFinishReadingRef.current = handleFinishReading;

  useEffect(() => {
    let visibilityHandler: (() => Promise<void>) | null = null;
    const registeredIpcHandlers: [string, (...args: any[]) => any][] = [];

    const init = async () => {
      if (isElectron) {
        try {
          await generateSnapshot();
        } catch (error) {
          console.error("Failed to generate snapshot:", error);
        }
      }
      props.handleFetchAuthed();
      props.handleFetchDefaultSyncOption();
      props.handleFetchDataSourceList();
      if (isElectron) {
        const fs = window.electronAPI.fs;
        const path = window.electronAPI.path;
        const ipcRenderer = window.electronAPI;
        const dirPath = ipcRenderer.sendSync("user-data", "ping");
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(path.join(dirPath, "data", "book"), { recursive: true });
        }

        if (
          ConfigService.getReaderConfig("storageLocation") &&
          !ConfigService.getItem("storageLocation")
        ) {
          ConfigService.setItem(
            "storageLocation",
            ConfigService.getReaderConfig("storageLocation")
          );
        }
        if (ConfigService.getReaderConfig("isHidePro") === "yes") {
          setPartialState({ isHidePro: true });
        }

        //Check for data update
        //upgrade data from old version
        let res1 = await upgradeStorage(handleFinishUpgrade);
        let res2 = await upgradeConfig();
        if (!res1 || !res2) {
          console.error("upgrade failed");
        }

        const readingFinishedHandler = async () => {
          await handleFinishReadingRef.current();
        };
        const openBookFromLinkHandler = async (config: any) => {
          const book = await DatabaseService.getRecord(config.bookKey, "books");
          if (book) {
            BookUtil.redirectBook(book);
          }
        };
        const openNoteFromLinkHandler = async (config: any) => {
          const note = await DatabaseService.getRecord(config.noteKey, "notes");
          if (!note) return;
          const book = await DatabaseService.getRecord(note.bookKey, "books");
          if (!book) return;
          let bookLocation: any = {};
          try {
            bookLocation = JSON.parse(note.cfi) || {};
          } catch (error) {
            bookLocation.cfi = note.cfi;
            bookLocation.chapterTitle = note.chapter;
          }
          if (bookLocation.fingerprint) {
            bookLocation.chapterDocIndex = bookLocation.page - 1 + "";
            bookLocation.chapterHref = "title" + (bookLocation.page - 1);
          }
          ConfigService.setObjectConfig(
            note.bookKey,
            bookLocation,
            "recordLocation"
          );
          BookUtil.redirectBook(book);
        };
        const chatMessageHandler = async (msg: any) => {
          if (msg.payload.event === "new-message") {
            ConfigService.setReaderConfig("isAllowNotification", "yes");
          }
        };
        readingFinishedHandlerRef.current = readingFinishedHandler;
        registeredIpcHandlers.push(
          ["reading-finished", readingFinishedHandler],
          ["open-book-from-link", openBookFromLinkHandler],
          ["open-note-from-link", openNoteFromLinkHandler],
          ["chat-message", chatMessageHandler]
        );
        for (const [channel, handler] of registeredIpcHandlers) {
          ipcRenderer.on(channel, handler);
        }
      } else {
        await upgradeConfig();
        const status = await LocalFileManager.getPermissionStatus();
        if (
          !ConfigService.getItem("isUseLocal") &&
          LocalFileManager.isSupported()
        ) {
          props.handleLocalFileDialog(true);
        } else if (
          ConfigService.getItem("isUseLocal") === "yes" &&
          !status.directoryName
        ) {
          props.handleLocalFileDialog(true);
        } else if (
          ConfigService.getItem("isUseLocal") === "yes" &&
          (status.needsReauthorization || !status.hasAccess)
        ) {
          props.handleLocalFileDialog(true);
        }
      }
      props.handleCloudSyncFunc(handleCloudSyncRef.current);
      visibilityHandler = async () => {
        if (
          document.visibilityState === "visible" &&
          !isElectron &&
          ConfigService.getReaderConfig("isFinishWebReading") === "yes"
        ) {
          await handleFinishReadingRef.current();
          // ConfigService.setReaderConfig("isFinishWebReading", "no");
        }
      };
      document.addEventListener("visibilitychange", visibilityHandler);
      let willAutoSync =
        ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
        ConfigService.getItem("defaultSyncOption");
      if (!willAutoSync) {
        handleOpenLastReadBook();
        autoScanFoldersOnStart();
      }
      startScheduledSync();
    };
    init();

    return () => {
      if (scheduledSyncTimerRef.current) {
        clearInterval(scheduledSyncTimerRef.current);
        scheduledSyncTimerRef.current = null;
      }
      if (isElectron && readingFinishedHandlerRef.current) {
        const ipcRenderer = window.electronAPI;
        ipcRenderer.removeListener(
          "reading-finished",
          readingFinishedHandlerRef.current
        );
        readingFinishedHandlerRef.current = null;
        for (const [channel, handler] of registeredIpcHandlers) {
          if (channel === "reading-finished") continue;
          ipcRenderer.removeListener(channel, handler);
        }
      }
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wasAuthed = prevIsAuthedRef.current;
    prevIsAuthedRef.current = props.isAuthed;
    if (!props.isAuthed || wasAuthed) {
      return;
    }
    const handleAuthed = async () => {
      if (ConfigService.getReaderConfig("isAllowNotification") === "yes") {
        getNotification().then((res) => {
          if (
            res.data &&
            res.data.result === "ok" &&
            res.data.unread &&
            res.data.unread > 0
          ) {
            setPartialState({ notificationCount: res.data.unread });
            ConfigService.setReaderConfig("isAllowNotification", "no");
          }
        });
      }
      if (ConfigService.getReaderConfig("isProUpgraded") !== "yes") {
        try {
          ConfigService.setReaderConfig("isProUpgraded", "yes");
          await generateSyncRecord();
        } catch (error) {
          console.error(error);
        }
      }
      let userInfo = await props.handleFetchUserInfo();
      if (
        ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
        ConfigService.getItem("defaultSyncOption")
      ) {
        setIsSync(true);
        await handleCloudSyncRef.current(userInfo);
        await handleOpenLastReadBook();
        await autoScanFoldersOnStart();
      } else {
        await autoScanFoldersOnStart();
      }
    };
    handleAuthed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isAuthed]);

  return (
    <div
      className="header"
      style={props.isCollapsed ? { marginLeft: "40px" } : {}}
    >
      {props.isAuthed && (
        <div
          className="header-chat-widget"
          onClick={async () => {
            setPartialState({ notificationCount: 0 });
            let deviceUuid = await TokenService.getFingerprint();
            let url =
              getWebsiteUrl() +
              getWebsiteLang() +
              "/faq" +
              "?referer=app&version=" +
              packageJson.version +
              "&client=web&device=" +
              deviceUuid;
            if (isElectron) {
              window.electronAPI?.invoke("new-chat", {
                url: url,
              });
            } else {
              openInBrowser(url);
            }
          }}
        >
          <img
            src={chatWidget}
            alt="logo"
            className="login-mobile-qr"
            style={{
              width: "100%",
              height: "100%",
            }}
          />
          {state.notificationCount > 0 && (
            <div className="header-chat-widget-badge">
              {state.notificationCount > 99 ? "99+" : state.notificationCount}
            </div>
          )}
        </div>
      )}
      <div
        className="header-search-container"
        style={props.isCollapsed ? { width: "369px" } : {}}
      >
        <SearchBox />
      </div>
      <div
        className="setting-icon-parrent"
        style={props.isCollapsed ? { marginLeft: "430px" } : {}}
      >
        <div
          className="setting-icon-container"
          onClick={() => {
            props.handleSortDisplay(!props.isSortDisplay);
          }}
          onMouseLeave={() => {
            props.handleSortDisplay(false);
          }}
          style={{ top: "18px" }}
        >
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={props.t("Sort by")}
            data-tooltip-place="left"
          >
            <span className="icon-sort-desc header-sort-icon"></span>
          </span>
        </div>
        <div
          className="setting-icon-container"
          onClick={() => {
            props.handleSetting(true);
            props.handleAbout(false);
          }}
          onMouseLeave={() => {
            props.handleAbout(false);
          }}
          style={{ marginTop: "2px" }}
        >
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={props.t("Setting")}
            data-tooltip-place="left"
          >
            <span
              className="icon-setting setting-icon"
              style={{ fontSize: "25px" }}
            ></span>
          </span>
        </div>
        {!props.isAuthed && (
          <div
            className="setting-icon-container"
            onClick={() => {
              props.handleSetting(true);
              props.handleSettingMode("account");
              props.handleAbout(false);
            }}
            onMouseLeave={() => {
              props.handleAbout(false);
            }}
            style={{ marginTop: "2px", fontWeight: "bold" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={props.t("Register / Login")}
              data-tooltip-place="left"
            >
              <span
                className="icon-account setting-icon"
                style={{ fontSize: "25px" }}
              ></span>
            </span>
          </div>
        )}
        <div
          className="setting-icon-container"
          onClick={async () => {
            if (props.isAuthed) {
              if (!ConfigService.getItem("defaultSyncOption")) {
                toast(
                  props.t(
                    "Please add data source in the setting-Sync and backup first"
                  )
                );
                props.handleSetting(true);
                props.handleSettingMode("sync");
                return;
              }
              setIsSync(true);
              let userInfo = await props.handleFetchUserInfo();
              await handleCloudSync(userInfo);
            } else {
              if (
                ConfigService.getReaderConfig("isEnableKoReaderSync") !== "yes"
              ) {
                toast(props.t("Please upgrade to Pro to use this feature"));
                props.handleSetting(true);
                props.handleSettingMode("account");
                setIsSync(false);
              } else {
                setIsSync(true);
                await handleKOReaderSync();
                setIsSync(false);
              }
            }
          }}
          style={{ marginTop: "2px" }}
        >
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={props.t("Sync")}
            data-tooltip-place="left"
          >
            <span
              className={
                "icon-sync setting-icon" + (state.isSync ? " icon-rotate" : "")
              }
              style={{ fontSize: "25px" }}
            ></span>
          </span>
        </div>
      </div>

      {!props.isAuthed &&
      !state.isHidePro &&
      window.location.hostname !== "web.koodoreader.cn" ? (
        <div className="header-report-container">
          <span
            style={{ textDecoration: "underline" }}
            onClick={() => {
              if (
                window.location.hostname !== "web.koodoreader.com" &&
                !isElectron
              ) {
                props.handleSetting(true);
                props.handleSettingMode("account");
                return;
              }
              props.history.push("/login");
            }}
          >
            <Trans>Pro version</Trans>
            <span> </span>
          </span>

          <span
            className="icon-close icon-pro-close"
            onClick={() => {
              ConfigService.setReaderConfig("isHidePro", "yes");
              setPartialState({ isHidePro: true });
            }}
          ></span>
        </div>
      ) : null}
      {props.isAuthed &&
      props.userInfo &&
      ((props.userInfo.type === "pro" &&
        props.userInfo.valid_until <
          new Date().getTime() / 1000 + 30 * 24 * 3600) ||
        (props.userInfo.type === "trial" &&
          props.userInfo.valid_until <
            new Date().getTime() / 1000 + 3 * 24 * 3600)) ? (
        <div className="header-report-container">
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={i18n.t("Your trial will expire in", {
              ttl: Math.ceil(
                (props.userInfo.valid_until - new Date().getTime() / 1000) /
                  (24 * 3600)
              ),
            })}
          >
            <span
              style={{ textDecoration: "underline" }}
              onClick={async () => {
                let response = await getTempToken();
                if (response.code === 200) {
                  let tempToken = response.data.access_token;
                  let deviceUuid = await TokenService.getFingerprint();
                  openInBrowser(
                    getWebsiteUrl() +
                      getWebsiteLang() +
                      "/pricing?temp_token=" +
                      tempToken +
                      "&device_uuid=" +
                      deviceUuid
                  );
                } else if (response.code === 401) {
                  props.handleFetchAuthed();
                }
              }}
            >
              <Trans>Renew Pro</Trans>
            </span>
          </span>
        </div>
      ) : null}
      {props.isAuthed &&
      props.userInfo &&
      props.userInfo.type === "trial" &&
      props.userInfo.valid_until >
        new Date().getTime() / 1000 + 3 * 24 * 3600 ? (
        <div className="header-report-container" style={{ right: "200px" }}>
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={i18n.t("Your trial will expire in", {
              ttl: Math.ceil(
                (props.userInfo.valid_until - new Date().getTime() / 1000) /
                  (24 * 3600)
              ),
            })}
          >
            <span
              style={{ textDecoration: "underline" }}
              onClick={async () => {
                let response = await getTempToken();
                if (response.code === 200) {
                  let tempToken = response.data.access_token;
                  let deviceUuid = await TokenService.getFingerprint();
                  openInBrowser(
                    getWebsiteUrl() +
                      getWebsiteLang() +
                      "/pricing?temp_token=" +
                      tempToken +
                      "&device_uuid=" +
                      deviceUuid
                  );
                } else if (response.code === 401) {
                  props.handleFetchAuthed();
                }
              }}
            >
              <Trans>In trial</Trans>
            </span>
          </span>
        </div>
      ) : null}
      {KookitConfig.CloudMode !== "production" ? (
        <div className="header-report-container" style={{ right: "300px" }}>
          <span
            style={{
              color: "red",
              opacity: 1,
              fontWeight: "bold",
            }}
          >
            <Trans>TEST</Trans>
            <span> </span>
          </span>
        </div>
      ) : null}

      <ImportLocal
        {...({
          handleDrag: props.handleDrag,
        } as any)}
      />
      <SupportDialog />
      <UpdateInfo />
    </div>
  );
};

export default Header;
