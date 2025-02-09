import React from "react";
import "./loadingDialog.css";
import { Trans } from "react-i18next";
const LoadingDialog = (_props) => {
  return (
    <div className="loading-dialog">
      <div className="loading-dialog-title">
        <Trans>Please wait</Trans>
      </div>
      <div className="loading-animation">
        <div className="loader"></div>
      </div>
    </div>
  );
};
export default LoadingDialog;
