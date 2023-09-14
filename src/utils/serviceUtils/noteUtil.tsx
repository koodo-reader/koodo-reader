import Note from "../../model/Note";
import { showPDFHighlight } from "../fileUtils/pdfUtil";
declare var window: any;
export const renderHighlighters = async (
  notes: Note[],
  format: string,
  handleNoteClick: (event: Event) => void
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
  notes.forEach((item: any) => {
    try {
      if (format === "PDF") {
        showPDFHighlight(
          JSON.parse(item.range),
          classes[item.color],
          item.key,
          handleNoteClick
        );
      } else {
        showNoteHighlight(
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
  });
};
export const showNoteHighlight = (
  range: any,
  colorCode: string,
  noteKey: string,
  handleNoteClick: (event: Event) => void
) => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let iWin = iframe.contentWindow || iframe.contentDocument?.defaultView;
  let doc = iframe.contentDocument;
  let temp = JSON.parse(range);
  temp = [temp];
  window.rangy.getSelection(iframe).restoreCharacterRanges(doc, temp);
  // 获取选中的文本范围
  var selection = window.getSelection();

  // 创建一个红色背景的span元素
  var span = document.createElement("span");
  span.style.backgroundColor = "red"; // 设置红色背景色

  // 遍历每个选中的范围
  for (var i = 0; i < selection.rangeCount; i++) {
    let range = selection.getRangeAt(i);
    range.insertNode(span.cloneNode(true));
  }
  if (!iWin || !iWin.getSelection()) return;
  iWin.getSelection()?.empty(); // 清除文本选取
};
