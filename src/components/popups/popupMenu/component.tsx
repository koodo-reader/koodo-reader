import React from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupOption from "../popupOption";
import PopupTrans from "../popupTrans";
import PopupDict from "../popupDict";
import NoteModel from "../../../model/Note";
import { PopupMenuProps, PopupMenuStates } from "./interface";
import { getIframeDoc } from "../../../utils/serviceUtils/docUtil";
import { showPDFHighlight } from "../../../utils/fileUtils/pdfUtil";
import BookUtil from "../../../utils/fileUtils/bookUtil";

declare var window: any;

class PopupMenu extends React.Component<PopupMenuProps, PopupMenuStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  rect: any;
  constructor(props: PopupMenuProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = {
      deleteKey: "",
      rect: this.props.rect,
    };
  }

  componentDidMount() {
    this.props.rendition.on("rendered", () => {
      setTimeout(() => {
        this.handleRenderHighlight();
        this.props.handleRenderNoteFunc(this.handleRenderHighlight);
      }, 500);
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps: PopupMenuProps) {
    if (nextProps.rect !== this.props.rect) {
      this.setState(
        {
          rect: nextProps.rect,
        },
        () => {
          this.openMenu();
        }
      );
    }
  }
  handleRenderHighlight = () => {
    new Promise<void>((resolve, reject) => {
      this.getHighlighter();
      resolve();
    }).then(() => {
      this.renderHighlighters();
    });
    let doc = getIframeDoc();
    if (!doc) return;
    doc.addEventListener("mousedown", this.openMenu);
    doc.addEventListener("touchend", this.openMenu);
    window.addEventListener("resize", BookUtil.reloadBooks);

    if (this.props.currentBook.format === "PDF") {
      setTimeout(() => {
        this.renderHighlighters();
      }, 1000);

      doc.addEventListener("wheel", () => {
        this.renderHighlighters();
      });
    }
  };
  //新建高亮
  getHighlighter = () => {
    let doc = getIframeDoc();
    if (!doc) return;
    this.highlighter = window.rangy.createHighlighter(doc);
    let classes = [
      "color-0",
      "color-1",
      "color-2",
      "color-3",
      "line-0",
      "line-1",
      "line-2",
      "line-3",
    ];
    classes.forEach((item) => {
      let config = {
        ignoreWhiteSpace: true,
        elementTagName: "span",
        elementProperties: {
          onclick: this.handleNoteClick,
        },
        onElementCreate: (element: any) => {
          element.dataset.key =
            this.key || this.props.notes[this.props.notes.length - 1].key;
        },
      };
      let applier = window.rangy.createClassApplier(item, config);
      this.highlighter.addClassApplier(applier);
    });
  };
  handleNoteClick = (event: any) => {
    let doc = getIframeDoc();
    if (!doc) return;
    this.props.handleMenuMode("note");
    let sel = doc.getSelection();
    if (!sel) return;
    let range = sel.getRangeAt(0);
    sel.removeAllRanges();
    sel.addRange(range);
    this.setState({ rect: range.getBoundingClientRect() }, () => {
      this.showMenu();
      this.handleClickHighlighter(event.currentTarget.dataset.key);
      event.stopPropagation();
    });
  };
  handlePDFClick = (event: any) => {
    this.props.handleMenuMode("note");
    this.setState({ rect: event.currentTarget.getBoundingClientRect() }, () => {
      this.showMenu();
      this.handleClickHighlighter(event.currentTarget.getAttribute("key"));
      event.stopPropagation();
    });
  };

  handleClickHighlighter = (key: string) => {
    let dialog: HTMLInputElement | null = document.querySelector(".editor-box");
    if (!dialog) return;
    let note = this.props.notes.filter((item) => item.key === key)[0];
    if (note && note.notes) {
      dialog.value = note.notes;
    }
    dialog?.focus();
    this.props.handleNoteKey(key);
  };
  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };
  showMenu = () => {
    let rect = this.state.rect;
    if (!rect) return;
    let { posX, posY } =
      this.props.currentBook.format !== "PDF"
        ? this.getHtmlPosition(rect)
        : this.getPdfPosition(rect);
    this.props.handleOpenMenu(true);
    let popupMenu = document.querySelector(".popup-menu-container");
    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
    this.setState({ rect: null });
  };
  getPdfPosition(rect: any) {
    let posY = rect.bottom;
    let posX = rect.left + rect.width / 2;
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%; overflow: hidden;");
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
    if (rect.bottom < doc.document.body.scrollHeight - 188) {
      this.props.handleChangeDirection(true);
      posY = posY + 16;
    } else {
      posY = posY - rect.height - 188;
    }
    posX = posX - 80;
    return { posX, posY } as any;
  }
  getHtmlPosition(rect: any) {
    let posY = rect.bottom - this.props.rendition.getPageSize().scrollTop;
    let posX = rect.left + rect.width / 2;
    if (
      posY <
      this.props.rendition.getPageSize().height -
        188 +
        this.props.rendition.getPageSize().top
    ) {
      this.props.handleChangeDirection(true);
      posY = posY + 16 + this.props.rendition.getPageSize().top;
    } else {
      posY = posY - rect.height - 188 + this.props.rendition.getPageSize().top;
    }
    posX = posX - 80 + this.props.rendition.getPageSize().left;
    return { posX, posY } as any;
  }
  //渲染高亮
  renderHighlighters = async () => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: NoteModel) => {
      if (this.props.currentBook.format !== "PDF") {
        return (
          item.chapter ===
            this.props.rendition.getChapterDoc()[this.props.chapterDocIndex]
              .label && item.bookKey === this.props.currentBook.key
        );
      } else {
        return (
          item.chapterIndex === this.props.chapterDocIndex &&
          item.bookKey === this.props.currentBook.key
        );
      }
    });
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe || !iframe.contentWindow) return;
    let iWin = iframe.contentWindow || iframe.contentDocument?.defaultView;
    this.highlighter && this.highlighter.removeAllHighlights(); // 为了避免下次反序列化失败，必须先清除已有的高亮
    let classes = [
      "color-0",
      "color-1",
      "color-2",
      "color-3",
      "line-0",
      "line-1",
      "line-2",
      "line-3",
    ];
    highlightersByChapter &&
      highlightersByChapter.forEach((item: any) => {
        this.key = item.key;
        //控制渲染指定图书的指定高亮
        if (item.bookKey === this.props.currentBook.key) {
          try {
            if (this.props.currentBook.format === "PDF") {
              showPDFHighlight(
                JSON.parse(item.range),
                classes[item.color],
                item.key,
                this.handlePDFClick
              );
            } else {
              let temp = JSON.parse(item.range);
              temp = [temp];
              let doc = iframe.contentDocument;
              window.rangy
                .getSelection(iframe)
                .restoreCharacterRanges(doc, temp);
              this.highlighter.highlightSelection(classes[item.color]);
            }
          } catch (e) {
            console.warn(
              e,
              "Exception has been caught when restore character ranges."
            );
            return;
          }
        }
      });
    this.key = "";
    if (!iWin || !iWin.getSelection()) return;
    iWin.getSelection()?.empty(); // 清除文本选取
    // this.props.isOpenMenu &&
    //   window.rangy.deserializeSelection(serial, null, iWin); // （为了选取文本后不被上一行代码清除掉）恢复原本的文本选取
  };
  //控制弹窗
  openMenu = () => {
    this.setState({ deleteKey: "" });
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let sel = doc.getSelection();
    this.props.handleChangeDirection(false);
    // 如果 popmenu正在被展示，则隐藏
    if (this.props.isOpenMenu) {
      this.props.handleMenuMode("menu");
      this.props.handleOpenMenu(false);
      this.props.handleNoteKey("");
    }
    if (!sel) return;
    // 使弹出菜单更加灵活可控;
    if (sel.isCollapsed) {
      this.props.isOpenMenu && this.props.handleOpenMenu(false);
      this.props.handleMenuMode("menu");
      this.props.handleNoteKey("");
      return;
    }
    this.showMenu();
    this.props.handleMenuMode("menu");
  };
  //添加高亮
  handleHighlight() {
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let color = this.props.color;
    let classes = [
      "color-0",
      "color-1",
      "color-2",
      "color-3",
      "line-0",
      "line-1",
      "line-2",
      "line-3",
    ];
    if (!this.highlighter) return;
    this.highlighter.highlightSelection(classes[color]);
    this.props.handleMenuMode("menu");
    this.props.handleOpenMenu(false);

    doc.getSelection()?.empty();
    this.props.handleMenuMode("menu");
    this.highlighter && this.highlighter.removeAllHighlights();
    new Promise<void>((resolve) => {
      this.getHighlighter();
      resolve();
    }).then(() => {
      this.renderHighlighters();
    });
  }
  render() {
    if (this.props.menuMode === "highlight") {
      // this.getHighlighter();
      this.handleHighlight();
    }
    const PopupProps = {
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
    };
    return (
      <div>
        <div
          className="popup-menu-container"
          style={this.props.isOpenMenu ? {} : { display: "none" }}
        >
          <div className="popup-menu-box">
            {this.props.menuMode === "menu" ? (
              <PopupOption {...PopupProps} />
            ) : this.props.menuMode === "note" ? (
              <PopupNote {...PopupProps} />
            ) : this.props.menuMode === "trans" ? (
              <PopupTrans {...PopupProps} />
            ) : this.props.menuMode === "dict" ? (
              <PopupDict {...PopupProps} />
            ) : null}
            <span
              className="icon-close popup-close"
              onClick={() => {
                this.props.handleOpenMenu(false);
              }}
              style={this.props.isChangeDirection ? { top: "180px" } : {}}
            ></span>
          </div>
          {this.props.isChangeDirection ? (
            <span
              className="icon-popup popup-menu-triangle-up"
              style={
                this.props.menuMode === "highlight" ? { bottom: "110px" } : {}
              }
            ></span>
          ) : (
            <span className="icon-popup popup-menu-triangle-down"></span>
          )}
        </div>
      </div>
    );
  }
}

export default PopupMenu;
