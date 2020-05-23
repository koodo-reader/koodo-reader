//图书导航栏页面的书签页面
import React from "react";
import "./bookmarkList.css";
import { connect } from "react-redux";
import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

export interface BookmarkListProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
}
export interface BookmarkListState {
  bookmarks: BookmarkModel[];
}
class BookmarkList extends React.Component<
  BookmarkListProps,
  BookmarkListState
> {
  constructor(props: BookmarkListProps) {
    super(props);
    this.state = { bookmarks: this.props.bookmarks };
  }
  static getDerivedStateFromProps(
    nextProps: BookmarkListProps,
    prevState: BookmarkListProps
  ) {
    if (nextProps.bookmarks !== prevState.bookmarks)
      return { bookmarks: nextProps.bookmarks };
    else return null;
  }
  //跳转到图书的指定位置
  handleJump(cfi: string) {
    this.props.currentEpub.gotoCfi(cfi);
  }
  render() {
    const renderBookmarkList = () => {
      let { bookmarks } = this.state;
      return bookmarks
        .filter((item) => {
          return item.bookKey === this.props.currentBook.key;
        })
        .map((item) => {
          return (
            <li className="book-bookmark-list" key={item.key}>
              <p className="book-bookmark-digest">{item.label}</p>
              <span className="book-bookmark-index">{item.chapter}</span>

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
        <ul className="book-bookmark">{renderBookmarkList()}</ul>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    bookmarks: state.reader.bookmarks,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BookmarkList as any));
