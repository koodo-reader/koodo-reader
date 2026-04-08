import Note from "../../models/Note";
import DatabaseService from "../storage/databaseService";
import {
  ConfigService,
  NoteSyncManager,
} from "../../assets/lib/kookit-extra-browser.min";
import { getIframeDoc } from "./docUtil";
import toast from "react-hot-toast";

export interface DigestParams {
  currentBook: any;
  htmlBook: any;
  chapterDocIndex: number;
  chapter: string;
  color: number;
  t: (key: string) => string;
  onNoteClick?: (event: Event) => void;
  onSuccess?: () => void;
}

export async function createHighlight(params: DigestParams): Promise<void> {
  const {
    currentBook,
    htmlBook,
    chapterDocIndex,
    chapter,
    color,
    t,
    onNoteClick,
    onSuccess,
  } = params;

  if (!htmlBook) return;

  let bookKey = currentBook.key;
  let bookLocation = ConfigService.getObjectConfig(
    bookKey,
    "recordLocation",
    {}
  );
  let cfi = JSON.stringify(bookLocation);

  if (
    currentBook.format === "PDF" &&
    ConfigService.getReaderConfig("isConvertPDF") !== "yes"
  ) {
    let pdfLocation = htmlBook.rendition.getPositionByChapter(chapterDocIndex);
    cfi = JSON.stringify(pdfLocation);
  }

  let percentage = bookLocation.percentage ? bookLocation.percentage : "0";
  let docs = getIframeDoc(currentBook.format);
  let text = "";
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i];
    if (!doc) continue;
    text = doc.getSelection()?.toString() || "";
    if (text) break;
  }
  if (!text) return;

  text = text.replace(/\s\s/g, "");
  text = text.replace(/\r/g, "");
  text = text.replace(/\n/g, "");
  text = text.replace(/\t/g, "");
  text = text.replace(/\f/g, "");

  let range = JSON.stringify(
    await htmlBook.rendition.getHightlightCoords(chapterDocIndex)
  );

  let highlight = new Note(
    bookKey,
    chapter,
    chapterDocIndex,
    text,
    cfi,
    range,
    "",
    percentage,
    color,
    []
  );

  await DatabaseService.saveRecord(highlight, "notes");
  toast.success(t("Addition successful"));
  await htmlBook.rendition.createOneNote(highlight, onNoteClick ?? (() => {}));
  let noteSyncManager = new NoteSyncManager(DatabaseService, ConfigService);
  noteSyncManager.syncNote(highlight, bookKey);
  onSuccess?.();
}
