import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import "./updateInfo.css";
import { useAppStore } from "../../../store/useAppStore";
import packageInfo from "../../../../package.json";
import { Trans } from "react-i18next";
import Lottie from "lottie-react";
import animationNew from "../../../assets/lotties/new.json";
import {
  compareVersions,
  getWebsiteLang,
  getWebsiteUrl,
  openExternalUrl,
} from "../../../utils/common";
import { isElectron } from "react-device-detect";
import { sleep } from "../../../utils/common";
import {
  checkDeveloperUpdate,
  checkStableUpdate,
  handleClearToken,
} from "../../../utils/request/common";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { isWindows } from "react-device-detect";

const UpdateInfo = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const isShowNew = useAppStore((s) => s.manager.isShowNew);
  const handleNewDialog = useAppStore((s) => s.handleNewDialog);
  const handleNewWarning = useAppStore((s) => s.handleNewWarning);
  const handleFetchAuthed = useAppStore((s) => s.handleFetchAuthed);
  const handleLoginOptionList = useAppStore((s) => s.handleLoginOptionList);
  const handleFetchDataSourceList = useAppStore(
    (s) => s.handleFetchDataSourceList
  );
  const handleFetchDefaultSyncOption = useAppStore(
    (s) => s.handleFetchDefaultSyncOption
  );
  const { t } = useTranslation();
  const [updateLog, setUpdateLog] = useState<any>("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!currentBook.key) {
        if (!isElectron) {
          return;
        }
        let res;
        if (ConfigService.getReaderConfig("updateChannel") === "stable") {
          res = await checkStableUpdate();
        } else {
          res = await checkDeveloperUpdate();
        }
        const newVersion = res.version;
        const stableVersion = res.stable_version || "1.0.0";
        await sleep(500);
        if (
          res.stable === "no" &&
          ConfigService.getReaderConfig("skipVersion") === newVersion
        ) {
          return;
        }
        if (window.electronAPI?.runtime?.windowsStore) {
          return;
        }
        if (!ConfigService.getReaderConfig("updateChannel")) {
          if (compareVersions(packageInfo.version, stableVersion) > 0) {
            ConfigService.setReaderConfig("updateChannel", "dev");
          }
        }
        if (
          stableVersion === packageInfo.version &&
          ConfigService.getReaderConfig("updateChannel") !== "dev"
        ) {
          return;
        }
        if (compareVersions(newVersion, packageInfo.version) > 0) {
          if (
            ConfigService.getReaderConfig("isDisableUpdate") !== "yes" ||
            isAuthed
          ) {
            setUpdateLog(res);
            handleNewDialog(true);
          } else {
            handleNewWarning(true);
          }
        }
      }
    })();
  }, []);

  const renderList = (arr: any[]) => {
    return arr.map((item, index) => {
      return (
        <li className="update-dialog-list" key={index}>
          <span>{index + 1 + ". "}</span>
          <span>{item}</span>
        </li>
      );
    });
  };

  const handleClose = () => {
    handleNewDialog(false);
  };

  return (
    <>
      {updateLog && isShowNew && (
        <div className="new-version">
          <div className="new-version-title">
            <Trans>Update to</Trans>
            {" " + updateLog.version}
            <div
              className="new-version-badge"
              style={{
                backgroundColor:
                  updateLog.stable === "yes"
                    ? "rgba(94, 178, 148, 1)"
                    : "rgba(92, 143, 211, 1)",
              }}
            >
              {t(
                updateLog.stable === "yes"
                  ? "Stable version"
                  : "Developer version"
              )}
            </div>
          </div>
          {(isAuthed && updateLog.skippable === "yes") ||
          !isAuthed ? (
            <div
              className="setting-close-container"
              onClick={() => {
                handleClose();
              }}
            >
              <span className="icon-close setting-close"></span>
            </div>
          ) : (
            <div
              className="update-log-out-button"
              style={{}}
              onClick={async () => {
                await handleClearToken();
                handleFetchAuthed();
                handleFetchDataSourceList();
                handleFetchDefaultSyncOption();
                handleLoginOptionList([]);
                toast.success(t("Log out successful"));
                handleClose();
              }}
            >
              {t("Exit Pro")}
            </div>
          )}
          <div className="update-dialog-info" style={{ height: 420 }}>
            <div className="new-version-animation">
              <Lottie
                animationData={animationNew}
                loop={false}
                style={{ height: 220, width: "100%" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <div
                className="new-version-open"
                onClick={() => {
                  if (isWindows) {
                    const ipcRenderer = window.electronAPI;
                    if (!isDownloading) {
                      setIsDownloading(true);
                      ipcRenderer.on(
                        "download-app-progress",
                        (config: any) => {
                          toast.loading(
                            t("Downloading") +
                              `(${config.downloadedMB} / ${config.totalMB} MB)`,
                            {
                              id: "download-progress",
                              position: "bottom-center",
                            }
                          );
                        }
                      );
                      ipcRenderer.invoke("update-win-app", {
                        version: updateLog.version,
                      });
                    } else {
                      ipcRenderer.invoke("cancel-download-app", {});
                      setIsDownloading(false);
                      setTimeout(() => {
                        toast.success(t("Cancellation successful"), {
                          id: "download-progress",
                        });
                      }, 500);
                    }
                  } else {
                    openExternalUrl(
                      getWebsiteUrl() +
                        getWebsiteLang() +
                        "/download" +
                        "?version=" +
                        (updateLog.stable === "yes" ? "stable" : "developer")
                    );
                  }
                }}
              >
                {isDownloading ? <Trans>Cancel</Trans> : <Trans>Download</Trans>}
              </div>
            </div>
            {isWindows && (
              <div
                className="new-version-skip"
                onClick={() => {
                  openExternalUrl(
                    getWebsiteUrl() +
                      getWebsiteLang() +
                      "/download" +
                      "?version=" +
                      (updateLog.stable === "yes" ? "stable" : "developer")
                  );
                }}
              >
                <Trans>Download in Browser</Trans>
              </div>
            )}
            {updateLog.stable !== "yes" && (
              <div
                className="new-version-skip"
                onClick={() => {
                  ConfigService.setReaderConfig(
                    "skipVersion",
                    updateLog.version
                  );
                  handleClose();
                }}
              >
                <Trans>Skip this version</Trans>
              </div>
            )}
            {updateLog.stable !== "yes" && (
              <div
                className="new-version-skip"
                onClick={() => {
                  ConfigService.setReaderConfig("updateChannel", "stable");
                  handleClose();
                }}
              >
                <Trans>Only receive stable version</Trans>
              </div>
            )}

            {updateLog && (
              <>
                <p className="update-dialog-new-title">
                  <Trans>What's new</Trans>
                </p>
                <ul className="update-dialog-new-container">
                  {renderList(updateLog.new)}
                </ul>
                <p className="update-dialog-fix-title">
                  <Trans>What's been fixed</Trans>
                </p>
                <ul className="update-dialog-fix-container">
                  {renderList(updateLog.fix)}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateInfo;
