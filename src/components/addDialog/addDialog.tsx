//添加图书到书架的对话框
import React, { Component } from "react";
import { connect } from "react-redux";
import "./addDialog.css";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
import { handleAddDialog } from "../../redux/book.redux";
import ShelfUtil from "../../utils/shelfUtil";
import BookModel from "../../model/Book";
import {stateType} from '../../store'
export interface AddDialogProps {
  handleAddDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface AddDialogState {
  isNew: boolean;
}
class AddDialog extends Component<AddDialogProps, AddDialogState> {
  constructor(props: AddDialogProps) {
    super(props);
    this.state = { isNew: false };
  }

  handleCancel = () => {
    this.props.handleAddDialog(false);
  };
  handleComfirm = () => {
    const inputElement: HTMLInputElement = document.querySelector(
      ".add-dialog-shelf-list-box"
    ) as HTMLInputElement;
    let shelfTitle: string = inputElement.value;
    if (this.state.isNew) {
      shelfTitle = inputElement.value;
    }
    ShelfUtil.setShelf(shelfTitle, this.props.currentBook.key);
    this.props.handleAddDialog(false);
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  };
  //如果是添加到已存在的书架就diable新建图书的input框
  handleChange = (shelfTitle: string) => {
    if (shelfTitle === "新建书架") {
      this.setState({ isNew: true });
      (document.querySelector(
        ".add-dialog-new-shelf-box"
      ) as HTMLInputElement).removeAttribute("disabled");
    } else {
      this.setState({ isNew: false });
      (document.querySelector(
        ".add-dialog-new-shelf-box"
      ) as HTMLInputElement).setAttribute("disabled", "disabled");
    }
  };
  render() {
    const renderShelfList = () => {
      let shelfList = ShelfUtil.getShelf();
      let shelfTitle = Object.keys(shelfList);
      return shelfTitle.map((item) => {
        return (
          <option
            value={item}
            key={item}
            className="add-dialog-shelf-list-option"
          >
            {item}
          </option>
        );
      });
    };
    return (
      <div className="add-dialog-container">
        <div className="add-dialog-title">添加到书架</div>
        <div className="add-dialog-shelf-list-container">
          <div className="add-dialog-shelf-list-text">选择</div>
          <select
            className="add-dialog-shelf-list-box"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this.handleChange(event.target.value);
            }}
          >
            {renderShelfList()}
          </select>
        </div>
        <div className="add-dialog-new-shelf-container">
          <div className="add-dialog-new-shelf-text">新建</div>
          <input className="add-dialog-new-shelf-box" />
        </div>
        <div
          className="add-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          取消
        </div>
        <div
          className="add-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          确认
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = {
  handleAddDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(mapStateToProps, actionCreator)(AddDialog);
