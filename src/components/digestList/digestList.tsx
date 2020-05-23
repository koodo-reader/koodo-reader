//我的书摘页面
import React from "react";
import "./digestList.css";
import { connect } from "react-redux";
import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
import DigestModel from "../../model/Digest";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

export interface DigestListProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
  digests: DigestModel[];
}

class DigestList extends React.Component<DigestListProps> {
  //根据bookkey获取
  handleBookName = (bookKey: string) => {
    let { books } = this.props;
    let bookName = "";
    for (let i = 0; i < this.props.books.length; i++) {
      // console.log(books[i].key === bookKey, "fhgjfhj");
      if (books[i].key === bookKey) {
        bookName = books[i].name;
        break;
      }
    }
    return bookName;
  };
  render() {
    let { digests } = this.props;
    let digestArr = [];
    //使书摘从晚到早排序
    for (let i = digests.length - 1; i >= 0; i--) {
      digestArr.push(digests[i]);
    }
    let dateArr = [digestArr[0].date];
    let temp = digestArr[0].date;
    //获取同一天的所有书摘
    for (let i = 1; i < digestArr.length; i++) {
      if (
        digestArr[i].date.year !== temp.year ||
        digestArr[i].date.month !== temp.month ||
        digestArr[i].date.day !== temp.day
      ) {
        dateArr.push(digestArr[i].date);
        temp = digestArr[i].date;
      }
    }
    //得到以日期为键，书摘为值的对象
    let digestObj: { [key: string]: any } = {};
    dateArr.forEach((date) => {
      digestObj["" + date.year + date.month + date.day] = [];
    });
    digestArr.forEach((digest) => {
      dateArr.forEach((date) => {
        if (
          date.year === digest.date.year &&
          date.month === digest.date.month &&
          date.day === digest.date.day
        ) {
          digestObj["" + date.year + date.month + date.day].push(digest);
        }
      });
    });
    const renderDigestListItem = (date: string) => {
      return digestObj[date].map((item: DigestModel) => {
        return (
          <li className="digest-list-item" key={item.text}>
            <div className="digest-list-item-digest">
              <div className="digest-list-item-text-parent">
                <div className="digest-list-item-text">{item.text}</div>
              </div>
              <div className="digest-list-item-citation">
                <div className="digest-list-item-title">
                  <Trans>From</Trans>《
                </div>
                <div className="digest-list-item-chapter digest-list-item-title">
                  {this.handleBookName(item.bookKey)}
                </div>
                <div className="digest-list-item-title">》{item.chapter}</div>
              </div>
            </div>
          </li>
        );
      });
    };
    const renderDigestList = () => {
      return dateArr.map((item, index) => {
        return (
          <li className="digest-page-item" key={index}>
            <div className="digest-page-item-date">{`${item.year}-${item.month}-${item.day}`}</div>
            <ul className="digest-list-container-box">
              {renderDigestListItem("" + item.year + item.month + item.day)}
            </ul>
          </li>
        );
      });
    };
    return (
      <div className="digest-list-container-parent">
        <div className="digest-list-container">{renderDigestList()}</div>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DigestList as any));
