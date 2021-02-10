import React from "react";
import Sidebar from "../../containers/sidebar";
import Header from "../../containers/header";
import DeleteDialog from "../../containers/deleteDialog";
import EditDialog from "../../containers/editDialog";
import AddDialog from "../../containers/addDialog";
import SortDialog from "../../containers/sortDialog";
import MessageBox from "../../containers/messageBox";
import BackupDialog from "../../containers/backupDialog";
import "./manager.css";
import { ManagerProps, ManagerState } from "./interface";
import { Trans } from "react-i18next";
import OtherUtil from "../../utils/otherUtil";
import AddFavorite from "../../utils/addFavorite";
import SettingDialog from "../../components/settingDialog";
import { isMobileOnly } from "react-device-detect";
import { Route, Switch, Redirect } from "react-router-dom";
import { routes } from "../../router/routes";
import Arrow from "../../components/arrow";
import LoadingDialog from "../../components/loadingDialog";
import DownloadDesk from "../../components/downloadDesk";
// declare var window: any;

//判断是否为触控设备
const is_touch_device = () => {
  return "ontouchstart" in window;
};
const isElectron = require("is-electron");
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
      isDrag: false,
      token: "",
    };
  }
  //从indexdb里读取书籍
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
    this.props.handleFetchNotes();
    this.props.handleFetchBookmarks();
    this.props.handleFetchBookSortCode();
    this.props.handleFetchList();
  }

  UNSAFE_componentWillReceiveProps(nextProps: ManagerProps) {
    if (nextProps.books && this.state.totalBooks !== nextProps.books.length) {
      this.setState(
        {
          totalBooks: nextProps.books.length,
        },
        () => {
          OtherUtil.setReaderConfig(
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
    if (is_touch_device() && !OtherUtil.getReaderConfig("isTouch")) {
      OtherUtil.setReaderConfig("isTouch", "yes");
    }
  }

  handleDrag = (isDrag: boolean) => {
    this.setState({ isDrag });
  };
  componentWillUnmout() {
    clearTimeout(this.timer);
  }

  render() {
    let { books } = this.props;
    // if (isMobileOnly) {
    //   return (
    //     <>
    //       <p className="waring-title">
    //         <Trans>Warning</Trans>
    //       </p>
    //       <div className="mobile-warning">
    //         <span>
    //           <Trans>
    //             For better user experince, please visit this site on a computer
    //           </Trans>
    //         </span>
    //       </div>
    //       <div>
    //         <img
    //           src={
    //             process.env.NODE_ENV === "production"
    //               ? "./assets/empty.svg"
    //               : "../../assets/empty.svg"
    //           }
    //           alt=""
    //           className="waring-pic"
    //         />
    //       </div>
    //     </>
    //   );
    // }
    return (
      <div
        className="manager"
        onDragEnter={() => {
          !this.props.dragItem && this.handleDrag(true);
          (document.getElementsByClassName(
            "import-from-local"
          )[0] as any).style.zIndex = "50";
        }}
      >
        {this.state.isDrag && !this.props.dragItem && (
          <div className="drag-background">
            <div className="drag-info">
              <Arrow />
              <p className="arrow-text">
                <Trans>Drop your books here</Trans>
              </p>
            </div>
          </div>
        )}
        <Sidebar />
        <Header {...{ handleDrag: this.handleDrag }} />
        {this.props.isOpenDeleteDialog && <DeleteDialog />}
        {this.props.isOpenEditDialog && <EditDialog />}
        {this.props.isOpenAddDialog && <AddDialog />}
        {this.props.isShowLoading && <LoadingDialog />}
        {
          <div
            className="drag-background"
            style={
              this.props.isSettingOpen ||
              this.props.isBackup ||
              this.props.isShowNew ||
              this.props.isOpenDeleteDialog ||
              this.props.isOpenEditDialog ||
              this.props.isOpenAddDialog ||
              this.props.isDownloadDesk ||
              this.props.isShowLoading
                ? {}
                : {
                    display: "none",
                  }
            }
          ></div>
        }

        {this.props.isMessage && <MessageBox />}
        <SortDialog />
        {this.props.isBackup && <BackupDialog />}
        {this.props.isSettingOpen && <SettingDialog />}
        {this.props.isDownloadDesk && !isElectron() && <DownloadDesk />}
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
