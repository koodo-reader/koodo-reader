import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import BackToMain from "../../components/backToMain";
import "./viewer.css";

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      href: "",
      title: "",
    };
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      document.title = book.name + " - Koodo Reader";
      this.props.handleReadingState(true);
      RecentBooks.setRecent(key);
      this.props.handleReadingBook(book);
      this.setState({ title: book.name + " - Koodo Reader" });
      this.setState({ href: BookUtil.getPDFUrl(book) });
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%");
  }

  render() {
    return (
      <div className="ebook-viewer">
        <iframe
          src={this.state.href}
          title={this.state.title}
          width="100%"
          height="100%"
        >
          Loading
        </iframe>
        <BackToMain />
      </div>
    );
  }
}
export default withRouter(Viewer as any);
