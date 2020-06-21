import React from "react";
import Sidebar from "../../containers/sidebar";
import Header from "../../containers/header";
import BookList from "../../containers/bookList";
import BookmarkPage from "../../containers/bookmarkPage";
import NoteList from "../../containers/noteList";
import DigestList from "../../containers/digestList";
import DeleteDialog from "../../containers/deleteDialog";
import EditDialog from "../../containers/editDialog";
import AddDialog from "../../containers/addDialog";
import SortDialog from "../../containers/sortDialog";
import MessageBox from "../../containers/messageBox";
import LoadingPage from "../../containers/loadingPage";
import BackupPage from "../../containers/backupPage";
import EmptyPage from "../../containers/emptyPage";
import ShelfUtil from "../../utils/shelfUtil";
import WelcomePage from "../../containers/welcomePage";
import RecordRecent from "../../utils/recordRecent";
import "./manager.css";
import { ManagerProps, ManagerState } from "./interface";
class Manager extends React.Component<ManagerProps, ManagerState> {
  timer!: NodeJS.Timeout;
  constructor(props: ManagerProps) {
    super(props);
    this.state = {
      totalBooks: parseInt(localStorage.getItem("totalBooks") || "0") || 0,
      recentBooks: Object.keys(RecordRecent.getRecent()).length,
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

  UNSAFE_componentWillReceiveProps(nextProps: ManagerProps) {
    this.setState({
      totalBooks: this.props.books === null ? 0 : this.props.books.length,
    });
    localStorage.setItem("totalBooks", this.state.totalBooks.toString());

    if (nextProps.isMessage) {
      this.timer = setTimeout(() => {
        this.props.handleMessageBox(false);
        // this.setState({ isMessage: false });
      }, 2000);
    }
  }
  componentDidMount() {
    this.props.handleFirst(localStorage.getItem("isFirst") || "yes");
  }

  componentWillUnmout() {
    clearTimeout(this.timer);
  }

  render() {
    let { mode, notes, digests, bookmarks, covers } = this.props;
    let { totalBooks, recentBooks } = this.state;
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitle[this.props.shelfIndex + 1];
    let shelfBooks = (ShelfUtil.getShelf()[currentShelfTitle] || []).length;
    return (
      <div className="manager">
        <Sidebar />
        <Header />
        <div className="manager-dialog-container">
          {this.props.isOpenDeleteDialog ? (
            <DeleteDialog />
          ) : this.props.isOpenEditDialog ? (
            <EditDialog />
          ) : this.props.isOpenAddDialog ? (
            <AddDialog />
          ) : null}
        </div>
        {this.props.isMessage ? <MessageBox /> : null}
        {this.props.isSortDisplay ? <SortDialog /> : null}
        {this.props.isBackup ? <BackupPage /> : null}
        {this.props.isFirst === "yes" ? <WelcomePage /> : null}
        //根据是否添加图书，路由地址等判断body的显示内容
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

export default Manager;
