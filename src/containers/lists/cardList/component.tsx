import React from "react";
import "./cardList.css";
import NoteModel from "../../../models/Note";
import { Trans } from "react-i18next";
import { CardListProps, CardListStates } from "./interface";
import { withRouter } from "react-router-dom";
import { Redirect } from "react-router-dom";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import BookModel from "../../../models/Book";
import {
  ConfigService,
  SortUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
class CardList extends React.Component<CardListProps, CardListStates> {
  private containerRef: React.RefObject<HTMLDivElement>;
  private scrollTimer: NodeJS.Timeout | null = null;
  constructor(props: CardListProps) {
    super(props);
    this.containerRef = React.createRef();
    this.state = {
      displayedCards: [],
      currentPage: 1,
      itemsPerPage: 16, // 每页显示16个卡片，适合屏幕显示
      isLoading: false,
    };
  }

  componentDidMount() {
    this.loadInitialCards();
    this.addScrollListener();
  }

  componentDidUpdate(prevProps: CardListProps) {
    // 当cards prop发生变化时，重新初始化
    if (
      prevProps.cards !== this.props.cards ||
      prevProps.noteSortCode !== this.props.noteSortCode
    ) {
      this.loadInitialCards();
    }
  }

  componentWillUnmount() {
    this.removeScrollListener();
    // 清理定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }

  loadInitialCards = () => {
    let sortedCards = [...this.props.cards];
    // 按照key排序
    sortedCards.sort((a, b) => {
      return this.props.noteSortCode.order === 2
        ? b.key.localeCompare(a.key)
        : a.key.localeCompare(b.key);
    });
    const { itemsPerPage } = this.state;

    // 根据屏幕大小动态调整每页显示的卡片数量
    const screenHeight = window.innerHeight;
    const adaptiveItemsPerPage =
      screenHeight > 800 ? itemsPerPage + 8 : itemsPerPage;

    this.setState({
      displayedCards: sortedCards.slice(0, adaptiveItemsPerPage),
      currentPage: 1,
      isLoading: false,
      itemsPerPage: adaptiveItemsPerPage,
    });
  };

  loadMoreCards = () => {
    let sortedCards = [...this.props.cards];
    sortedCards.sort((a, b) => {
      return this.props.noteSortCode.order === 2
        ? b.key.localeCompare(a.key)
        : a.key.localeCompare(b.key);
    });
    const { displayedCards, currentPage, itemsPerPage, isLoading } = this.state;

    if (isLoading || displayedCards.length >= sortedCards.length) {
      return;
    }

    this.setState({ isLoading: true });

    // 模拟异步加载延迟
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * itemsPerPage;
      const endIndex = nextPage * itemsPerPage;
      const newCards = sortedCards.slice(startIndex, endIndex);

      this.setState({
        displayedCards: [...displayedCards, ...newCards],
        currentPage: nextPage,
        isLoading: false,
      });
    }, 200);
  };

  handleScroll = () => {
    // 清除之前的定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    // 设置防抖定时器
    this.scrollTimer = setTimeout(() => {
      const container = this.containerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      // 当滚动到距离底部100px时开始加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        this.loadMoreCards();
      }
    }, 100); // 100ms防抖延迟
  };

  addScrollListener = () => {
    const container = this.containerRef.current;
    if (container) {
      container.addEventListener("scroll", this.handleScroll);
    }
  };

  removeScrollListener = () => {
    const container = this.containerRef.current;
    if (container) {
      container.removeEventListener("scroll", this.handleScroll);
    }
  };

  handleBookName = (bookKey: string) => {
    let { books } = this.props;
    let bookName = "";
    for (let i = 0; i < this.props.books.length; i++) {
      if (books[i].key === bookKey) {
        bookName = books[i].name;
        break;
      }
    }
    return bookName;
  };

  formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp));
      return date.toLocaleString();
    } catch (error) {
      return timestamp; // 如果转换失败，返回原始值
    }
  };
  handleJump = (note: NoteModel) => {
    let { books } = this.props;
    let book: BookModel | null = null;
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === note.bookKey) {
        book = books[i];
        break;
      }
    }
    if (!book) {
      toast(this.props.t("Book not exists"));
      return;
    }

    let bookLocation: any = {};
    //compatile wiht lower version(1.4.2)
    try {
      bookLocation = JSON.parse(note.cfi) || {};
    } catch (error) {
      bookLocation.cfi = note.cfi;
      bookLocation.chapterTitle = note.chapter;
    }
    if (bookLocation.fingerprint) {
      bookLocation.chapterDocIndex = bookLocation.page - 1 + "";
      bookLocation.chapterHref = "title" + (bookLocation.page - 1);
    }
    ConfigService.setObjectConfig(note.bookKey, bookLocation, "recordLocation");

    BookUtil.redirectBook(book);
  };
  render() {
    let { cards } = this.props;
    const { displayedCards, isLoading } = this.state;

    if (cards.length === 0) {
      return <Redirect to="/manager/empty" />;
    }

    const renderCardListItem = (notes) => {
      return notes.map((item: NoteModel, index: number) => {
        return (
          <li
            className="card-list-item"
            key={index}
            style={
              this.props.mode === "note" && !this.props.isCollapsed
                ? { height: "250px" }
                : this.props.mode === "note" && this.props.isCollapsed
                ? { height: "250px", width: "calc(50vw - 70px)" }
                : this.props.isCollapsed
                ? { width: "calc(50vw - 70px)" }
                : {}
            }
          >
            <div className="card-list-item-card">
              <div
                className="card-list-item-title"
                style={{ padding: 15, opacity: 0.6 }}
              >
                {this.formatTimestamp(item.key)}
              </div>
              <div className="card-list-item-text-parent">
                <div className="card-list-item-note">
                  {this.props.mode === "note" ? item.notes : item.text}
                </div>
              </div>
              {this.props.mode === "note" ? (
                <div className="card-list-item-text-note">
                  <div className="card-list-item-text">{item.text}</div>
                </div>
              ) : null}

              <div className="card-list-item-citation">
                <div className="card-list-item-title">
                  <Trans>From</Trans>《
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  {this.handleBookName(item.bookKey)}
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  》{item.chapter}
                </div>
              </div>
              <div className="card-list-item-show-more-container">
                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={this.props.t("Edit")}
                >
                  <span
                    className="icon-edit-line"
                    style={{
                      fontSize: "22px",
                      marginRight: "15px",
                      marginLeft: "15px",
                    }}
                    onClick={() => {
                      this.props.handleNoteKey(item.key);
                      this.props.handleShowPopupNote(true);
                    }}
                  ></span>
                </span>

                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={this.props.t("Show in the book")}
                >
                  <span
                    className="icon-idea-line"
                    style={{
                      fontSize: "22px",

                      fontWeight: 400,
                    }}
                    onClick={() => {
                      this.handleJump(item);
                    }}
                  ></span>
                </span>
              </div>
            </div>
          </li>
        );
      });
    };
    return (
      <div className="card-list-container" ref={this.containerRef}>
        {renderCardListItem(displayedCards)}
        {isLoading && (
          <div className="card-list-loading">
            <div className="loading-spinner">{this.props.t("Loading")}...</div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(CardList as any);
