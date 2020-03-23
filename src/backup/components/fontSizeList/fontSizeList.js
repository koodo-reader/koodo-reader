//字体大小选择页面
import React, { Component } from "react";
import { fontSizeList } from "../../utils/readerConfig";
import ReaderConfig from "../../utils/readerConfig";
import StyleConfig from "../../utils/styleConfig";
import { connect } from "react-redux";

import "./fontSizeList.css";
// @connect(state => state.settingPanel)
class FontSizeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFontSizeIndex: fontSizeList.findIndex(item => {
        return item.num === this.props.fontSize;
      })
    };
  }

  handleFontSize(num, index) {
    ReaderConfig.set("fontSize", num);
    this.setState({
      currentFontSizeIndex: index
    });
    StyleConfig.addDefaultCss();
  }

  render() {
    const renderFontSizeDescription = () => {
      return fontSizeList.map((item, index) => {
        // console.log(index, this.state.currentFontSizeIndex);
        return (
          <li className="font-size-description" key={item.id}>
            <div
              className={
                index === this.state.currentFontSizeIndex
                  ? "active-font-size font-size-circle"
                  : "font-size-circle"
              }
              onClick={() => this.handleFontSize(item.num, index)}
            ></div>
            <p className="font-size-text">{item.size}</p>
          </li>
        );
      });
    };
    return (
      <div className="font-size-setting">
        <div className="font-size-title">字号大小</div>
        <span className="ultra-small-size">A</span>
        <div className="font-size-line"></div>
        <ul className="font-size-selector">{renderFontSizeDescription()}</ul>

        <span className="ultra-large-size">A</span>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { fontSize: state.settingPanel.fontSize };
};
const actionCreator = {};
FontSizeList = connect(mapStateToProps, actionCreator)(FontSizeList);
export default FontSizeList;
