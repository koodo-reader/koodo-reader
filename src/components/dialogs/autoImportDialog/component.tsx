import React from "react";
import "./autoImportDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { AutoImportDialogProps, AutoImportDialogState } from "./interface";
import { supportedFormats } from "../../../utils/common";
declare var window: any;

const FOLDER_CONFIG_KEY = "autoImportFolders";

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
      return ConfigService.getAllListConfig(FOLDER_CONFIG_KEY) || [];
    } catch {
      return [];
    }
  }

  saveFolders(folders: string[]) {
    ConfigService.setAllListConfig(folders, FOLDER_CONFIG_KEY);
  }

  handleClose = () => {
    this.props.handleAutoImportDialog(false);
  };

  getAllFilesRecursively = (
    fs: any,
    path: any,
    dirPath: string
  ): string[] => {
    let files: string[] = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory && !stat.isFile) {
          files = files.concat(this.getAllFilesRecursively(fs, path, fullPath));
        } else if (stat.isFile) {
          const ext = path.extname(item).toLowerCase();
          if (supportedFormats.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    }
    return files;
  };

  getExistingBookPaths(): Set<string> {
    const paths = new Set<string>();
    if (this.props.books && this.props.books.length > 0) {
      for (const book of this.props.books) {
        if (book.path) paths.add(book.path);
      }
    }
    return paths;
  }

  scanAndImportFolder = async (folderPath: string) => {
    const fs = window.electronAPI.fs;
    const path = window.electronAPI.path;
    const ipcRenderer = window.electronAPI;
    // Lightweight dedup: only read db size/path, no file read, no md5.
    // A path match means already imported; falling back to size+path filter
    // avoids re-importing an existing book whose stored path is empty.
    const existingPaths = new Set<string>();
    const sizeByPath = new Map<string, number>();
    const bookListResult = await ipcRenderer.invoke("custom-database-command", {
      query: `SELECT path, size FROM books`,
      dbName: "books",
      storagePath: ConfigService.getItem("storageLocation"),
      executeType: "all",
    });
    (bookListResult || []).forEach((item: any) => {
      if (item.path) existingPaths.add(item.path);
      if (item.path && item.size != null) sizeByPath.set(item.path, item.size);
    });
    const files = this.getAllFilesRecursively(fs, path, folderPath);
    let imported = 0;
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile) continue;
        if (existingPaths.has(filePath)) continue;
        if (
          sizeByPath.has(filePath) &&
          sizeByPath.get(filePath) === stat.size
        ) {
          continue;
        }
        const buffer = await fs.promises.readFile(filePath);
        const arraybuffer = new Uint8Array(buffer).buffer;
        const blob = new Blob([arraybuffer]);
        let file: any = new File([blob], fileName);
        file.path = filePath;
        await this.props.importBookFunc(file);
        existingPaths.add(filePath);
        imported++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(
          this.props.t("Import failed") + ": " + fileName + " - " + errorMessage
        );
      }
    }
    return imported;
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
