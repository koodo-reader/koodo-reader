//我的书签页面
import React from "react";
import "./bookmarkPage.css";
import RecordLocation from "../../utils/recordLocation";
import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
import { Trans } from "react-i18next";
import { BookmarkPageProps, BookmarkPageState } from "./interface";
import { Redirect, withRouter } from "react-router-dom";
import _ from "underscore";
import EmptyCover from "../../components/emptyCover";

declare var window: any;

class BookmarkPage extends React.Component<
  BookmarkPageProps,
  BookmarkPageState
> {
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
  }

  //点击跳转后跳转到指定页面
  handleRedirect = (key: string, cfi: string, percentage: number) => {
    let { books } = this.props;
    let book: any;
    //根据bookKey获取指定的book
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === key) {
        book = books[i];
        break;
      }
    }
    if (!cfi || !percentage) {
      cfi = RecordLocation.getCfi(book!.key).cfi;
      percentage = RecordLocation.getCfi(book!.key).percentage;
    }
    if (!book) {
      this.props.handleMessage("Book not exsit");
      this.props.handleMessageBox(true);
      return;
    }
    RecordLocation.recordCfi(key, cfi, percentage);
    window.open(`${window.location.href.split("#")[0]}#/epub/${book.key}`);
  };
  render() {
    let { bookmarks, books } = this.props;
    let bookKeyArr: string[] = [];
    if (bookmarks.length === 0) {
      return <Redirect to="/manager/empty" />;
    }
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
    const renderBookmarkPage = () => {
      return bookArr.map((item, index) => {
        console.log(item.cover, item.name);
        return (
          <li className="bookmark-page-item" key={item.key}>
            {item.cover && item.cover !== "noCover" ? (
              <img
                className="bookmark-page-cover"
                src={item.cover}
                alt=""
                onClick={() => {
                  this.handleRedirect(item.key, "", 0);
                }}
              />
            ) : (
              <div className="bookmark-page-cover">
                <EmptyCover
                  {...{
                    format: item.format,
                    title: item.name,
                    scale: 0.86,
                  }}
                />
              </div>
            )}

            <p className="bookmark-page-name">{bookArr[index].name}</p>
            <div className="bookmark-page-bookmark-container-parent">
              <ul className="bookmark-page-bookmark-container">
                {renderBookmarklistItem(item)}
              </ul>
            </div>
          </li>
        );
      });
    };
    return (
      <div className="bookmark-page-container-parent">
        <div className="bookmark-page-container">
          {_.clone(this.props.bookmarks) && renderBookmarkPage()}
        </div>
      </div>
    );
  }
}

export default withRouter(BookmarkPage);
