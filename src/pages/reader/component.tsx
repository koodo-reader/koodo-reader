import React from "react";
import SettingPanel from "../../containers/panels/settingPanel";
import NavigationPanel from "../../containers/panels/navigationPanel";
import OperationPanel from "../../containers/panels/operationPanel";
import { Toaster } from "react-hot-toast";
import ProgressPanel from "../../containers/panels/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import Viewer from "../../containers/viewer";
import { Tooltip } from "react-tooltip";
import "./index.css";
import Book from "../../models/Book";
import DatabaseService from "../../utils/storage/databaseService";
import BookUtil from "../../utils/file/bookUtil";

let lock = false; //prevent from clicking too fasts
let throttleTime =
  ConfigService.getReaderConfig("isSliding") === "yes" ? 1000 : 200;
let isHovering = false;
class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenTopPanel: false,
      isOpenBottomPanel: false,
      hoverPanel: "",
      isOpenLeftPanel: this.props.isNavLocked,
      isOpenRightPanel: this.props.isSettingLocked,
      totalDuration: 0,
      currentDuration: 0,
      scale: ConfigService.getReaderConfig("scale"),
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isShowScale: false,
    };
  }
  componentDidMount() {
    if (ConfigService.getReaderConfig("isMergeWord") === "yes") {
      document
        .querySelector("body")
        ?.setAttribute("style", "background-color: rgba(0,0,0,0)");
    }
    let totalDuration = 0;
    let seconds = 0;

    this.tickTimer = setInterval(() => {
      if (totalDuration === 0) {
        totalDuration = ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "readingTime",
          0
        );
      }
      if (this.props.currentBook.key) {
        seconds += 1;
        this.setState({ totalDuration: totalDuration + seconds });
        this.setState({ currentDuration: seconds });
        ConfigService.setObjectConfig(
          this.props.currentBook.key,
          totalDuration + seconds,
          "readingTime"
        );
      }
    }, 1000);
    window.addEventListener("beforeunload", function (event) {
      ConfigService.setItem("isFinshReading", "yes");
    });
  }
  UNSAFE_componentWillMount() {
    let url = document.location.href;
    let firstIndexOfQuestion = url.indexOf("?");
    let lastIndexOfSlash = url.lastIndexOf("/", firstIndexOfQuestion);
    let key = url.substring(lastIndexOfSlash + 1, firstIndexOfQuestion);
    this.props.handleFetchBooks();
    DatabaseService.getRecord(key, "books").then((book: Book | null) => {
      book = book || JSON.parse(ConfigService.getItem("tempBook") || "{}");
      if (!book) return;

      this.props.handleFetchPercentage(book);
      let readerMode =
        book.format === "PDF" || book.format.startsWith("CB")
          ? ConfigService.getReaderConfig("pdfReaderMode") || "scroll"
          : ConfigService.getReaderConfig("readerMode") || "double";
      this.props.handleReaderMode(readerMode);
      this.props.handleReadingBook(book);
    });
  }

  handleEnterReader = (position: string) => {
    switch (position) {
      case "right":
        this.setState({
          isOpenRightPanel: true,
        });
        break;
      case "left":
        this.setState({
          isOpenLeftPanel: true,
        });
        break;
      case "top":
        this.setState({
          isOpenTopPanel: true,
        });
        break;
      case "bottom":
        this.setState({
          isOpenBottomPanel: true,
        });
        break;
      default:
        break;
    }
  };
  handleLeaveReader = (position: string) => {
    switch (position) {
      case "right":
        if (this.props.isSettingLocked) {
          break;
        } else {
          this.setState({ isOpenRightPanel: false });
          break;
        }

      case "left":
        if (this.props.isNavLocked || this.props.isSearch) {
          break;
        } else {
          this.setState({ isOpenLeftPanel: false });
          break;
        }
      case "top":
        this.setState({ isOpenTopPanel: false });
        break;
      case "bottom":
        this.setState({ isOpenBottomPanel: false });
        break;
      default:
        break;
    }
  };
  handleLocation = () => {
    let position = this.props.htmlBook.rendition.getPosition();

    ConfigService.setObjectConfig(
      this.props.currentBook.key,
      position,
      "recordLocation"
    );
  };
  render() {
    const renditionProps = {
      handleLeaveReader: this.handleLeaveReader,
      handleEnterReader: this.handleEnterReader,
      isShow:
        this.state.isOpenLeftPanel ||
        this.state.isOpenTopPanel ||
        this.state.isOpenBottomPanel ||
        this.state.isOpenRightPanel,
    };
    return (
      <div className="viewer">
        <Tooltip id="my-tooltip" style={{ zIndex: 25 }} />
        {ConfigService.getReaderConfig("isHidePageButton") !== "yes" && (
          <>
            <div
              className="previous-chapter-single-container"
              onClick={async () => {
                if (lock) return;
                lock = true;
                await this.props.htmlBook.rendition.prev();
                this.handleLocation();
                setTimeout(() => (lock = false), throttleTime);
              }}
              style={{
                left: this.props.isNavLocked ? 315 : 15,
              }}
            >
              <span className="icon-dropdown previous-chapter-single"></span>
            </div>
            <div
              className="next-chapter-single-container"
              onClick={async () => {
                if (lock) return;
                lock = true;
                await this.props.htmlBook.rendition.next();
                this.handleLocation();
                setTimeout(() => (lock = false), throttleTime);
              }}
              style={{
                right: this.props.isSettingLocked ? 315 : 15,
              }}
            >
              <span className="icon-dropdown next-chapter-single"></span>
            </div>
            {this.props.isAuthed && (
              <div
                className="next-chapter-single-container"
                onClick={async () => {
                  this.props.handleMenuMode("assistant");
                  this.props.handleOriginalText(
                    await this.props.htmlBook.rendition.chapterText()
                  );
                  this.props.handleOpenMenu(true);
                }}
                style={{
                  bottom: "55px",
                  transform: "rotate(0deg)",
                  fontWeight: "bold",
                  fontSize: "17px",
                  right: this.props.isSettingLocked ? 315 : 15,
                }}
              >
                AI
              </div>
            )}
          </>
        )}
        {ConfigService.getReaderConfig("isHideMenuButton") !== "yes" && (
          <div
            className="reader-setting-icon-container"
            onClick={() => {
              this.handleEnterReader("left");
              this.handleEnterReader("right");
              this.handleEnterReader("bottom");
              this.handleEnterReader("top");
            }}
            style={{ right: this.props.isSettingLocked ? 315 : 15 }}
          >
            <span className="icon-grid reader-setting-icon"></span>
          </div>
        )}
        {(this.props.readerMode === "scroll" ||
          this.props.readerMode === "single") && (
          <div
            style={{
              position: "absolute",
              right: this.props.isSettingLocked ? 315 : 15,
            }}
          >
            <div
              className="reader-zoom-in-icon-container"
              onClick={() => {
                this.setState({ isShowScale: !this.state.isShowScale });
              }}
            >
              <span className="icon-zoom-in reader-setting-icon"></span>
            </div>
            {this.state.isShowScale && (
              <div className="scale-container">
                <div
                  style={{
                    position: "absolute",
                    top: "7px",
                    right: "190px",
                    zIndex: 100,
                    width: "120px",
                  }}
                >
                  <input
                    className="input-value"
                    defaultValue={
                      ConfigService.getReaderConfig("scale")
                        ? parseFloat(ConfigService.getReaderConfig("scale")) *
                          100
                        : 100
                    }
                    type="number"
                    onInput={(event: any) => {
                      let fieldVal = event.target.value;
                      ConfigService.setReaderConfig(
                        "scale",
                        parseFloat(fieldVal) / 100 + ""
                      );
                    }}
                    onChange={(event) => {
                      let fieldVal = event.target.value;
                      ConfigService.setReaderConfig(
                        "scale",
                        parseFloat(fieldVal) / 100 + ""
                      );
                    }}
                    onBlur={(event) => {
                      BookUtil.reloadBooks();
                    }}
                  />
                  <span> %</span>
                </div>

                <input
                  className="input-progress"
                  value={this.state.scale}
                  type="range"
                  max={1.5}
                  min={0.5}
                  step={0.01}
                  onInput={(event: any) => {
                    const scale = event.target.value;
                    ConfigService.setReaderConfig("scale", scale);
                  }}
                  onChange={(event) => {
                    this.setState({ scale: event.target.value });
                  }}
                  onMouseUp={() => {
                    BookUtil.reloadBooks();
                  }}
                  style={{
                    position: "absolute",
                    top: "18px",
                    right: "100px",
                    zIndex: 100,
                    width: "120px",
                  }}
                />
              </div>
            )}
          </div>
        )}

        <Toaster />

        <div
          className="left-panel"
          onMouseEnter={() => {
            isHovering = true;
            setTimeout(() => {
              if (!isHovering) return;
              if (
                this.state.isTouch ||
                this.state.isOpenLeftPanel ||
                this.state.isPreventTrigger
              ) {
                this.setState({ hoverPanel: "left" });
                return;
              }
              this.handleEnterReader("left");
            }, 500);
          }}
          onMouseLeave={() => {
            isHovering = false;
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "left" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("left");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="right-panel"
          onMouseEnter={() => {
            isHovering = true;
            setTimeout(() => {
              if (!isHovering) return;
              if (
                this.state.isTouch ||
                this.state.isOpenRightPanel ||
                this.state.isPreventTrigger
              ) {
                this.setState({ hoverPanel: "right" });
                return;
              }
              this.handleEnterReader("right");
            }, 500);
          }}
          onMouseLeave={() => {
            isHovering = false;
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "right" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("right");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="top-panel"
          onMouseEnter={() => {
            isHovering = true;
            setTimeout(() => {
              if (!isHovering) return;
              if (
                this.state.isTouch ||
                this.state.isOpenTopPanel ||
                this.state.isPreventTrigger
              ) {
                this.setState({ hoverPanel: "top" });
                return;
              }
              this.handleEnterReader("top");
            }, 500);
          }}
          style={
            this.state.hoverPanel === "top"
              ? {
                  opacity: 0.5,
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
              : {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
          }
          onMouseLeave={() => {
            isHovering = false;
            this.setState({ hoverPanel: "" });
          }}
          onClick={() => {
            this.handleEnterReader("top");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="bottom-panel"
          onMouseEnter={() => {
            isHovering = true;
            setTimeout(() => {
              if (!isHovering) return;
              if (
                this.state.isTouch ||
                this.state.isOpenBottomPanel ||
                this.state.isPreventTrigger
              ) {
                this.setState({ hoverPanel: "bottom" });
                return;
              }
              this.handleEnterReader("bottom");
            }, 500);
          }}
          style={
            this.state.hoverPanel === "bottom"
              ? {
                  opacity: 0.5,
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
              : {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
          }
          onMouseLeave={() => {
            isHovering = false;
            this.setState({ hoverPanel: "" });
          }}
          onClick={() => {
            this.handleEnterReader("bottom");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>

        <div
          className="setting-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("right");
          }}
          style={
            this.state.isOpenRightPanel
              ? {}
              : {
                  transform: "translateX(309px)",
                }
          }
        >
          <SettingPanel />
        </div>
        <div
          className="navigation-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("left");
          }}
          style={
            this.state.isOpenLeftPanel
              ? {}
              : {
                  transform: "translateX(-309px)",
                }
          }
        >
          <NavigationPanel
            {...{
              totalDuration: this.state.totalDuration,
            }}
          />
        </div>
        <div
          className="progress-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("bottom");
          }}
          style={
            this.state.isOpenBottomPanel
              ? {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
              : {
                  transform: "translateY(110px)",
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
          }
        >
          <ProgressPanel />
        </div>
        <div
          className="operation-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("top");
          }}
          style={
            this.state.isOpenTopPanel
              ? {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
              : {
                  transform: "translateY(-110px)",
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : 0,
                }
          }
        >
          {this.props.htmlBook && (
            <OperationPanel
              {...{
                currentDuration: this.state.currentDuration,
              }}
            />
          )}
        </div>

        {this.props.currentBook.key && <Viewer {...renditionProps} />}
      </div>
    );
  }
}

export default Reader;
