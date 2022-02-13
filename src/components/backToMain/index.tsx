import React from "react";
import "./style.css";
import { withRouter } from "react-router-dom";
import { stateType } from "../../store";
import { connect } from "react-redux";
import { handleReadingState } from "../../store/actions";
import { isElectron } from "react-device-detect";

const BackToMain = (props: any) => {
  return (
    <div
      className="back-main-container"
      onClick={() => {
        if (isElectron) {
          if (
            window
              .require("electron")
              .ipcRenderer.sendSync("check-main-open", "ping")
          ) {
            window
              .require("electron")
              .ipcRenderer.invoke("focus-on-main", "ping");
            window.close();
          } else {
            window
              .require("electron")
              .ipcRenderer.invoke("create-new-main", "ping");
            window.close();
          }
        } else {
          props.history.push("/manager/home");
          document.title = "Koodo Reader";
          props.handleReadingState(false);
        }
      }}
      style={document.URL.indexOf("djvu") > -1 ? { bottom: "60px" } : {}}
    >
      <span className="icon-home back-home"></span>
    </div>
  );
};
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleReadingState };
export default connect(mapStateToProps, actionCreator)(withRouter(BackToMain));
