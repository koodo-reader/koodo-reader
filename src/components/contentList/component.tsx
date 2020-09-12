//图书导航栏的目录列表
import React from "react";
import "./contentList.css";
import { ContentListProps, ContentListState } from "./interface";
class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = { chapters: [], isCollapsed: true, currentIndex: -1 };
    this.handleJump = this.handleJump.bind(this);
  }

  componentWillMount() {
    this.props.currentEpub.loaded.navigation
      .then((chapters: any) => {
        this.setState({ chapters: chapters.toc });
      })
      .catch(() => {
        console.log("Error occurs");
      });
  }
  handleJump(event: any) {
    event.preventDefault();
    let href = event.target.getAttribute("href");
    this.props.currentEpub.rendition.display(href);
  }
  render() {
    const renderContentList = (items: any) => {
      return items.map((item: any, index: number) => {
        return (
          <li key={index} className="book-content-list">
            {item.subitems.length > 0 && (
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
              {item.label}
            </a>
            {item.subitems.length > 0 && this.state.currentIndex === index ? (
              <ul>{renderContentList(item.subitems)}</ul>
            ) : null}
          </li>
        );
      });
    };

    return (
      <div className="book-content-container">
        <ul className="book-content">
          {this.state.chapters && renderContentList(this.state.chapters)}
        </ul>
      </div>
    );
  }
}

export default ContentList;
