import React from "react";
import "./popupMenu.css";
import PopupHighlist from "../popupHighlight/popupHighlight";
import PopupNote from "../popupNote/popupNote";
import PopupOption from "../popupOption/popupOption";
import { handleSelection } from "../../redux/viewArea.redux";
import { connect } from "react-redux";
import BookModel from "../../model/Book";
import HighlighterModel from "../../model/Highlighter";
declare var window: any;
export interface PopupMenuProps {
  currentEpub: any;
  currentBook: BookModel;
  isOpenMenu: boolean;
  isOpenHighlight: boolean;
  isOpenNote: boolean;
  highlighters: HighlighterModel[];
}

export interface PopupMenuState {
  mode: string;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
}

class PopupMenu extends React.Component<PopupMenuProps, PopupMenuState> {
  highlighter: any;
  timer: NodeJS.Timeout;
  key: any;
  constructor(props: PopupMenuProps) {
    super(props);
    this.state = {
      mode: "menu",
      isOpenMenu: false,
      isChangeDirection: false,
    };
    this.highlighter = null;
  }

  componentDidMount() {
    this.props.currentEpub.on("renderer:chapterDisplayed", () => {
      let doc = this.props.currentEpub.renderer.doc;
      this.getHighlighter();
      this.timer = setTimeout(() => {
        this.renderHighlighters();
      }, 100);

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
          onclick: (event) => {
            let iDoc = document.getElementsByTagName("iframe")[0]
              .contentDocument;
            let sel = iDoc.getSelection();
            if (!sel.isCollapsed) return;
            let key = event.currentTarget.dataset.key;
            this.openMenu();
            event.stopPropagation();
          },
        },
        onElementCreate: (element) => {
          element.dataset.key = this.key;
        },
      };
      let applier = window.rangy.createClassApplier(item, config);
      this.highlighter.addClassApplier(applier);
    });
  };
  //渲染高亮
  renderHighlighters = () => {
    let { highlighters } = this.props;
    let iframe = document.getElementsByTagName("iframe")[0];
    let iWin = iframe.contentWindow || iframe.contentDocument.defaultView;
    let sel = window.rangy.getSelection(iframe);
    let serial = window.rangy.serializeSelection(sel, true);
    this.highlighter && this.highlighter.removeAllHighlights(); // 为了避免下次反序列化失败，必须先清除已有的高亮

    let classes = ["color-0", "color-1", "color-2", "color-3"];
    highlighters !== null &&
      highlighters.forEach((item) => {
        this.key = item.key;
        //控制渲染指定图书的指定高亮
        if (item.bookKey === this.props.currentBook.key) {
          try {
            let temp = JSON.parse(item.range);
            temp = [temp];
            // console.log(temp, "test");
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

    iWin.getSelection().empty(); // 清除文本选取
    this.state.isOpenMenu &&
      window.rangy.deserializeSelection(serial, null, iWin); // （为了选取文本后不被上一行代码清除掉）恢复原本的文本选取
  };
  openMenu = () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc.getSelection();
    this.setState({ isChangeDirection: false });
    // 如果 popmenu正在被展示，则隐藏
    if (this.state.isOpenMenu) {
      this.changeMenu("menu");
      this.closeMenu();
    }
    // 使弹出菜单更加灵活可控
    if (sel.isCollapsed) {
      this.props.isOpenMenu && this.closeMenu();
      this.changeMenu("menu");
      return;
    }
    //获取选择文字的坐标
    let rect = this.props.currentEpub.renderer.rangePosition(sel.getRangeAt(0));
    // console.log(rect);

    let height = 200;
    let posX = rect.x + rect.width / 2 - 20;
    //防止menu超出图书
    let rightEdge = this.props.currentEpub.renderer.width - 154;
    var posY;
    //控制menu方向
    if (rect.y < height) {
      this.setState({ isChangeDirection: true });
      posY = rect.y + 77;
    } else {
      posY = rect.y - height / 2 - rect.height;
    }
    // let
    posY = posY < 6 ? 6 : posY;
    posX =
      posX < 10
        ? 10
        : this.state.mode === "note"
        ? rect.x > rightEdge
          ? rightEdge
          : posX
        : posX;
    this.setState({ isOpenMenu: true });
    let popupMenu = document.querySelector(".popup-menu-container");
    popupMenu.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };
  closeMenu = () => {
    this.setState({ isOpenMenu: false });
  };
  changeMenu = (mode) => {
    this.setState({ mode: mode });
  };
  render() {
    return (
      <div>
        {this.state.isOpenMenu ? (
          <div className="popup-menu-container">
            <div className="popup-menu-box">
              {this.state.mode === "menu" ? (
                <PopupOption
                  closeMenu={this.closeMenu}
                  changeMenu={this.changeMenu}
                />
              ) : this.state.mode === "note" ? (
                <PopupNote
                  closeMenu={this.closeMenu}
                  changeMenu={this.changeMenu}
                />
              ) : (
                <PopupHighlist
                  closeMenu={this.closeMenu}
                  changeMenu={this.changeMenu}
                  getHighlighter={this.getHighlighter}
                  highlighter={this.highlighter}
                  isChangeDirection={this.state.isChangeDirection}
                />
              )}
            </div>
            {this.state.isChangeDirection ? (
              <span
                className="icon-popup popup-menu-triangle-up"
                style={
                  this.state.mode === "highlight" ? { bottom: "110px" } : {}
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
const mapStateToProps = (state) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isOpenMenu: state.viewArea.isOpenMenu,
    isOpenHighlight: state.viewArea.isOpenHighlight,
    isOpenNote: state.viewArea.isOpenNote,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = { handleSelection };
export default connect(mapStateToProps, actionCreator)(PopupMenu);
