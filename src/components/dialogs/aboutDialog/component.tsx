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
          style={{ left: "495px" }}
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
                  StorageUtil.getReaderConfig("lang") === "zh" ||
                  StorageUtil.getReaderConfig("lang") === "cht"
                ) {
                  this.handleJump(
                    "https://troyeguo.notion.site/Koodo-Reader-0c9c7ccdc5104a54825dfc72f1c84bea"
                  );
                } else {
                  this.handleJump(
                    "https://troyeguo.notion.site/Koodo-Reader-Document-9c767af3d66c459db996bdd08a34c34b"
                  );
                }
              }}
            >
              <Trans>Help</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump(`https://koodo.960960.xyz/en/support`);
              }}
            >
              <Trans>Feedback</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                if (
                  StorageUtil.getReaderConfig("lang") === "zh" ||
                  StorageUtil.getReaderConfig("lang") === "cht"
                ) {
                  this.handleJump(
                    "https://troyeguo.notion.site/215baeda57804fd29dbb0e91d1e6a021?v=360c00183d944b598668f34c255edfd7"
                  );
                } else {
                  this.handleJump(
                    "https://troyeguo.notion.site/d1c19a132932465bae1d89dd963c92ea?v=ca8aa69cf25849c18c92b92ba868663b"
                  );
                }
              }}
            >
              <Trans>Roadmap</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump("https://koodo.960960.xyz");
              }}
            >
              <Trans>Our Website</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump(
                  "https://poeditor.com/join/project?hash=fk4qbQTlsk"
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
              <Trans>Github Repo</Trans>
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
                <Trans>Open Console</Trans>
              </li>
            )}
            {this.props.isNewWarning && (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  this.handleJump("https://koodo.960960.xyz/en");
                }}
                style={{ color: "rgb(35, 170, 242)" }}
              >
                <Trans>New Version</Trans>
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
              <Trans>Export All</Trans>
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
                toast.success(this.props.t("Export Successfully"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export All Books</Trans>
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
                toast.success(this.props.t("Export Successfully"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export All Notes</Trans>
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
                toast.success(this.props.t("Export Successfully"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export All Highlights</Trans>
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
                toast.success(this.props.t("Export Successfully"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export All Dictionary History</Trans>
          </li>
        </div>
      </>
    );
  }
}

export default AboutDialog;
