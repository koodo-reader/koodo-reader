import React from "react";
import "./contentList.css";
import { ContentListProps, ContentListState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import _ from "underscore";
class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = {
      chapters: [],
      isCollapsed: true,
      currentIndex: -1,
      isExpandContent: StorageUtil.getReaderConfig("isExpandContent") === "yes",
    };
    this.handleJump = this.handleJump.bind(this);
  }
  componentDidMount() {
    this.props.htmlBook &&
      this.setState({
        chapters: this.props.htmlBook.chapters,
      });
  }
  handleJump(event: any) {
    event.preventDefault();
    let href = event.target.getAttribute("href");
    let chapterIndex = _.findIndex(this.props.htmlBook.flattenChapters, {
      href,
    });
    console.log(chapterIndex, this.props.htmlBook.flattenChapters);
    let title = this.props.htmlBook.flattenChapters[chapterIndex].title;
    let index = this.props.htmlBook.flattenChapters[chapterIndex].index;
    this.props.htmlBook.rendition.goToChapter(index.toString(), href, "");
    this.props.handleCurrentChapter(title);
    this.props.handleCurrentChapterIndex(index);
  }
  UNSAFE_componentWillReceiveProps(nextProps: ContentListProps) {
    if (nextProps.htmlBook && nextProps.htmlBook !== this.props.htmlBook) {
      this.setState({ chapters: nextProps.htmlBook.chapters });
    }
  }
  render() {
    console.log(this.state.chapters);
    const renderContentList = (items: any, level: number) => {
      level++;
      return items.map((item: any, index: number) => {
        return (
          <li key={index} className="book-content-list">
            {item.subitems &&
              item.subitems.length > 0 &&
              level <= 2 &&
              !this.state.isExpandContent && (
                <span
                  className="icon-dropdown content-dropdown"
                  onClick={() => {
                    this.setState({
                      currentIndex:
                        this.state.currentIndex === index ? -1 : index,
                    });
                  }}
                  style={
                    this.state.currentIndex === index
                      ? {}
                      : { transform: "rotate(-90deg)" }
                  }
                ></span>
              )}

            <a
              href={item.href}
              onClick={this.handleJump}
              className="book-content-name"
            >
              {item.title}
            </a>
            {item.subitems &&
            item.subitems.length > 0 &&
            (this.state.currentIndex === index ||
              level > 2 ||
              this.state.isExpandContent) ? (
              <ul>{renderContentList(item.subitems, level)}</ul>
            ) : null}
          </li>
        );
      });
    };

    return (
      <div className="book-content-container">
        <ul className="book-content">
          {this.state.chapters && renderContentList(this.state.chapters, 1)}
        </ul>
      </div>
    );
  }
}

export default ContentList;
