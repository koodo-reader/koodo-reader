import { useState } from "react";
import "./popupOptionDialog.css";
import { ReactSortable } from "react-sortablejs";
import toast from "react-hot-toast";
import {
  PopupOptionDialogItem,
  PopupOptionDialogProps,
} from "./interface";
import {
  getPopupOptionSettingList,
  POPUP_OPTION_LIMIT,
  savePopupOptionSettingList,
} from "../../../constants/popupList";

const PopupOptionDialog = (props: PopupOptionDialogProps) => {
  const [popupOptionList, setPopupOptionList] = useState<
    PopupOptionDialogItem[]
  >(getPopupOptionSettingList());

  const handleClose = () => {
    props.handlePopupOptionDialog(false);
  };

  const handleToggleOption = (targetKey: string) => {
    const enabledCount = popupOptionList.filter((item) => item.enabled).length;
    const targetOption = popupOptionList.find(
      (item) => item.key === targetKey
    );

    if (!targetOption) return;

    if (!targetOption.enabled && enabledCount >= POPUP_OPTION_LIMIT) {
      toast(
        props.t("You can enable up to {{count}} options", {
          count: POPUP_OPTION_LIMIT,
        })
      );
      return;
    }

    const nextList = popupOptionList.map((item) => {
      if (item.key !== targetKey) {
        return item;
      }

      return {
        ...item,
        enabled: !item.enabled,
      };
    });

    setPopupOptionList(nextList);
    savePopupOptionSettingList(nextList);
    props.handlePopupOptionUpdate(Date.now());
  };

  return (
    <div
      className="edit-dialog-container popup-option-dialog-container"
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="backup-dialog-title">
        {props.t("Customize popup menu")}
      </div>
      <div className="import-dialog-option">
        <ReactSortable<PopupOptionDialogItem>
          list={popupOptionList}
          setList={(nextList) => {
            setPopupOptionList(nextList);
            savePopupOptionSettingList(nextList);
            props.handlePopupOptionUpdate(Date.now());
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
          {popupOptionList.map((item) => {
            return (
              <div
                key={item.key}
                className="cloud-drive-item popup-option-dialog-item"
                style={item.enabled ? {} : { opacity: 0.6 }}
              >
                <span
                  className={`icon-${item.icon} ${item.name}-icon popup-option-dialog-item-icon`}
                ></span>
                <span className="popup-option-dialog-item-label">
                  {props.t(item.title)}
                </span>
                <span
                  className="single-control-switch popup-option-dialog-switch"
                  onClick={() => {
                    handleToggleOption(item.key);
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
        {props.t("You can enable up to {{count}} options", {
          count: POPUP_OPTION_LIMIT,
        })}
      </div>
      <div className="import-dialog-back-button">
        {props.t("Drag to sort")}
      </div>

      <div
        className="backup-page-close-icon"
        onClick={() => {
          handleClose();
        }}
      >
        <span className="icon-close backup-close-icon"></span>
      </div>
    </div>
  );
};

export default PopupOptionDialog;
