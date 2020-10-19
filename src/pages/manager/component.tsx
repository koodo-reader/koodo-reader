import React from "react";
import Sidebar from "../../containers/sidebar";
import Header from "../../containers/header";
import DeleteDialog from "../../containers/deleteDialog";
import EditDialog from "../../containers/editDialog";
import AddDialog from "../../containers/addDialog";
import SortDialog from "../../containers/sortDialog";
import MessageBox from "../../containers/messageBox";
import BackupDialog from "../../containers/backupDialog";
import WelcomeDialog from "../../containers/welcomeDialog";
import "./manager.css";
import { ManagerProps, ManagerState } from "./interface";
import { Trans } from "react-i18next";
import OtherUtil from "../../utils/otherUtil";
import AddFavorite from "../../utils/addFavorite";
import { updateLog } from "../../constants/readerConfig";
import UpdateDialog from "../../components/updataDialog";
import SettingDialog from "../../components/settingDialog";
import { isMobileOnly } from "react-device-detect";
import { Route, Switch, Redirect } from "react-router-dom";
import { routes } from "../../router/routes";
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
      isUpdated: false,
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
    setTimeout(() => {
      this.setState({
        isUpdated: OtherUtil.getReaderConfig("version") !== updateLog.version,
      });
      this.props.handleFirst(OtherUtil.getReaderConfig("isFirst") || "yes");
    }, 1000);
  }
  handleUpdateDialog = () => {
    this.setState({ isUpdated: false });
    OtherUtil.setReaderConfig("version", updateLog.version);
  };
  componentWillUnmout() {
    clearTimeout(this.timer);
  }

  render() {
    let { books } = this.props;
    const updateDialogProps = {
      handleUpdateDialog: this.handleUpdateDialog,
    };
    if (isMobileOnly) {
      return (
        <>
          <p className="waring-title">
            <Trans>Warning</Trans>
          </p>
          <div className="mobile-warning">
            <span>
              <Trans>
                For better user experince, please visit this site on a computer
              </Trans>
            </span>
          </div>
          <div>
            <img
              src={
                process.env.NODE_ENV === "production"
                  ? "./assets/empty.svg"
                  : "../../assets/empty.svg"
              }
              alt=""
              className="waring-pic"
            />
          </div>
        </>
      );
    }
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
        {this.props.isBackup ? <BackupDialog /> : null}
        {!this.state.isUpdated && this.props.isFirst === "yes" ? (
          <WelcomeDialog />
        ) : null}
        {this.state.isUpdated ? <UpdateDialog {...updateDialogProps} /> : null}
        {this.props.isSettingOpen ? <SettingDialog /> : null}
        {!books && this.state.totalBooks ? (
          <Redirect to="/manager/loading" />
        ) : (
          <Switch>
            {routes.map((ele) => (
              <Route
                render={() => <ele.component />}
                key={ele.path}
                path={ele.path}
              />
            ))}
          </Switch>
        )}
      </div>
    );
  }
}
export default Manager;
