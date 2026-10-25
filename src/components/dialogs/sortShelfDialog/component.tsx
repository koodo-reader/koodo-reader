import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./sortShelfDialog.css";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { ReactSortable } from "react-sortablejs";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import DeletePopup from "../deletePopup";

const SortShelfDialog = () => {
  const handleSortShelfDialog = useAppStore((s) => s.handleSortShelfDialog);
  const handleShelf = useAppStore((s) => s.handleShelf);
  const { t } = useTranslation();
  const newShelfInput = useRef<HTMLInputElement>(null);
  const latestSortedShelfList = useRef<any[]>([]);
  const [sortedShelfList, setSortedShelfList] = useState<any[]>([]);
  const [currentEditShelf, setCurrentEditShelf] = useState("");
  const [currentDeleteShelf, setCurrentDeleteShelf] = useState("");
  const [newShelfName, setNewShelfName] = useState("");
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  const updateSortedShelfList = (nextList: any[]) => {
    latestSortedShelfList.current = nextList;
    setSortedShelfList(nextList);
  };

  useEffect(() => {
    let storedSortedShelfList =
      ConfigService.getAllListConfig("sortedShelfList") || [];
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    let shelfTitleList = Object.keys(shelfList);
    updateSortedShelfList(
      Array.from(new Set([...storedSortedShelfList, ...shelfTitleList])).map(
        (item, index) => {
          return { name: item, id: index };
        }
      )
    );
  }, []);

  const handleClose = () => {
    handleSortShelfDialog(false);
  };
  const handleRenameShelf = () => {
    if (!newShelfName) {
      toast(t("Shelf Title is Empty"));
      setCurrentEditShelf("");
      setNewShelfName("");
      return;
    }
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if (shelfList.hasOwnProperty(newShelfName)) {
      toast(t("Duplicate shelf"));
      return;
    }
    let newShelfList = sortedShelfList.map((item) => {
      if (item.name === currentEditShelf) {
        return { name: newShelfName, id: item.id };
      }
      return item;
    });
    updateSortedShelfList(newShelfList);
    ConfigService.setAllListConfig(
      newShelfList.map((item) => item.name),
      "sortedShelfList"
    );
    let shelfItemList = shelfList[currentEditShelf];
    ConfigService.deleteMapConfig(currentEditShelf, "shelfList");
    ConfigService.setOneMapConfig(newShelfName, shelfItemList, "shelfList");
    toast.success(t("Renamed successfully"));
    setCurrentEditShelf("");
    setNewShelfName("");
  };
  const handleDeleteShelf = () => {
    if (!currentDeleteShelf) return;
    let currentShelfTitle = currentDeleteShelf;
    ConfigService.deleteMapConfig(currentShelfTitle, "shelfList");
    ConfigService.deleteListConfig(currentShelfTitle, "sortedShelfList");

    handleShelf("");
    let storedSortedShelfList =
      ConfigService.getAllListConfig("sortedShelfList") || [];
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    let shelfTitleList = Object.keys(shelfList);
    updateSortedShelfList(
      Array.from(new Set([...storedSortedShelfList, ...shelfTitleList])).map(
        (item, index) => {
          return { name: item, id: index };
        }
      )
    );
  };
  const handleDeletePopup = (isOpen: boolean) => {
    setIsOpenDelete(isOpen);
  };

  const deletePopupProps = {
    mode: "shelf",
    name: currentDeleteShelf,
    title: "Delete this shelf",
    description: "This action will clear and remove this shelf",
    handleDeletePopup: handleDeletePopup,
    handleDeleteOpearion: handleDeleteShelf,
  };
  return (
    <div
      className="backup-page-container"
      style={{ height: "450px", top: "calc(50% - 225px)" }}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {isOpenDelete && <DeletePopup {...(deletePopupProps as any)} />}
      <div className="backup-dialog-title">
        <Trans>Manage shelf</Trans>
      </div>
      <div className="import-dialog-option">
        {
          <ReactSortable
            list={sortedShelfList}
            setList={(newState) => updateSortedShelfList(newState)}
            animation={200}
            delayOnTouchStart={true}
            delay={2}
            scroll={true}
            scrollSensitivity={140}
            scrollSpeed={20}
            bubbleScroll={true}
            filter={"input"}
            preventOnFilter={false}
            onEnd={() => {
              let nextSortedShelfList = latestSortedShelfList.current.map(
                (item) => item.name
              );
              ConfigService.setAllListConfig(
                nextSortedShelfList,
                "sortedShelfList"
              );
            }}
          >
            {sortedShelfList.map((item) => {
              return currentEditShelf === item.name ? (
                <div className={`cloud-drive-item `} key={item.id}>
                  <input
                    ref={newShelfInput}
                    type="text"
                    name="newShelf"
                    id="sidebar-new-shelf"
                    style={{ margin: "0px", height: "25px" }}
                    className="tag-list-item-new"
                    defaultValue={item.name}
                    onChange={(event) => {
                      const sanitizedValue = event.target.value.replace(
                        /[\[\]{}",:\/\\|<>*?]/g,
                        ""
                      );
                      setNewShelfName(sanitizedValue);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleRenameShelf();
                      }
                    }}
                  />
                  <span
                    className="icon-check"
                    onClick={async () => {
                      handleRenameShelf();
                    }}
                    style={{ fontSize: "20px", marginRight: "15px" }}
                  ></span>
                </div>
              ) : (
                <div
                  key={item.id}
                  className={`cloud-drive-item `}
                  onClick={() => {}}
                >
                  <span className="sort-shelf-label">
                    {t(item.name)}
                  </span>
                  <span
                    className="icon-trash-line "
                    onClick={async () => {
                      setCurrentDeleteShelf(item.name);
                      setIsOpenDelete(true);
                    }}
                    style={{ fontSize: "20px", marginRight: "15px" }}
                  ></span>
                  <span
                    className="icon-edit-line "
                    onClick={async () => {
                      setCurrentEditShelf(item.name);
                      setTimeout(() => {
                        newShelfInput.current?.focus();
                      }, 10);
                    }}
                    style={{ fontSize: "20px", marginRight: "15px" }}
                  ></span>
                  <span
                    className="icon-menu "
                    style={{ marginRight: "10px" }}
                  ></span>
                </div>
              );
            })}
          </ReactSortable>
        }
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

export default SortShelfDialog;
