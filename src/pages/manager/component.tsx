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
import ActionDialog from "../../containers/actionDialog";
import SortDialog from "../../containers/sortDialog";
import MessageBox from "../../containers/messageBox";
import LoadingPage from "../../containers/loadingPage";
import BackupPage from "../../containers/backupPage";
import EmptyPage from "../../containers/emptyPage";
import ShelfUtil from "../../utils/shelfUtil";
import WelcomePage from "../../containers/welcomePage";
import "./manager.css";
import { ManagerProps, ManagerState } from "./interface";
import { Trans } from "react-i18next";
import { getParamsFromUrl } from "../../utils/syncUtils/common";
import copy from "copy-text-to-clipboard";
import OtherUtil from "../../utils/otherUtil";
import AddFavorite from "../../utils/addFavorite";
import packageJson from "../../../package.json";
import UpdateDialog from "../../components/updataDialog";

class Manager extends React.Component<ManagerProps, ManagerState> {
  timer!: NodeJS.Timeout;
  constructor(props: ManagerProps) {
    super(props);
    this.state = {
      totalBooks: parseInt(OtherUtil.getReaderConfig("totalBooks") || "0") || 0,
      favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
      isAuthed: false,
      isError: false,
      isCopied: false,
      isUpdated: OtherUtil.getReaderConfig("version") !== packageJson.version,
      token: "",
    };
  }
  //从indexdb里读取书籍
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
    this.props.handleFetchNotes();
    this.props.handleFetchBookmarks();
    this.props.handleFetchSortCode();
    this.props.handleFetchList();
  }

  UNSAFE_componentWillReceiveProps(nextProps: ManagerProps) {
    if (nextProps.books && this.state.totalBooks !== nextProps.books.length) {
      this.setState({
        totalBooks: nextProps.books.length,
      });
      OtherUtil.setReaderConfig("totalBooks", this.state.totalBooks.toString());
    }
    if (this.props.mode !== nextProps.mode) {
      this.setState({
        favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
      });
    }
    if (nextProps.isMessage) {
      this.timer = setTimeout(() => {
        this.props.handleMessageBox(false);
      }, 2000);
    }
  }
  componentDidMount() {
    //判断是否是获取token后的回调页面
    let url = document.location.href;
    if (url.indexOf("error") > -1) {
      this.setState({ isError: true });
      return false;
    }
    if (url.indexOf("code") > -1) {
      let params: any = getParamsFromUrl();
      console.log(params, "params");
      this.setState({ token: params.code });
      this.setState({ isAuthed: true });
      return false;
    }
    if (url.indexOf("access_token") > -1) {
      let params: any = getParamsFromUrl();
      console.log(params, "params");
      this.setState({ token: params.access_token });
      this.setState({ isAuthed: true });
      return false;
    }
    setTimeout(() => {
      this.props.handleFirst(OtherUtil.getReaderConfig("isFirst") || "yes");
    }, 1000);
  }
  handleUpdateDialog = () => {
    this.setState({ isUpdated: false });
    OtherUtil.setReaderConfig("version", packageJson.version);
  };
  componentWillUnmout() {
    clearTimeout(this.timer);
  }

  render() {
    console.log(
      this.state.isUpdated,
      OtherUtil.getReaderConfig("version"),
      packageJson.version
    );
    if (this.state.isError || this.state.isAuthed) {
      return (
        <div className="backup-page-finish-container">
          <div className="backup-page-finish">
            {this.state.isAuthed ? (
              <span className="icon-message backup-page-finish-icon"></span>
            ) : (
              <span className="icon-close auth-page-close-icon"></span>
            )}

            <div className="backup-page-finish-text">
              <Trans>
                {this.state.isAuthed
                  ? "Authorize Successfully"
                  : "Authorize Failed"}
              </Trans>
            </div>
            {this.state.isAuthed ? (
              <div
                className="token-dialog-token-text"
                onClick={() => {
                  copy(this.state.token);
                  this.setState({ isCopied: true });
                }}
              >
                {this.state.isCopied ? (
                  <Trans>Copied</Trans>
                ) : (
                  <Trans>Copy Token</Trans>
                )}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    let { mode, notes, digests, bookmarks, covers } = this.props;
    let { totalBooks, favoriteBooks } = this.state;
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitle[this.props.shelfIndex + 1];
    let shelfBooks = (ShelfUtil.getShelf()[currentShelfTitle] || []).length;
    const updateDialogProps = {
      handleUpdateDialog: this.handleUpdateDialog,
    };
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
        {this.props.isOpenActionDialog ? <ActionDialog /> : null}
        {this.props.isSortDisplay ? <SortDialog /> : null}
        {this.props.isBackup ? <BackupPage /> : null}
        {this.props.isFirst === "yes" ? <WelcomePage /> : null}
        {this.state.isUpdated ? <UpdateDialog {...updateDialogProps} /> : null}
        {totalBooks === 0 ? (
          <EmptyPage />
        ) : covers === null &&
          (mode === "home" || mode === "favorite" || mode === "shelf") ? (
          <LoadingPage />
        ) : (mode !== "shelf" || shelfBooks !== 0) &&
          (mode === "home" ||
            (mode === "favorite" && favoriteBooks !== 0) ||
            mode === "shelf") ? (
          <BookList />
        ) : bookmarks && mode === "bookmark" ? (
          <BookmarkPage />
        ) : notes.filter((item) => item.notes !== "").length > 0 &&
          mode === "note" ? (
          <NoteList />
        ) : digests.length > 0 && mode === "digest" ? (
          <DigestList />
        ) : (
          <EmptyPage />
        )}
      </div>
    );
  }
}

export default Manager;
