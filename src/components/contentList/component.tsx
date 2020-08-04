//图书导航栏的目录列表
import React from "react";
import "./contentList.css";
import { ContentListProps, ContentListState } from "./interface";
class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = { chapters: [] };
    this.handleJump = this.handleJump.bind(this);
  }
  componentWillMount() {
    this.props.currentEpub
      .getToc()
      .then((chapters: any) => {
        this.setState({ chapters });
      })
      .catch(() => {
        console.log("Error occurs");
      });
  }
  handleJump(event: any) {
    event.preventDefault();
    let href = event.target.getAttribute("href");
    console.log(href, "href");
    this.props.currentEpub.goto(href);
  }
  render() {
    const renderContentList = (items: any) => {
      return items.map((item: any, index: number) => {
        return (
          <li key={index} className="book-content-list">
            <a
              href={item.href}
              onClick={this.handleJump}
              className="book-content-name"
            >
              {item.label}
            </a>
            {item.subitems.length > 0 ? (
              <ul>{renderContentList(item.subitems)}</ul>
            ) : null}
          </li>
        );
      });
    };
    // return (
    //   <li className="book-content-list" key={index}>
    //     <a
    //       href={item.href}
    //       onClick={this.handleJump}
    //       className="book-content-name"
    //     >
    //       {item.label}
    //     </a>
    //     {item.subitems.length > 0 ? (
    //       <ul>{renderSubContentList(item.subitems)}</ul>
    //     ) : null}
    //   </li>
    // );

    return (
      <div className="book-content-container">
        <ul className="book-content">
          {renderContentList(this.state.chapters)}
        </ul>
      </div>
    );
  }
}

export default ContentList;
