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

let lock = false; //prevent from clicking too fasts
let throttleTime =
  ConfigService.getReaderConfig("isSliding") === "yes" ? 1000 : 200;
class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenRightPanel:
        ConfigService.getReaderConfig("isSettingLocked") === "yes"
          ? true
          : false,
      isOpenTopPanel: false,
      isOpenBottomPanel: false,
      hoverPanel: "",
      isOpenLeftPanel:
        ConfigService.getReaderConfig("isNavLocked") === "yes" ? true : false,
      time: 0,
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
    };
  }
  componentDidMount() {
    if (ConfigService.getReaderConfig("isMergeWord") === "yes") {
      document
        .querySelector("body")
        ?.setAttribute("style", "background-color: rgba(0,0,0,0)");
    }

    this.tickTimer = setInterval(() => {
      if (this.props.currentBook.key) {
        let time = ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "readingTime",
          0
        );
        time += 1;
        this.setState({ time });
        ConfigService.setObjectConfig(
          this.props.currentBook.key,
          time,
          "readingTime"
        );
      }
    }, 1000);
  }
  UNSAFE_componentWillMount() {
    let url = document.location.href;
    let firstIndexOfQuestion = url.indexOf("?");
    let lastIndexOfSlash = url.lastIndexOf("/", firstIndexOfQuestion);
    let key = url.substring(lastIndexOfSlash + 1, firstIndexOfQuestion);
    this.props.handleFetchBooks();
    DatabaseService.getRecord(key, "books").then((book: Book | null) => {
      if (!book) {
        return;
      }
      book = book || JSON.parse(ConfigService.getItem("tempBook") || "{}");

      this.props.handleFetchPercentage(book);
      let readerMode =
        book.format === "PDF" || book.format.startsWith("CB")
          ? ConfigService.getReaderConfig("pdfReaderMode") || "scroll"
          : ConfigService.getReaderConfig("readerMode") || "double";
      console.log(readerMode, "readerMode23423");
      this.props.handleReaderMode(readerMode);
      this.props.handleReadingBook(book);
    });
  }

  handleEnterReader = (position: string) => {
    switch (position) {
      case "right":
        this.setState({
          isOpenRightPanel: this.state.isOpenRightPanel ? false : true,
        });
        break;
      case "left":
        this.setState({
          isOpenLeftPanel: this.state.isOpenLeftPanel ? false : true,
        });
        break;
      case "top":
        this.setState({
          isOpenTopPanel: this.state.isOpenTopPanel ? false : true,
        });
        break;
      case "bottom":
        this.setState({
          isOpenBottomPanel: this.state.isOpenBottomPanel ? false : true,
        });
        break;
      default:
        break;
    }
  };
  handleLeaveReader = (position: string) => {
    switch (position) {
      case "right":
        if (ConfigService.getReaderConfig("isSettingLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenRightPanel: false });
          break;
        }

      case "left":
        if (ConfigService.getReaderConfig("isNavLocked") === "yes") {
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
            >
              <span className="icon-dropdown next-chapter-single"></span>
            </div>
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
          >
            <span className="icon-grid reader-setting-icon"></span>
          </div>
        )}
        <Toaster />

        <div
          className="left-panel"
          onMouseEnter={() => {
            if (
              this.state.isTouch ||
              this.state.isOpenLeftPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "left" });
              return;
            }
            this.handleEnterReader("left");
          }}
          onMouseLeave={() => {
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
            if (
              this.state.isTouch ||
              this.state.isOpenRightPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "right" });
              return;
            }
            this.handleEnterReader("right");
          }}
          onMouseLeave={() => {
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
            if (
              this.state.isTouch ||
              this.state.isOpenTopPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "top" });
              return;
            }
            this.handleEnterReader("top");
          }}
          style={this.state.hoverPanel === "top" ? { opacity: 0.5 } : {}}
          onMouseLeave={() => {
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
            if (
              this.state.isTouch ||
              this.state.isOpenBottomPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "bottom" });
              return;
            }
            this.handleEnterReader("bottom");
          }}
          style={this.state.hoverPanel === "bottom" ? { opacity: 0.5 } : {}}
          onMouseLeave={() => {
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
          <NavigationPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="progress-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("bottom");
          }}
          style={
            this.state.isOpenBottomPanel
              ? {}
              : {
                  transform: "translateY(110px)",
                }
          }
        >
          <ProgressPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="operation-panel-container"
          onMouseLeave={() => {
            this.handleLeaveReader("top");
          }}
          style={
            this.state.isOpenTopPanel
              ? {}
              : {
                  transform: "translateY(-110px)",
                }
          }
        >
          {this.props.htmlBook && (
            <OperationPanel {...{ time: this.state.time }} />
          )}
        </div>

        {this.props.currentBook.key && <Viewer {...renditionProps} />}
      </div>
    );
  }
}

export default Reader;
