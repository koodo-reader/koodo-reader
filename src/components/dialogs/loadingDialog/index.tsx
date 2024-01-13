import React from "react";
import "./loadingDialog.css";
import { Trans } from "react-i18next";
const LoadingDialog = (props) => {
  return (
    <div className="loading-dialog">
      <div className="loading-dialog-title">
        <Trans>Please Wait</Trans>
      </div>
      <div className="loading-animation">
        <div className="loader"></div>
      </div>
    </div>
  );
};
export default LoadingDialog;
