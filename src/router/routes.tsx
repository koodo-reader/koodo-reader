import BookList from "../containers/lists/bookList";
import DeletedBookList from "../containers/lists/deletedBookList";
import NoteList from "../containers/lists/noteList";
import EmptyPage from "../containers/emptyPage";

export const routes = [
  { path: "/manager/empty", component: EmptyPage },
  { path: "/manager/note", component: NoteList },
  { path: "/manager/highlight", component: NoteList },
  { path: "/manager/home", component: BookList },
  { path: "/manager/shelf", component: BookList },
  { path: "/manager/favorite", component: BookList },
  { path: "/manager/trash", component: DeletedBookList },
];
