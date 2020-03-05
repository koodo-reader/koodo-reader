import React, { Component } from "react";
import Sidebar from "../../components/sidebar/sidebar";
import Header from "../../components/header/header";
import BookList from "../../components/bookList/booklist";
import BookmarkPage from "../../components/bookmarkPage/bookmarkPage";
import NoteList from "../../components/noteList/noteList";
import DigestList from "../../components/digestList/digestList";
import DeleteDialog from "../../components/deleteDialog/deleteDialog";
import EditDialog from "../../components/editDialog/editDialog";
import AddDialog from "../../components/addDialog/addDialog";
import SortDialog from "../../components/sortDialog/sortDialog";
import MessageBox from "../../components/messageBox/messageBox";
import LoadingPage from "../../components/loadingPage/loadingPage";
import BackupPage from "../../components/backupPage/backupPage";
import EmptyPage from "../../components/emptyPage/emptyPage";
import ShelfUtil from "../../utils/shelfUtil";
import WelcomePage from "../../components/welcomePage/welcomePage";
import RecordRecent from "../../utils/recordRecent";
import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchSortCode,
  handleFetchList,
  handleList,
  handleMessageBox
} from "../../redux/manager.redux";
import {
  handleFetchNotes,
  handleFetchDigests,
  handleFetchBookmarks,
  handleFetchHighlighters
} from "../../redux/reader.redux";
import "./manager.css";

class Manager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: this.props.mode,
      shelfIndex: this.props.shelfIndex,
      books: this.props.books,
      notes: this.props.notes,
      digests: this.props.digests,
      covers: this.props.covers,
      bookmarks: this.props.bookmarks,
      isOpenEditDialog: this.props.isOpenEditDialog,
      isOpenDeleteDialog: this.props.isOpenDeleteDialog,
      isOpenAddDialog: this.props.isOpenAddDialog,
      isSort: this.props.isSort,
      isSortDisplay: this.props.isSortDisplay,
      isMessage: false,
      isBackup: false,
      totalBooks: localStorage.getItem("totalBooks") || 0,
      isFirst: null,
      recentBooks: Object.keys(RecordRecent.getRecent()).length
    };
  }
  //从indexdb里读取书籍
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
    this.props.handleFetchNotes();
    this.props.handleFetchDigests();
    this.props.handleFetchBookmarks();
    this.props.handleFetchHighlighters();
    this.props.handleFetchSortCode();
    this.props.handleFetchList();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // console.log(nextProps);
    this.setState({
      mode: nextProps.mode,
      shelfIndex: nextProps.shelfIndex,
      books: nextProps.books,
      notes: nextProps.notes,
      covers: nextProps.covers,
      digests: nextProps.digests,
      bookmarks: nextProps.bookmarks,
      isOpenDeleteDialog: nextProps.isOpenDeleteDialog,
      isOpenEditDialog: nextProps.isOpenEditDialog,
      isOpenAddDialog: nextProps.isOpenAddDialog,
      isSort: nextProps.isSort,
      isSortDisplay: nextProps.isSortDisplay,
      isMessage: nextProps.isMessage,
      isBackup: nextProps.isBackup
    });
    console.log(this.state.books, "books");
    this.setState({
      totalBooks: this.state.books === null ? 0 : this.state.books.length
    });
    localStorage.setItem("totalBooks", this.state.totalBooks);

    if (nextProps.isMessage) {
      this.timer = setTimeout(() => {
        this.props.handleMessageBox(false);
        this.setState({ isMessage: false });
      }, 2000);
    }
  }
  componentDidMount() {
    this.setState({ isFirst: localStorage.getItem("isFirst") || "first" });
  }

  componentWillUnmout() {
    clearTimeout(this.timer);
  }
  handleCloseWelcome = () => {
    this.setState({ isFirst: "no" });
    localStorage.setItem("isFirst", "no");
  };
  render() {
    console.log(this.state.isFirst, "first");
    let {
      mode,
      notes,
      digests,
      bookmarks,
      covers,
      totalBooks,
      recentBooks
    } = this.state;
    console.log(this.state.isBackup, "toatl");
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    // console.log(shelfTitle, index, "shelfTitle");
    let currentShelfTitle = shelfTitle[this.state.shelfIndex + 1];
    let shelfBooks = ShelfUtil.getShelf()[currentShelfTitle].length;
    // console.log(this.state.isMessage, "message");
    console.log(shelfBooks, "shelf");
    return (
      <div className="manager">
        <Sidebar />
        <Header />
        <div className="manager-dialog-container">
          {this.state.isOpenDeleteDialog ? (
            <DeleteDialog />
          ) : this.state.isOpenEditDialog ? (
            <EditDialog />
          ) : this.state.isOpenAddDialog ? (
            <AddDialog />
          ) : null}
        </div>
        {this.state.isMessage ? <MessageBox /> : null}
        {this.state.isSortDisplay ? <SortDialog /> : null}
        {this.state.isBackup ? <BackupPage /> : null}
        {this.state.isFirst === "first" ? (
          <WelcomePage
            handleCloseWelcome={() => {
              this.handleCloseWelcome();
            }}
          />
        ) : null}
        {totalBooks === 0 ? (
          <EmptyPage />
        ) : covers === null &&
          (mode === "home" || mode === "recent" || mode === "shelf") ? (
          <LoadingPage />
        ) : (mode !== "shelf" || shelfBooks !== 0) &&
          (mode === "home" ||
            (mode === "recent" && recentBooks !== 0) ||
            mode === "shelf") ? (
          <BookList />
        ) : bookmarks !== null && mode === "bookmark" ? (
          <BookmarkPage />
        ) : notes !== null && notes !== undefined && mode === "note" ? (
          <NoteList />
        ) : digests !== null && mode === "digest" ? (
          <DigestList />
        ) : (
          <EmptyPage />
        )}
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    covers: state.manager.covers,
    notes: state.reader.notes,
    digests: state.reader.digests,
    bookmarks: state.reader.bookmarks,
    isReading: state.book.isReading,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
    isOpenEditDialog: state.book.isOpenEditDialog,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    isOpenAddDialog: state.book.isOpenAddDialog,
    isSort: state.manager.isSort,
    isSortDisplay: state.manager.isSortDisplay,
    isMessage: state.manager.isMessage,
    isBackup: state.backupPage.isBackup
  };
};
const actionCreator = {
  handleFetchBooks,
  handleFetchNotes,
  handleFetchDigests,
  handleFetchBookmarks,
  handleFetchHighlighters,
  handleFetchSortCode,
  handleFetchList,
  handleList,
  handleMessageBox
};
Manager = connect(mapStateToProps, actionCreator)(Manager);
export default Manager;
