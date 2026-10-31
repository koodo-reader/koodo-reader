import { useTranslation } from "react-i18next";
import { useState } from "react";
import "./popupOptionDialog.css";
import { ReactSortable } from "react-sortablejs";
import toast from "react-hot-toast";
import { useAppStore } from "../../../store/useAppStore";
import {
  getPopupOptionSettingList,
  POPUP_OPTION_LIMIT,
  savePopupOptionSettingList,
} from "../../../constants/popupList";

import { PopupOptionItem } from "../../../constants/popupList";

export interface PopupOptionDialogItem extends PopupOptionItem {
  id: string;
  enabled: boolean;
}

const PopupOptionDialog = () => {
  const handlePopupOptionDialog = useAppStore((s) => s.handlePopupOptionDialog);
  const handlePopupOptionUpdate = useAppStore((s) => s.handlePopupOptionUpdate);
  const { t } = useTranslation();
  const [popupOptionList, setPopupOptionList] = useState<
    PopupOptionDialogItem[]
  >(getPopupOptionSettingList());

  const handleClose = () => {
    handlePopupOptionDialog(false);
  };

  const handleToggleOption = (targetKey: string) => {
    const enabledCount = popupOptionList.filter((item) => item.enabled).length;
    const targetOption = popupOptionList.find(
      (item) => item.key === targetKey
    );

    if (!targetOption) return;

    if (!targetOption.enabled && enabledCount >= POPUP_OPTION_LIMIT) {
      toast(
        t("You can enable up to {{count}} options", {
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
    handlePopupOptionUpdate(Date.now());
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
        {t("Customize popup menu")}
      </div>
      <div className="import-dialog-option">
        <ReactSortable<PopupOptionDialogItem>
          list={popupOptionList}
          setList={(nextList) => {
            setPopupOptionList(nextList);
            savePopupOptionSettingList(nextList);
            handlePopupOptionUpdate(Date.now());
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
                  {t(item.title)}
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
        {t("You can enable up to {{count}} options", {
          count: POPUP_OPTION_LIMIT,
        })}
      </div>
      <div className="import-dialog-back-button">
        {t("Drag to sort")}
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
