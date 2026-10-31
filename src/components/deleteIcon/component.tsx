import { useTranslation } from "react-i18next";
import { useState } from "react";
import "./deleteIcon.css";
import DeletePopup from "../dialogs/deletePopup";
import toast from "react-hot-toast";
import DatabaseService from "../../utils/storage/databaseService";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import { useAppStore } from "../../store/useAppStore";

export interface DeleteIconProps {
  mode: string;
  index: number;
  tagName: string;
  itemKey: string;
  renderHighlighters: () => void;
  handleShowDelete: (Deletekey: string) => void;
  handleChangeTag: (index: number) => void;
}

const DeleteIcon = (props: DeleteIconProps) => {
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const handleShowBookmark = useAppStore((s) => s.handleShowBookmark);
  const { t } = useTranslation();
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  const handleDelete = async () => {
    let deleteFunc =
      props.mode === "notes" ? handleFetchNotes : handleFetchBookmarks;
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
        currentBook.key,
        "recordLocation",
        {}
      );
      let bookmark = await DatabaseService.getRecord(
        props.itemKey,
        "bookmarks"
      );
      if (!bookmark) return;
      if (bookLocation.percentage === bookmark.percentage) {
        handleShowBookmark(false);
      }
      DatabaseService.deleteRecord(props.itemKey, "bookmarks").then(() => {
        deleteFunc();
        toast.success(t("Deletion successful"));
      });
      return;
    }
    if (props.mode === "notes") {
      let note = await DatabaseService.getRecord(props.itemKey, "notes");
      if (!note) return;
      if (htmlBook && htmlBook.rendition) {
        htmlBook.rendition.removeOneNote(
          props.itemKey,
          note.chapterIndex
        );
      }

      DatabaseService.deleteRecord(props.itemKey, "notes").then(() => {
        deleteFunc();
        toast.success(t("Deletion successful"));
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
