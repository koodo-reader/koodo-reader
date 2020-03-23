//添加图书到书架的对话框
import React, { Component } from "react";
import { connect } from "react-redux";
import "./addDialog.css";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
import { handleAddDialog } from "../../redux/book.redux";
import ShelfUtil from "../../utils/shelfUtil";

class AddDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { isNew: false };
  }

  handleCancel = () => {
    this.props.handleAddDialog(false);
  };
  handleComfirm = () => {
    let shelfTitle = document.querySelector(".add-dialog-shelf-list-box").value;
    if (this.state.isNew) {
      shelfTitle = document.querySelector(".add-dialog-new-shelf-box").value;
    }
    ShelfUtil.setShelf(shelfTitle, this.props.currentBook.key);
    this.props.handleAddDialog(false);
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  };
  //如果是添加到已存在的书架就diable新建图书的input框
  handleChange = event => {
    let shelfTitle = event.target.value;
    if (shelfTitle === "新建书架") {
      this.setState({ isNew: true });
      document
        .querySelector(".add-dialog-new-shelf-box")
        .removeAttribute("disabled");
    } else {
      this.setState({ isNew: false });
      document
        .querySelector(".add-dialog-new-shelf-box")
        .setAttribute("disabled", "diabled");
    }

    console.log(shelfTitle, this.state.isNew);
  };
  render() {
    const renderShelfList = () => {
      let shelfList = ShelfUtil.getShelf();
      let shelfTitle = Object.keys(shelfList);
      console.log(shelfTitle);
      return shelfTitle.map((item, index) => {
        return (
          <option
            value={item}
            key={index}
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
            onChange={event => {
              this.handleChange(event);
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
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters
  };
};
const actionCreator = {
  handleAddDialog,
  handleMessageBox,
  handleMessage
};
AddDialog = connect(mapStateToProps, actionCreator)(AddDialog);
export default AddDialog;
