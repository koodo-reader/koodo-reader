import React from "react";
import "./popupOptionDialog.css";
import { ReactSortable } from "react-sortablejs";
import toast from "react-hot-toast";
import {
  PopupOptionDialogItem,
  PopupOptionDialogProps,
  PopupOptionDialogState,
} from "./interface";
import {
  getPopupOptionSettingList,
  POPUP_OPTION_LIMIT,
  savePopupOptionSettingList,
} from "../../../constants/popupList";

class PopupOptionDialog extends React.Component<
  PopupOptionDialogProps,
  PopupOptionDialogState
> {
  constructor(props: PopupOptionDialogProps) {
    super(props);
    this.state = {
      popupOptionList: getPopupOptionSettingList(),
    };
  }

  handleClose = () => {
    this.props.handlePopupOptionDialog(false);
  };

  handleToggleOption = (targetKey: string) => {
    const enabledCount = this.state.popupOptionList.filter(
      (item) => item.enabled
    ).length;
    const targetOption = this.state.popupOptionList.find(
      (item) => item.key === targetKey
    );

    if (!targetOption) return;

    if (!targetOption.enabled && enabledCount >= POPUP_OPTION_LIMIT) {
      toast(this.props.t("You can enable up to 8 options"));
      return;
    }

    const popupOptionList = this.state.popupOptionList.map((item) => {
      if (item.key !== targetKey) {
        return item;
      }

      return {
        ...item,
        enabled: !item.enabled,
      };
    });

    this.setState({ popupOptionList });
    savePopupOptionSettingList(popupOptionList);
    this.props.handlePopupOptionUpdate(Date.now());
  };

  render() {
    return (
      <div
        className="backup-page-container popup-option-dialog-container"
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="backup-dialog-title">
          {this.props.t("Customize popup menu")}
        </div>
        <div className="import-dialog-option">
          <ReactSortable<PopupOptionDialogItem>
            list={this.state.popupOptionList}
            setList={(popupOptionList) => {
              this.setState({ popupOptionList });
              savePopupOptionSettingList(
                popupOptionList as unknown as PopupOptionDialogState["popupOptionList"]
              );
              this.props.handlePopupOptionUpdate(Date.now());
            }}
            animation={200}
            delayOnTouchStart={true}
            delay={2}
            scroll={true}
            scrollSensitivity={140}
            scrollSpeed={20}
            bubbleScroll={true}
            handle=".popup-option-dialog-drag"
          >
            {this.state.popupOptionList.map((item) => {
              return (
                <div
                  key={item.key}
                  className="cloud-drive-item popup-option-dialog-item"
                  style={item.enabled ? {} : { opacity: 0.6 }}
                >
                  <span
                    className={`icon-${item.icon} popup-option-dialog-item-icon`}
                  ></span>
                  <span className="popup-option-dialog-item-label">
                    {this.props.t(item.title)}
                  </span>
                  <span
                    className="single-control-switch popup-option-dialog-switch"
                    onClick={() => {
                      this.handleToggleOption(item.key);
                    }}
                  >
                    <span
                      className="single-control-button"
                      style={
                        item.enabled
                          ? {
                              transform: "translateX(20px)",
                              transition: "transform 0.5s ease",
                              bottom: "0px",
                            }
                          : {
                              transform: "translateX(0px)",
                              transition: "transform 0.5s ease",
                              bottom: "0px",
                            }
                      }
                    ></span>
                  </span>
                  <span className="icon-menu popup-option-dialog-drag"></span>
                </div>
              );
            })}
          </ReactSortable>
        </div>
        <div className="popup-option-dialog-tip popup-option-dialog-limit">
          {this.props.t("You can enable up to 8 options")}
        </div>
        <div className="import-dialog-back-button">
          {this.props.t("Drag to sort")}
        </div>

        <div
          className="backup-page-close-icon"
          onClick={() => {
            this.handleClose();
          }}
        >
          <span className="icon-close backup-close-icon"></span>
        </div>
      </div>
    );
  }
}

export default PopupOptionDialog;
