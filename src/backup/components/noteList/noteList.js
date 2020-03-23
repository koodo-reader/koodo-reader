//我的笔记页面
import React, { Component } from "react";
import "./noteList.css";
import { connect } from "react-redux";
class NoteList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDate: null,
      currentIndex: null
    };
  }
  //获取图书名
  handleBookName = bookKey => {
    let { books } = this.props;
    let bookName = "";
    for (let i = 0; i < this.props.books.length; i++) {
      console.log(books[i].key === bookKey);
      if (books[i].key === bookKey) {
        bookName = books[i].name;
        break;
      }
    }
    // console.log(chapter, "chapter");
    return bookName;
  };
  //获取到当前的笔记index
  handleClick = (date, index) => {
    if (this.state.currentDate) {
      this.setState({ currentDate: null, currentIndex: null });
    } else {
      this.setState({ currentDate: date, currentIndex: index });
    }
  };
  render() {
    let { notes } = this.props;
    console.log(this.props.notes);
    let noteArr = [];
    //从早到晚排序
    for (let i = notes.length - 1; i >= 0; i--) {
      noteArr.push(notes[i]);
    }

    // console.log(noteArr[0].date, notes, "notesaghsag");
    let dateArr = [noteArr[0].date];
    let temp = noteArr[0].date;
    // console.log(noteArr[0].date.day === noteArr[1].date.day);
    //获取笔记日期列表
    for (let i = 1; i < noteArr.length; i++) {
      // console.log(noteArr[i].date);
      // console.log(noteArr[i].date);
      if (
        noteArr[i].date !== undefined &&
        (noteArr[i].date.year !== temp.year ||
          noteArr[i].date.month !== temp.month ||
          noteArr[i].date.day !== temp.day)
      ) {
        dateArr.push(noteArr[i].date);
        temp = noteArr[i].date;
      }

      // console.log(dateArr);
    }
    //得到日期为键，笔记为值的对象
    let noteObj = {};
    console.log(dateArr);

    dateArr.forEach(date => {
      noteObj["" + date.year + date.month + date.day] = [];
    });
    noteArr.forEach(note => {
      dateArr.forEach(date => {
        if (
          date.year === note.date.year &&
          date.month === note.date.month &&
          date.day === note.date.day
        ) {
          noteObj["" + date.year + date.month + date.day].push(note);
        }
      });
      // if(item.date.year===)
    });
    // console.log(noteObj, "agasgbsg");
    const renderNoteListItem = date => {
      return noteObj[date].map((item, index) => {
        console.log(item, "item");
        // console.log(height, "height");
        // notePageItem.setAttribute("style", `height:${height}px`);
        let isCurrent =
          this.state.currentDate === date && this.state.currentIndex === index;
        return (
          <li
            className="note-list-item"
            key={index}
            style={isCurrent ? { height: "200px" } : null}
          >
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
                {isCurrent ? "收起" : "显示笔记出处"}
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
                <div className="note-list-item-title">来自《</div>
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
            <div className="note-page-item-date">{`${item.year}年${item.month}月${item.day}日`}</div>
            <ul className="note-list-container-box">
              {renderNoteListItem("" + item.year + item.month + item.day)}
            </ul>
          </li>
        );
      });
    };
    console.log(dateArr, noteArr, notes, "notesaghsag");
    return (
      <div className="note-list-container-parent">
        <div className="note-list-container">{renderNoteList()}</div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    notes: state.reader.notes,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books
  };
};
const actionCreator = {
  // handleFetchNotes
};
NoteList = connect(mapStateToProps, actionCreator)(NoteList);
export default NoteList;
