import React from "react";
import "./popupRefer.css";
import { PopupReferProps, PopupReferStates } from "./interface";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { openExternalUrl } from "../../../utils/common";
import Parser from "html-react-parser";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

class PopupRefer extends React.Component<PopupReferProps, PopupReferStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  rect: any;
  constructor(props: PopupReferProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = {
      rect: {},
      isOpenMenu: false,
      footnote: "",
      href: "",
      isJump: false,
      returnPosition: null,
    };
  }
  componentDidMount() {
    this.props.rendition.on("rendered", () => {
      let docs = getIframeDoc(this.props.currentBook.format);
      for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        if (!doc) continue;
        doc.addEventListener("click", this.handleLink);
      }
    });
  }
  handleLink = async (event: any) => {
    if (this.state.isOpenMenu) {
      this.setState({ isOpenMenu: false });
      return;
    }
    this.handleLinkJump(event);
  };
  handleShowMenu = async (node, rect) => {
    let result = await this.props.rendition.getFootnoteContent(node);
    if (!result.handled) return;
    this.setState(
      {
        rect: rect,
        footnote: result.content,
        isOpenMenu: true,
      },
      () => {
        this.showMenu();
      }
    );
  };
  handleLinkJump = async (event: any): Promise<boolean> => {
    let href = this.props.rendition.getTargetHref(event);
    let result = await this.props.rendition.handleLinkJump(href, event);
    console.log(result, "we3463454");
    if (!result.handled) {
      return false;
    }
    if (result.external) {
      openExternalUrl(href);
      return true;
    }
    if (result.isJump) {
      this.setState({
        isJump: true,
        returnPosition: ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "recordLocation",
          {}
        ),
      });
    }
    if (result.href) {
      this.setState({ href: result.href });
    }
    if (result.isShowMenu) {
      let targetElement = event.target;
      let rect = targetElement.getBoundingClientRect();
      await this.handleShowMenu(result.node, rect);
      return true;
    }
    return true;
  };

  showMenu = () => {
    let rect = this.state.rect;
    if (!rect) return;
    let { posX, posY } = this.getHtmlPosition(rect);
    let popupMenu = document.querySelector(".popup-ref-container");
    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };
  getHtmlPosition(rect: any) {
    let pageSize = this.props.rendition.getPageSize();
    let posY = rect.bottom - pageSize.scrollTop;
    let posX = rect.left + rect.width / 2;
    if (rect.width > pageSize.sectionWidth) {
      posX = rect.left + rect.width - pageSize.sectionWidth / 2;
    }
    if (pageSize.height - rect.height < 188) {
      posY = rect.top + 16 + pageSize.top;
    } else if (posY < pageSize.height - 188 + pageSize.top) {
      posY = posY + 16 + pageSize.top;
    } else {
      posY = posY - rect.height - 188 + pageSize.top;
    }
    posX = posX - 135 + pageSize.left;
    if (
      this.props.currentBook.format === "PDF" &&
      this.props.readerMode === "double" &&
      this.props.chapterDocIndex % 2 === 1 &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      posX = posX + pageSize.sectionWidth + pageSize.gap;
    }
    if (
      this.props.currentBook.format === "PDF" &&
      this.props.readerMode === "scroll" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      posY = posY + this.props.chapterDocIndex * pageSize.sectionHeight;
    }
    if (posX < 0) {
      posX = 20;
    }
    if (posY < 0) {
      posY = 20;
    }
    if (posX > document.body.clientWidth - 290 - 20) {
      posX = document.body.clientWidth - 290 - 20;
    }
    if (posY > document.body.clientHeight - 250 - 20) {
      posY = document.body.clientHeight - 250 - 20;
    }
    if (
      this.props.readerMode === "scroll" &&
      this.props.currentBook.format === "PDF"
    ) {
      posX = posX - pageSize.scrollLeft;
    }
    return { posX, posY } as any;
  }

  render() {
    return (
      <div>
        <div
          className="popup-menu-container popup-ref-container"
          style={this.state.isOpenMenu ? {} : { display: "none" }}
        >
          <div
            className="popup-menu-box popup-ref-box"
            onClick={(event) => {
              this.handleLinkJump(event);
              event.stopPropagation();
              event.preventDefault();
            }}
          >
            {Parser(this.state.footnote)}
            <div className="popup-ref-button">
              <span
                style={{ marginRight: 10 }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    this.state.footnote.replace(/<[^>]+>/g, "").trim()
                  );
                }}
              >
                {this.props.t("Copy")}
              </span>
              <span
                onClick={async () => {
                  if (this.state.isJump && this.state.returnPosition) {
                    await this.props.rendition.goToPosition(
                      JSON.stringify(this.state.returnPosition)
                    );
                    this.setState({
                      isJump: false,
                      returnPosition: null,
                      isOpenMenu: false,
                    });
                    return;
                  }
                  let pageArea = document.getElementById("page-area");
                  if (!pageArea) return false;
                  let iframe = pageArea.getElementsByTagName("iframe")[0];
                  if (!iframe) return false;
                  let doc: any = iframe.contentDocument;
                  if (!doc) {
                    return false;
                  }
                  let id = this.state.href.split("#").reverse()[0];
                  this.setState({
                    isJump: true,
                    returnPosition: ConfigService.getObjectConfig(
                      this.props.currentBook.key,
                      "recordLocation",
                      {}
                    ),
                  });
                  await this.props.rendition.goToNode(
                    doc.body.querySelector("#" + CSS.escape(id)) || doc.body
                  );
                }}
                style={{
                  color: this.state.isJump ? "rgba(231, 69, 69, 0.8)" : "",
                }}
              >
                {this.props.t(this.state.isJump ? "Return" : "Go to")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PopupRefer;
