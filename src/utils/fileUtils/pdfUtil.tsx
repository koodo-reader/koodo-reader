export const getHightlightCoords = () => {
  let iframe = document.getElementsByTagName("iframe")[0];
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  var pageIndex = iWin!.PDFViewerApplication.pdfViewer.currentPageNumber - 1;
  var page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  var pageRect = page.canvas.getClientRects()[0];
  var selectionRects = iWin.getSelection()!.getRangeAt(0).getClientRects();
  console.log(selectionRects);
  var viewport = page.viewport;
  var selected = Array.from(selectionRects).map(function (r: any) {
    return viewport
      .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
      .concat(
        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)
      );
  });
  return { page: pageIndex, coords: selected };
};

export const showHighlight = (selected) => {
  let iframe = document.getElementsByTagName("iframe")[0];
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  var pageIndex = selected.page;
  var page = iWin.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  var pageElement = page.textLayer.textLayerDiv;
  console.log(page);
  var viewport = page.viewport;
  selected.coords.forEach(function (rect) {
    var bounds = viewport.convertToViewportRectangle(rect);
    var el = iWin.document.createElement("div");
    el.setAttribute(
      "style",
      "position: absolute; background-color: red;" +
        "left:" +
        Math.min(bounds[0], bounds[2]) +
        "px; top:" +
        Math.min(bounds[1], bounds[3]) +
        "px;" +
        "width:" +
        Math.abs(bounds[0] - bounds[2]) +
        "px; height:" +
        Math.abs(bounds[1] - bounds[3]) +
        "px; z-index:" +
        "-1"
    );
    pageElement.appendChild(el);
  });
  console.log(pageElement);
};
