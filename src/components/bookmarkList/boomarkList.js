//图书导航栏页面的书签页面
import React, { Component } from "react";
import "./bookmarkList.css";
import { connect } from "react-redux";
class BookmarkList extends Component {
  constructor(props) {
    super(props);
    this.state = { bookmarks: this.props.bookmarks };
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    // console.log("nextProps", nextProps, "\nprevState", prevState);
    if (nextProps.bookmarks !== prevState.bookmarks)
      return { bookmarks: nextProps.bookmarks };
    else return null;
  }
  //跳转到图书的指定位置
  handleJump(cfi) {
    // console.log(cfi, "afhahhhh");
    this.props.currentEpub.gotoCfi(cfi);
  }
  render() {
    // console.log(this.props.bookmarks, "bookmarkks");
    const renderBookmarkList = () => {
      let { bookmarks } = this.state;
      // console.log(bookmarks);
      return bookmarks
        .filter(item => {
          return item.bookKey === this.props.currentBook.key;
        })
        .map(item => {
          return (
            <li className="book-bookmark-list" key={item.key}>
              <p className="book-bookmark-digest">{item.label}</p>
              <span className="book-bookmark-index">{item.chapter}</span>
              <div className="book-bookmark-progress">
                {Math.floor(item.percentage * 100)}%
              </div>
              <div
                className="book-bookmark-link"
                onClick={() => {
                  this.handleJump(item.cfi);
                }}
                style={{ cursor: "pointer" }}
              >
                点击跳转
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
const mapStateToProps = state => {
  return {
    state: state,
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    bookmarks: state.reader.bookmarks
  };
};
const actionCreator = {};
BookmarkList = connect(mapStateToProps, actionCreator)(BookmarkList);
export default BookmarkList;
