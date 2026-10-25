import NoteModel from "../../../models/Note";

export interface NoteListProps {

}
export interface NoteListState {
  tag: string[];
  bookNamesMap: { [key: string]: string };
  cardList: NoteModel[];
}
