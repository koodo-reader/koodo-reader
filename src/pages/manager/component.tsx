import React from "react";
import Sidebar from "../../containers/sidebar";
import Header from "../../containers/header";
import DeleteDialog from "../../components/dialogs/deleteDialog";
import EditDialog from "../../components/dialogs/editDialog";
import AddDialog from "../../components/dialogs/addDialog";
import SortDialog from "../../components/dialogs/sortDialog";
import AboutDialog from "../../components/dialogs/aboutDialog";
import BackupDialog from "../../components/dialogs/backupDialog";
import ImportDialog from "../../components/dialogs/importDialog";
import { ManagerProps, ManagerState } from "./interface";
import { Trans } from "react-i18next";
import SettingDialog from "../../components/dialogs/settingDialog";
import { isMobile } from "react-device-detect";
import { Route, Switch, Redirect } from "react-router-dom";
import { routes } from "../../router/routes";
import Arrow from "../../components/arrow";
import LoadingDialog from "../../components/dialogs/loadingDialog";
import { Toaster } from "react-hot-toast";
import DetailDialog from "../../components/dialogs/detailDialog";
import FeedbackDialog from "../../components/dialogs/feedbackDialog";
import { Tooltip } from "react-tooltip";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import emptyDark from "../../assets/images/empty-dark.svg";
import emptyLight from "../../assets/images/empty-light.svg";
class Manager extends React.Component<ManagerProps, ManagerState> {
  timer!: NodeJS.Timeout;
  constructor(props: ManagerProps) {
    super(props);
    this.state = {
      totalBooks: parseInt(ConfigService.getReaderConfig("totalBooks")) || 0,
      favoriteBooks: Object.keys(
        ConfigService.getAllListConfig("favoriteBooks")
      ).length,
      isAuthed: false,
      isError: false,
      isCopied: false,
      isUpdated: false,
      isDrag: false,
      token: "",
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: ManagerProps) {
    if (nextProps.books && this.state.totalBooks !== nextProps.books.length) {
      this.setState(
        {
          totalBooks: nextProps.books.length,
        },
        () => {
          ConfigService.setReaderConfig(
            "totalBooks",
            this.state.totalBooks.toString()
          );
        }
      );
    }
    if (nextProps.books && nextProps.books.length === 1 && !this.props.books) {
      this.props.history.push("/manager/home");
    }
    if (this.props.mode !== nextProps.mode) {
      this.setState({
        favoriteBooks: Object.keys(
          ConfigService.getAllListConfig("favoriteBooks")
        ).length,
      });
    }
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
    this.props.handleFetchPlugins();
    this.props.handleFetchNotes();
    this.props.handleFetchBookmarks();
    this.props.handleFetchBookSortCode();
    this.props.handleFetchNoteSortCode();
    this.props.handleFetchList();
  }
  componentDidMount() {
    this.props.handleReadingState(false);
  }

  handleDrag = (isDrag: boolean) => {
    this.setState({ isDrag });
  };
  render() {
    let { books } = this.props;
    return (
      <div
        className="manager"
        onDragEnter={() => {
          !this.props.dragItem && this.handleDrag(true);
          (
            document.getElementsByClassName("import-from-local")[0] as any
          ).style.zIndex = "50";
        }}
      >
        <Tooltip id="my-tooltip" style={{ zIndex: 25 }} />
        {!this.props.dragItem && (
          <div
            className="drag-background"
            onClick={() => {
              this.props.handleEditDialog(false);
              this.props.handleDeleteDialog(false);
              this.props.handleAddDialog(false);
              this.props.handleDetailDialog(false);
              this.props.handleLoadingDialog(false);
              if (!this.props.isAuthed) {
                this.props.handleNewDialog(false);
                this.props.handleShowSupport(false);
              }
              this.props.handleBackupDialog(false);
              this.props.handleImportDialog(false);
              this.props.handleSetting(false);
              this.props.handleFeedbackDialog(false);
              this.handleDrag(false);
            }}
            style={
              this.props.isSettingOpen ||
              this.props.isOpenFeedbackDialog ||
              this.props.isBackup ||
              this.props.isOpenImportDialog ||
              this.props.isShowNew ||
              this.props.isShowSupport ||
              this.props.isOpenDeleteDialog ||
              this.props.isOpenEditDialog ||
              this.props.isDetailDialog ||
              this.props.isOpenAddDialog ||
              this.props.isShowLoading ||
              this.state.isDrag
                ? {}
                : {
                    display: "none",
                  }
            }
          >
            {this.state.isDrag && (
              <div className="drag-info">
                <Arrow />
                <p className="arrow-text">
                  <Trans>Drop your books here</Trans>
                </p>
              </div>
            )}
          </div>
        )}
        <Sidebar />
        <Toaster />
        <Header {...{ handleDrag: this.handleDrag }} />
        {this.props.isOpenDeleteDialog && <DeleteDialog />}
        {this.props.isOpenEditDialog && <EditDialog />}
        {this.props.isOpenAddDialog && <AddDialog />}
        {this.props.isShowLoading && <LoadingDialog />}
        {this.props.isSortDisplay && <SortDialog />}
        {this.props.isAboutOpen && <AboutDialog />}
        {this.props.isBackup && <BackupDialog />}
        {this.props.isOpenImportDialog && <ImportDialog />}
        {this.props.isOpenFeedbackDialog && <FeedbackDialog />}{" "}
        {this.props.isSettingOpen && <SettingDialog />}
        {this.props.isDetailDialog && <DetailDialog />}
        {(!books || books.length === 0) && this.state.totalBooks ? (
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
