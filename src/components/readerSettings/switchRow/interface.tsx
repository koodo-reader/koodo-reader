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
