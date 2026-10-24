import { useState } from "react";
import "./autoImportDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { AutoImportDialogProps } from "./interface";
import {
  AUTO_IMPORT_FOLDERS_KEY,
  scanFolderForNewBooks,
} from "../../../utils/common";
declare var window: any;

const loadFolders = (): string[] => {
  try {
    return ConfigService.getAllListConfig(AUTO_IMPORT_FOLDERS_KEY) || [];
  } catch {
    return [];
  }
};

const saveFolders = (folders: string[]) => {
  ConfigService.setAllListConfig(folders, AUTO_IMPORT_FOLDERS_KEY);
};

const AutoImportDialog = (props: AutoImportDialogProps) => {
  const [folders, setFolders] = useState<string[]>(loadFolders);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    props.handleAutoImportDialog(false);
  };

  const scanAndImportFolder = async (folderPath: string) => {
    return scanFolderForNewBooks(folderPath, props.importBookFunc);
  };

  const handleAddFolder = async () => {
    const ipcRenderer = window.electronAPI;
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) return;
    if (folders.includes(newPath)) {
      toast.error(props.t("Folder already added"));
      return;
    }
    setIsLoading(true);
    const imported = await scanAndImportFolder(newPath);
    const nextFolders = [...folders, newPath];
    setFolders(nextFolders);
    setIsLoading(false);
    saveFolders(nextFolders);
    if (imported > 0) {
      toast.success(props.t("Auto import complete") + ": " + imported);
      props.handleFetchBooks();
    } else {
      toast.success(props.t("No new books found"));
    }
  };

  const handleScanAllFolders = async () => {
    if (folders.length === 0) {
      toast.error(props.t("No auto import folder added yet"));
      return;
    }
    setIsLoading(true);
    let imported = 0;
    for (const folder of folders) {
      imported += await scanAndImportFolder(folder);
    }
    setIsLoading(false);
    if (imported > 0) {
      toast.success(props.t("Auto import complete") + ": " + imported);
      props.handleFetchBooks();
    } else {
      toast.success(props.t("No new books found"));
    }
  };

  const handleRemoveFolder = (folderPath: string) => {
    const nextFolders = folders.filter((item) => item !== folderPath);
    setFolders(nextFolders);
    saveFolders(nextFolders);
    toast.success(props.t("Folder removed"));
  };

  return (
    <div
      className="backup-page-container auto-import-container"
      style={{ height: "450px", top: "calc(50% - 225px)" }}
    >
      <div className="backup-dialog-title">
        {props.t("Auto import folder")}
      </div>

      <div className="import-dialog-option">
        {isLoading ? (
          <div className="loading-animation" style={{ height: "100%" }}>
            <div className="loader"></div>
          </div>
        ) : folders.length === 0 ? (
          <div className="auto-import-empty">
            <div>{props.t("No auto import folder added yet")}</div>
            <div style={{ marginTop: "8px" }}>
              {props.t(
                "Auto scan and import books when starting the app or when clicking Scan"
              )}
            </div>
          </div>
        ) : (
          folders.map((folder, index) => (
            <div key={index} className="cloud-drive-item auto-import-item">
              <span className="cloud-drive-label" title={folder}>
                <span className="icon-folder auto-import-folder-icon"></span>
                {folder}
              </span>
              <span
                className="icon-trash import-dialog-folder-button"
                style={{ fontSize: "13px", marginRight: "8px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFolder(folder);
                }}
              ></span>
            </div>
          ))
        )}
      </div>

      <div className="cloud-drive-item auto-import-scan-button">
        <div
          className="cloud-drive-label"
          style={{ textAlign: "left", marginLeft: "10px" }}
          onClick={handleScanAllFolders}
        >
          <Trans>Scan for new books</Trans>
        </div>
      </div>

      <div className="cloud-drive-item auto-import-add-button">
        <div
          className="cloud-drive-label"
          style={{ textAlign: "right" }}
          onClick={handleAddFolder}
        >
          <Trans>Add local folder</Trans>
        </div>
      </div>

      <div className="backup-page-close-icon" onClick={() => handleClose()}>
        <span className="icon-close backup-close-icon"></span>
      </div>
    </div>
  );
};

export default AutoImportDialog;
