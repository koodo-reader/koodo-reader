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
export const getPDFIframeDoc = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  if (!iWin) return null;
  return iWin;
};
