import { openExternalUrl } from "../serviceUtils/urlUtil";

export const handleLinkJump = async (event: any, rendition: any = {}) => {
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
  console.log(href);
  if (href.indexOf("#") > -1) {
    await rendition.goToAnchor(href);
  } else if (
    href &&
    href.indexOf("../") === -1 &&
    href.indexOf("http") === 0 &&
    href.indexOf("OEBPF") === -1 &&
    href.indexOf("OEBPS") === -1 &&
    href.indexOf("footnote") === -1 &&
    href.indexOf("blob") === -1 &&
    href.indexOf("data:application") === -1
  ) {
    openExternalUrl(href);
  }
};
