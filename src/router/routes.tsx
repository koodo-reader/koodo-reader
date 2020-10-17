import BookList from "../containers/bookList";
import BookmarkPage from "../containers/bookmarkPage";
import NoteList from "../containers/noteList";
import DigestList from "../containers/digestList";
import EmptyPage from "../containers/emptyPage";
import LoadingPage from "../containers/loadingPage";

export const routes = [
  { path: "/manager/empty", component: EmptyPage },
  { path: "/manager/loading", component: LoadingPage },
  { path: "/manager/note", component: NoteList },
  { path: "/manager/digest", component: DigestList },
  { path: "/manager/home", component: BookList },
  { path: "/manager/favorite", component: BookList },
  { path: "/manager/bookmark", component: BookmarkPage },
];
