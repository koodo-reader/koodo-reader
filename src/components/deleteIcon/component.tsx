import React from "react";
import "./deleteIcon.css";
import { DeleteIconProps, DeleteIconStates } from "./interface";
import localforage from "localforage";
import TagUtil from "../../utils/readUtils/tagUtil";
import DeletePopup from "../dialogs/deletePopup";
import toast from "react-hot-toast";
class DeleteIcon extends React.Component<DeleteIconProps, DeleteIconStates> {
  constructor(props: DeleteIconProps) {
    super(props);
    this.state = {
      deleteIndex: -1,
      isOpenDelete: false,
    };
  }

  handleDelete = () => {
    let deleteItems =
      this.props.mode === "notes"
        ? this.props.notes
        : this.props.mode === "tags"
        ? TagUtil.getAllTags()
        : this.props.bookmarks;
    let deleteFunc =
      this.props.mode === "notes"
        ? this.props.handleFetchNotes
        : this.props.handleFetchBookmarks;
    deleteItems.forEach((item: any, index: number) => {
      if (this.props.mode === "tags") {
        item === this.props.tagName && TagUtil.clear(item);
        return;
      }
      if (item.key === this.props.itemKey) {
        deleteItems.splice(index, 1);
        if (deleteItems.length === 0) {
          localforage
            .removeItem(this.props.mode)
            .then(() => {
              deleteFunc();
              toast.success(this.props.t("Delete Successfully"));
            })
            .catch(() => {
              console.log("删除失败");
            });
        } else {
          localforage
            .setItem(this.props.mode, deleteItems)
            .then(() => {
              deleteFunc();
              toast.success(this.props.t("Delete Successfully"));
            })
            .catch(() => {
              console.log("修改失败");
            });
        }
      }
    });
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
      handleDeleteOpearion: this.handleDelete,
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
