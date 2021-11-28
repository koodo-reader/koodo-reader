export const getHightlightCoords = () => {
  let iframe = document.getElementsByTagName("iframe")[0];
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  var pageIndex = iWin!.PDFViewerApplication.pdfViewer.currentPageNumber - 1;
  var page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  var pageRect = page.canvas.getClientRects()[0];
  var selectionRects = iWin.getSelection()!.getRangeAt(0).getClientRects();
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
