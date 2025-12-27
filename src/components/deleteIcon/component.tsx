import React from "react";
import "./deleteIcon.css";
import { DeleteIconProps, DeleteIconStates } from "./interface";
import DeletePopup from "../dialogs/deletePopup";
import toast from "react-hot-toast";
import DatabaseService from "../../utils/storage/databaseService";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";

class DeleteIcon extends React.Component<DeleteIconProps, DeleteIconStates> {
  constructor(props: DeleteIconProps) {
    super(props);
    this.state = {
      deleteIndex: -1,
      isOpenDelete: false,
    };
  }

  handleDelete = async () => {
    try {
      let deleteFunc =
        this.props.mode === "notes"
          ? this.props.handleFetchNotes
          : this.props.handleFetchBookmarks;
      
      if (this.props.mode === "tags") {
        ConfigService.deleteListConfig(this.props.tagName, "noteTags");
        await this.handleDeleteTagFromNote(this.props.tagName);
        // Note: Toast is shown by DeletePopup component
        return;
      }
      
      if (this.props.mode === "bookmarks") {
        await DatabaseService.deleteRecord(this.props.itemKey, "bookmarks");
        deleteFunc();
        toast.success(this.props.t("Deletion successful"));
        return;
      }
      
      if (this.props.mode === "notes") {
        let note = await DatabaseService.getRecord(this.props.itemKey, "notes");
        if (!note) return;
        
        if (this.props.htmlBook && this.props.htmlBook.rendition) {
          this.props.htmlBook.rendition.removeOneNote(
            this.props.itemKey,
            note.chapterIndex
          );
        }

        await DatabaseService.deleteRecord(this.props.itemKey, "notes");
        deleteFunc();
        toast.success(this.props.t("Deletion successful"));
        return;
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(this.props.t("Deletion failed"));
    }
  };
  handleDeleteTagFromNote = async (tagName: string) => {
    await ConfigUtil.deleteTagFromNotes(tagName);
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
    if (!isOpenDelete) {
      this.props.handleChangeTag(this.props.index);
    }
  };
  render() {
    const deletePopupProps = {
      name: this.props.tagName,
      title: "Delete this tag",
      description: "This action will clear and remove this tag",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOperation: this.handleDelete,
    };
    return (
      <>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
        <div
          className="delete-digest-button"
          onClick={() => {
            this.props.mode === "tags"
              ? this.handleDeletePopup(true)
              : this.handleDelete();
          }}
        >
          <span className="icon-close delete-digest-icon"></span>
        </div>
      </>
    );
  }
}

export default DeleteIcon;
