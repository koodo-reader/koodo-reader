declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];
export const getHightlightCoords = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  var pageIndex = iWin!.PDFViewerApplication.pdfViewer.currentPageNumber - 1;
  var page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  var pageRect = page.canvas.getClientRects()[0];
  var selectionRects = iWin.getSelection()!.getRangeAt(0).getClientRects();
  var viewport = page.viewport;
  let tempRect: { bottom: number; top: number; left: number; right: number }[] =
    [];
  for (let i = 0; i < selectionRects.length; i++) {
    if (i === 0) {
      tempRect.push({
        bottom: selectionRects[i].bottom,
        top: selectionRects[i].top,
        left: selectionRects[i].left,
        right: selectionRects[i].right,
      });
    } else if (
      Math.abs(
        tempRect[tempRect.length - 1].bottom - selectionRects[i].bottom
      ) < 5
    ) {
      if (tempRect[tempRect.length - 1].left > selectionRects[i].left) {
        tempRect[tempRect.length - 1].left = selectionRects[i].left;
      }
      if (tempRect[tempRect.length - 1].right < selectionRects[i].right) {
        tempRect[tempRect.length - 1].right = selectionRects[i].right;
      }
    } else {
      tempRect.push({
        bottom: selectionRects[i].bottom,
        top: selectionRects[i].top,
        left: selectionRects[i].left,
        right: selectionRects[i].right,
      });
    }
  }
  var selected = tempRect.map(function (r: any) {
    return viewport
      .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
      .concat(
        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)
      );
  });
  return { page: pageIndex, coords: selected };
};
export const getPDFCover = (file: ArrayBuffer) => {
  return new Promise<string>((resolve, reject) => {
    pdfjsLib
      .getDocument({ data: file })
      .promise.then((pdfDoc: any) => {
        pdfDoc.getPage(1).then((page: any) => {
          var scale = 1.5;
          var viewport = page.getViewport({
            scale: scale,
          });
          var canvas: any = document.getElementById("the-canvas");
          var context = canvas.getContext("2d");
          canvas.height =
            viewport.height || viewport.viewBox[3]; /* viewport.height is NaN */
          canvas.width =
            viewport.width ||
            viewport.viewBox[2]; /* viewport.width is also NaN */
          var task = page.render({
            canvasContext: context,
            viewport: viewport,
          });
          task.promise.then(async () => {
            let cover: any = canvas.toDataURL("image/jpeg");

            resolve(cover);
          });
        });
      })
      .catch((err: any) => {
        resolve("");
      });
  });
};
