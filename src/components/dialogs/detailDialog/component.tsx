import React from "react";
import "./updateInfo.css";
import { DetailDialogProps, DetailDialogState } from "./interface";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import EmptyCover from "../../emptyCover";
import CoverUtil from "../../../utils/file/coverUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
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
  render() {
    const renderShelfLocation = (shelfLocation: string[]) => {
      return shelfLocation.map((item: any, index: number) => {
        return (
          <li
            key={item}
            className={"tag-list-item"}
            style={{ borderWidth: 1.5 }}
          >
            <div className="center">
              <Trans>{item}</Trans>
            </div>
          </li>
        );
      });
    };
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
                <Trans>Added on</Trans>
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
                <Trans>Format</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">
                  {this.props.currentBook.format}
                </p>
              </p>
            </p>
          </div>
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
