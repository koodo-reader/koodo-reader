import BookList from "../containers/lists/bookList";
import DeletedBookList from "../containers/lists/deletedBookList";
import NoteList from "../containers/lists/noteList";
import EmptyPage from "../containers/emptyPage";
import LoadingPage from "../containers/loadingPage";

export const routes = [
  { path: "/manager/empty", component: EmptyPage },
  { path: "/manager/loading", component: LoadingPage },
  { path: "/manager/note", component: NoteList },
  { path: "/manager/digest", component: NoteList },
  { path: "/manager/home", component: BookList },
  { path: "/manager/shelf", component: BookList },
  { path: "/manager/favorite", component: BookList },
  { path: "/manager/trash", component: DeletedBookList },
];
