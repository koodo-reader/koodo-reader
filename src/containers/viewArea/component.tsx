import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import ViewPage from "../../components/viewPage";

class ViewArea extends React.Component {
  render() {
    return (
      <div className="view-area">
        <PopupMenu />
        <ViewPage />
      </div>
    );
  }
}

export default ViewArea;
