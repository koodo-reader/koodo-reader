//图书导航栏的目录列表
import React, { Component } from "react";
import "./contentList.css";
import { connect } from "react-redux";
class ContentList extends Component {
  constructor(props) {
    super(props);
    this.state = { chapters: [] };
    this.handleJump = this.handleJump.bind(this);
  }
  componentWillMount() {
    this.props.currentEpub
      .getToc()
      .then((chapters) => {
        this.setState({ chapters });
        // console.log(this.state.chapters);
      })
      .catch((err) => {
        console.log("Error occurs");
      });
  }
  handleJump(event) {
    let href = event.target.getAttribute("href");
    // console.log(this.props.currentEpub, href, "sfhfdhdfhf");
    this.props.currentEpub.goto(href);
    event.preventDefault();
    // console.log("fdhadfhgdgdj");
  }
  render() {
    // console.log(this.state.chapters, "fhdfhahh");
    const renderContentList = () => {
      return this.state.chapters.map((item, index) => {
        // let href = "/#/reader/" + item.href;
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
ContentList = connect(mapStateToProps, actionCreator)(ContentList);
export default ContentList;
