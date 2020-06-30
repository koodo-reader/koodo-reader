//我的书摘页面
import React from "react";
import "./deleteIcon.css";
import { DeleteIconProps, DeleteIconStates } from "./interface";
import localforage from "localforage";
class DeleteIcon extends React.Component<DeleteIconProps, DeleteIconStates> {
  constructor(props: DeleteIconProps) {
    super(props);
    this.state = { deleteIndex: -1 };
  }

  handleDelete = () => {
    let deleteItems =
      this.props.mode === "digests"
        ? this.props.digests
        : this.props.mode === "notes"
        ? this.props.notes
        : this.props.bookmarks;
    let deleteFunc =
      this.props.mode === "digests"
        ? this.props.handleFetchDigests
        : this.props.mode === "notes"
        ? this.props.handleFetchNotes
        : this.props.handleFetchBookmarks;
    deleteItems.forEach((item: any, index: number) => {
      if (item.key === this.props.itemKey) {
        deleteItems.splice(index, 1);
        if (deleteItems.length === 0) {
          localforage.removeItem(this.props.mode).then(() => {
            deleteFunc();
            this.props.handleMessage("Delete Successfully");
            this.props.handleMessageBox(true);
          });
        } else {
          localforage.setItem(this.props.mode, deleteItems).then(() => {
            deleteFunc();
            this.props.handleMessage("Delete Successfully");
            this.props.handleMessageBox(true);
          });
        }
      }
    });
  };
  render() {
    return (
      <div
        className="delete-digest-button"
        onClick={() => {
          this.handleDelete();
        }}
      >
        <span className="icon-close delete-digest-icon"></span>
      </div>
    );
  }
}

export default DeleteIcon;
