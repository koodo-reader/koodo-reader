import React from "react";
import "./updateInfo.css";
import { DetailDialogProps, DetailDialogState } from "./interface";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";

import ShelfUtil from "../../../utils/readUtils/shelfUtil";
class DetailDialog extends React.Component<
  DetailDialogProps,
  DetailDialogState
> {
  constructor(props: DetailDialogProps) {
    super(props);
    this.state = {};
  }

  handleClose = () => {
    this.props.handleDetailDialog(false);
  };
  render() {
    return (
      <div className="download-desk-container">
        <div
          className="action-dialog-book-info"
          style={{ paddingTop: "20", paddingBottom: "20" }}
        >
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
              <Trans>Shelf</Trans>:
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
              {Parser(
                DOMPurify.sanitize(this.props.currentBook.description) || " "
              )}
            </div>
          </div>
        </div>
        <div
          className="new-version-open"
          onClick={() => {
            this.handleClose();
          }}
          style={{ marginTop: "-10px" }}
        >
          <Trans>Close</Trans>
        </div>
      </div>
    );
  }
}

export default DetailDialog;
