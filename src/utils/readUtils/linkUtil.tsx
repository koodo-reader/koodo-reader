import { isElectron } from "react-device-detect";

export const handleLinkJump = (event: any) => {
  let href;

  if (
    event.target &&
    event.target.parentNode &&
    event.target.parentNode.parentNode
  ) {
    href =
      (event.target.innerText.indexOf("http") > -1 && event.target.innerText) ||
      event.target.src ||
      event.target.href ||
      event.target.parentNode.href ||
      event.target.parentNode.parentNode.href ||
      "";
  }
  if (
    href &&
    href.indexOf("../") === -1 &&
    href.indexOf("http") === 0 &&
    href.indexOf("OEBPF") === -1 &&
    href.indexOf("OEBPS") === -1 &&
    href.indexOf("footnote") === -1 &&
    href.indexOf("blob") === -1 &&
    href.indexOf("data:application") === -1 &&
    href.indexOf(".htm") === -1
  ) {
    if (isElectron) {
      const { shell } = window.require("electron");
      shell.openExternal(href);
    } else {
      window.open(href);
    }
  }
};
