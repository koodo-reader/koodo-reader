import React, { Component } from "react";
import "./viewArea.css";
import { connect } from "react-redux";
import PopupMenu from "../popupMenu/popupMenu";
import ViewPage from "../../components/viewPage/viewPage";
class ViewArea extends Component {
  constructor(props) {
    super(props);
    this.state = { isSingle: "double" };
  }

  // 翻页：上一页
  prev() {
    this.props.epub.prevPage();
    this.closeMenu();
    this.closeNoteCard();
  }

  // 翻页：下一页
  next() {
    this.props.epub.nextPage();
    this.closeMenu();
    this.closeNoteCard();
  }

  render() {
    // console.log(this.state.isSingle);
    return (
      <div className="view-area">
        <PopupMenu id="popup-menu" />
        <ViewPage />
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    isSingle: state.reader.isSingle
  };
};
const actionCreator = {};
ViewArea = connect(mapStateToProps, actionCreator)(ViewArea);
export default ViewArea;
