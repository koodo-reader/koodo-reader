import React from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupOption from "../popupOption";
import PopupTrans from "../popupTrans";
import { PopupMenuProps, PopupMenuStates } from "./interface";
import StorageUtil from "../../../utils/storageUtil";

declare var window: any;

class PopupMenu extends React.Component<PopupMenuProps, PopupMenuStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  cfiRange: any;
  contents: any;
  rect: any;
  constructor(props: PopupMenuProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = {
      deleteKey: "",
      cfiRange: this.props.cfiRange,
      contents: this.props.contents,
      rect: this.props.rect,
    };
  }

  componentDidMount() {
    this.props.rendition.on("rendered", () => {
      new Promise<void>((resolve, reject) => {
        this.getHighlighter();
        resolve();
      }).then(() => {
        this.renderHighlighters();
      });
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) return;
      doc.addEventListener("mousedown", this.openMenu);
    });
  }
  componentWillReceiveProps(nextProps: PopupMenuProps) {
    if (nextProps.cfiRange !== this.props.cfiRange) {
      this.setState(
        {
          cfiRange: nextProps.cfiRange,
          contents: nextProps.contents,
          rect: nextProps.rect,
        },
        () => {
          this.openMenu();
        }
      );
    }
  }
  //新建高亮
  getHighlighter = () => {
    // 注意点一
    // 为了每次切换章节时都有与当前文档相关联的 pen
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
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
          onclick: (event: any) => {
            let iframe = document.getElementsByTagName("iframe")[0];
            if (!iframe) return;
            let doc = iframe.contentDocument;
            if (!doc) return;
            this.props.handleMenuMode("note");
            let sel = doc.getSelection();
            if (!sel) return;
            let range = sel.getRangeAt(0);
            this.setState({ rect: range.getBoundingClientRect() }, () => {
              this.showMenu();
              this.handleClickHighlighter(event.currentTarget.dataset.key);
              event.stopPropagation();
            });
          },
        },
        onElementCreate: (element: any) => {
          element.dataset.key = this.key;
        },
      };
      let applier = window.rangy.createClassApplier(item, config);
      this.highlighter.addClassApplier(applier);
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
    this.props.handleChangeDirection(false);
    // const rect = this.rect;
    let height = 200;
    let x =
      StorageUtil.getReaderConfig("readerMode") === "single"
        ? rect.x
        : StorageUtil.getReaderConfig("readerMode") === "scroll"
        ? rect.right
        : rect.x % this.props.currentEpub.rendition._layout.width;
    let y = rect.y % this.props.currentEpub.rendition._layout.height;
    let posX = x + rect.width / 2 - 20;
    //防止menu超出图书
    let rightEdge =
      this.props.menuMode === "note" || this.props.menuMode === "trans"
        ? this.props.currentEpub.rendition._layout.width - 310
        : this.props.currentEpub.rendition._layout.width - 200;
    let posY: number;
    //控制menu方向
    if (y < height) {
      this.props.handleChangeDirection(true);
      posY = y + 67;
    } else {
      posY = y - height / 2 - 57;
    }
    posX = posX > rightEdge ? rightEdge : posX;
    this.props.handleOpenMenu(true);
    let popupMenu = document.querySelector(".popup-menu-container");

    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
    this.setState({ rect: null });
  };
  //渲染高亮
  renderHighlighters = () => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    if (!this.props.rendition || !this.props.rendition.currentLocation) {
      return;
    }
    const currentLocation = this.props.rendition.currentLocation();
    if (!currentLocation || !currentLocation.start) return;
    let chapterIndex = currentLocation.start.index;
    let highlightersByChapter = highlighters.filter(
      (item: any) => item.chapterIndex === chapterIndex
    );
    let iframe = document.getElementsByTagName("iframe")[0];
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
            let temp = JSON.parse(item.range);
            temp = [temp];
            window.rangy
              .getSelection(iframe)
              .restoreCharacterRanges(iframe.contentDocument, temp);
          } catch (e) {
            console.warn(
              "Exception has been caught when restore character ranges."
            );
            return;
          }
          this.highlighter.highlightSelection(classes[item.color]);
        }
      });
    if (!iWin || !iWin.getSelection()) return;
    iWin.getSelection()?.empty(); // 清除文本选取
    // this.props.isOpenMenu &&
    //   window.rangy.deserializeSelection(serial, null, iWin); // （为了选取文本后不被上一行代码清除掉）恢复原本的文本选取
  };
  //控制弹窗
  openMenu = () => {
    this.setState({ deleteKey: "" });
    let iframe = document.getElementsByTagName("iframe")[0];
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
    let iframe = document.getElementsByTagName("iframe")[0];
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
      this.handleHighlight();
    }
    const PopupProps = {
      cfiRange: this.props.cfiRange,
      contents: this.props.contents,
      rect: this.props.rect,
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
            ) : null}
            <span
              className="icon-close popup-close"
              onClick={() => {
                this.props.handleOpenMenu(false);
              }}
              style={this.props.isChangeDirection ? { top: "170px" } : {}}
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
