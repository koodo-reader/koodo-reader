import React from "react";
import SettingPanel from "../../containers/panels/settingPanel";
import NavigationPanel from "../../containers/panels/navigationPanel";
import OperationPanel from "../../containers/panels/operationPanel";
import { Toaster, toast } from "react-hot-toast";
import ProgressPanel from "../../containers/panels/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import {
  ConfigService,
  ReadingTimeUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import Viewer from "../../containers/viewer";
import { Tooltip } from "react-tooltip";
import "./index.css";
import Book from "../../models/Book";
import DatabaseService from "../../utils/storage/databaseService";
import ConvertDialog from "../../components/dialogs/convertDialog";
import ScalePageDialog from "../../components/dialogs/scalePageDialog";
import PdfCropDialog from "../../components/dialogs/pdfCropDialog";
import StudyLangDialog from "../../components/dialogs/studyLangDialog";
import AssistReadDialog from "../../components/dialogs/assistReadDialog";
import { isElectron } from "react-device-detect";
import SettingDialog from "../../components/dialogs/settingDialog";
import SpeechDialog from "../../components/dialogs/speechDialog";
import AnnotationDialog from "../../components/dialogs/annotationDialog";
import PopupOptionDialog from "../../components/dialogs/popupOptionDialog";
import {
  updateDiscordPresence,
  clearDiscordPresence,
} from "../../utils/reader/discordRPC";
import SupportDialog from "../../components/dialogs/supportDialog";
import WindowControls from "../../components/windowControls";
import { READING_PANEL_TOGGLE_EVENT } from "../../utils/reader/mouseEvent";
import { isPaginatedBook, isReadingRawPDF, throttle } from "../../utils/common";
declare var window: any;
let lock = false; //prevent from clicking too fasts
let throttleTime = 200;
let isMouseMoving = false;
const PANEL_POSITIONS = ["left", "right", "top", "bottom"] as const;
type PanelPosition = (typeof PANEL_POSITIONS)[number];
const PANEL_ENTER_DELAY = 500;
const PANEL_LEAVE_DELAY = 500;
const enterTimers: Record<string, NodeJS.Timeout | null> = {
  left: null,
  right: null,
  top: null,
  bottom: null,
};
const leaveTimers: Record<string, NodeJS.Timeout | null> = {
  left: null,
  right: null,
  top: null,
  bottom: null,
};
const isEdgeHovering: Record<string, boolean> = {
  left: false,
  right: false,
  top: false,
  bottom: false,
};
const PANEL_OPEN_STATE: Record<
  PanelPosition,
  | "isOpenLeftPanel"
  | "isOpenRightPanel"
  | "isOpenTopPanel"
  | "isOpenBottomPanel"
> = {
  left: "isOpenLeftPanel",
  right: "isOpenRightPanel",
  top: "isOpenTopPanel",
  bottom: "isOpenBottomPanel",
};
class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  private autoShowTimer: NodeJS.Timeout | null = null;
  private dialogAnchorIcon: HTMLElement | null = null;
  private quickButtonsFrame: number | null = null;
  private lastPointerPosition: { x: number; y: number } | null = null;
  private readingTimeUtil = new ReadingTimeUtil(
    ConfigService,
    isElectron
      ? {
          registerUnloadHandler(callback: () => void): () => void {
            const ipcRenderer = window.electronAPI;
            // Separate reader window close
            ipcRenderer.on("before-reader-close", callback);
            // In-app tab (WebContentsView) close
            ipcRenderer.on("before-tab-close", callback);
            return () => {
              ipcRenderer.removeListener("before-reader-close", callback);
              ipcRenderer.removeListener("before-tab-close", callback);
            };
          },
          onBeforeClose(): void {
            const ipcRenderer = window.electronAPI;
            // Reply to whichever close signal is active
            ipcRenderer.send("reader-close-ready");
            ipcRenderer.send("tab-close-ready");
          },
        }
      : {
          registerUnloadHandler(callback: () => void): () => void {
            window.addEventListener("beforeunload", callback);
            return () => window.removeEventListener("beforeunload", callback);
          },
        }
  );
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
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isNearEdge: false,
    };
  }
  componentDidMount() {
    if (ConfigService.getReaderConfig("isMergeWord") === "yes") {
      document
        .querySelector("body")
        ?.setAttribute("style", "background-color: rgba(0,0,0,0)");
    }

    // Update UI counters every second so the navigation panel still shows
    // live reading-time values, but actual storage writes only happen when
    // a reading session ends (visibility hidden / blur / unmount).
    this.tickTimer = setInterval(() => {
      if (!this.props.currentBook.key) return;
      this.setState((prev) => ({
        totalDuration: prev.totalDuration + 60,
        currentDuration: prev.currentDuration + 60,
      }));
    }, 60000);

    window.addEventListener("beforeunload", function (event) {
      if (!isElectron) {
        ConfigService.setReaderConfig("isFinishWebReading", "yes");
      }
    });
    const handleMouseMove = () => {
      isMouseMoving = true;
      setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };
    const throttledMouseMove = throttle(handleMouseMove, 100);
    window.addEventListener("mousemove", throttledMouseMove);
    window.addEventListener(
      READING_PANEL_TOGGLE_EVENT,
      this.handleReadingPanelToggle
    );
    window.addEventListener("resize", this.updateSettingDialogPosition);
    window.addEventListener("mousemove", this.handleQuickButtonsMouseMove);
    document.addEventListener(
      "mouseleave",
      this.handleQuickButtonsMouseLeaveWindow
    );

    // 进入阅读器后主动展示快捷按钮 3 秒，提示用户位置后自动隐藏
    this.setState({ isNearEdge: true });
    this.autoShowTimer = setTimeout(() => {
      this.autoShowTimer = null;
      this.setState({ isNearEdge: false }, this.updateQuickButtonsVisibility);
    }, 1500);
  }
  componentDidUpdate() {
    if (document.querySelector(".reader-setting-dialog-anchor")) {
      this.updateSettingDialogPosition();
    }
  }
  async UNSAFE_componentWillMount() {
    let url = document.location.href;
    let firstIndexOfQuestion = url.indexOf("?");
    let lastIndexOfSlash = url.lastIndexOf("/", firstIndexOfQuestion);
    let key = url.substring(lastIndexOfSlash + 1, firstIndexOfQuestion);
    if (ConfigService.getAllListConfig("seperateStyleBooks").includes(key)) {
      window.currentBookKey = key;
      this.props.handleBackgroundColor(
        ConfigService.getReaderConfig("backgroundColor") || ""
      );
    } else {
      window.currentBookKey = "";
    }
    this.props.handleFetchBooks();
    this.props.handleFetchAuthed();
    if (
      key &&
      ConfigService.getAllListConfig("convertPDFBooks").includes(key) &&
      ConfigService.getReaderConfig(
        this.props.currentBook?.description?.indexOf("scanned") > -1
          ? "scannedOcrEngine"
          : "textOcrEngine"
      ) === "official-ai-ocr"
    ) {
      await this.props.handleFetchUserInfo();
    }
    DatabaseService.getRecord(key, "books").then((book: Book | null) => {
      book = book || JSON.parse(ConfigService.getItem("tempBook") || "{}");
      if (!book) return;

      this.props.handleFetchPercentage(book);
      let readerMode = isPaginatedBook(book)
        ? ConfigService.getReaderConfig("pdfReaderMode") || "scroll"
        : ConfigService.getReaderConfig("readerMode") || "double";
      this.props.handleReaderMode(readerMode);
      this.props.handleReadingBook(book);
      // Start event-driven reading-time tracking
      this.readingTimeUtil.start(book.key);
      // Initialise UI duration from persisted total
      const savedTotal = this.readingTimeUtil.getTotalSeconds(book.key);
      this.setState({ totalDuration: savedTotal, currentDuration: 0 });
      if (isElectron) {
        updateDiscordPresence(book);
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener(
      READING_PANEL_TOGGLE_EVENT,
      this.handleReadingPanelToggle
    );
    window.removeEventListener("resize", this.updateSettingDialogPosition);
    window.removeEventListener("mousemove", this.handleQuickButtonsMouseMove);
    document.removeEventListener(
      "mouseleave",
      this.handleQuickButtonsMouseLeaveWindow
    );
    if (this.quickButtonsFrame !== null) {
      cancelAnimationFrame(this.quickButtonsFrame);
      this.quickButtonsFrame = null;
    }
    if (isElectron) {
      clearDiscordPresence();
    }
    clearInterval(this.tickTimer);
    if (this.autoShowTimer) {
      clearTimeout(this.autoShowTimer);
      this.autoShowTimer = null;
    }
    PANEL_POSITIONS.forEach((position) => {
      this.cancelEnterReader(position);
      this.cancelLeaveReader(position);
    });
    // Flush any in-flight session time before the component tears down
    this.readingTimeUtil.stop();
  }

  cancelEnterReader = (position: string) => {
    isEdgeHovering[position] = false;
    if (enterTimers[position]) {
      clearTimeout(enterTimers[position]!);
      enterTimers[position] = null;
    }
  };

  scheduleEnterReader = (position: string) => {
    this.cancelEnterReader(position);
    isEdgeHovering[position] = true;
    const delay = this.state.isPreventTrigger ? 0 : PANEL_ENTER_DELAY;
    enterTimers[position] = setTimeout(() => {
      enterTimers[position] = null;
      if (!isEdgeHovering[position] || isMouseMoving) return;
      this.handleEnterReader(position);
    }, delay);
  };

  cancelLeaveReader = (position: string) => {
    if (leaveTimers[position]) {
      clearTimeout(leaveTimers[position]!);
      leaveTimers[position] = null;
    }
  };

  scheduleLeaveReader = (position: string) => {
    this.cancelLeaveReader(position);
    leaveTimers[position] = setTimeout(() => {
      leaveTimers[position] = null;
      this.handleLeaveReader(position);
    }, PANEL_LEAVE_DELAY);
  };

  handleEdgeMouseEnter = (position: PanelPosition) => {
    if (
      this.state.isTouch ||
      this.state[PANEL_OPEN_STATE[position]] ||
      this.state.isPreventTrigger
    ) {
      this.cancelLeaveReader(position);
      this.setState({ hoverPanel: position });
      return;
    }
    this.scheduleEnterReader(position);
  };

  handleEdgeMouseLeave = (position: PanelPosition) => {
    this.cancelEnterReader(position);
    this.setState({ hoverPanel: "" });
  };

  handleEnterReader = (position: string) => {
    this.cancelEnterReader(position);
    this.cancelLeaveReader(position);
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
    this.cancelLeaveReader(position);
    switch (position) {
      case "right":
        if (this.props.isSettingLocked) {
          break;
        } else {
          this.setState({ isOpenRightPanel: false });
          break;
        }

      case "left":
        if (
          this.props.isNavLocked ||
          ConfigService.getReaderConfig("isTempLocked") === "yes"
        ) {
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
  handleReadingPanelToggle = (event: Event) => {
    const position = (event as CustomEvent<{ position: string }>).detail
      ?.position;
    if (!PANEL_POSITIONS.includes(position as PanelPosition)) return;
    const stateKey = PANEL_OPEN_STATE[position as PanelPosition];
    if (this.state[stateKey]) {
      this.handleLeaveReader(position);
    } else {
      this.handleEnterReader(position);
    }
  };
  closeSettingDialogs = () => {
    this.props.handleScalePageDialog(false);
    this.props.handleConvertDialog(false);
    this.props.handlePdfCropDialog(false);
    this.props.handleStudyLangDialog(false);
    this.props.handleAssistReadDialog(false);
  };
  updateSettingDialogPosition = () => {
    const anchor = document.querySelector<HTMLElement>(
      ".reader-setting-dialog-anchor"
    );
    const dialog = anchor?.querySelector<HTMLElement>(".sort-dialog-container");
    if (!anchor || !dialog) return;
    const icon = this.dialogAnchorIcon;
    if (!icon || !icon.isConnected) return;
    const iconRect = icon.getBoundingClientRect();
    const iconCenter = iconRect.left + iconRect.width / 2;
    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const reservedRight =
      this.props.isSettingLocked || this.props.isDockedRight ? 300 : 0;
    const dialogWidth = dialog.offsetWidth;
    if (!dialogWidth) return;
    const minLeft = 8;
    const maxLeft = Math.max(
      minLeft,
      viewportWidth - reservedRight - dialogWidth - 8
    );
    const left = Math.min(
      maxLeft,
      Math.max(minLeft, iconCenter - dialogWidth / 2)
    );
    document.documentElement.style.setProperty(
      "--reader-dialog-anchor-x",
      `${iconCenter}px`
    );
    anchor.style.left = `${left}px`;
  };
  handleDialogButtonHover = (
    handleDialog: (isOpen: boolean) => void,
    dialogSelector: string
  ) => ({
    onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => {
      this.dialogAnchorIcon = event.currentTarget;
      this.closeSettingDialogs();
      handleDialog(true);
      this.updateSettingDialogPosition();
      window.requestAnimationFrame(this.updateSettingDialogPosition);
    },
    onMouseLeave: () => {
      window.setTimeout(() => {
        if (!document.querySelector(`${dialogSelector}:hover`)) {
          handleDialog(false);
        }
      }, 200);
    },
  });
  updateQuickButtonsVisibility = () => {
    if (!this.lastPointerPosition) return;
    const { x, y } = this.lastPointerPosition;
    const isInside = Array.from(
      document.querySelectorAll<HTMLElement>(".reader-quick-buttons")
    ).some((element) => {
      const rect = element.getBoundingClientRect();
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    });
    if (isInside !== this.state.isNearEdge) {
      this.setState({ isNearEdge: isInside });
    }
  };
  handleQuickButtonsMouseMove = (event: MouseEvent) => {
    this.lastPointerPosition = { x: event.clientX, y: event.clientY };
    if (this.autoShowTimer) return;
    if (this.quickButtonsFrame !== null) return;
    this.quickButtonsFrame = window.requestAnimationFrame(() => {
      this.quickButtonsFrame = null;
      this.updateQuickButtonsVisibility();
    });
  };
  handleQuickButtonsMouseLeaveWindow = (event: MouseEvent) => {
    if (event.relatedTarget) return;
    this.lastPointerPosition = null;
    this.setState({ isNearEdge: false });
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
    const isSeparateElectronWindow =
      isElectron && ConfigService.getReaderConfig("isOpenInMain") !== "yes";
    const isMacOS =
      isElectron && window.electronAPI?.runtime?.platform === "darwin";
    const isMergeWord = ConfigService.getReaderConfig("isMergeWord") === "yes";
    const showCustomWindowControls =
      isSeparateElectronWindow && (!isMacOS || isMergeWord);
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
        {isSeparateElectronWindow && (
          <div className="reader-window-drag-region" />
        )}

        <div
          className="previous-chapter-single-container reader-quick-buttons"
          onClick={async () => {
            if (lock) return;
            lock = true;
            // RTL 下左侧箭头翻到下一页
            if (
              ConfigService.getReaderConfig("revertDirection") === "yes" &&
              ConfigService.getReaderConfig("textOrientation") !== "vertical"
            ) {
              await this.props.htmlBook.rendition.next();
            } else {
              await this.props.htmlBook.rendition.prev();
            }
            this.handleLocation();
            setTimeout(() => (lock = false), throttleTime);
          }}
          style={{
            left: this.props.isNavLocked ? 315 : 15,
            opacity: this.state.isNearEdge ? undefined : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <span className="icon-dropdown previous-chapter-single"></span>
        </div>
        <div
          className="reader-quick-buttons"
          style={{
            position: "absolute",
            bottom: 10,
            right:
              this.props.isSettingLocked || this.props.isDockedRight ? 315 : 15,
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: "center",
            gap: "8px",
            zIndex: 10,
            opacity: this.state.isNearEdge ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            className="next-chapter-single-container"
            onClick={async () => {
              if (lock) return;
              lock = true;
              // RTL 下右侧箭头翻到上一页
              if (
                ConfigService.getReaderConfig("revertDirection") === "yes" &&
                ConfigService.getReaderConfig("textOrientation") !== "vertical"
              ) {
                await this.props.htmlBook.rendition.prev();
              } else {
                await this.props.htmlBook.rendition.next();
              }
              this.handleLocation();
              setTimeout(() => (lock = false), throttleTime);
            }}
            style={{ position: "static" }}
          >
            <span className="icon-dropdown next-chapter-single"></span>
          </div>
          <div
            className="next-chapter-single-container"
            onClick={async () => {
              this.props.handleSpeechDialog(!this.props.isSpeechOpen);
            }}
            style={{ position: "static", transform: "rotate(0deg)" }}
          >
            <span
              style={
                this.props.isSpeechOpen
                  ? { fontWeight: "bold", marginTop: "4px" }
                  : {}
              }
              className={`icon-${this.props.isSpeechOpen ? "close" : "earphone"} next-chapter-single`}
            ></span>
          </div>
          {ConfigService.getReaderConfig("isDisableAI") !== "yes" && (
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
                position: "static",
                transform: "rotate(0deg)",
                fontWeight: "bold",
                fontSize: "17px",
              }}
            >
              AI
            </div>
          )}
          {this.props.currentBook &&
            isReadingRawPDF(this.props.currentBook) &&
            this.props.currentBook.description.indexOf("scanned") > -1 && (
              <div
                className="next-chapter-single-container"
                onClick={() => {
                  this.props.htmlBook.rendition.applyAnnotationConfig({
                    isDrawing: this.props.isAnnotationOpen ? "no" : "yes",
                  });
                  this.props.handleAnnotationDialog(
                    !this.props.isAnnotationOpen
                  );
                }}
                style={{ position: "static", transform: "rotate(0deg)" }}
              >
                <span
                  style={
                    this.props.isAnnotationOpen
                      ? { fontWeight: "bold", marginTop: "4px" }
                      : { fontSize: "17px" }
                  }
                  className={`icon-${this.props.isAnnotationOpen ? "close" : "edit"} next-chapter-single`}
                ></span>
              </div>
            )}
        </div>

        <div
          className="reader-quick-buttons"
          style={{
            position: "absolute",
            top: "0px",
            ...(isSeparateElectronWindow && isMacOS
              ? {
                  left: this.props.isNavLocked ? 315 : isMergeWord ? 15 : 82,
                  right: "auto",
                }
              : {
                  right:
                    this.props.isSettingLocked || this.props.isDockedRight
                      ? 300
                      : 15,
                }),
            zIndex: 16,
            width: "max-content",
            display: "flex",
            flexDirection: "column",
            alignItems:
              isSeparateElectronWindow && isMacOS ? "flex-start" : "flex-end",
            justifyContent: "flex-end",
            opacity: this.state.isNearEdge ? 1 : 0,
            transition: "opacity 0.3s ease",
            color: ConfigService.getReaderConfig("textColor")
              ? ConfigService.getReaderConfig("textColor")
              : "",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {this.props.currentBook &&
              !isReadingRawPDF(this.props.currentBook) && (
                <>
                  <div
                    className="reader-setting-icon-container"
                    {...this.handleDialogButtonHover(
                      this.props.handleStudyLangDialog,
                      ".study-lang-dialog-container"
                    )}
                  >
                    <span
                      className="icon-trans reader-setting-icon"
                      style={{ fontSize: 23 }}
                    ></span>
                  </div>
                  <div
                    className="reader-setting-icon-container"
                    {...this.handleDialogButtonHover(
                      this.props.handleAssistReadDialog,
                      ".assist-read-dialog-container"
                    )}
                  >
                    <span
                      className="icon-pencil-ruler reader-setting-icon"
                      style={{ fontSize: 21 }}
                    ></span>
                  </div>
                </>
              )}
            {(this.props.readerMode === "scroll" ||
              this.props.readerMode === "single") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  className="reader-setting-icon-container"
                  {...this.handleDialogButtonHover(
                    this.props.handleScalePageDialog,
                    ".scale-page-dialog-container"
                  )}
                >
                  <span
                    className="icon-zoom-in reader-setting-icon"
                    style={{ fontSize: 23 }}
                  ></span>
                </div>
              </div>
            )}

            {this.props.currentBook.format === "PDF" &&
              this.props.readerMode === "scroll" && (
                <div
                  className="reader-setting-icon-container"
                  {...this.handleDialogButtonHover(
                    this.props.handlePdfCropDialog,
                    ".pdf-crop-dialog-container"
                  )}
                >
                  <span
                    className="icon-crop reader-setting-icon"
                    style={{ fontSize: 24 }}
                  ></span>
                </div>
              )}

            {this.props.currentBook.format === "PDF" && (
              <div
                className="reader-setting-icon-container"
                {...this.handleDialogButtonHover(
                  this.props.handleConvertDialog,
                  ".convert-dialog-container"
                )}
              >
                <span
                  className="icon-convert-text reader-setting-icon"
                  style={{ fontSize: 26 }}
                ></span>
              </div>
            )}
            <div
              className="reader-setting-icon-container"
              aria-label={this.props.t("Toggle menu")}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Toggle menu")}
              onClick={() => {
                this.handleEnterReader("left");
                this.handleEnterReader("right");
                this.handleEnterReader("bottom");
                this.handleEnterReader("top");
              }}
            >
              <span
                className="icon-grid reader-setting-icon"
                style={{ fontSize: 20 }}
              ></span>
            </div>
            {showCustomWindowControls && <WindowControls t={this.props.t} />}
          </div>
        </div>
        {this.props.isSettingOpen && (
          <>
            <SettingDialog />
            <div className="drag-background"></div>
          </>
        )}
        <Toaster
          toastOptions={{
            style: {
              wordWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "normal",
              overflowWrap: "break-word",
            },
          }}
        />

        <div
          className="left-panel"
          onMouseEnter={() => this.handleEdgeMouseEnter("left")}
          onMouseLeave={() => this.handleEdgeMouseLeave("left")}
          style={this.state.hoverPanel === "left" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("left");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="right-panel"
          onMouseEnter={() => this.handleEdgeMouseEnter("right")}
          onMouseLeave={() => this.handleEdgeMouseLeave("right")}
          style={
            this.state.hoverPanel === "right"
              ? {
                  opacity: 0.5,
                  right: this.props.isDockedRight ? "299px" : "0px",
                }
              : { right: this.props.isDockedRight ? "299px" : "0px" }
          }
          onClick={() => {
            this.handleEnterReader("right");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="top-panel"
          onMouseEnter={() => this.handleEdgeMouseEnter("top")}
          style={
            this.state.hoverPanel === "top"
              ? {
                  opacity: 0.5,
                  marginLeft:
                    this.props.isNavLocked &&
                    !this.props.isSettingLocked &&
                    !this.props.isDockedRight
                      ? 150
                      : 0,
                }
              : {
                  marginLeft:
                    this.props.isNavLocked &&
                    !this.props.isSettingLocked &&
                    !this.props.isDockedRight
                      ? 150
                      : 0,
                }
          }
          onMouseLeave={() => this.handleEdgeMouseLeave("top")}
          onClick={() => {
            this.handleEnterReader("top");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="bottom-panel"
          onMouseEnter={() => this.handleEdgeMouseEnter("bottom")}
          onMouseLeave={() => this.handleEdgeMouseLeave("bottom")}
          onClick={() => {
            this.handleEnterReader("bottom");
          }}
          style={
            this.state.hoverPanel === "bottom"
              ? {
                  opacity: 0.5,
                  marginLeft:
                    this.props.isNavLocked &&
                    !this.props.isSettingLocked &&
                    !this.props.isDockedRight
                      ? 150
                      : 0,
                }
              : {
                  marginLeft:
                    this.props.isNavLocked &&
                    !this.props.isSettingLocked &&
                    !this.props.isDockedRight
                      ? 150
                      : 0,
                }
          }
        >
          <span className="icon-grid panel-icon"></span>
        </div>

        <div
          className="setting-panel-container"
          onMouseEnter={() => {
            this.cancelLeaveReader("right");
          }}
          onMouseLeave={() => {
            this.scheduleLeaveReader("right");
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
          onMouseEnter={() => {
            this.cancelLeaveReader("left");
          }}
          onMouseLeave={() => {
            this.scheduleLeaveReader("left");
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
            {...({
              totalDuration: this.state.totalDuration,
            } as any)}
          />
        </div>
        <div
          className="progress-panel-container"
          onMouseEnter={() => {
            this.cancelLeaveReader("bottom");
          }}
          onMouseLeave={() => {
            this.scheduleLeaveReader("bottom");
          }}
          style={
            this.state.isOpenBottomPanel
              ? {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : !this.props.isNavLocked &&
                          (this.props.isSettingLocked ||
                            this.props.isDockedRight)
                        ? -150
                        : 0,
                }
              : {
                  transform: "translateY(110px)",
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : !this.props.isNavLocked &&
                          (this.props.isSettingLocked ||
                            this.props.isDockedRight)
                        ? -150
                        : 0,
                }
          }
        >
          <ProgressPanel />
        </div>
        <div
          className="operation-panel-container"
          onMouseEnter={() => {
            this.cancelLeaveReader("top");
          }}
          onMouseLeave={() => {
            this.scheduleLeaveReader("top");
          }}
          style={
            this.state.isOpenTopPanel
              ? {
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : !this.props.isNavLocked &&
                          (this.props.isSettingLocked ||
                            this.props.isDockedRight)
                        ? -150
                        : 0,
                }
              : {
                  transform: "translateY(-110px)",
                  marginLeft:
                    this.props.isNavLocked && !this.props.isSettingLocked
                      ? 150
                      : !this.props.isNavLocked &&
                          (this.props.isSettingLocked ||
                            this.props.isDockedRight)
                        ? -150
                        : 0,
                }
          }
        >
          {this.props.htmlBook && (
            <OperationPanel
              {...({
                currentDuration: this.state.currentDuration,
              } as any)}
            />
          )}
        </div>

        {this.props.currentBook.key && <Viewer {...(renditionProps as any)} />}
        {((this.props.readerMode === "scroll" ||
          this.props.readerMode === "single") &&
          this.props.isScaleOpen) ||
        this.props.isConvertOpen ||
        this.props.isPdfCropOpen ||
        this.props.isStudyLangOpen ||
        this.props.isAssistReadOpen ? (
          <div className="reader-setting-dialog-anchor">
            {(this.props.readerMode === "scroll" ||
              this.props.readerMode === "single") &&
              this.props.isScaleOpen && <ScalePageDialog />}
            {this.props.isConvertOpen && <ConvertDialog />}
            {this.props.isPdfCropOpen && <PdfCropDialog />}
            {this.props.isStudyLangOpen && <StudyLangDialog />}
            {this.props.isAssistReadOpen && <AssistReadDialog />}
          </div>
        ) : null}
        <SupportDialog />
        {this.props.isOpenPopupOptionDialog && (
          <>
            <PopupOptionDialog />
            <div className="drag-background"></div>
          </>
        )}
        {
          <div
            style={
              this.props.isSpeechOpen
                ? {}
                : {
                    display: "none",
                  }
            }
          >
            <SpeechDialog />
          </div>
        }
        {this.props.isAnnotationOpen && <AnnotationDialog />}
      </div>
    );
  }
}

export default Reader;
