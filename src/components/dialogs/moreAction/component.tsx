import React from "react";
import "./moreAction.css";
import { Trans } from "react-i18next";
import { MoreActionProps, MoreActionState } from "./interface";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/file/bookUtil";
import {
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/file/export";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  BookHelper,
  ConfigService,
} from "../../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../../assets/lib/kookit.min";
import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../../../utils/common";
class ActionDialog extends React.Component<MoreActionProps, MoreActionState> {
  constructor(props: MoreActionProps) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          this.props.handleMoreAction(false);
          this.props.handleActionDialog(false);
        }}
        onMouseEnter={(event) => {
          this.props.handleMoreAction(true);
          this.props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          this.props.isShowExport
            ? {
                position: "fixed",
                left: this.props.left + (this.props.isExceed ? -195 : 195),
                top: this.props.top + 70,
              }
            : { display: "none" }
        }
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              BookUtil.fetchBook(
                this.props.currentBook.key,
                this.props.currentBook.format.toLowerCase(),
                true,
                this.props.currentBook.path
              ).then((result: any) => {
                toast.success(this.props.t("Export successful"));
                saveAs(
                  new Blob([result]),
                  this.props.currentBook.name +
                    `.${this.props.currentBook.format.toLocaleLowerCase()}`
                );
              });
            }}
          >
            <p className="action-name">
              <Trans>Export books</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              let books = await DatabaseService.getAllRecords("books");
              let notes = (
                await DatabaseService.getRecordsByBookKey(
                  this.props.currentBook.key,
                  "notes"
                )
              ).filter((note) => note.notes !== "");
              if (notes.length > 0) {
                exportNotes(notes, books);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <p className="action-name">
              <Trans>Export notes</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              let books = await DatabaseService.getAllRecords("books");
              let highlights = (
                await DatabaseService.getRecordsByBookKey(
                  this.props.currentBook.key,
                  "notes"
                )
              ).filter((note) => note.notes === "");
              if (highlights.length > 0) {
                exportHighlights(highlights, books);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <p className="action-name">
              <Trans>Export highlights</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              let dictHistory = await DatabaseService.getRecordsByBookKey(
                this.props.currentBook.key,
                "words"
              );
              let books = await DatabaseService.getAllRecords("books");
              if (dictHistory.length > 0) {
                exportDictionaryHistory(dictHistory, books);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <p className="action-name">
              <Trans>Export dictionary history</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              if (this.props.currentBook.format === "PDF") {
                toast(this.props.t("Not supported yet"));
                return;
              }
              toast(this.props.t("Pre-caching"));
              BookUtil.fetchBook(
                this.props.currentBook.key,
                this.props.currentBook.format.toLowerCase(),
                true,
                this.props.currentBook.path
              ).then(async (result: any) => {
                let rendition = BookHelper.getRendition(
                  result,
                  {
                    format: this.props.currentBook.format,
                    readerMode: "",
                    charset: this.props.currentBook.charset,
                    animation:
                      ConfigService.getReaderConfig("isSliding") === "yes"
                        ? "sliding"
                        : "",
                    convertChinese:
                      ConfigService.getReaderConfig("convertChinese"),
                    parserRegex: "",
                    isDarkMode: "no",
                    isMobile: "no",
                  },
                  Kookit
                );
                let cache = await rendition.preCache(result);
                if (cache !== "err" || cache) {
                  await BookUtil.addBook(
                    "cache-" + this.props.currentBook.key,
                    "zip",
                    cache
                  );
                  toast.success(this.props.t("Pre-caching successful"));
                } else {
                  toast.error(this.props.t("Pre-caching failed"));
                }
              });
            }}
          >
            <p className="action-name">
              <Trans>Pre-cache</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              await BookUtil.deleteBook(
                "cache-" + this.props.currentBook.key,
                "zip"
              );
              toast.success(this.props.t("Deletion successful"));
            }}
          >
            <p className="action-name">
              <Trans>Delete pre-cache</Trans>
            </p>
          </div>
          {isElectron && (
            <div
              className="action-dialog-edit"
              style={{ paddingLeft: "0px" }}
              onClick={async () => {
                if (!this.props.currentBook.path) {
                  toast.error(this.props.t("No path found for this book"));
                  return;
                }
                const fs = window.require("fs");
                const path = window.require("path");
                const bookPath =
                  this.props.currentBook.path ||
                  path.join(
                    getStorageLocation() || "",
                    `book`,
                    this.props.currentBook.key +
                      "." +
                      this.props.currentBook.format.toLowerCase()
                  );
                if (!fs.existsSync(bookPath)) {
                  toast.error(this.props.t("File not found"));
                  return;
                }

                const { shell } = window.require("electron");
                shell.showItemInFolder(bookPath);
              }}
            >
              <p className="action-name">
                <Trans>Locate in the folder</Trans>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ActionDialog;
