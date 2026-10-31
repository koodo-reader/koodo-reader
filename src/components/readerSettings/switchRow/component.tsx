import React from "react";

export type SwitchRowVariant = "dialog" | "setting" | "panel";

export interface SwitchRowProps {
  title: React.ReactNode;
  isEnabled: boolean;
  onClick: () => void;
  variant?: SwitchRowVariant;
  style?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
}

const SwitchRow = ({
  title,
  isEnabled,
  onClick,
  variant = "dialog",
  style,
  titleStyle,
}: SwitchRowProps) => {
  const isDialog = variant === "dialog";
  const switchNode = (
    <span
      className="single-control-switch"
      onClick={isDialog ? undefined : onClick}
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
  );

  if (isDialog) {
    return (
      <div className="scale-page-fit-switch" style={style} onClick={onClick}>
        <span className="scale-page-fit-switch-title" style={titleStyle}>
          {title}
        </span>
        {switchNode}
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className="single-control-switch-container" style={style}>
        <span className="single-control-switch-title" style={titleStyle}>
          {title}
        </span>
        {switchNode}
      </div>
    );
  }

  return (
    <div className="setting-dialog-new-title" style={style}>
      <span style={{ width: "calc(100% - 100px)", ...titleStyle }}>
        {title}
      </span>
      {switchNode}
    </div>
  );
};

export default SwitchRow;
