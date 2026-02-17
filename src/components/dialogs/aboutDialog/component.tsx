import React from "react";
import { Trans } from "react-i18next";
import { AboutDialogProps, AboutDialogState } from "./interface";
import { isElectron } from "react-device-detect";
import { getWebsiteUrl, openExternalUrl } from "../../../utils/common";
import toast from "react-hot-toast";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/file/export";
import "./aboutDialog.css";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import copyTextToClipboard from "copy-text-to-clipboard";
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
                  ConfigService.getReaderConfig("lang") &&
                  ConfigService.getReaderConfig("lang").startsWith("zh")
                ) {
                  this.handleJump(getWebsiteUrl() + "/zh/document");
                } else {
                  this.handleJump(getWebsiteUrl() + "/en/document");
                }
              }}
            >
              <Trans>Document</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={async () => {
                if (
                  ConfigService.getReaderConfig("lang") &&
                  ConfigService.getReaderConfig("lang").startsWith("zh")
                ) {
                  openExternalUrl(getWebsiteUrl() + "/zh/support");
                } else {
                  openExternalUrl(getWebsiteUrl() + "/en/support");
                }
              }}
            >
              <Trans>Support</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump(getWebsiteUrl());
              }}
            >
              <Trans>Our website</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                copyTextToClipboard("feedback@koodoreader.com");
                toast.success(this.props.t("Email copied to clipboard"));
              }}
            >
              <Trans>Send email</Trans>
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
                  this.handleJump(getWebsiteUrl());
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
                  left: "665px",
                  top: isElectron ? "230px" : "200px",
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
              let books = await DatabaseService.getAllRecords("books");
              if (books.length > 0) {
                await exportBooks(books);
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export all books</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={async () => {
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter(
                (note) => note.notes && note.notes.length > 0
              );
              if (notes.length > 0) {
                exportNotes(notes, books);
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
            onClick={async () => {
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter((note) => note.notes === "");
              if (notes.length > 0) {
                exportHighlights(notes, books);
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
              let dictHistory = await DatabaseService.getAllRecords("words");
              let books = await DatabaseService.getAllRecords("books");
              if (dictHistory.length > 0) {
                exportDictionaryHistory(dictHistory, books);
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
