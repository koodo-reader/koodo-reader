import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import NoteModel from "../../../models/Note";
import { HighlightValue } from "../../../utils/common";
export interface PopupNoteProps {

  isDockedRight: boolean;

  chapterDocIndex: number;
  chapter: string;
}
