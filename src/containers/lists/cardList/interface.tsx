import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";

export interface CardListProps {
  cards: NoteModel[];
  mode: string;
  bookNamesMap: { [key: string]: string };
}
