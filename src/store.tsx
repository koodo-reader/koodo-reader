import { createStore, applyMiddleware, compose, combineReducers } from "redux";
import thunk from "redux-thunk";
import { settingPanel } from "./redux/settingPanel.redux";
import { book } from "./redux/book.redux";
import { manager } from "./redux/manager.redux";
import { progressPanel } from "./redux/progressPanel.redux";
import { reader } from "./redux/reader.redux";
import { viewArea } from "./redux/viewArea.redux";
import { sidebar } from "./redux/sidebar.redux";
import { backupPage } from "./redux/backupPage.redux";
const rootReducer = combineReducers({
  settingPanel,
  book,
  manager,
  reader,
  progressPanel,
  viewArea,
  sidebar,
  backupPage,
});
const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunk),
    (window as any).devToolsExtension
      ? (window as any).devToolsExtension()
      : (f) => f
  )
);
export default store;
