import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps } from "./interface";
import AddTrash from "../../../utils/readUtils/addTrash";
import FileSaver from "file-saver";
import Parser from "html-react-parser";
import ShelfUtil from "../../../utils/readUtils/shelfUtil";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/fileUtils/bookUtil";
class ActionDialog extends React.Component<ActionDialogProps> {
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleDeleteDialog(true);
    this.props.handleActionDialog(false);
  };
  handleEditBook = () => {
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleRestoreBook = () => {
    AddTrash.clear(this.props.currentBook.key);
    this.props.handleActionDialog(false);
    toast.success(this.props.t("Restore Successfully"));
    this.props.handleFetchBooks();
  };
  render() {
    if (this.props.mode === "trash") {
      return (
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          style={{
            left: this.props.left,
            top: this.props.top,
            maxHeight: "45px",
            paddingTop: "3px",
          }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleRestoreBook();
              }}
            >
              <span className="icon-clockwise view-icon"></span>
              <span className="action-name">
                <Trans>Restore</Trans>
              </span>
              <p className="action-name"></p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          this.props.handleActionDialog(false);
        }}
        style={{ left: this.props.left, top: this.props.top }}
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-add"
            onClick={() => {
              this.handleAddShelf();
            }}
          >
            <span className="icon-shelf view-icon"></span>
            <p className="action-name">
              <Trans>Add to Shelf</Trans>
            </p>
            <p className="action-name"></p>
          </div>
          <div
            className="action-dialog-delete"
            onClick={() => {
              this.handleDeleteBook();
            }}
          >
            <span className="icon-trash view-icon"></span>
            <p className="action-name">
              <Trans>Delete</Trans>
            </p>
            <p className="action-name"></p>
          </div>
          <div
            className="action-dialog-edit"
            onClick={() => {
              this.handleEditBook();
            }}
          >
            <span className="icon-edit view-icon"></span>
            <p className="action-name">
              <Trans>Edit</Trans>
            </p>
            <p className="action-name"></p>
          </div>
          <div
            className="action-dialog-edit"
            onClick={() => {
              BookUtil.fetchBook(
                this.props.currentBook.key,
                true,
                this.props.currentBook.path
              ).then((result: any) => {
                toast.success(this.props.t("Export Successfully"));
                FileSaver.saveAs(
                  new Blob([result]),
                  this.props.currentBook.name +
                    `.${this.props.currentBook.format.toLocaleLowerCase()}`
                );
              });
            }}
          >
            <span className="icon-export view-icon"></span>
            <p className="action-name">
              <Trans>Export</Trans>
            </p>
            <p className="action-name"></p>
          </div>
        </div>
        <div className="sort-dialog-seperator"></div>

        <div className="action-dialog-book-info">
          <div>
            <p className="action-dialog-book-publisher">
              <Trans>Book Name</Trans>:
            </p>
            <p className="action-dialog-book-title">
              {this.props.currentBook.name}
            </p>
            <p className="action-dialog-book-publisher">
              <Trans>Author</Trans>:
            </p>
            <p className="action-dialog-book-title">
              <Trans>{this.props.currentBook.author}</Trans>
            </p>
          </div>
          <div>
            <p className="action-dialog-book-publisher">
              <Trans>Publisher</Trans>:
            </p>
            <p className="action-dialog-book-title">
              {this.props.currentBook.publisher}
            </p>
          </div>
          <div>
            <p className="action-dialog-book-publisher">
              <Trans>File size</Trans>:
            </p>
            <p className="action-dialog-book-title">
              {this.props.currentBook.size
                ? this.props.currentBook.size / 1024 / 1024 > 1
                  ? parseFloat(
                      this.props.currentBook.size / 1024 / 1024 + ""
                    ).toFixed(2) + "Mb"
                  : parseInt(this.props.currentBook.size / 1024 + "") + "Kb"
                : // eslint-disable-next-line
                  "0" + "Kb"}
            </p>
          </div>
          <div>
            <p className="action-dialog-book-added">
              <Trans>Added at</Trans>:
            </p>
            <p className="action-dialog-book-title">
              {new Date(parseInt(this.props.currentBook.key))
                .toLocaleString()
                .replace(/:\d{1,2}$/, " ")}
            </p>
          </div>
          <div>
            <p className="action-dialog-book-publisher">
              <Trans>My Shelves</Trans>:
            </p>
            <p className="action-dialog-book-title">
              {ShelfUtil.getBookPosition(this.props.currentBook.key).map(
                (item) => (
                  <>
                    #<Trans>{item}</Trans>&nbsp;
                  </>
                )
              )}
            </p>
          </div>
          <div>
            <p className="action-dialog-book-desc">
              <Trans>Description</Trans>:
            </p>
            <div className="action-dialog-book-detail">
              {Parser(this.props.currentBook.description || " ")}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ActionDialog;
