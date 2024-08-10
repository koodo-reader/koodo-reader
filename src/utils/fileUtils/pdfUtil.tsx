import { lines, pdfColors } from "../../constants/themeList";
import { getPDFIframeDoc } from "../serviceUtils/docUtil";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];

export const getHightlightCoords = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  var pageIndex = iWin!.PDFViewerApplication.pdfViewer.currentPageNumber - 1;
  var selectionRects = iWin.getSelection()!.getRangeAt(0).getClientRects();

  var page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  var viewport = page.viewport;
  var pageRect = page.canvas.getClientRects()[0];
  //handle double page mode
  if (iWin!.PDFViewerApplication.pdfViewer.spreadMode === 1) {
    if (selectionRects.length > 0) {
      if (selectionRects[0].left > pageRect.right) {
        pageIndex++;
        page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
        viewport = page.viewport;
        pageRect = page.canvas.getClientRects()[0];
      }
    }
  }
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
export const getPDFMetadata = (file: ArrayBuffer) => {
  return new Promise<any>((resolve, reject) => {
    let fileSize = file.byteLength / 1024 / 1024;
    setTimeout(() => {
      resolve("");
    }, Math.ceil(fileSize / 10) * 1000);
    pdfjsLib
      .getDocument({ data: file })
      .promise.then(async (pdfDoc: any) => {
        pdfDoc
          .getMetadata()
          .then(async (metadata) => {
            let name = metadata.info.Title;
            let author = metadata.info.Author;
            let publisher = metadata.info.Producer;
            let pageCount = (await pdfDoc)._pdfInfo.numPages;
            pdfDoc.getPage(1).then((page: any) => {
              var scale = 1.5;
              var viewport = page.getViewport({
                scale: scale,
              });
              var canvas: any = document.getElementById("the-canvas");
              var context = canvas.getContext("2d");
              canvas.height =
                viewport.height ||
                viewport.viewBox[3]; /* viewport.height is NaN */
              canvas.width =
                viewport.width ||
                viewport.viewBox[2]; /* viewport.width is also NaN */
              var task = page.render({
                canvasContext: context,
                viewport: viewport,
              });
              task.promise.then(async () => {
                let cover: any = canvas.toDataURL("image/jpeg");
                resolve({ cover, author, name, publisher, pageCount });
              });
            });
          })
          .catch(function (err) {
            console.log(err);
          });
      })
      .catch((err: any) => {
        resolve("");
      });
  });
};
export const removePDFHighlight = (
  selected: any,
  colorCode: string,
  noteKey: string
) => {
  let iWin = getPDFIframeDoc();
  if (!iWin) return;
  var pageIndex = selected.page;
  if (!iWin.PDFViewerApplication.pdfViewer) return;
  var page = iWin.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  if (page && page.div && page.textLayer && page.textLayer.textLayerDiv) {
    var pageElement =
      colorCode.indexOf("color") > -1 ? page.textLayer.textLayerDiv : page.div;

    let noteElements = pageElement.querySelectorAll(".kookit-note");
    noteElements.forEach((item: any) => {
      if (item.dataset.key === noteKey) {
        item.parentNode?.removeChild(item);
      }
    });
  }
};
export const showPDFHighlight = (
  selected: any,
  colorCode: string,
  noteKey: string,
  handleNoteClick: any
) => {
  let iWin = getPDFIframeDoc();
  if (!iWin) return;
  var pageIndex = selected.page;
  if (!iWin.PDFViewerApplication.pdfViewer) return;
  var page = iWin.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
  if (page && page.div && page.textLayer && page.textLayer.textLayerDiv) {
    var pageElement =
      colorCode.indexOf("color") > -1 ? page.textLayer.textLayerDiv : page.div;

    var viewport = page.viewport;
    selected.coords.forEach((rect) => {
      var bounds = viewport.convertToViewportRectangle(rect);
      var el = iWin.document.createElement("div");

      el?.setAttribute(
        "style",
        "position: absolute;" +
          (colorCode.indexOf("color") > -1
            ? "background-color: "
            : "border-bottom: ") +
          (colorCode.indexOf("color") > -1
            ? pdfColors[colorCode.split("-")[1]]
            : `2px solid ${lines[colorCode.split("-")[1]]}`) +
          "; left:" +
          Math.min(bounds[0], bounds[2]) +
          "px; top:" +
          Math.min(bounds[1], bounds[3]) +
          "px;" +
          "width:" +
          Math.abs(bounds[0] - bounds[2]) +
          "px; height:" +
          Math.abs(bounds[1] - bounds[3]) +
          "px; z-index:-1;"
      );
      el?.setAttribute("data-key", noteKey);
      el?.setAttribute("class", "kookit-note");
      el?.addEventListener("click", (event: any) => {
        if (event && event.target) {
          if (
            (event.target as any).dataset &&
            (event.target as any).dataset.key
          ) {
            handleNoteClick(event);
          }
        }
      });

      pageElement.appendChild(el);
    });
  }
};
