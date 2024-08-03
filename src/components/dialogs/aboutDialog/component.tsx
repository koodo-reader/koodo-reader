import React from "react";
import { Trans } from "react-i18next";
import { AboutDialogProps, AboutDialogState } from "./interface";
import { isElectron } from "react-device-detect";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import toast from "react-hot-toast";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/syncUtils/exportUtil";
import "./aboutDialog.css";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";

declare var window: any;
class AboutDialog extends React.Component<AboutDialogProps, AboutDialogState> {
  constructor(props: AboutDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
    };
  }
  handleJump = (url: string) => {
    openExternalUrl(url);
    this.props.handleAbout(false);
  };

  render() {
    return (
      <>
        <div
          className="sort-dialog-container"
          onMouseLeave={() => {
            this.props.handleAbout(false);
          }}
          onMouseEnter={() => {
            this.props.handleAbout(true);
          }}
          style={{ left: "480px" }}
        >
          <ul className="sort-by-category">
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.props.handleSetting(true);
                this.props.handleAbout(false);
              }}
            >
              <Trans>Setting</Trans>
            </li>

            <li
              className="sort-by-category-list"
              onClick={() => {
                if (
                  StorageUtil.getReaderConfig("lang") === "zhCN" ||
                  StorageUtil.getReaderConfig("lang") === "zhTW" ||
                  StorageUtil.getReaderConfig("lang") === "zhMO"
                ) {
                  this.handleJump("https://koodoreader.com/zh/document");
                } else {
                  this.handleJump("https://koodoreader.com/en/document");
                }
              }}
            >
              <Trans>Document</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={async () => {
                this.handleJump(`https://koodoreader.com/en/support`);
              }}
            >
              <Trans>Feedback</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                if (
                  StorageUtil.getReaderConfig("lang") === "zhCN" ||
                  StorageUtil.getReaderConfig("lang") === "zhTW" ||
                  StorageUtil.getReaderConfig("lang") === "zhMO"
                ) {
                  this.handleJump("https://koodoreader.com/zh/roadmap");
                } else {
                  this.handleJump("https://koodoreader.com/en/roadmap");
                }
              }}
            >
              <Trans>Roadmap</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump("https://koodoreader.com");
              }}
            >
              <Trans>Our website</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump(
                  "https://github.com/koodo-reader/koodo-reader#translation"
                );
              }}
            >
              <Trans>Translation</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump("https://github.com/koodo-reader/koodo-reader");
              }}
            >
              <Trans>GitHub repository</Trans>
            </li>

            {isElectron && (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  window
                    .require("electron")
                    .ipcRenderer.invoke("open-console", "ping");
                }}
              >
                <Trans>Open console</Trans>
              </li>
            )}
            {this.props.isNewWarning && (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  this.handleJump("https://koodoreader.com/en");
                }}
                style={{ color: "rgb(35, 170, 242)" }}
              >
                <Trans>New version</Trans>
              </li>
            )}
            <li
              className="sort-by-category-list"
              onMouseEnter={() => {
                this.setState({ isShowExportAll: true });
              }}
              onMouseLeave={(event) => {
                this.setState({ isShowExportAll: false });
                event.stopPropagation();
              }}
            >
              <Trans>Export all</Trans>
              <span className="icon-dropdown icon-export-all"></span>
            </li>
          </ul>
        </div>
        <div
          className="sort-dialog-container"
          style={
            this.state.isShowExportAll
              ? {
                  position: "absolute",
                  left: "680px",
                  top: "250px",
                }
              : { display: "none" }
          }
          onMouseEnter={(event) => {
            this.setState({ isShowExportAll: true });
            event?.stopPropagation();
          }}
          onMouseLeave={() => {
            this.setState({ isShowExportAll: false });
            this.props.handleAbout(false);
          }}
        >
          <li
            className="sort-by-category-list"
            onClick={async () => {
              if (
                [...this.props.books, ...this.props.deletedBooks].length > 0
              ) {
                await exportBooks([
                  ...this.props.books,
                  ...this.props.deletedBooks,
                ]);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export all books</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              if (
                this.props.notes.filter((item) => item.notes !== "").length > 0
              ) {
                exportNotes(
                  this.props.notes.filter((item) => item.notes !== ""),
                  [...this.props.books, ...this.props.deletedBooks]
                );
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export all notes</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              if (
                this.props.notes.filter((item) => item.notes === "").length > 0
              ) {
                exportHighlights(
                  this.props.notes.filter((item) => item.notes === ""),
                  [...this.props.books, ...this.props.deletedBooks]
                );
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export all highlights</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={async () => {
              let dictHistory =
                (await window.localforage.getItem("words")) || [];
              if (dictHistory.length > 0) {
                exportDictionaryHistory(dictHistory, [
                  ...this.props.books,
                  ...this.props.deletedBooks,
                ]);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export all dictionary history</Trans>
          </li>
        </div>
      </>
    );
  }
}

export default AboutDialog;
