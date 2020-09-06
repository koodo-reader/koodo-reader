//我的书摘页面
import React from "react";
import "./cardList.css";
import NoteModel from "../../model/Note";
import { Trans } from "react-i18next";
import { CardListProps, CardListStates } from "./interface";
import DeleteIcon from "../../components/deleteIcon";
import RecentBooks from "../../utils/recordRecent";
import RecordLocation from "../../utils/recordLocation";

class CardList extends React.Component<CardListProps, CardListStates> {
  constructor(props: CardListProps) {
    super(props);
    this.state = { deleteKey: "" };
  }
  //根据bookkey获取
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
  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };
  handleJump = (cfi: string, bookKey: string, percentage: number) => {
    let { books, epubs } = this.props;
    let book = null;
    let epub = null;
    //根据bookKey获取指定的book和epub
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === bookKey) {
        book = books[i];
        epub = epubs[i];
        break;
      }
    }
    this.props.handleReadingBook(book!);
    this.props.handleReadingEpub(epub);
    this.props.handleReadingState(true);
    RecentBooks.setRecent(bookKey);
    RecordLocation.recordCfi(bookKey, cfi, percentage);
  };
  render() {
    let { cards } = this.props;
    let cardArr = [];
    //使书摘从晚到早排序
    for (let i = cards.length - 1; i >= 0; i--) {
      cardArr.push(cards[i]);
    }
    let dateArr = [cardArr[0].date];
    let temp = cardArr[0].date;
    //获取同一天的所有书摘
    for (let i = 1; i < cardArr.length; i++) {
      if (
        cardArr[i].date.year !== temp.year ||
        cardArr[i].date.month !== temp.month ||
        cardArr[i].date.day !== temp.day
      ) {
        dateArr.push(cardArr[i].date);
        temp = cardArr[i].date;
      }
    }
    //得到以日期为键，书摘为值的对象
    let cardObj: { [key: string]: any } = {};
    dateArr.forEach((date) => {
      cardObj["" + date.year + date.month + date.day] = [];
    });
    cardArr.forEach((card) => {
      dateArr.forEach((date) => {
        if (
          date.year === card.date.year &&
          date.month === card.date.month &&
          date.day === card.date.day
        ) {
          cardObj["" + date.year + date.month + date.day].push(card);
        }
      });
    });
    const renderCardListItem = (date: string) => {
      return cardObj[date].map((item: NoteModel, index: number) => {
        const cardProps = {
          itemKey: item.key,
          mode: "notes",
        };
        return (
          <li
            className="card-list-item"
            key={index}
            onMouseOver={() => {
              this.handleShowDelete(item.key);
            }}
            onMouseLeave={() => {
              this.handleShowDelete("");
            }}
          >
            {this.state.deleteKey === item.key ? (
              <DeleteIcon {...cardProps} />
            ) : null}
            <div className="card-list-item-card">
              <div className="card-list-item-text-parent">
                <div className="card-list-item-text">
                  {this.props.mode === "note" ? item.notes : item.text}
                </div>
              </div>
              <div className="card-list-item-citation">
                <div className="card-list-item-title">
                  <Trans>From</Trans>《
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  {this.handleBookName(item.bookKey)}
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  》<Trans>{item.chapter}</Trans>
                </div>
              </div>
              <div
                onClick={() => {
                  this.handleJump(item.cfi, item.bookKey, item.percentage);
                }}
              >
                <div
                  className="card-list-item-show-more"
                  style={{ color: "rgba(75,75,75,0.8)", bottom: "10px" }}
                >
                  {this.props.mode === "note" ? (
                    <Trans>{"More Notes"}</Trans>
                  ) : (
                    <Trans>{"More Digests"}</Trans>
                  )}

                  <span className="icon-dropdown icon-card-right"></span>
                </div>
              </div>
            </div>
          </li>
        );
      });
    };
    const renderCardList = () => {
      return dateArr.map((item, index) => {
        return (
          <li className="card-page-item" key={index}>
            <div className="card-page-item-date">{`${item.year}-${item.month}-${item.day}`}</div>
            <ul className="card-list-container-box">
              {renderCardListItem("" + item.year + item.month + item.day)}
            </ul>
          </li>
        );
      });
    };
    return <div className="card-list-container">{renderCardList()}</div>;
  }
}

export default CardList;
