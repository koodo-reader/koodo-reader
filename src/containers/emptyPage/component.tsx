import React from "react";
import "./emptyPage.css";
import { emptyList } from "../../constants/emptyList";
import { Trans } from "react-i18next";
import { EmptyPageProps, EmptyPageState } from "./interface";
import emptyDark from "../../assets/images/empty-dark.svg";
import emptyLight from "../../assets/images/empty-light.svg";

import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import DeletePopup from "../../components/dialogs/deletePopup";

class EmptyPage extends React.Component<EmptyPageProps, EmptyPageState> {
  constructor(props: EmptyPageProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
    };
  }
  handleDeleteShelf = () => {
    if (!this.props.shelfTitle) return;
    let currentShelfTitle = this.props.shelfTitle;
    ConfigService.deleteMapConfig(currentShelfTitle, "shelfList");
    ConfigService.deleteListConfig(currentShelfTitle, "sortedShelfList");

    this.props.handleShelf("");
    this.props.handleMode("home");
    this.props.history.push("/manager/home");
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  render() {
    const renderEmptyList = () => {
      return emptyList.map((item) => {
        return (
          <div
            className="empty-page-info-container"
            key={item.mode}
            style={
              this.props.mode === item.mode ? {} : { visibility: "hidden" }
            }
          >
            <div className="empty-page-info-main">
              <Trans>{item.main}</Trans>
            </div>
            <div className="empty-page-info-sub">
              <Trans>{item.sub}</Trans>
            </div>
          </div>
        );
      });
    };
    const deletePopupProps = {
      mode: "shelf",
      name: this.props.shelfTitle,
      title: "Delete this shelf",
      description: "This action will clear and remove this shelf",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOpearion: this.handleDeleteShelf,
    };
    return (
      <>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
        <div
          className="empty-page-container"
          style={
            this.props.isCollapsed
              ? { width: "calc(100vw - 100px)", left: "100px" }
              : {}
          }
        >
          <div
            className="empty-illustration-container"
            style={{ width: "calc(100% - 50px)" }}
          >
            <img
              src={
                ConfigService.getReaderConfig("appSkin") === "night" ||
                (ConfigService.getReaderConfig("appSkin") === "system" &&
                  ConfigService.getReaderConfig("isOSNight") === "yes")
                  ? emptyDark
                  : emptyLight
              }
              alt=""
              className="empty-page-illustration"
            />
          </div>

          {renderEmptyList()}
          {this.props.shelfTitle && !this.props.isSelectBook && (
            <div
              className="book-list-header"
              style={
                this.props.isCollapsed
                  ? { width: "calc(100% - 70px)", left: "-77px" }
                  : { left: "22px" }
              }
            >
              <div></div>
              <div
                className="booklist-delete-container"
                onClick={() => {
                  this.handleDeletePopup(true);
                }}
              >
                <Trans>Delete this shelf</Trans>
              </div>
              <div></div>
            </div>
          )}
        </div>
      </>
    );
  }
}

export default EmptyPage;
