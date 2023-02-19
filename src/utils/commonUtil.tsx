import React from "react";
import { withTooltip } from "react-tippy";
export const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
export const removeExtraQuestionMark = (html: any) => {
  return html
    .replaceAll("–?", "–")
    .replaceAll("“?", "“")
    .replaceAll("”?", "”")
    .replaceAll("©?", "©")
    .replaceAll("’?", "’")
    .replaceAll("“?", "“")
    .replaceAll("…?", "…")
    .replaceAll("—?", "—")
    .replaceAll("‘?", "‘")
    .replaceAll("“?", "“");
};
export const copyArrayBuffer = (src) => {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
};
export const getTooltip = (Node, option) => {
  let ToolTip: any = withTooltip(() => Node, option);
  return <ToolTip></ToolTip>;
};
