import React from "react";
import "./updateInfo.css";
import { DetailDialogProps, DetailDialogState } from "./interface";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import { FastAverageColor } from "fast-average-color";
import EmptyCover from "../../emptyCover";
class DetailDialog extends React.Component<
  DetailDialogProps,
  DetailDialogState
> {
  constructor(props: DetailDialogProps) {
    super(props);
    this.state = {
      backgroundColor: "",
      textColor: "",
    };
  }
  componentDidMount() {
    const fac = new FastAverageColor();

    // From not loaded image (HTMLImageElement)
    fac
      .getColorAsync(this.props.currentBook.cover, { algorithm: "dominant" })
      .then((color) => {
        this.setState({ textColor: color.isDark ? "#fff" : "#333" });
      })
      .catch((e) => {
        console.error(e);
      });
  }
  handleClose = () => {
    this.props.handleDetailDialog(false);
  };
  render() {
    return (
      <div
        className="download-desk-container"
        style={{ color: this.state.textColor }}
      >
        <div className="detail-cover-background-container">
          <div
            className="detail-cover-background"
            style={{
              // background: this.state.backgroundColor,

              backgroundImage: 'url("' + this.props.currentBook.cover + '")',
            }}
          ></div>
        </div>
        <div
          className="detail-dialog-book-info"
          style={{
            paddingTop: "20",
            paddingBottom: "20",
            height: "430px",
          }}
        >
          <div style={{ position: "relative" }}>
            <div className="detail-cover-container">
              {this.props.currentBook.cover ? (
                <img
                  src={this.props.currentBook.cover}
                  alt=""
                  className="detail-cover"
                />
              ) : (
                <div
                  className="detail-cover"
                  style={{ width: "130px", height: "170px" }}
                >
                  <EmptyCover
                    {...{
                      format: this.props.currentBook.format,
                      title: this.props.currentBook.name,
                      scale: 1.2,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <p className="detail-dialog-book-title">
            {this.props.currentBook.name}
          </p>
          <p className="detail-dialog-book-author">
            <Trans>{this.props.currentBook.author}</Trans>
          </p>

          <div className="detail-sub-info">
            <p className="detail-dialog-book-publisher">
              <p className="detail-sub-title">
                <Trans>Publisher</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">
                  {this.props.currentBook.publisher}
                </p>
              </p>
            </p>
            <p
              className="detail-dialog-book-divider"
              style={{ backgroundColor: this.state.textColor }}
            ></p>
            <p className="detail-dialog-book-size">
              <p className="detail-sub-title">
                <Trans>File size</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">
                  {this.props.currentBook.size
                    ? this.props.currentBook.size / 1024 / 1024 > 1
                      ? parseFloat(
                          this.props.currentBook.size / 1024 / 1024 + ""
                        ).toFixed(2) + "Mb"
                      : parseInt(this.props.currentBook.size / 1024 + "") + "Kb"
                    : // eslint-disable-next-line
                      "0" + "Kb"}
                </p>
              </p>
            </p>
            <p
              className="detail-dialog-book-divider"
              style={{ backgroundColor: this.state.textColor }}
            ></p>
            <p className="detail-dialog-book-added">
              <p className="detail-sub-title">
                <Trans>Added at</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">
                  {new Date(parseInt(this.props.currentBook.key))
                    .toLocaleString()
                    .replace(/:\d{1,2}$/, " ")}
                </p>
              </p>
            </p>
            <p
              className="detail-dialog-book-divider"
              style={{ backgroundColor: this.state.textColor }}
            ></p>
            <p className="detail-dialog-book-added">
              <p className="detail-sub-title">
                <Trans>Pages</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">
                  {this.props.currentBook.page}
                </p>
              </p>
            </p>
          </div>
          <div>
            <p className="detail-dialog-book-desc">
              <Trans>Description</Trans>:
            </p>
            <div className="detail-dialog-book-detail">
              {this.props.currentBook.description ? (
                Parser(DOMPurify.sanitize(this.props.currentBook.description))
              ) : (
                <Trans>Empty</Trans>
              )}
            </div>
          </div>
        </div>
        <div
          className="new-version-open"
          onClick={() => {
            this.handleClose();
          }}
          style={{ marginTop: "10px", position: "absolute", bottom: "10px" }}
        >
          <Trans>Close</Trans>
        </div>
      </div>
    );
  }
}

export default DetailDialog;
