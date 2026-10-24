import { useState } from "react";
import "./deleteIcon.css";
import { DeleteIconProps } from "./interface";
import DeletePopup from "../dialogs/deletePopup";
import toast from "react-hot-toast";
import DatabaseService from "../../utils/storage/databaseService";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";

const DeleteIcon = (props: DeleteIconProps) => {
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  const handleDelete = async () => {
    let deleteFunc =
      props.mode === "notes"
        ? props.handleFetchNotes
        : props.handleFetchBookmarks;
    if (props.mode === "tags") {
      ConfigService.deleteListConfig(props.tagName, "noteTags");
      handleDeleteTagFromNote(props.tagName);
      return;
    }
    if (props.mode === "bookmarks") {
      let bookLocation: {
        text: string;
        count: string;
        chapterTitle: string;
        chapterDocIndex: string;
        chapterHref: string;
        percentage: string;
        cfi: string;
      } = ConfigService.getObjectConfig(
        props.currentBook.key,
        "recordLocation",
        {}
      );
      let bookmark = await DatabaseService.getRecord(
        props.itemKey,
        "bookmarks"
      );
      if (!bookmark) return;
      if (bookLocation.percentage === bookmark.percentage) {
        props.handleShowBookmark(false);
      }
      DatabaseService.deleteRecord(props.itemKey, "bookmarks").then(() => {
        deleteFunc();
        toast.success(props.t("Deletion successful"));
      });
      return;
    }
    if (props.mode === "notes") {
      let note = await DatabaseService.getRecord(props.itemKey, "notes");
      if (!note) return;
      if (props.htmlBook && props.htmlBook.rendition) {
        props.htmlBook.rendition.removeOneNote(
          props.itemKey,
          note.chapterIndex
        );
      }

      DatabaseService.deleteRecord(props.itemKey, "notes").then(() => {
        deleteFunc();
        toast.success(props.t("Deletion successful"));
      });

      return;
    }
  };
  const handleDeleteTagFromNote = async (tagName: string) => {
    await ConfigUtil.deleteTagFromNotes(tagName);
  };
  const handleDeletePopup = (isOpenDelete: boolean) => {
    setIsOpenDelete(isOpenDelete);
    if (!isOpenDelete) {
      props.handleChangeTag(props.index);
    }
  };
  const deletePopupProps = {
    name: props.tagName,
    title: "Delete this tag",
    description: "This action will clear and remove this tag",
    handleDeletePopup: handleDeletePopup,
    handleDeleteOpearion: handleDelete,
  };
  return (
    <>
      {isOpenDelete && <DeletePopup {...(deletePopupProps as any)} />}
      <div
        className="delete-digest-button"
        onClick={() => {
          props.mode === "tags"
            ? handleDeletePopup(true)
            : handleDelete();
        }}
      >
        <span className="icon-close delete-digest-icon"></span>
      </div>
    </>
  );
};

export default DeleteIcon;
