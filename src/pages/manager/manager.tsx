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
import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchSortCode,
  handleFetchList,
  handleMessageBox,
  handleFirst,
} from "../../redux/actions/manager";
import {
  handleFetchNotes,
  handleFetchDigests,
  handleFetchBookmarks,
  handleFetchHighlighters,
} from "../../redux/actions/reader";
import "./manager.css";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import BookmarkModel from "../../model/Bookmark";
import { stateType } from "../../redux/store";

export interface ManagerProps {
  books: BookModel[];
  covers: { key: string; url: string }[];
  notes: NoteModel[];
  digests: DigestModel[];
  bookmarks: BookmarkModel[];
  isReading: boolean;
  mode: string;
  shelfIndex: number;
  isOpenEditDialog: boolean;
  isOpenDeleteDialog: boolean;
  isOpenAddDialog: boolean;
  isSort: boolean;
  isFirst: string;
  isSortDisplay: boolean;
  isMessage: boolean;
  isBackup: boolean;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchDigests: () => void;
  handleFetchBookmarks: () => void;
  handleFetchHighlighters: () => void;
  handleFetchSortCode: () => void;
  handleFetchList: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFirst: (isFirst: string) => void;
}

export interface ManagerState {
  totalBooks: number;
  recentBooks: number;
}

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
const mapStateToProps = (state: stateType) => {
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
    isBackup: state.backupPage.isBackup,
    isFirst: state.manager.isFirst,
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
  handleMessageBox,
  handleFirst,
};
export default connect(mapStateToProps, actionCreator)(Manager);
