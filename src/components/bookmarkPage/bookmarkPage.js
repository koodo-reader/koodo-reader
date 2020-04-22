//我的书签页面
import React, { Component } from "react";
import "./bookmarkPage.css";
import { connect } from "react-redux";
import { handleFetchBookmarks } from "../../redux/reader.redux";
import {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/book.redux";
import RecentBooks from "../../utils/recordRecent";
import RecordLocation from "../../utils/recordLocation";
class BookmarkPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // renderIndex: null
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
  }
  //点击跳转后跳转到指定页面
  handleRedirect = (key, cfi, percentage) => {
    let { books, epubs } = this.props;
    let book = {};
    let epub = {};
    //根据bookKey获取指定的book和epub
    for (let i = 0; i < books.length; i++) {
      // console.log(books[i].key, key, "key");
      if (books[i].key === key) {
        // console.log("sdghasghgh");
        book = books[i];
        epub = epubs[i];
        break;
      }
    }
    // let epub = {};
    // console.log(this.props.books, book);

    this.props.handleReadingBook(book);
    this.props.handleReadingEpub(epub);
    this.props.handleReadingState(true);
    RecentBooks.setRecent(key);
    RecordLocation.recordCfi(key, cfi, percentage);
  };
  // handlePopup = index => {
  //   this.setState({ renderIndex: index });
  // };
  // handleClose = () => {
  //   // console.log("hello");
  //   this.setState({ renderIndex: null });
  // };
  render() {
    let { bookmarks, books, covers } = this.props;
    // console.log(this.props.state, "bookmarks");
    let bookKeyArr = [];
    //获取bookmarks中的图书列表
    bookmarks.forEach((item) => {
      if (bookKeyArr.indexOf(item.bookKey) === -1) {
        bookKeyArr.push(item.bookKey);
        return false;
      }
    });
    // console.log(bookKeyArr, "bookArr");
    //根据图书列表获取图书数据
    let bookArr = books.filter((item) => {
      // console.log(item.key, bookKeyArr, "haslghakfg");
      return bookKeyArr.indexOf(item.key) > -1;
    });
    // console.log(bookArr);
    let coverArr = covers.filter((item) => {
      // console.log(item.key, bookKeyArr, "asgalsgh");
      return bookKeyArr.indexOf(item.key) > -1;
    });
    let coverObj = {};
    //根据图书数据获取封面的url
    coverArr.forEach((item) => {
      coverObj[item.key] = item.url;
    });
    // console.log(coverObj, "arr");
    let bookmarkObj = {};
    bookmarks.forEach((item) => {
      //bookmarkobj没有此书就新建
      if (!bookmarkObj[item.bookKey] && bookKeyArr.indexOf(item.bookKey) > -1) {
        bookmarkObj[item.bookKey] = [];
      }
      //往bookmarkobj里填充书签信息，最终获得以bookkey为键，bookmark为值的对象
      if (bookKeyArr.indexOf(item.bookKey) > -1) {
        bookmarkObj[item.bookKey].push(item);
      }
      return false;
    });
    const renderBookmarklistItem = (item) => {
      return bookmarkObj[item.key].map((item) => (
        <li className="bookmark-page-list-item" key={item.key}>
          <div className="bookmark-page-list-item-title">{item.chapter}</div>
          <div className="bookmark-page-progress">
            {parseInt(item.percentage * 100)}%
          </div>
          <div
            className="bookmark-page-list-item-link"
            onClick={() => {
              this.handleRedirect(item.bookKey, item.cfi, item.percentage);
            }}
          >
            <div className="bookmark-page-list-item-link-text">点击跳转</div>
          </div>
        </li>
      ));
    };
    const renderBookmarkPageItem = (item, index, isShowMore) => {
      // console.log(bookmarkObj[item.key].length, "fhfjhfjhfk");
      return (
        <li className="bookmark-page-item" key={item.key}>
          <img
            className="bookmark-page-cover"
            src={coverObj[item.key]}
            alt=""
          />
          <p className="bookmark-page-name">{bookArr[index].name}</p>
          <div className="bookmark-page-bookmark-container-parent">
            <ul className="bookmark-page-bookmark-container">
              {renderBookmarklistItem(item)}
            </ul>
          </div>
        </li>
      );
    };
    const renderBookmarkPage = () => {
      return bookArr.map((item, index) => {
        return (
          <div key={item.key}>{renderBookmarkPageItem(item, index, false)}</div>
        );
      });
    };
    return (
      <div className="bookmark-page-container-parent">
        <div className="bookmark-page-container">{renderBookmarkPage()}</div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    state: state,
    bookmarks: state.reader.bookmarks,
    covers: state.manager.covers,
    books: state.manager.books,
    epubs: state.manager.epubs,
  };
};
const actionCreator = {
  handleFetchBookmarks,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
};
BookmarkPage = connect(mapStateToProps, actionCreator)(BookmarkPage);
export default BookmarkPage;
