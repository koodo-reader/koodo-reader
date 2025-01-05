export const getIframeDoc = () => {
  let pageArea = document.getElementById("page-area");

  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  let doc = iframe.contentDocument;

  if (!doc) {
    return null;
  }
  return doc;
};
export const getIframeWin = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  return iframe;
};
