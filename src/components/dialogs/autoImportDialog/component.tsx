import React from "react";
import "./autoImportDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { AutoImportDialogProps, AutoImportDialogState } from "./interface";
import {
  AUTO_IMPORT_FOLDERS_KEY,
  scanFolderForNewBooks,
} from "../../../utils/common";
declare var window: any;

class AutoImportDialog extends React.Component<
  AutoImportDialogProps,
  AutoImportDialogState
> {
  constructor(props: AutoImportDialogProps) {
    super(props);
    this.state = {
      folders: this.loadFolders(),
      isLoading: false,
    };
  }

  loadFolders(): string[] {
    try {
      return ConfigService.getAllListConfig(AUTO_IMPORT_FOLDERS_KEY) || [];
    } catch {
      return [];
    }
  }

  saveFolders(folders: string[]) {
    ConfigService.setAllListConfig(folders, AUTO_IMPORT_FOLDERS_KEY);
  }

  handleClose = () => {
    this.props.handleAutoImportDialog(false);
  };

  scanAndImportFolder = async (folderPath: string) => {
    return scanFolderForNewBooks(folderPath, this.props.importBookFunc);
  };

  handleAddFolder = async () => {
    const ipcRenderer = window.electronAPI;
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) return;
    if (this.state.folders.includes(newPath)) {
      toast.error(this.props.t("Folder already added"));
      return;
    }
    this.setState({ isLoading: true });
    const imported = await this.scanAndImportFolder(newPath);
    this.setState(
      {
        folders: [...this.state.folders, newPath],
        isLoading: false,
      },
      () => {
        this.saveFolders(this.state.folders);
        if (imported > 0) {
          toast.success(
            this.props.t("Auto import complete") + ": " + imported
          );
          this.props.handleFetchBooks();
        } else {
          toast.success(this.props.t("No new books found"));
        }
      }
    );
  };

  handleRemoveFolder = (folderPath: string) => {
    this.setState(
      {
        folders: this.state.folders.filter((item) => item !== folderPath),
      },
      () => {
        this.saveFolders(this.state.folders);
        toast.success(this.props.t("Folder removed"));
      }
    );
  };

  render() {
    return (
      <div
        className="backup-page-container auto-import-container"
        style={{ height: "450px", top: "calc(50% - 225px)" }}
      >
        <div className="backup-dialog-title">
          {this.props.t("Auto import folder")}
        </div>

        <div className="import-dialog-option">
          {this.state.isLoading ? (
            <div className="loading-animation" style={{ height: "100%" }}>
              <div className="loader"></div>
            </div>
          ) : this.state.folders.length === 0 ? (
            <div
              className="auto-import-empty"
            >
              {this.props.t("No auto import folder added yet")}
            </div>
          ) : (
            this.state.folders.map((folder, index) => (
              <div key={index} className="cloud-drive-item auto-import-item">
                <span
                  className="cloud-drive-label"
                  title={folder}
                >
                  <span className="icon-folder auto-import-folder-icon"></span>
                  {folder}
                </span>
                <span
                  className="icon-trash import-dialog-folder-button"
                  style={{ fontSize: "13px", marginRight: "8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleRemoveFolder(folder);
                  }}
                ></span>
              </div>
            ))
          )}
        </div>

        <div
          className="cloud-drive-item auto-import-add-button"
          onClick={this.handleAddFolder}
        >
          <span className="cloud-drive-label" style={{ textAlign: "right" }}>
            <Trans>Add local folder</Trans>
          </span>
        </div>

        <div
          className="backup-page-close-icon"
          onClick={() => this.handleClose()}
        >
          <span className="icon-close backup-close-icon"></span>
        </div>
      </div>
    );
  }
}

export default AutoImportDialog;
