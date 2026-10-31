import BookList from "../containers/lists/bookList";
import DeletedBookList from "../containers/lists/deletedBookList";
import NoteList from "../containers/lists/noteList";
import EmptyPage from "../containers/emptyPage";

export const routes = [
  { path: "empty", component: EmptyPage },
  { path: "note", component: NoteList },
  { path: "highlight", component: NoteList },
  { path: "home", component: BookList },
  { path: "shelf", component: BookList },
  { path: "favorite", component: BookList },
  { path: "trash", component: DeletedBookList },
];

