import React from "react";
import "./style.css";
import { withRouter } from "react-router-dom";
const BackToMain = (props: any) => {
  return (
    <div
      className="back-main-container"
      onClick={() => {
        props.history.push("/manager/home");
      }}
      style={document.URL.indexOf("djvu") > -1 ? { bottom: "60px" } : {}}
    >
      <span className="icon-home back-home"></span>
    </div>
  );
};

export default withRouter(BackToMain);
