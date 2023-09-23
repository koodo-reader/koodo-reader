import Note from "../../model/Note";
import { showPDFHighlight } from "../fileUtils/pdfUtil";
declare var window: any;
export const renderHighlighters = async (
  notes: Note[],
  format: string,
  handleNoteClick: any
) => {
  let classes = [
    "color-0",
    "color-1",
    "color-2",
    "color-3",
    "line-0",
    "line-1",
    "line-2",
    "line-3",
  ];
  clearHighlight();
  console.log(notes);
  for (let index = 0; index < notes.length; index++) {
    const item = notes[index];
    try {
      if (format === "PDF") {
        let pageArea = document.getElementById("page-area");
        if (!pageArea) return;
        let iframe = pageArea.getElementsByTagName("iframe")[0];
        if (!iframe || !iframe.contentWindow) return;
        let iWin: any =
          iframe.contentWindow || iframe.contentDocument?.defaultView;
        showPDFHighlight(
          JSON.parse(item.range),
          classes[item.color],
          item.key,
          handleNoteClick
        );
        if (!iWin || !iWin.getSelection()) return;
        iWin.getSelection()?.empty(); // 清除文本选取
      } else {
        await showNoteHighlight(
          JSON.parse(item.range),
          classes[item.color],
          item.key,
          handleNoteClick
        );
        // highlighter.highlightSelection(classes[item.color]);
      }
    } catch (e) {
      console.warn(
        e,
        "Exception has been caught when restore character ranges."
      );
      return;
    }
  }
};
export const showNoteHighlight = async (
  range: any,
  colorCode: string,
  noteKey: string,
  handleNoteClick: any
) => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  let doc = iframe.contentDocument;
  if (!doc) return;

  let temp = range;
  temp = [temp];
  // sleep(500);

  window.rangy.getSelection(iframe).restoreCharacterRanges(doc, temp);
  let sel = doc!.getSelection();
  if (!sel) return;
  let newRange = sel.getRangeAt(0);
  var safeRanges = getSafeRanges(newRange);
  for (var i = 0; i < safeRanges.length; i++) {
    highlightRange(safeRanges[i], colorCode, noteKey, handleNoteClick, doc);
  }
  if (!iWin || !iWin.getSelection()) return;
  iWin.getSelection()?.empty(); // 清除文本选取
};
function clearHighlight() {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let doc = iframe.contentDocument;
  if (!doc) return;
  const elements = doc.querySelectorAll(".kookit-note");
  for (let index = 0; index < elements.length; index++) {
    const element: any = elements[index];
    element.classList.remove("kookit-note");
    element.removeAttribute("data-key");
    var classes = element.classList;

    // 遍历所有class名
    for (var i = classes.length - 1; i >= 0; i--) {
      var className = classes[i];

      // 判断class名是否以"color"开头
      if (className.startsWith("color") || className.startsWith("line")) {
        // 删除以"color"开头的class名
        element.classList.remove(className);
      }
    }
  }
}
function highlightRange(
  range: Range,
  colorCode: string,
  noteKey: string,
  handleNoteClick: any,
  doc: any
) {
  var newNode = document.createElement("span");
  newNode.setAttribute("class", colorCode + " kookit-note");
  newNode.setAttribute("data-key", noteKey);
  // newNode.setAttribute("onclick", `window.handleNoteClick()`);
  newNode.addEventListener("click", (event) => {
    handleNoteClick(event);
  });

  range.surroundContents(newNode);
  var startNode = range.startContainer;
  var endNode = range.endContainer;
  var startOffset = range.startOffset;
  var endOffset = range.endOffset;
  var newRange = doc!.createRange();
  newRange.setStart(startNode, startOffset);
  newRange.setEnd(endNode, endOffset);
  var commonAncestor = newRange.commonAncestorContainer;
  var treeWalker = document.createTreeWalker(
    commonAncestor,
    NodeFilter.SHOW_ELEMENT
  );
  while (treeWalker.nextNode()) {
    var node: any = treeWalker.currentNode;
    if (node.nodeType === 1) {
      node.setAttribute("data-key", noteKey);
    }
  }
}

function getSafeRanges(dangerous) {
  var a = dangerous.commonAncestorContainer;
  // Starts -- Work inward from the start, selecting the largest safe range
  var s = new Array(0),
    rs = new Array(0);
  if (dangerous.startContainer !== a) {
    for (let i = dangerous.startContainer; i !== a; i = i.parentNode) {
      s.push(i);
    }
  }
  if (s.length > 0) {
    for (let i = 0; i < s.length; i++) {
      var xs = document.createRange();
      if (i) {
        xs.setStartAfter(s[i - 1]);
        xs.setEndAfter(s[i].lastChild);
      } else {
        xs.setStart(s[i], dangerous.startOffset);
        xs.setEndAfter(
          s[i].nodeType === Node.TEXT_NODE ? s[i] : s[i].lastChild
        );
      }
      rs.push(xs);
    }
  }

  // Ends -- basically the same code reversed
  var e = new Array(0),
    re = new Array(0);
  if (dangerous.endContainer !== a) {
    for (var i = dangerous.endContainer; i !== a; i = i.parentNode) {
      e.push(i);
    }
  }
  if (e.length > 0) {
    for (let i = 0; i < e.length; i++) {
      var xe = document.createRange();
      if (i) {
        xe.setStartBefore(e[i].firstChild);
        xe.setEndBefore(e[i - 1]);
      } else {
        xe.setStartBefore(
          e[i].nodeType === Node.TEXT_NODE ? e[i] : e[i].firstChild
        );
        xe.setEnd(e[i], dangerous.endOffset);
      }
      re.unshift(xe);
    }
  }

  // Middle -- the uncaptured middle
  if (s.length > 0 && e.length > 0) {
    var xm = document.createRange();
    xm.setStartAfter(s[s.length - 1]);
    xm.setEndBefore(e[e.length - 1]);
  } else {
    return [dangerous];
  }

  // Concat
  rs.push(xm);
  let response = rs.concat(re);

  // Send to Console
  return response;
}
