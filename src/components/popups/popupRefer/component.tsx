import React from "react";
import "./popupRefer.css";
import { PopupReferProps, PopupReferStates } from "./interface";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { getTargetHref, openExternalUrl } from "../../../utils/common";
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
    this.handleLinkJump(event, this.props.rendition);
  };
  handleLinkJump = async (
    event: any,
    rendition: any = {}
  ): Promise<boolean> => {
    let href = getTargetHref(event);

    if (href && href.startsWith("kindle:")) {
      let result = await this.props.rendition.resolveHref(href);
      href = "#" + result;
    }

    if (href && href.indexOf("#") > -1) {
      let pageArea = document.getElementById("page-area");
      if (!pageArea) return false;
      let iframe = pageArea.getElementsByTagName("iframe")[0];
      if (!iframe) return false;
      let doc: any = iframe.contentDocument;
      if (!doc) {
        return false;
      }
      this.setState({ href: href });
      if (href.indexOf("#") > -1) {
        let id = href.split("#").reverse()[0];
        let node = doc.body.querySelector("#" + CSS.escape(id));
        if (!node) {
          //can't find the node, go to href
          if (href.indexOf("#") !== 0) {
            let chapterInfo = rendition.resolveChapter(href.split("#")[0]);
            await rendition.goToChapter(
              chapterInfo.index,
              chapterInfo.href,
              chapterInfo.label
            );
          }
          await rendition.goToNode(
            doc.body.querySelector("#" + CSS.escape(id)) || doc.body
          );
          return true;
        }

        if (
          node.textContent.trim() === event.target.textContent.trim() ||
          !node.textContent.trim()
        ) {
          node = node.parentElement;
        }
        let htmlContent = node.innerHTML;
        //将html代码中的img标签由blob转换为base64
        const convertBlobToDataURL = async (blobUrl) => {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        const processHtml = async (html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const images: any[] = Array.from(doc.getElementsByTagName("img"));
          for (const img of images) {
            if (img.src && img.src.startsWith("blob:")) {
              try {
                const dataUrl = await convertBlobToDataURL(img.src);
                img.src = dataUrl;
                img.style.maxWidth = "100%"; // 确保图片不会超出容器宽度
              } catch (error) {
                console.error("Error converting blob to data URL:", error);
              }
            }
          }
          return doc.body.innerHTML;
        };

        htmlContent = await processHtml(htmlContent);
        this.setState(
          {
            rect: event.target.getBoundingClientRect(),
            footnote: htmlContent,
            isOpenMenu: true,
          },
          () => {
            this.showMenu();
          }
        );

        return true;
      }
    } else if (
      href &&
      rendition.resolveChapter &&
      rendition.resolveChapter(href)
    ) {
      let chapterInfo = rendition.resolveChapter(href);
      await rendition.goToChapter(
        chapterInfo.index,
        chapterInfo.href,
        chapterInfo.label
      );
      return true;
    } else if (
      href &&
      href.indexOf("../") === -1 &&
      href.indexOf("http") === 0 &&
      href.indexOf("OEBPF") === -1 &&
      href.indexOf("OEBPS") === -1 &&
      href.indexOf("footnote") === -1 &&
      href.indexOf("blob") === -1 &&
      href.indexOf("data:application") === -1
    ) {
      openExternalUrl(href);
      return true;
    }
    return false;
  };

  showMenu = () => {
    let rect = this.state.rect;
    if (!rect) return;
    let { posX, posY } = this.getHtmlPosition(rect);
    let popupMenu = document.querySelector(".popup-ref-container");
    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };
  getHtmlPosition(rect: any) {
    let posY = rect.bottom - this.props.rendition.getPageSize().scrollTop;
    let posX = rect.left + rect.width / 2;
    if (rect.width > this.props.rendition.getPageSize().sectionWidth) {
      posX =
        rect.left +
        rect.width -
        this.props.rendition.getPageSize().sectionWidth / 2;
    }
    if (this.props.rendition.getPageSize().height - rect.height < 188) {
      posY = rect.top + 16 + this.props.rendition.getPageSize().top;
    } else if (
      posY <
      this.props.rendition.getPageSize().height -
        188 +
        this.props.rendition.getPageSize().top
    ) {
      posY = posY + 16 + this.props.rendition.getPageSize().top;
    } else {
      posY = posY - rect.height - 188 + this.props.rendition.getPageSize().top;
    }
    posX = posX - 135 + this.props.rendition.getPageSize().left;
    if (
      this.props.currentBook.format === "PDF" &&
      this.props.readerMode === "double" &&
      this.props.chapterDocIndex % 2 === 1 &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      posX =
        posX +
        this.props.rendition.getPageSize().sectionWidth +
        this.props.rendition.getPageSize().gap;
    }
    if (
      this.props.currentBook.format === "PDF" &&
      this.props.readerMode === "scroll" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      posY =
        posY +
        this.props.chapterDocIndex *
          this.props.rendition.getPageSize().sectionHeight;
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
              this.handleLinkJump(event, this.props.rendition);
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
                    this.setState({ isJump: false, returnPosition: null });
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
