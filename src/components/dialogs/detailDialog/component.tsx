import React from "react";
import "./updateInfo.css";
import { DetailDialogProps, DetailDialogState } from "./interface";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import EmptyCover from "../../emptyCover";
import CoverUtil from "../../../utils/file/coverUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { formatDateToDay, formatTimestamp } from "../../../utils/common";
class DetailDialog extends React.Component<
  DetailDialogProps,
  DetailDialogState
> {
  constructor(props: DetailDialogProps) {
    super(props);
    this.state = {
      backgroundColor: "#333",
      textColor: "#333",
      cover: "",
      isCoverExist: false,
      shelfLocation: [],
    };
  }
  async componentDidMount() {
    this.setState({
      cover: await CoverUtil.getCover(this.props.currentBook),
      isCoverExist: await CoverUtil.isCoverExist(this.props.currentBook),
    });
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    let shelfLocation: string[] = [];
    for (let shelf in shelfList) {
      if (shelfList[shelf].indexOf(this.props.currentBook.key) > -1) {
        shelfLocation.push(shelf);
      }
    }
    this.setState({ shelfLocation });
  }
  handleClose = () => {
    this.props.handleDetailDialog(false);
  };
  handleShelfClick = (shelfTitle: string) => {
    this.props.handleDetailDialog(false);
    this.props.handleShelf(shelfTitle);
    this.props.handleMode("shelf");
    this.props.history.push("/manager/shelf");
  };
  render() {
    const renderShelfLocation = (shelfLocation: string[]) => {
      return shelfLocation.map((item: any, index: number) => {
        return (
          <li
            key={item}
            className={"tag-list-item"}
            style={{ borderWidth: 1.5 }}
            onClick={() => {
              this.handleShelfClick(item);
            }}
          >
            <div className="center">
              <Trans>{item}</Trans>
            </div>
          </li>
        );
      });
    };
    const fileSize = this.props.currentBook.size
      ? this.props.currentBook.size / 1024 / 1024 > 1
        ? parseFloat(this.props.currentBook.size / 1024 / 1024 + "").toFixed(
            2
          ) + "Mb"
        : parseInt(this.props.currentBook.size / 1024 + "") + "Kb"
      : "0Kb";
    const infoFields: { label: string; value: string }[] = [
      {
        label: "Publisher",
        value: this.props.currentBook.publisher || "-",
      },
      {
        label: "Published date",
        value: formatDateToDay(this.props.currentBook.published) || "-",
      },
      {
        label: "Modified date",
        value: formatDateToDay(this.props.currentBook.modified) || "-",
      },
      {
        label: "Language",
        value: this.props.currentBook.language || "-",
      },
      {
        label: "Rights",
        value: this.props.currentBook.rights || "-",
      },
      { label: "File size", value: fileSize },
      {
        label: "Added on",
        value: formatTimestamp(parseInt(this.props.currentBook.key)),
      },
      {
        label: "Format",
        value: this.props.currentBook.format || "-",
      },
    ];
    const metadataFields: { label: string; value: string }[] = [
      { label: "Identifier", value: this.props.currentBook.identifier },
      { label: "Subject", value: this.props.currentBook.subject },
      { label: "ISBN", value: this.props.currentBook.isbn },
      { label: "Layout", value: this.props.currentBook.layout },
    ].filter((item) => item.value);
    return (
      <div className="download-desk-container">
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
              {this.state.isCoverExist ? (
                <img src={this.state.cover} alt="" className="detail-cover" />
              ) : (
                <div
                  className="detail-cover"
                  style={{ width: "125px", height: "170px" }}
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
            <Trans>{this.props.currentBook.author || "Unknown author"}</Trans>
          </p>

          <div className="detail-sub-info">
            {infoFields.map((item) => (
              <div className="detail-sub-info-item" key={item.label}>
                <p className="detail-sub-title">
                  <Trans>{item.label}</Trans>
                </p>
                <p className="detail-sub-content-container">
                  <p className="detail-sub-content">{item.value}</p>
                </p>
              </div>
            ))}
          </div>
          {metadataFields.length > 0 && (
            <div className="detail-metadata-section">
              <p className="detail-dialog-book-desc">
                <Trans>Metadata</Trans>:
              </p>
              <div className="detail-metadata-grid">
                {metadataFields.map((item) => (
                  <div className="detail-metadata-item" key={item.label}>
                    <div className="detail-metadata-label">
                      <Trans>{item.label}</Trans>
                    </div>
                    <div className="detail-metadata-value" title={item.value}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {this.state.shelfLocation.length > 0 && (
            <div>
              <p className="detail-dialog-book-desc">
                <Trans>Shelf location</Trans>:
              </p>
              <div className="detail-dialog-shelf-location">
                {renderShelfLocation(this.state.shelfLocation)}
              </div>
            </div>
          )}
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
        <div style={{ display: "flex", justifyContent: "center" }}>
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
      </div>
    );
  }
}

export default DetailDialog;
