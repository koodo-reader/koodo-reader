import React from "react";
import { Trans } from "react-i18next";
import { SwitchRowProps } from "./interface";

const SwitchRow = ({ title, isEnabled, onClick }: SwitchRowProps) => {
  return (
    <div className="scale-page-fit-switch" onClick={onClick}>
      <span className="scale-page-fit-switch-title">
        <Trans>{title}</Trans>
      </span>
      <span
        className="single-control-switch"
        style={isEnabled ? {} : { opacity: 0.6 }}
      >
        <span
          className="single-control-button"
          style={{
            transform: isEnabled ? "translateX(20px)" : "translateX(0px)",
            transition: "transform 0.5s ease",
          }}
        ></span>
      </span>
    </div>
  );
};

export default SwitchRow;
