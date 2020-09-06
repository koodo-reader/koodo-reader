//我的书签页面
import React from "react";
import "./bookmarkPage.css";
import RecentBooks from "../../utils/recordRecent";
import RecordLocation from "../../utils/recordLocation";
import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
import { Trans } from "react-i18next";
import { BookmarkPageProps, BookmarkPageState } from "./interface";

class BookmarkPage extends React.Component<
  BookmarkPageProps,
  BookmarkPageState
> {
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
  }
  //点击跳转后跳转到指定页面
  handleRedirect = (key: string, cfi: string, percentage: number) => {
    let { books, epubs } = this.props;
    let book = null;
    let epub = null;
    //根据bookKey获取指定的book和epub
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === key) {
        book = books[i];
        epub = epubs[i];
        break;
      }
    }
    this.props.handleReadingBook(book!);
    this.props.handleReadingEpub(epub);
    this.props.handleReadingState(true);
    RecentBooks.setRecent(key);
    RecordLocation.recordCfi(key, cfi, percentage);
  };
  render() {
    let { bookmarks, books, covers } = this.props;
    let bookKeyArr: string[] = [];
    //获取bookmarks中的图书列表
    bookmarks.forEach((item) => {
      if (bookKeyArr.indexOf(item.bookKey) === -1) {
        bookKeyArr.push(item.bookKey);
        return false;
      }
    });
    //根据图书列表获取图书数据
    let bookArr = books.filter((item) => {
      return bookKeyArr.indexOf(item.key) > -1;
    });
    let coverArr: { key: string; url: string }[] = covers.filter((item) => {
      return bookKeyArr.indexOf(item.key) > -1;
    });
    let coverObj: { [key: string]: string } = {};
    //根据图书数据获取封面的url
    coverArr.forEach((item: any) => {
      coverObj[item.key] = item.url;
    });
    let bookmarkObj: { [key: string]: any } = {};
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
    const renderBookmarklistItem = (item: BookModel) => {
      return bookmarkObj[item.key].reverse().map((item: BookmarkModel) => (
        <li className="bookmark-page-list-item" key={item.key}>
          <div className="bookmark-page-list-item-title">
            <Trans>{item.chapter}</Trans>
          </div>
          <div className="bookmark-page-progress">
            {Math.round(item.percentage * 100)}%
          </div>
          <div
            className="bookmark-page-list-item-link"
            onClick={() => {
              this.handleRedirect(item.bookKey, item.cfi, item.percentage);
            }}
          >
            <div className="bookmark-page-list-item-link-text">
              <Trans>Go To</Trans>
            </div>
          </div>
        </li>
      ));
    };
    const renderBookmarkPageItem = (item: BookModel, index: number) => {
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
        return <div key={item.key}>{renderBookmarkPageItem(item, index)}</div>;
      });
    };
    return (
      <div className="bookmark-page-container-parent">
        <div className="bookmark-page-container">{renderBookmarkPage()}</div>
      </div>
    );
  }
}

export default BookmarkPage;
