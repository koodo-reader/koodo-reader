//图书导航栏的目录列表
import React from "react";
import "./contentList.css";
import { connect } from "react-redux";

export interface ContentListProps {
  currentEpub: any;
}
export interface ContentListState {
  chapters: any;
}
class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = { chapters: [] };
    this.handleJump = this.handleJump.bind(this);
  }
  componentWillMount() {
    this.props.currentEpub
      .getToc()
      .then((chapters) => {
        this.setState({ chapters });
      })
      .catch(() => {
        console.log("Error occurs");
      });
  }
  handleJump(event) {
    event.preventDefault();
    let href = event.target.getAttribute("href");
    this.props.currentEpub.goto(href);
  }
  render() {
    const renderContentList = () => {
      return this.state.chapters.map((item, index) => {
        let isSubContentList = item.subitems && item.subitems.length;
        const renderSubContentList = () => {
          return item.subitems.map((item, index) => {
            return (
              <li key={index} className="book-subcontent-list">
                <a
                  href={item.href}
                  onClick={this.handleJump}
                  className="book-subcontent-name"
                >
                  {item.label}
                </a>
              </li>
            );
          });
        };
        return (
          <li className="book-content-list" key={index}>
            <a
              href={item.href}
              onClick={this.handleJump}
              className="book-content-name"
            >
              {item.label}
            </a>
            {isSubContentList ? <ul>{renderSubContentList()}</ul> : null}
          </li>
        );
      });
    };

    return (
      <div className="book-content-container">
        <ul className="book-content">{renderContentList()}</ul>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return { currentEpub: state.book.currentEpub };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(ContentList);
