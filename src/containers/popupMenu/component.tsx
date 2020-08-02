import React from "react";
import "./popupMenu.css";
import PopupNote from "../../components/popupNote";
import PopupOption from "../../components/popupOption";
import { PopupMenuProps, PopupMenuStates } from "./interface";

declare var window: any;

class PopupMenu extends React.Component<PopupMenuProps, PopupMenuStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  constructor(props: PopupMenuProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = { deleteKey: "" };
  }

  componentDidMount() {
    this.props.currentEpub.on("renderer:chapterDisplayed", () => {
      let doc = this.props.currentEpub.renderer.doc;
      this.getHighlighter();
      this.timer = setTimeout(() => {
        this.renderHighlighters();
      }, 100);
      this.getHighlighter();

      doc.addEventListener("click", this.openMenu);
    });
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  //新建高亮
  getHighlighter = () => {
    // 注意点一
    // 为了每次切换章节时都有与当前文档相关联的 pen
    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    this.highlighter = window.rangy.createHighlighter(iDoc);
    let classes = ["color-0", "color-1", "color-2", "color-3"];

    classes.forEach((item) => {
      let config = {
        ignoreWhiteSpace: true,
        elementTagName: "span",
        elementProperties: {
          onclick: (event: any) => {
            if (!document.getElementsByTagName("iframe")[0].contentDocument) {
              return;
            }

            this.handleClickHighlighter();

            this.showMenu();
            event.stopPropagation();
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
  handleClickHighlighter = () => {};
  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };
  showMenu = () => {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }
    this.props.handleChangeDirection(false);
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc!.getSelection();
    let rect = this.props.currentEpub.renderer.rangePosition(
      sel!.getRangeAt(0)
    );

    let height = 200;
    let posX = rect.x + rect.width / 2 - 20;
    //防止menu超出图书
    let rightEdge = this.props.currentEpub.renderer.width - 154;
    var posY;
    //控制menu方向
    if (rect.y < height) {
      this.props.handleChangeDirection(true);
      posY = rect.y + 77;
    } else {
      posY = rect.y - height / 2 - rect.height;
    }

    posY = posY < 6 ? 6 : posY;
    posX =
      posX < 10
        ? 10
        : this.props.menuMode === "note"
        ? rect.x > rightEdge
          ? rightEdge
          : posX
        : posX;
    const selection = window.getSelection();
    selection.removeAllRanges();
    // selection.addRange(item.range);
    this.props.handleOpenMenu(true);
    this.props.handleMenuMode("note");
    let popupMenu = document.querySelector(".popup-menu-container");
    popupMenu &&
      popupMenu.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };
  //渲染高亮
  renderHighlighters = () => {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }

    let highlighters: any = [...this.props.digests, ...this.props.notes];
    if (!highlighters) {
      return;
    }
    let chapterIndex = this.props.currentEpub.renderer.currentChapter.spinePos;
    let highlightersByChapter = highlighters.filter(
      (item: any) => item.chapterIndex === chapterIndex
    );
    let iframe = document.getElementsByTagName("iframe")[0];
    let iWin = iframe.contentWindow || iframe.contentDocument!.defaultView;
    let sel = window.rangy.getSelection(iframe);
    let serial = window.rangy.serializeSelection(sel, true);
    this.highlighter && this.highlighter.removeAllHighlights(); // 为了避免下次反序列化失败，必须先清除已有的高亮

    let classes = ["color-0", "color-1", "color-2", "color-3"];
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
    if (!iWin || !iWin.getSelection()) {
      return;
    }
    iWin.getSelection()!.empty(); // 清除文本选取
    this.props.isOpenMenu &&
      window.rangy.deserializeSelection(serial, null, iWin); // （为了选取文本后不被上一行代码清除掉）恢复原本的文本选取
  };
  //控制弹窗
  openMenu = () => {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }
    this.setState({ deleteKey: "" });
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc!.getSelection();
    this.props.handleChangeDirection(false);
    // 如果 popmenu正在被展示，则隐藏
    if (this.props.isOpenMenu) {
      this.props.handleMenuMode("menu");
      this.props.handleOpenMenu(false);
    }

    // 使弹出菜单更加灵活可控;
    if (sel!.isCollapsed) {
      this.props.isOpenMenu && this.props.handleOpenMenu(false);
      this.props.handleMenuMode("menu");
      return;
    }
    this.showMenu();
    this.props.handleMenuMode("menu");
  };
  //添加高亮
  handleHighlight() {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }

    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let color = this.props.color;
    // let note = this.createNote(color);
    let classes = ["color-0", "color-1", "color-2", "color-3"];
    let key = new Date().getTime() + "";
    this.highlighter.highlightSelection(classes[color]);
    // 清空文本选取
    this.key = key;
    this.props.handleMenuMode("menu");
    this.props.handleOpenMenu(false);
    iDoc!.getSelection()!.empty();
  }
  render() {
    if (this.props.menuMode === "highlight") {
      this.handleHighlight();
    }

    return (
      <div>
        {this.props.isOpenMenu ? (
          <div className="popup-menu-container">
            <div className="popup-menu-box">
              {this.props.menuMode === "menu" ? (
                <PopupOption />
              ) : this.props.menuMode === "note" ? (
                <PopupNote />
              ) : null}
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
        ) : null}
      </div>
    );
  }
}

export default PopupMenu;
