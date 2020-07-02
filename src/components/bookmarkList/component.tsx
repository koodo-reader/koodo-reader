//图书导航栏页面的书签页面
import React from "react";
import "./bookmarkList.css";
import { Trans } from "react-i18next";
import { BookmarkListProps, BookmarkListState } from "./interface";
import DeleteIcon from "../deleteIcon";
class BookmarkList extends React.Component<
  BookmarkListProps,
  BookmarkListState
> {
  constructor(props: BookmarkListProps) {
    super(props);
    this.state = { deleteIndex: -1 };
  }
  //跳转到图书的指定位置
  handleJump(cfi: string) {
    if (!cfi) {
      this.props.handleMessage("Wrong bookmark");
      this.props.handleMessageBox(true);
      return;
    }
    this.props.currentEpub.gotoCfi(cfi);
  }
  handleShowDelete = (index: number) => {
    this.setState({ deleteIndex: index });
  };
  render() {
    console.log(this.props.bookmarks, "bookmarks");
    const renderBookmarkList = () => {
      let { bookmarks } = this.props;
      return bookmarks
        .filter((item) => {
          return item.bookKey === this.props.currentBook.key;
        })
        .map((item, index) => {
          const bookmarkProps = {
            itemKey: item.key,
            mode: "bookmarks",
          };
          return (
            <li
              className="book-bookmark-list"
              key={item.key}
              onMouseEnter={() => {
                this.handleShowDelete(index);
              }}
              onMouseLeave={() => {
                this.handleShowDelete(-1);
              }}
            >
              <p className="book-bookmark-digest">{item.label}</p>
              <span className="book-bookmark-index">{item.chapter}</span>
              {this.state.deleteIndex === index ? (
                <DeleteIcon {...bookmarkProps} />
              ) : null}
              <div
                className="book-bookmark-link"
                onClick={() => {
                  this.handleJump(item.cfi);
                }}
                style={{ cursor: "pointer" }}
              >
                <Trans>Go To</Trans>
              </div>
              <div className="book-bookmark-progress">
                {Math.floor(item.percentage * 100)}%
              </div>
            </li>
          );
        });
    };
    return (
      <div className="book-bookmark-container">
        <ul className="book-bookmark">
          {this.props.bookmarks && renderBookmarkList()}
        </ul>
      </div>
    );
  }
}

export default BookmarkList;
