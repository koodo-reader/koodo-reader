//我的笔记页面
import React from "react";
import "./noteList.css";
import NoteModel from "../../model/Note";
import { Trans } from "react-i18next";
import { NoteListProps, NoteListState } from "./interface";
import DeleteIcon from "../../components/deleteIcon";
class NoteList extends React.Component<NoteListProps, NoteListState> {
  constructor(props: NoteListProps) {
    super(props);
    this.state = {
      currentDate: null,
      currentIndex: null,
      deleteKey: "",
    };
  }
  //获取图书名
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
  //获取到当前的笔记index
  handleClick = (date: string, index: number) => {
    if (this.state.currentDate) {
      this.setState({ currentDate: null, currentIndex: null });
    } else {
      this.setState({ currentDate: date, currentIndex: index });
    }
  };
  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };

  render() {
    let { notes } = this.props;
    let noteArr = [];
    //从早到晚排序
    for (let i = notes.length - 1; i >= 0; i--) {
      noteArr.push(notes[i]);
    }

    let dateArr = [noteArr[0].date];
    let temp = noteArr[0].date;
    //获取笔记日期列表
    for (let i = 1; i < noteArr.length; i++) {
      if (
        noteArr[i].date !== undefined &&
        (noteArr[i].date.year !== temp.year ||
          noteArr[i].date.month !== temp.month ||
          noteArr[i].date.day !== temp.day)
      ) {
        dateArr.push(noteArr[i].date);
        temp = noteArr[i].date;
      }
    }
    //得到日期为键，笔记为值的对象
    let noteObj: { [key: string]: any } = {};
    dateArr.forEach((date) => {
      noteObj["" + date.year + date.month + date.day] = [];
    });
    noteArr.forEach((note) => {
      dateArr.forEach((date) => {
        if (
          date.year === note.date.year &&
          date.month === note.date.month &&
          date.day === note.date.day
        ) {
          noteObj["" + date.year + date.month + date.day].push(note);
        }
      });
    });
    const renderNoteListItem = (date: string) => {
      return noteObj[date].map((item: NoteModel, index: number) => {
        let isCurrent =
          this.state.currentDate === date && this.state.currentIndex === index;
        const noteProps = {
          itemKey: item.key,
          mode: "notes",
        };
        return (
          <li
            className="note-list-item"
            key={item.notes}
            style={isCurrent ? { height: "200px" } : {}}
            onMouseEnter={() => {
              this.handleShowDelete(item.key);
            }}
            onMouseLeave={() => {
              this.handleShowDelete("");
            }}
          >
            {this.state.deleteKey === item.key ? (
              <DeleteIcon {...noteProps} />
            ) : null}
            <div className="note-list-item-note-parent">
              <div className="note-list-item-note">{item.notes}</div>
            </div>

            <div
              onClick={() => {
                this.handleClick(date, index);
              }}
            >
              <div
                className="note-list-item-show-more"
                style={
                  isCurrent
                    ? { color: "rgba(75,75,75,0.8)", bottom: "10px" }
                    : {}
                }
              >
                <Trans>{isCurrent ? "Less" : "More"}</Trans>
              </div>
              {isCurrent ? null : (
                <span className="icon-dropdown note-list-show-more-icon"></span>
              )}
            </div>
            <div
              className="note-list-item-more-info"
              style={isCurrent ? { display: "block" } : {}}
            >
              <div className="note-list-item-more-text-parent">
                <div className="note-list-item-more-text">{item.text}</div>
              </div>

              <div className="note-list-item-citation">
                <div className="note-list-item-title">
                  <Trans>From</Trans>《
                </div>
                <div className="note-list-item-chapter note-list-item-title">
                  {this.handleBookName(item.bookKey)}
                </div>
                <div className="note-list-item-title">》{item.chapter}</div>
              </div>
            </div>
          </li>
        );
      });
    };
    const renderNoteList = () => {
      return dateArr.map((item, index) => {
        return (
          <li className="note-page-item" key={index}>
            <div className="note-page-item-date">{`${item.year}-${item.month}-${item.day}`}</div>
            <ul className="note-list-container-box">
              {renderNoteListItem("" + item.year + item.month + item.day)}
            </ul>
          </li>
        );
      });
    };
    return (
      <div className="note-list-container-parent">
        <div className="note-list-container">{renderNoteList()}</div>
      </div>
    );
  }
}

export default NoteList;
