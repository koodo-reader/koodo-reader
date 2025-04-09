export const getIframeDoc = (format: string) => {
  let pageArea = document.getElementById("page-area");

  if (!pageArea) return [];
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return [];
  let doc = iframe.contentDocument;

  if (!doc) {
    return [];
  }
  if (format === "PDF") {
    let subIframes = doc.querySelectorAll("iframe");
    return [
      doc,
      ...Array.from(subIframes).map((subIframe) => {
        let subDoc = subIframe.contentDocument;
        return subDoc;
      }),
    ];
  } else {
    return [doc];
  }
};
export const getIframeWin = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  return iframe;
};
